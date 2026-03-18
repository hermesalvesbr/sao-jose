import type { PublicPdvCatalogResponse, PublicPdvCategory, PublicPdvPoint, PublicPdvProduct } from '~/types/api'
import type { DirectusFile, PdvCategory, PdvProduct, PdvProductionPoint } from '~/types/schema'
import { readItems } from '@directus/sdk'

const LOJINHA_POINT_ID = '771786ea-9431-411b-8274-28b224bfb5ad'

type PointRecord = Pick<PdvProductionPoint, 'id' | 'name' | 'emoji' | 'role' | 'sort'>
type CategoryRecord = Pick<PdvCategory, 'id' | 'name' | 'icon' | 'sort_order'> & {
  points_id?: string | PointRecord | null
}
type ProductRecord = Pick<PdvProduct, 'id' | 'name' | 'price' | 'stock_quantity' | 'sort_order' | 'imagem' | 'emoji'> & {
  imagem?: string | DirectusFile | null
  category_id?: string | Pick<PdvCategory, 'id'> | null
  production_point_id?: string | Pick<PdvProductionPoint, 'id'> | null
}

function resolveId<T extends { id: string }>(value: string | T | null | undefined): string | null {
  if (!value)
    return null
  return typeof value === 'string' ? value : value.id
}

function resolveFileId(value: string | DirectusFile | null | undefined): string | null {
  if (!value)
    return null
  return typeof value === 'string' ? value : value.id
}

export default defineEventHandler(async (event): Promise<PublicPdvCatalogResponse> => {
  assertMethod(event, 'GET')
  const client = createServerDirectusClient(event)

  const [points, categories, products] = await Promise.all([
    client.request(
      readItems('pdv_production_points', {
        fields: ['id', 'name', 'emoji', 'role', 'sort'],
        filter: {
          active: { _eq: true },
          status: { _eq: 'published' },
        },
        sort: ['sort', 'name'],
        limit: -1,
      }),
    ),
    client.request(
      readItems('pdv_categories', {
        fields: ['id', 'name', 'icon', 'sort_order', { points_id: ['id', 'name', 'emoji', 'role', 'sort'] }],
        filter: {
          active: { _eq: true },
          status: { _eq: 'published' },
        },
        sort: ['sort_order', 'name'],
        limit: -1,
      }),
    ),
    client.request(
      readItems('pdv_products', {
        fields: ['id', 'name', 'price', 'stock_quantity', 'sort_order', 'imagem', 'emoji', 'category_id', 'production_point_id'],
        filter: {
          active: { _eq: true },
          status: { _eq: 'published' },
        },
        sort: ['sort_order', 'name'],
        limit: -1,
      }),
    ),
  ])

  const normalizedPoints: PublicPdvPoint[] = (points as PointRecord[])
    .map(point => ({
      id: point.id,
      name: point.name,
      emoji: point.emoji || '🛒',
      role: point.role || 'pdv',
      sort: Number(point.sort || 0),
    }))
    .filter(point => point.id !== LOJINHA_POINT_ID && point.role !== 'lojinha')

  const allowedPointIds = new Set(normalizedPoints.map(point => point.id))

  const normalizedCategories: PublicPdvCategory[] = (categories as CategoryRecord[])
    .map(category => ({
      id: category.id,
      name: category.name,
      icon: category.icon || 'shape',
      sort_order: Number(category.sort_order || 0),
      point: typeof category.points_id === 'object' && category.points_id
        ? {
            id: category.points_id.id,
            name: category.points_id.name,
            emoji: category.points_id.emoji || '🛒',
            role: category.points_id.role || 'pdv',
            sort: Number(category.points_id.sort || 0),
          }
        : null,
    }))
    .filter(category => category.point && allowedPointIds.has(category.point.id))

  const categoryMap = new Map(normalizedCategories.map(category => [category.id, category]))

  const normalizedProducts: PublicPdvProduct[] = (products as ProductRecord[])
    .map(product => ({
      id: product.id,
      name: product.name,
      price: Number(product.price || 0),
      stock_quantity: Number(product.stock_quantity || 0),
      sort_order: Number(product.sort_order || 0),
      imagem: resolveFileId(product.imagem),
      emoji: product.emoji || '🛍️',
      category_id: resolveId(product.category_id) || '',
      production_point_id: resolveId(product.production_point_id),
    }))
    .filter((product) => {
      if (!product.category_id)
        return false

      const category = categoryMap.get(product.category_id)
      const pointId = product.production_point_id || category?.point?.id || null
      return Boolean(pointId && allowedPointIds.has(pointId))
    })

  const pointsWithProducts = new Set(
    normalizedProducts
      .map((product) => {
        const category = categoryMap.get(product.category_id)
        return product.production_point_id || category?.point?.id || null
      })
      .filter((pointId): pointId is string => Boolean(pointId)),
  )

  const filteredPoints = normalizedPoints.filter(point => pointsWithProducts.has(point.id))
  const filteredPointIds = new Set(filteredPoints.map(point => point.id))
  const filteredCategories = normalizedCategories.filter(category => category.point && filteredPointIds.has(category.point.id))
  const filteredProducts = normalizedProducts.filter((product) => {
    const category = categoryMap.get(product.category_id)
    const pointId = product.production_point_id || category?.point?.id || null
    return Boolean(pointId && filteredPointIds.has(pointId))
  })

  return {
    points: filteredPoints,
    categories: filteredCategories,
    products: filteredProducts,
    defaultPointId: filteredPoints[0]?.id ?? null,
  }
})
