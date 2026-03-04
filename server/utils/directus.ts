import type { ApiCollections } from '../../app/types/schema'
import { createDirectus, rest, staticToken } from '@directus/sdk'

/**
 * Cria um client Directus autenticado para uso exclusivo em server routes do Nuxt.
 * O token permanece no servidor, nunca é exposto ao browser.
 *
 * @param event - H3 event do servidor (necessário para acessar runtimeConfig)
 */
export function createServerDirectusClient(event: Parameters<typeof useRuntimeConfig>[0]) {
  const config = useRuntimeConfig(event)
  return createDirectus<ApiCollections>(config.public.directus.url as string)
    .with(staticToken(config.directus.token as string))
    .with(rest())
}
