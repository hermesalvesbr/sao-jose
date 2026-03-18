import type { Agenda } from '@/types/schema'

/**
 * Composable que encapsula o estado e a busca dos eventos da agenda.
 * Usa a rota server-side `/api/agenda` para que o token Directus
 * nunca seja exposto ao browser.
 */
export function useAgenda() {
  const events = ref<Agenda[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Busca todos os eventos publicados via rota server-side do Nuxt.
   */
  async function fetchAgenda() {
    loading.value = true
    error.value = null
    try {
      const result = await $fetch<Agenda[]>('/api/agenda')
      events.value = Array.isArray(result) ? result : []
    }
    catch {
      error.value = 'Erro ao buscar agenda. Por favor, tente novamente mais tarde.'
    }
    finally {
      loading.value = false
    }
  }

  onMounted(fetchAgenda)

  return { events, loading, error, fetchAgenda }
}
