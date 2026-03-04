import { readItems } from '@directus/sdk'

/**
 * GET /api/aniversariantes
 * Retorna todos os católicos publicados com data de nascimento.
 * A requisição é feita server-side; o token nunca é exposto ao browser.
 */
export default defineEventHandler(async (event) => {
  const client = createServerDirectusClient(event)
  return client.request(
    readItems('catolico', {
      fields: ['id', 'nome', 'sexo', 'nascimento', 'telefone', { instituicao: ['nome'] }],
      filter: {
        nascimento: { _nnull: true },
        status: { _eq: 'published' },
      },
      sort: ['nascimento'],
      limit: -1,
    }),
  )
})
