import { readItems } from '@directus/sdk'

/**
 * GET /api/ads-novenario
 * Retorna todos os anúncios publicados do novenário.
 * A requisição é feita server-side; o token nunca é exposto ao browser.
 */
export default defineEventHandler(async (event) => {
  assertMethod(event, 'GET')
  const client = createServerDirectusClient(event)
  return client.request(
    readItems('ads_novenario', {
      fields: ['id', 'anunciante', 'midia', 'tipo_midia', 'duracao', 'valor_pago', 'sort'],
      filter: { status: { _eq: 'published' } },
      sort: ['sort'],
      limit: -1,
    }),
  )
})
