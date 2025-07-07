import { authentication, createDirectus, readMe, rest } from '@directus/sdk'

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

  /**
   * Verifica se o usuário atual está autenticado.
   * O SDK do Directus gerencia o token (em cookies), então uma requisição bem-sucedida
   * para `readMe` confirma a autenticação.
   * @returns Os dados do usuário se autenticado, caso contrário, `null`.
   */
  async function checkUser() {
    try {
      const client = await getClient()
      return await client.request(readMe({ fields: ['id'] }))
    }
    catch {
      // Se a requisição falhar (ex: 401 Unauthorized), consideramos o usuário como não logado.
      return null
    }
  }

  /**
   * Realiza o logout do usuário, invalidando o token.
   */
  async function logout() {
    try {
      const client = await getClient()
      await client.logout()
    }
    catch (e) {
      console.error('Falha ao fazer logout:', e)
    }
  }

  return {
    entrar,
    checkUser,
    logout,
    loading,
    error,
  }
}
