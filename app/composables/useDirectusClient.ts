// composables/directus/useDirectusClient.ts
import type { DirectusClient, RestClient } from '@directus/sdk'
import type { ApiCollections } from '@/types/schema'
import { createDirectus, rest, staticToken } from '@directus/sdk'

interface DirectusConfig {
  url: string
  token: string
}

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
 * Cria um client Directus usando dados do endpoint interno /api/directus
 * @returns Promise<DirectusClient>
 * @throws Error caso não seja possível obter as credenciais
 */
export async function useDirectusClient() {
  return retryOperation(async () => {
    const { url, token } = await $fetch<DirectusConfig>('/api/directus')
    return createDirectus<ApiCollections>(url)
      .with(staticToken(token))
      .with(rest())
  })
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
