import { readItems } from '@directus/sdk'

/**
 * GET /api/cardapio
 * Retorna produtos ativos agrupados por categoria (com ponto de produção).
 */
export default defineEventHandler(async (event) => {
  assertMethod(event, 'GET')
  const client = createServerDirectusClient(event)

  const [products, categories] = await Promise.all([
    client.request(
      readItems('pdv_products', {
        fields: ['id', 'name', 'price', 'sort_order', 'imagem', 'category_id'],
        filter: { active: { _eq: true }, status: { _eq: 'published' } },
        sort: ['sort_order'],
        limit: -1,
      }),
    ),
    client.request(
      readItems('pdv_categories', {
        fields: ['id', 'name', 'icon', 'sort_order', { points_id: ['id', 'name'] }],
        filter: { active: { _eq: true }, status: { _eq: 'published' } },
        sort: ['sort_order'],
        limit: -1,
      }),
    ),
  ])

  return { products, categories }
})
