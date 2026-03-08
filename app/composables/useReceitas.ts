import type { DirectusClient, RestClient } from '@directus/sdk'
/**
 * useReceitas — CRUD para receitas avulsas do novenário.
 *
 * Cobre: doações, campanhas/rifas, taxas/ingressos, subsídios, reembolsos.
 * Inclui gestão de comprovantes (M2M via receitas_comprovantes → directus_files).
 *
 * DRY: reutiliza useAuth().getAuthClient() e padrões de useDizimos/usePdv.
 */
import type { ReceitaComprovanteItem } from '~/types/comprovantes'
import type { ApiCollections, Receita } from '~/types/schema'
import { createItem, deleteItem, readItems, updateItem, uploadFiles } from '@directus/sdk'

export const TIPO_RECEITA_LABELS: Record<string, string> = {
  doacao: 'Doação / Contribuição',
  campanha: 'Campanha / Rifa / Bingo / Leilão',
  taxa: 'Taxa / Ingresso',
  subsidio: 'Subsídio / Repasse',
  reembolso: 'Reembolso',
  outro: 'Outro',
}

export const MEIO_PAGAMENTO_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao: 'Cartão',
  transferencia: 'Transferência',
  permuta: 'Permuta / In natura',
}

type DirectusTypedClient = DirectusClient<ApiCollections> & RestClient<ApiCollections>

export function useReceitas() {
  const { getAuthClient } = useAuth()
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function getClient(): Promise<DirectusTypedClient> {
    return await getAuthClient() as DirectusTypedClient
  }

  // ─── RECEITAS CRUD ─────────────────────────────────────────────────────────

  async function fetchReceitas(query: Record<string, unknown> = {}): Promise<Receita[]> {
    loading.value = true
    error.value = null
    try {
      const client = await getClient()
      const result = await client.request(readItems('receitas', {
        filter: { status: { _eq: 'published' } },
        sort: ['-data', '-date_created'],
        limit: -1,
        fields: ['*', { responsavel_id: ['id', 'nome'] }],
        ...query,
      } as any))
      return (result as unknown as Receita[]) ?? []
    }
    catch (e: unknown) {
      error.value = 'Erro ao carregar receitas'
      console.error('useReceitas.fetchReceitas:', e)
      return []
    }
    finally {
      loading.value = false
    }
  }

  async function fetchReceitaById(id: string): Promise<Receita | null> {
    loading.value = true
    error.value = null
    try {
      const client = await getClient()
      const result = await client.request(readItems('receitas', {
        filter: { id: { _eq: id } },
        fields: ['*', { responsavel_id: ['id', 'nome'] }],
        limit: 1,
      } as any))
      const items = result as unknown as Receita[]
      return items[0] ?? null
    }
    catch (e: unknown) {
      error.value = 'Erro ao carregar receita'
      console.error('useReceitas.fetchReceitaById:', e)
      return null
    }
    finally {
      loading.value = false
    }
  }

  async function salvarReceita(data: Partial<Receita>): Promise<Receita> {
    loading.value = true
    error.value = null
    try {
      const client = await getClient()
      const payload = { ...data, status: 'published' }
      return await client.request(createItem('receitas', payload as any)) as Receita
    }
    catch (e: unknown) {
      error.value = 'Erro ao salvar receita'
      console.error('useReceitas.salvarReceita:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  async function atualizarReceita(id: string, data: Partial<Receita>): Promise<Receita> {
    loading.value = true
    error.value = null
    try {
      const client = await getClient()
      return await client.request(updateItem('receitas', id, data as any)) as Receita
    }
    catch (e: unknown) {
      error.value = 'Erro ao atualizar receita'
      console.error('useReceitas.atualizarReceita:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  async function arquivarReceita(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const client = await getClient()
      await client.request(updateItem('receitas', id, { status: 'archived' } as any))
    }
    catch (e: unknown) {
      error.value = 'Erro ao arquivar receita'
      console.error('useReceitas.arquivarReceita:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  // ─── COMPROVANTES (M2M → directus_files) ───────────────────────────────────

  async function fetchComprovantes(receitaId: string): Promise<ReceitaComprovanteItem[]> {
    try {
      const client = await getClient()
      const result = await client.request(readItems('receitas_comprovantes', {
        filter: { receita_id: { _eq: receitaId } },
        fields: ['id', 'receita_id', { directus_files_id: ['id', 'title', 'type', 'filesize', 'filename_download'] }],
        limit: -1,
      } as any))
      return (result as unknown as ReceitaComprovanteItem[]) ?? []
    }
    catch (e: unknown) {
      console.error('useReceitas.fetchComprovantes:', e)
      return []
    }
  }

  async function uploadComprovante(receitaId: string, file: File): Promise<ReceitaComprovanteItem | null> {
    loading.value = true
    error.value = null
    try {
      const client = await getClient()
      // 1. Upload do arquivo para directus_files
      const formData = new FormData()
      formData.append('file', file)
      const uploaded = await client.request(uploadFiles(formData)) as { id: string }
      if (!uploaded?.id)
        throw new Error('Upload falhou')
      // 2. Cria registro na junction
      const junction = await client.request(createItem('receitas_comprovantes', {
        receita_id: receitaId,
        directus_files_id: uploaded.id,
      } as any)) as ReceitaComprovanteItem
      return junction
    }
    catch (e: unknown) {
      error.value = 'Erro ao fazer upload do comprovante'
      console.error('useReceitas.uploadComprovante:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  async function removerComprovante(junctionId: number): Promise<void> {
    loading.value = true
    try {
      const client = await getClient()
      await client.request(deleteItem('receitas_comprovantes', junctionId as any))
    }
    catch (e: unknown) {
      error.value = 'Erro ao remover comprovante'
      console.error('useReceitas.removerComprovante:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchReceitas,
    fetchReceitaById,
    salvarReceita,
    atualizarReceita,
    arquivarReceita,
    fetchComprovantes,
    uploadComprovante,
    removerComprovante,
  }
}
