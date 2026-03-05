import { readItems } from '@directus/sdk'

/**
 * GET /api/agenda
 * Retorna todos os eventos publicados da agenda do Directus.
 * A requisição é feita server-side; o token nunca é exposto ao browser.
 */
export default defineEventHandler(async (event) => {
  assertMethod(event, 'GET')
  const client = createServerDirectusClient(event)
  return client.request(
    readItems('agenda', {
      fields: ['id', 'status', 'titulo', 'descricao', 'recorrente', 'dia', 'data_evento', 'horario', 'tipo_especial', 'data_limite'],
      filter: { status: { _eq: 'published' } },
      sort: ['-data_evento'],
      limit: -1,
    }),
  )
})
