// composables/directus/useDirectusClient.ts
import { createDirectus, rest, staticToken } from '@directus/sdk'

interface DirectusConfig {
  url: string
  token: string
}

/**
 * Cria um client Directus usando dados do endpoint interno /api/directus
 * @returns Promise<DirectusClient>
 * @throws Error caso não seja possível obter as credenciais
 */
export async function useDirectusClient() {
  try {
    const { url, token } = await $fetch<DirectusConfig>('/api/directus')
    const client = createDirectus(url)
      .with(staticToken(token))
      .with(rest())
    return client
  }
  catch (error) {
    console.error('Erro ao criar o Directus Client:', error)
    throw new Error('Não foi possível conectar ao serviço Directus.')
  }
}
