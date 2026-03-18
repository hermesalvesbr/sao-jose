export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  return {
    url: config.public.directus.url,
    hasToken: Boolean(config.directus.token),
  }
})
