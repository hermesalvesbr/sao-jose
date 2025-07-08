import type { AuthenticationClient, DirectusClient, RestClient } from '@directus/sdk'
import type { ApiCollections } from '~/types/schema'
import { authentication, createDirectus, login as directusLogin, readMe, rest } from '@directus/sdk'

/**
 * AuthService encapsula autenticação e gerenciamento do usuário autenticado via Directus.
 * Evita múltiplos fetchs da URL do Directus e expõe métodos para login, logout, token e avatar.
 */
class AuthService {
  private directusUrl: string | null = null
  private token: string | null = null
  private _refreshToken: string | null = null
  public loading = ref(false)
  public error = ref<Error | null>(null)
  public isAuthenticated = ref(false)
  public user = ref<any>(null)

  constructor() {
    // Restaura o token do localStorage, se existir
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('directus_token')
      if (storedToken) {
        this.token = storedToken
      }
      const storedRefreshToken = localStorage.getItem('directus_refresh_token')
      if (storedRefreshToken) {
        this._refreshToken = storedRefreshToken
      }
    }
  }

  /**
   * Busca e armazena a URL do Directus apenas uma vez.
   */
  ensureDirectusUrl = async (): Promise<string> => {
    if (!this.directusUrl) {
      const { url } = await $fetch<{ url: string }>('/api/directus')
      this.directusUrl = url
    }
    return this.directusUrl
  }

  /**
   * Cria um cliente Directus com autenticação por token estático
   * @param token Token estático para autenticação
   */
  public async getStaticClient(token?: string): Promise<DirectusClient<ApiCollections> & RestClient<ApiCollections> & AuthenticationClient<ApiCollections>> {
    const url = await this.ensureDirectusUrl()
    const client = createDirectus<ApiCollections>(url)
      .with(rest())
      .with(authentication())
    if (token) {
      client.setToken(token)
    }
    return client
  }

  /**
   * Cria um cliente Directus com autenticação por login/senha
   */
  /**
   * Cria um cliente Directus com autenticação por login/senha (modo JSON, recomendado para login via API)
   */
  public async getAuthClient(): Promise<DirectusClient<ApiCollections> & RestClient<ApiCollections> & AuthenticationClient<ApiCollections>> {
    const url = await this.ensureDirectusUrl()
    const client = createDirectus<ApiCollections>(url)
      .with(rest())
      .with(authentication('json'))
    if (this.token) {
      client.setToken(this.token)
    }
    return client
  }

  /**
   * Realiza login com email e senha
   * @param credentials Credenciais de login
   */
  /**
   * Realiza login com email e senha usando o authentication('json')
   * @param credentials Credenciais de login
   */
  public async entrar(credentials: { email: string, password: string }) {
    this.loading.value = true
    this.error.value = null
    try {
      const client = await this.getAuthClient()
      // Alternativa: login via request(login(...)) para máxima compatibilidade
      const result = await client.request(directusLogin({ email: credentials.email, password: credentials.password }))
      if (result.access_token) {
        this.token = result.access_token
        if (result.refresh_token) {
          this._refreshToken = result.refresh_token
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('directus_token', this.token)
          if (this._refreshToken) {
            localStorage.setItem('directus_refresh_token', this._refreshToken)
          }
        }
        this.isAuthenticated.value = true
        await this.fetchCurrentUser()
      }
      return result
    }
    catch (e) {
      this.error.value = e as Error
      this.isAuthenticated.value = false
      this.user.value = null
      this.token = null
      console.error('Login failed:', e)
      throw e
    }
    finally {
      this.loading.value = false
    }
  }

  /**
   * Verifica se o usuário atual está autenticado e busca seus dados
   * @returns Os dados do usuário se autenticado, caso contrário, `null`
   */
  public async checkUser() {
    try {
      const client = await this.getAuthClient()
      const userData = await client.request(readMe({
        fields: ['id', 'email', 'first_name', 'last_name', 'role', 'avatar'],
      }))
      if (userData) {
        this.isAuthenticated.value = true
        this.user.value = userData
        return userData
      }
      return null
    }
    catch {
      this.isAuthenticated.value = false
      this.user.value = null
      return null
    }
  }

  /**
   * Busca os dados do usuário atual
   */
  public async fetchCurrentUser() {
    try {
      const client = await this.getAuthClient()
      const userData = await client.request(readMe())
      this.user.value = userData
      return userData
    }
    catch (e) {
      console.error('Falha ao buscar dados do usuário:', e)
      this.user.value = null
      return null
    }
  }

  /**
   * Obtém o token de acesso do usuário autenticado
   * @returns O token de acesso ou `null` se ocorrer um erro
   */
  public async getToken() {
    try {
      const client = await this.getAuthClient()
      return await client.getToken()
    }
    catch (e) {
      console.error('Falha ao obter o token:', e)
      return null
    }
  }

  /**
   * Realiza o logout do usuário, invalidando o token
   */
  public async logout() {
    this.loading.value = true
    try {
      // Realiza o logout localmente, sem depender do refresh token
      this.isAuthenticated.value = false
      this.user.value = null
      this.error.value = null
      this.token = null
      this._refreshToken = null
      if (typeof window !== 'undefined') {
        localStorage.removeItem('directus_token')
        localStorage.removeItem('directus_refresh_token')
      }
      // Limpa o cache do usuário se o composable useUser existir (evita erro SSR)
      try {
        if (typeof window !== 'undefined' && typeof (window as any).useUser === 'function') {
          const { clearUser } = (window as any).useUser()
          if (typeof clearUser === 'function')
            clearUser()
        }
      }
      catch {
        // useUser pode não existir
      }
      // Redireciona para a página de login
      await navigateTo('/admin')
    }
    catch (e) {
      console.error('Falha ao fazer logout:', e)
      this.error.value = e as Error
    }
    finally {
      this.loading.value = false
    }
  }

  /**
   * Refresh do token de autenticação
   */
  public async refreshToken() {
    try {
      const client = await this.getAuthClient()
      const result = await client.refresh()
      if (result.access_token) {
        this.token = result.access_token
        if (result.refresh_token) {
          this._refreshToken = result.refresh_token
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('directus_token', this.token)
          if (this._refreshToken) {
            localStorage.setItem('directus_refresh_token', this._refreshToken)
          }
        }
        this.isAuthenticated.value = true
        await this.fetchCurrentUser()
      }
      return result
    }
    catch (e) {
      console.error('Falha ao renovar token:', e)
      this.isAuthenticated.value = false
      this.user.value = null
      this.token = null
      this.error.value = e as Error
      return null
    }
  }

  /**
   * Gera a URL do avatar do usuário autenticado, se disponível.
   * @returns string | null
   */
  public getUserAvatarUrl(): string | null {
    if (!this.user.value || !this.user.value.avatar)
      return null
    if (!this.directusUrl)
      return null
    let url = `${this.directusUrl.replace(/\/$/, '')}/assets/${this.user.value.avatar}`
    if (this.token) {
      url += `?access_token=${this.token}`
    }
    return url
  }

  public async init() {
    return this.checkUser()
  }
}

let _authService: AuthService | null = null

/**
 * useAuth composable: retorna singleton do AuthService e proxies para reatividade.
 */
export function useAuth() {
  if (!_authService) {
    _authService = new AuthService()
    // Executa verificação inicial de autenticação
    if (typeof window !== 'undefined') {
      _authService.init()
    }
  }
  return {
    // Clients
    getStaticClient: _authService.getStaticClient.bind(_authService),
    getAuthClient: _authService.getAuthClient.bind(_authService),

    // Authentication methods
    entrar: _authService.entrar.bind(_authService),
    logout: _authService.logout.bind(_authService),
    refreshToken: _authService.refreshToken.bind(_authService), // método público, não a propriedade

    // User methods
    checkUser: _authService.checkUser.bind(_authService),
    fetchCurrentUser: _authService.fetchCurrentUser.bind(_authService),
    getToken: _authService.getToken.bind(_authService),
    getUserAvatarUrl: _authService.getUserAvatarUrl.bind(_authService),

    // State
    loading: _authService.loading,
    error: _authService.error,
    isAuthenticated: _authService.isAuthenticated,
    user: _authService.user,
  }
}
