// composables/directus/useDirectusClient.ts
import type { DirectusClient, RestClient } from '@directus/sdk'
import type { ApiCollections } from '@/types/schema'

/**
 * Função genérica para tentar uma operação várias vezes
 * @param operation Função que será executada
 * @param maxRetries Número máximo de tentativas
 * @returns Resultado da operação
 */
async function retryOperation<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    }
    catch (error) {
      lastError = error as Error
      console.error(`Tentativa ${attempt} de ${maxRetries} falhou:`, error)

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
        continue
      }
    }
  }

  throw new Error(`Operação falhou após ${maxRetries} tentativas. Último erro: ${lastError?.message}`)
}

/**
 * Retorna o client Directus autenticado com o token do usuário logado.
 * Usa o mesmo cliente singleton de useAuth (com autoRefresh de JWT).
 */
export async function useDirectusClient() {
  const { getAuthClient } = useAuth()
  return getAuthClient()
}

/**
 * Retorna um client Directus com o token estático público configurado no .env
 * Usado em páginas públicas onde o visitante não tem login no painel.
 */
export async function usePublicDirectusClient() {
  const { public: { directus: { token } } } = useRuntimeConfig()
  const { getStaticClient } = useAuth()
  return getStaticClient(token)
}


/**
 * Executa uma requisição no Directus com retry automático
 * @param operation Função que faz a requisição
 * @returns Resultado da requisição
 */
export async function executeWithRetry<T>(operation: (client: DirectusClient<ApiCollections> & RestClient<ApiCollections>) => Promise<T>): Promise<T> {
  return retryOperation(async () => {
    const client = await useDirectusClient()
    return operation(client)
  })
}
