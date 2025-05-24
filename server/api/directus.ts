export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  return {
    url: config.public.directus.url,
    token: config.directus.token,
  }
})
