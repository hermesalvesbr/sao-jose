import type { Catolico } from '~/types/schema'

/** Nomes dos meses em português */
const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

/**
 * Composable que encapsula o estado e busca dos aniversariantes.
 * Usa a rota server-side `/api/aniversariantes` para que o token
 * Directus nunca seja exposto ao browser.
 *
 * DRY: reutilizado por `aniversariantes.vue` e `index.vue`.
 */
export function useAniversariantes() {
  const aniversariantes = ref<Catolico[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAniversariantes() {
    loading.value = true
    error.value = null
    try {
      const result = await $fetch<Catolico[]>('/api/aniversariantes')
      aniversariantes.value = Array.isArray(result) ? result : []
    }
    catch (err) {
      console.error('Erro ao buscar aniversariantes:', err)
      error.value = 'Erro ao buscar aniversariantes. Por favor, tente novamente mais tarde.'
    }
    finally {
      loading.value = false
    }
  }

  onMounted(fetchAniversariantes)

  // ─── Helpers ────────────────────────────────────────────

  /** Extrai mês (0-indexed) de uma string ISO `YYYY-MM-DD` */
  function getMesIndex(nascimento: string): number {
    const [, m] = nascimento.split('-')
    return Number.parseInt(m as string, 10) - 1
  }

  /** Extrai dia (string) de uma string ISO `YYYY-MM-DD` */
  function getDia(nascimento: string): string {
    const [, , d] = nascimento.split('-')
    return d as string
  }

  /** Retorna primeiro nome */
  function getPrimeiroNome(nome: string): string {
    return nome.split(' ')[0] ?? nome
  }

  /** Retorna ícone MDI de acordo com o sexo */
  function getSexoIcon(sexo: string): string {
    if (sexo === 'M')
      return 'mdi-gender-male'
    if (sexo === 'F')
      return 'mdi-gender-female'
    return 'mdi-account'
  }

  /** Nome do mês por índice 0-based */
  function getNomeMes(index: number): string {
    return MESES[index] ?? ''
  }

  // ─── Computeds derivados ────────────────────────────────

  /** Aniversariantes de um mês específico (0-based), ordenados por dia */
  function aniversariantesDoMes(month: number): Catolico[] {
    return aniversariantes.value
      .filter(a => a.nascimento && getMesIndex(a.nascimento as string) === month)
      .sort((a, b) => {
        const da = Number.parseInt(getDia(a.nascimento as string), 10)
        const db = Number.parseInt(getDia(b.nascimento as string), 10)
        return da - db
      })
  }

  /** Aniversariantes de hoje */
  const aniversariantesHoje = computed(() => {
    const hoje = new Date()
    const mesHoje = hoje.getMonth()
    const diaHoje = hoje.getDate()
    return aniversariantes.value.filter((a) => {
      if (!a.nascimento)
        return false
      const m = getMesIndex(a.nascimento as string)
      const d = Number.parseInt(getDia(a.nascimento as string), 10)
      return m === mesHoje && d === diaHoje
    })
  })

  /** Aniversariantes dos próximos 7 dias (exclui hoje) */
  const aniversariantesProximos = computed(() => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    return aniversariantes.value.filter((a) => {
      if (!a.nascimento)
        return false
      const m = getMesIndex(a.nascimento as string)
      const d = Number.parseInt(getDia(a.nascimento as string), 10)
      const aniv = new Date(hoje.getFullYear(), m, d)
      // Se já passou, tenta próximo ano
      if (aniv < hoje)
        aniv.setFullYear(aniv.getFullYear() + 1)
      const diff = (aniv.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      return diff > 0 && diff <= 7
    }).sort((a, b) => {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      function daysUntil(nasc: string) {
        const m = getMesIndex(nasc)
        const d = Number.parseInt(getDia(nasc), 10)
        const aniv = new Date(hoje.getFullYear(), m, d)
        if (aniv < hoje)
          aniv.setFullYear(aniv.getFullYear() + 1)
        return (aniv.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      }
      return daysUntil(a.nascimento as string) - daysUntil(b.nascimento as string)
    })
  })

  /** Aniversariantes da semana atual (domingo a sábado) */
  const aniversariantesSemana = computed(() => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const startOfWeek = new Date(hoje)
    startOfWeek.setDate(hoje.getDate() - hoje.getDay()) // domingo
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // sábado

    return aniversariantes.value.filter((a) => {
      if (!a.nascimento)
        return false
      const m = getMesIndex(a.nascimento as string)
      const d = Number.parseInt(getDia(a.nascimento as string), 10)
      const aniv = new Date(hoje.getFullYear(), m, d)
      return aniv >= startOfWeek && aniv <= endOfWeek
    }).sort((a, b) => {
      const da = getMesIndex(a.nascimento as string) * 31 + Number.parseInt(getDia(a.nascimento as string), 10)
      const db = getMesIndex(b.nascimento as string) * 31 + Number.parseInt(getDia(b.nascimento as string), 10)
      return da - db
    })
  })

  /** Verifica se uma data (Date) tem aniversariante */
  function temAniversariante(date: Date): Catolico[] {
    const mes = date.getMonth()
    const dia = date.getDate()
    return aniversariantes.value.filter((a) => {
      if (!a.nascimento)
        return false
      return getMesIndex(a.nascimento as string) === mes
        && Number.parseInt(getDia(a.nascimento as string), 10) === dia
    })
  }

  return {
    // State
    aniversariantes,
    loading,
    error,
    fetchAniversariantes,

    // Computeds
    aniversariantesHoje,
    aniversariantesProximos,
    aniversariantesSemana,

    // Methods
    aniversariantesDoMes,
    temAniversariante,
    getMesIndex,
    getDia,
    getPrimeiroNome,
    getSexoIcon,
    getNomeMes,

    // Constants
    MESES,
  }
}
