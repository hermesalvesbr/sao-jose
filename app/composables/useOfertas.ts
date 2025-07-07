import type { DirectusClient, RestClient } from '@directus/sdk'
import type { ApiCollections, OfertaFinanceira } from '~/types/schema'
import { readItems } from '@directus/sdk'

/**
 * Composable para gerenciar o estado das ofertas financeiras.
 * Centraliza a lógica de busca e o estado (ofertas, loading).
 *
 * @returns Um objeto com o estado reativo das ofertas, o estado de carregamento
 * e a função para buscar as ofertas.
 */
export function useOfertas() {
  const ofertas = useState<OfertaFinanceira[]>('ofertas', () => [])
  const loading = useState<boolean>('ofertas-loading', () => false)

  /**
   * Busca as ofertas financeiras do Directus e atualiza o estado.
   */
  async function fetchOfertas() {
    loading.value = true
    try {
      const d = await useDirectusClient() as DirectusClient<ApiCollections> & RestClient<ApiCollections>
      const result = await d.request(readItems('oferta_financeira', {
        fields: ['id', 'valor', 'data_entrada', { evento: ['titulo'] }] as any,
        sort: ['-date_created'],
        limit: 100,
      }))
      ofertas.value = Array.isArray(result) ? result as unknown as OfertaFinanceira[] : []
    }
    catch (err) {
      console.error('Erro ao carregar ofertas:', err)
      // Em caso de erro, limpa a lista para evitar dados obsoletos
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
