import type { AdsNovenario } from '~/types/schema'
import { createItem, deleteItem, readItem, readItems, updateItem, uploadFiles } from '@directus/sdk'

export function useAdsNovenario() {
  const { getAuthClient } = useAuth()
  const anuncios = useState<AdsNovenario[]>('ads-novenario', () => [])
  const loading = useState<boolean>('ads-novenario-loading', () => false)

  async function fetchAnuncios(): Promise<void> {
    loading.value = true
    try {
      const client = await getAuthClient()
      const result = await client.request(readItems('ads_novenario', {
        fields: ['id', 'status', 'anunciante', 'midia', 'tipo_midia', 'duracao', 'valor_pago', 'sort', 'status_pagamento', 'meio_pagamento', 'data_pagamento', 'permuta_descricao', 'valor_permuta', 'valor_pago_especie', 'recibo_pagamento'],
        sort: ['sort'],
        limit: -1,
      }))
      anuncios.value = Array.isArray(result) ? result as unknown as AdsNovenario[] : []
    }
    catch (err) {
      console.error('Erro ao carregar anúncios:', err)
      anuncios.value = []
    }
    finally {
      loading.value = false
    }
  }

  async function fetchAnuncioById(id: string): Promise<AdsNovenario | null> {
    loading.value = true
    try {
      const client = await getAuthClient()
      const result = await client.request(readItem('ads_novenario', id, {
        fields: ['id', 'status', 'anunciante', 'midia', 'tipo_midia', 'duracao', 'valor_pago', 'sort', 'status_pagamento', 'meio_pagamento', 'data_pagamento', 'permuta_descricao', 'valor_permuta', 'valor_pago_especie', 'recibo_pagamento'],
      }))
      return result as unknown as AdsNovenario
    }
    catch (err) {
      console.error('Erro ao carregar anúncio:', err)
      return null
    }
    finally {
      loading.value = false
    }
  }

  async function salvarAnuncio(data: Partial<AdsNovenario>): Promise<void> {
    const client = await getAuthClient()
    await client.request(createItem('ads_novenario', data as never))
  }

  async function atualizarAnuncio(id: string, data: Partial<AdsNovenario>): Promise<void> {
    const client = await getAuthClient()
    await client.request(updateItem('ads_novenario', id, data as never))
  }

  async function removerAnuncio(id: string): Promise<void> {
    const client = await getAuthClient()
    await client.request(deleteItem('ads_novenario', id))
  }

  async function uploadMidia(file: File): Promise<string | null> {
    try {
      const client = await getAuthClient()
      const formData = new FormData()
      formData.append('file', file)
      const result = await client.request(uploadFiles(formData))
      return (result as unknown as Record<string, string>)?.id ?? null
    }
    catch (e) {
      console.error('Erro ao fazer upload de mídia:', e)
      throw e
    }
  }

  function getAssetUrl(fileId: string | null | undefined): string | null {
    if (!fileId)
      return null
    return getDirectusAssetUrl(fileId)
  }

  return {
    anuncios,
    loading,
    fetchAnuncios,
    fetchAnuncioById,
    salvarAnuncio,
    atualizarAnuncio,
    removerAnuncio,
    uploadMidia,
    getAssetUrl,
  }
}
