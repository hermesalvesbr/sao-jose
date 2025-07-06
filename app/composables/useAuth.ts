import { authentication, createDirectus, rest } from '@directus/sdk'

export function useAuth() {
  const loading = ref(false)
  const error = ref<Error | null>(null)

  async function getClient() {
    const { url } = await $fetch<{ url: string }>('/api/directus')
    return createDirectus(url).with(rest()).with(authentication('json'))
  }

  async function entrar(credentials: { email: string, password: any }) {
    loading.value = true
    error.value = null
    try {
      const client = await getClient()
      await client.login(credentials)
    }
    catch (e) {
      error.value = e as Error
      console.error('Login failed:', e)
    }
    finally {
      loading.value = false
    }
  }

  return {
    entrar,
    loading,
    error,
  }
}
