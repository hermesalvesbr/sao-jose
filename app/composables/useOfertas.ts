import type { DirectusClient, RestClient } from '@directus/sdk'
import type { ApiCollections, OfertaFinanceira } from '~/types/schema'
import { readItems } from '@directus/sdk'

export function useOfertas() {
  const ofertas = useState<OfertaFinanceira[]>('ofertas', () => [])
  const loading = useState<boolean>('ofertas-loading', () => false)

  async function fetchOfertas(): Promise<void> {
    loading.value = true
    try {
      const d = await useDirectusClient() as DirectusClient<ApiCollections> & RestClient<ApiCollections>
      const result = await d.request(readItems('oferta_financeira', {
        fields: ['id', 'valor', 'data_entrada', 'meio', 'observacao', 'valores_detalhados', { evento: ['titulo'] }] as any,
        filter: { status: { _eq: 'published' } } as any,
        sort: ['-date_created'],
        limit: 100,
      }))
      ofertas.value = Array.isArray(result) ? result as unknown as OfertaFinanceira[] : []
    }
    catch (err) {
      console.error('Erro ao carregar ofertas:', err)
      ofertas.value = []
    }
    finally {
      loading.value = false
    }
  }

  return {
    ofertas,
    loading,
    fetchOfertas,
  }
}
