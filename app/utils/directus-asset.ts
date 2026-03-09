/**
 * Builds a Directus asset URL with the public access token when available.
 * Auto-imported by Nuxt — call from any component, composable or page.
 */
const TRAILING_SLASH_RE = /\/$/

export function getDirectusAssetUrl(fileId: string, params?: Record<string, string | number>): string {
  const { directus } = useRuntimeConfig().public as { directus: { url: string, token: string } }
  const base = directus.url.replace(TRAILING_SLASH_RE, '')
  const query = new URLSearchParams()

  if (directus.token)
    query.set('access_token', directus.token)

  if (params) {
    for (const [k, v] of Object.entries(params))
      query.set(k, String(v))
  }

  const qs = query.toString()
  return qs ? `${base}/assets/${fileId}?${qs}` : `${base}/assets/${fileId}`
}
