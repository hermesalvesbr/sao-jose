import type { AuthenticationClient, AuthenticationStorage, DirectusClient, RestClient } from '@directus/sdk'
import type { ApiCollections } from '~/types/schema'
import { authentication, createDirectus, readMe, rest } from '@directus/sdk'

/** Chave única no localStorage para persistir o estado completo de autenticação do SDK. */
const AUTH_STORAGE_KEY = 'directus_auth'

/**
 * Adaptador de armazenamento que serializa/deserializa o estado completo
 * de autenticação do Directus SDK (access_token, refresh_token, expires_at)
 * em uma única entrada do localStorage.
 */
function createLocalStorageAdapter(): AuthenticationStorage {
  return {
    get() {
      if (typeof window === 'undefined')
        return null
      try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY)
        return raw ? JSON.parse(raw) : null
      }
      catch {
        return null
      }
    },
    set(value) {
      if (typeof window === 'undefined')
        return
      if (value) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value))
      }
      else {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    },
  }
}

/**
 * AuthService encapsula autenticação e gerenciamento do usuário autenticado via Directus.
 * Usa um cliente SDK singleton com autoRefresh e storage adapter para persistência robusta.
 * O SDK gerencia automaticamente a renovação do access_token antes do vencimento.
 */
class AuthService {
  private directusUrl: string | null = null
  private _client: (DirectusClient<ApiCollections> & RestClient<ApiCollections> & AuthenticationClient<ApiCollections>) | null = null
  public loading = ref(false)
  public error = ref<Error | null>(null)
  public isAuthenticated = ref(false)
  public user = ref<any>(null)

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
   * Retorna o cliente SDK singleton com autoRefresh e storage adapter.
   * O mesmo cliente é reutilizado em toda vida útil do app, garantindo
   * que o SDK gerencie tokens e renovações automaticamente.
   */
  public async getAuthClient(): Promise<DirectusClient<ApiCollections> & RestClient<ApiCollections> & AuthenticationClient<ApiCollections>> {
    if (!this._client) {
      const url = await this.ensureDirectusUrl()
      this._client = createDirectus<ApiCollections>(url)
        .with(rest())
        .with(authentication('json', {
          autoRefresh: true,
          storage: createLocalStorageAdapter(),
        }))
    }
    return this._client
  }

  /**
   * Cria um cliente Directus com autenticação por token estático (legado).
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
   * Realiza login com email e senha.
   * O SDK persiste automaticamente access_token, refresh_token e expires_at
   * via o storage adapter, e agenda a renovação automática.
   */
  public async entrar(credentials: { email: string, password: string }) {
    this.loading.value = true
    this.error.value = null
    try {
      const client = await this.getAuthClient()
      await client.login({ email: credentials.email, password: credentials.password })
      this.isAuthenticated.value = true
      await this.fetchCurrentUser()
    }
    catch (e) {
      this.error.value = e as Error
      this.isAuthenticated.value = false
      this.user.value = null
      console.error('Login failed:', e)
      throw e
    }
    finally {
      this.loading.value = false
    }
  }

  /**
   * Verifica se há sessão válida restaurando o token do storage.
   * O SDK executa refresh automático se o access_token estiver expirado.
   * @returns Os dados do usuário se autenticado, caso contrário, `null`
   */
  public async checkUser() {
    try {
      const client = await this.getAuthClient()
      // getToken() dispara o refresh automático se necessário
      const token = await client.getToken()
      if (!token) {
        this.isAuthenticated.value = false
        this.user.value = null
        return null
      }
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
   * Busca os dados do usuário atual.
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
   * Obtém o token de acesso atual (com refresh automático se necessário).
   * @returns O token de acesso ou `null`
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
   * Realiza o logout: invalida o token no servidor e limpa o storage.
   */
  public async logout() {
    this.loading.value = true
    try {
      const client = await this.getAuthClient()
      try {
        await client.logout()
      }
      catch {
        // ignora erro de rede no logout — limpeza local ocorre de qualquer forma
      }
      this.isAuthenticated.value = false
      this.user.value = null
      this.error.value = null
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
   * Força o refresh manual do token de autenticação.
   */
  public async refreshToken() {
    try {
      const client = await this.getAuthClient()
      const result = await client.refresh()
      this.isAuthenticated.value = true
      await this.fetchCurrentUser()
      return result
    }
    catch (e) {
      console.error('Falha ao renovar token:', e)
      this.isAuthenticated.value = false
      this.user.value = null
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
    return `${this.directusUrl.replace(/\/$/, '')}/assets/${this.user.value.avatar}`
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
