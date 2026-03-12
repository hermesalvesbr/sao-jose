import type { PublicPdvReceiptItem, PublicPdvSaleRequest, PublicPdvSaleResponse } from '~/types/api'
import type { PdvCategory, PdvOperator, PdvProduct, PdvProductionPoint } from '~/types/schema'
import { createItem, readItems, updateItem } from '@directus/sdk'
import { titleCase } from '~/utils/normalize-text'

type PaymentMethod = PublicPdvSaleRequest['paymentMethod']
type ProductPointRecord = Pick<PdvProductionPoint, 'id' | 'name'>
type ProductCategoryRecord = Pick<PdvCategory, 'id'> & {
  points_id?: string | ProductPointRecord | null
}
type ProductRecord = Pick<PdvProduct, 'id' | 'name' | 'price' | 'stock_quantity'> & {
  production_point_id?: string | ProductPointRecord | null
  category_id?: string | ProductCategoryRecord | null
}
type OperatorRecord = Pick<PdvOperator, 'id' | 'name' | 'active'>
type PointRecord = Pick<PdvProductionPoint, 'id' | 'name'>

const VALID_PAYMENT_METHODS: PaymentMethod[] = ['dinheiro', 'pix', 'cartao']
const MULTI_SPACE_RE = /\s+/g

function badRequest(statusMessage: string, statusCode = 400): never {
  throw createError({ statusCode, statusMessage })
}

function toOperatorName(value: string): string {
  return titleCase(value.trim().replace(MULTI_SPACE_RE, ' '))
}

export default defineEventHandler(async (event): Promise<PublicPdvSaleResponse> => {
  assertMethod(event, 'POST')
  const body = await readBody<PublicPdvSaleRequest>(event)

  if (!body || typeof body !== 'object')
    badRequest('Payload de venda inválido.')

  const operatorName = toOperatorName(body.operatorName || '')
  if (!operatorName)
    badRequest('Informe o nome do atendente.')

  if (!VALID_PAYMENT_METHODS.includes(body.paymentMethod))
    badRequest('Forma de pagamento inválida.')

  if (!Array.isArray(body.items) || body.items.length === 0)
    badRequest('Adicione ao menos um item ao carrinho.')

  const sanitizedItems = body.items
    .map(item => ({
      productId: item.productId,
      quantity: Number(item.quantity),
    }))
    .filter(item => item.productId && Number.isInteger(item.quantity) && item.quantity > 0)

  if (sanitizedItems.length !== body.items.length)
    badRequest('Itens do carrinho inválidos.')

  const client = createServerDirectusClient(event)
  const productIds = [...new Set(sanitizedItems.map(item => item.productId))]

  const [products, existingOperators, selectedPoint] = await Promise.all([
    client.request(
      readItems('pdv_products', {
        fields: ['id', 'name', 'price', 'stock_quantity', { production_point_id: ['id', 'name'] }, { category_id: ['id', { points_id: ['id', 'name'] }] }],
        filter: {
          id: { _in: productIds },
          active: { _eq: true },
          status: { _eq: 'published' },
        },
        limit: -1,
      }),
    ),
    client.request(
      readItems('pdv_operators', {
        fields: ['id', 'name', 'active'],
        filter: {
          name: { _eq: operatorName },
        },
        limit: 1,
      }),
    ),
    body.pointId
      ? client.request(
          readItems('pdv_production_points', {
            fields: ['id', 'name'],
            filter: {
              id: { _eq: body.pointId },
              active: { _eq: true },
              status: { _eq: 'published' },
            },
            limit: 1,
          }),
        )
      : Promise.resolve([] as PointRecord[]),
  ])

  if (products.length !== productIds.length)
    badRequest('Um ou mais produtos não estão disponíveis.', 409)

  const productMap = new Map((products as ProductRecord[]).map(product => [product.id, product]))
  const receiptItems: PublicPdvReceiptItem[] = []
  let totalAmount = 0

  for (const item of sanitizedItems) {
    const product = productMap.get(item.productId)
    if (!product)
      badRequest('Produto não encontrado.', 409)

    if (item.quantity > Number(product.stock_quantity || 0))
      badRequest(`Estoque insuficiente para ${product.name}.`, 409)

    const unitPrice = Number(product.price || 0)
    const totalPrice = unitPrice * item.quantity
    const directPoint = typeof product.production_point_id === 'object' && product.production_point_id
      ? product.production_point_id
      : null
    const categoryPoint = typeof product.category_id === 'object' && product.category_id && typeof product.category_id.points_id === 'object' && product.category_id.points_id
      ? product.category_id.points_id
      : null

    totalAmount += totalPrice

    receiptItems.push({
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
      pointName: directPoint?.name || categoryPoint?.name || null,
    })
  }

  let operatorId = (existingOperators as OperatorRecord[])[0]?.id || null
  const currentOperator = (existingOperators as OperatorRecord[])[0]

  if (!operatorId) {
    const createdOperator = await client.request(createItem('pdv_operators', {
      name: operatorName,
      active: true,
      status: 'published',
    }))
    operatorId = createdOperator.id
  }
  else if (currentOperator && !currentOperator.active) {
    await client.request(updateItem('pdv_operators', operatorId, { active: true }))
  }

  const createdSale = await client.request(createItem('pdv_sales', {
    status: 'published',
    sale_status: 'completed',
    total_amount: Number(totalAmount.toFixed(2)),
    payment_method: body.paymentMethod,
    operator_id: operatorId,
    printed: false,
    discount_amount: 0,
  }))

  for (const item of receiptItems) {
    await client.request(createItem('pdv_sale_items', {
      status: 'published',
      sale_id: createdSale.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      returned_qty: 0,
    }))

    const product = productMap.get(item.productId)
    if (!product)
      continue

    const updatedStock = Math.max(0, Number(product.stock_quantity || 0) - item.quantity)
    await client.request(updateItem('pdv_products', product.id, { stock_quantity: updatedStock }))
  }

  return {
    saleId: createdSale.id,
    saleNumber: typeof createdSale.sale_number === 'number' ? createdSale.sale_number : null,
    createdAt: typeof createdSale.created_at === 'string' ? createdSale.created_at : new Date().toISOString(),
    operatorName,
    paymentMethod: body.paymentMethod,
    totalAmount: Number(totalAmount.toFixed(2)),
    pointName: (selectedPoint as PointRecord[])[0]?.name ?? receiptItems[0]?.pointName ?? null,
    items: receiptItems,
  }
})
