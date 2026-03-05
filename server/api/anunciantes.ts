import type { AdsNovenario } from '~~/app/types/schema'
import { readItems } from '@directus/sdk'

interface RawLog {
  ads: string
  duracao_exibida: number
  exibido_em: string
}

/**
 * GET /api/anunciantes
 * Retorna todos os anúncios publicados com estatísticas agregadas de exibição.
 */
export default defineEventHandler(async (event) => {
  assertMethod(event, 'GET')
  const client = createServerDirectusClient(event)

  const [ads, logs] = await Promise.all([
    client.request(
      readItems('ads_novenario', {
        fields: ['id', 'anunciante', 'tipo_midia', 'duracao', 'valor_pago'],
        filter: { status: { _eq: 'published' } },
        sort: ['sort'],
        limit: -1,
      }),
    ) as unknown as AdsNovenario[],
    client.request(
      readItems('ads_log', {
        fields: ['ads', 'duracao_exibida', 'exibido_em'],
        limit: -1,
      } as never),
    ) as unknown as RawLog[],
  ])

  return ads.map((ad) => {
    const adLogs = logs.filter(l => l.ads === ad.id)
    const totalDuracao = adLogs.reduce((acc, l) => acc + (l.duracao_exibida || 0), 0)
    const sorted = [...adLogs].sort(
      (a, b) => new Date(b.exibido_em).getTime() - new Date(a.exibido_em).getTime(),
    )
    return {
      id: ad.id,
      anunciante: ad.anunciante,
      tipo_midia: ad.tipo_midia,
      duracao: ad.duracao,
      valor_pago: ad.valor_pago,
      total_exibicoes: adLogs.length,
      total_duracao_exibida: totalDuracao,
      ultima_exibicao: sorted[0]?.exibido_em ?? null,
    }
  })
})
