import { createItem } from '@directus/sdk'

interface AdsLogPayload {
  ads: string
  exibido_em: string
  duracao_exibida: number
  anunciante: string
  tipo_midia: string
}

/**
 * POST /api/ads-log
 * Registra a exibição de um anúncio no telão.
 * O token permanece server-side; a rota é pública para o telão não exigir autenticação.
 */
export default defineEventHandler(async (event) => {
  assertMethod(event, 'POST')
  const body = await readBody<AdsLogPayload>(event)

  if (!body?.ads || !body?.exibido_em) {
    throw createError({ statusCode: 400, statusMessage: 'ads e exibido_em são obrigatórios' })
  }

  const client = createServerDirectusClient(event)
  return client.request(
    createItem('ads_log', {
      ads: body.ads,
      exibido_em: body.exibido_em,
      duracao_exibida: body.duracao_exibida ?? 0,
      anunciante: body.anunciante ?? '',
      tipo_midia: body.tipo_midia ?? '',
      status: 'published',
    } as never),
  )
})
