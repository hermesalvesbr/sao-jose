import type { PublicPdvMarkPrintedRequest } from '~/types/api'
import { updateItem } from '@directus/sdk'

export default defineEventHandler(async (event): Promise<{ success: true }> => {
  assertMethod(event, 'POST')
  const body = await readBody<PublicPdvMarkPrintedRequest>(event)

  if (!body?.saleId)
    throw createError({ statusCode: 400, statusMessage: 'Venda não informada.' })

  const client = createServerDirectusClient(event)
  await client.request(updateItem('pdv_sales', body.saleId, { printed: true }))

  return { success: true }
})
