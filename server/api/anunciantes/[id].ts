import { readItem, readItems } from '@directus/sdk'

/**
 * GET /api/anunciantes/:id
 * Retorna o anúncio e todo o histórico de exibições ordenado por data.
 */
export default defineEventHandler(async (event) => {
  assertMethod(event, 'GET')

  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'ID do anúncio é obrigatório' })

  const client = createServerDirectusClient(event)

  const [ad, logs] = await Promise.all([
    client.request(
      readItem('ads_novenario', id, {
        fields: ['id', 'anunciante', 'tipo_midia', 'duracao', 'midia'],
      } as never),
    ),
    client.request(
      readItems('ads_log', {
        fields: ['id', 'exibido_em', 'duracao_exibida', 'anunciante', 'tipo_midia'],
        filter: { ads: { _eq: id } },
        sort: ['-exibido_em'],
        limit: -1,
      } as never),
    ),
  ])

  return { ad, logs }
})
