interface UsePublicSeoOptions {
  title: string
  description: string
  path?: string
  image?: string
  noindex?: boolean
}

const TRAILING_SLASH_RE = /\/$/

/**
 * Aplica metadados SEO padronizados para páginas públicas.
 * Inclui canonical, Open Graph e Twitter Card de forma DRY.
 */
export function usePublicSeo(options: UsePublicSeoOptions) {
  const route = useRoute()
  const runtimeConfig = useRuntimeConfig()

  const currentPath = computed(() => options.path ?? route.path)
  const requestUrl = import.meta.server ? useRequestURL() : null

  const runtimeSiteUrl = String(runtimeConfig.public.siteUrl || '').trim()
  const baseUrl = (runtimeSiteUrl
    || requestUrl?.origin
    || (import.meta.client ? window.location.origin : '')
  ).replace(TRAILING_SLASH_RE, '')

  const canonicalUrl = computed(() => {
    const normalizedPath = currentPath.value.startsWith('/')
      ? currentPath.value
      : `/${currentPath.value}`
    return `${baseUrl}${normalizedPath}`
  })

  const ogImageUrl = computed(() => {
    const rawImage = options.image || '/images/og-image.png'
    if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
      return rawImage
    }
    const normalizedPath = rawImage.startsWith('/') ? rawImage : `/${rawImage}`
    return `${baseUrl}${normalizedPath}`
  })

  useSeoMeta({
    title: options.title,
    description: options.description,
    robots: options.noindex ? 'noindex,nofollow' : 'index,follow',

    ogTitle: options.title,
    ogDescription: options.description,
    ogType: 'website',
    ogLocale: 'pt_BR',
    ogUrl: () => canonicalUrl.value,
    ogImage: () => ogImageUrl.value,

    twitterCard: 'summary_large_image',
    twitterTitle: options.title,
    twitterDescription: options.description,
    twitterImage: () => ogImageUrl.value,
  })

  useHead({
    link: [
      {
        rel: 'canonical',
        href: canonicalUrl,
      },
    ],
  })
}
