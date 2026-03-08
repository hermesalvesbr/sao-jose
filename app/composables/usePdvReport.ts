/**
 * usePdvReport — Utilitários compartilhados para relatórios do PDV/Quermesse.
 *
 * DRY: centraliza formatações, atalhos de data e lógica de impressão
 * usada em relatorio.vue, relatorio-itens.vue, relatorio-consolidado.vue,
 * sangria.vue e escala.vue.
 */

// ─── Date helpers ─────────────────────────────────────────────────────────────

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const BR_DATE_RE = /^\d{2}\/\d{2}\/\d{4}$/

/**
 * Converte um objeto Date para string ISO local (YYYY-MM-DD) sem conversão UTC.
 */
export function toLocalISO(d: Date): string {
  return d.toISOString().substring(0, 10)
}

/**
 * Converte YYYY-MM-DD para DD/MM/YYYY.
 * Aceita ISO com horário e retorna vazio para valores inválidos.
 */
export function isoToBrDate(dateStr: string | null | undefined): string {
  if (!dateStr)
    return ''

  const trimmed = dateStr.trim()
  if (BR_DATE_RE.test(trimmed))
    return trimmed

  const isoDate = trimmed.substring(0, 10)
  if (!ISO_DATE_RE.test(isoDate))
    return ''

  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

/**
 * Converte DD/MM/YYYY para YYYY-MM-DD.
 * Mantém ISO já válido e retorna vazio para valores inválidos.
 */
export function brToIsoDate(dateStr: string | null | undefined): string {
  if (!dateStr)
    return ''

  const trimmed = dateStr.trim()
  const isoDate = trimmed.substring(0, 10)
  if (ISO_DATE_RE.test(isoDate))
    return isoDate
  if (!BR_DATE_RE.test(trimmed))
    return ''

  const [day, month, year] = trimmed.split('/')
  return `${year}-${month}-${day}`
}

/**
 * Formata string YYYY-MM-DD para DD/MM/YYYY.
 */
export function formatDate(dateStr: string | null | undefined): string {
  return isoToBrDate(dateStr)
}

/**
 * Formata número como moeda BRL (R$ 1.234,56).
 */
export function formatCurrency(val: number | null | undefined): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val ?? 0)
}

/**
 * Converte texto monetário BR em número decimal.
 * Aceita valores como "R$ 100,00", "100,00" ou "100.50".
 */
export function parseCurrencyInput(raw: string | number | null | undefined): number {
  if (raw === undefined || raw === null || raw === '')
    return 0

  if (typeof raw === 'number')
    return raw

  const normalized = String(raw).trim()
  if (!normalized)
    return 0

  if (!normalized.includes(',') && /\d\.\d/.test(normalized))
    return Number.parseFloat(normalized.replace(/[^\d.]/g, '')) || 0

  const cleaned = normalized.replace(/[^\d,]/g, '').replace(',', '.')
  return Number.parseFloat(cleaned) || 0
}

/**
 * Formata string datetime ISO para hora local HH:MM.
 */
export function formatTime(datetimeStr: string | null | undefined): string {
  if (!datetimeStr)
    return ''
  const d = new Date(datetimeStr)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Formata string datetime ISO para DD/MM/YYYY HH:MM.
 */
export function formatDateTime(datetimeStr: string | null | undefined): string {
  if (!datetimeStr)
    return ''
  const d = new Date(datetimeStr)
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

// ─── Composable ───────────────────────────────────────────────────────────────

/**
 * Composable que provê estado reativo de período (dateFrom/dateTo) com
 * atalhos de data e rótulo de período formatado.
 */
export function usePdvReportPeriod() {
  const today = toLocalISO(new Date())
  const dateFrom = ref(today)
  const dateTo = ref(today)

  /** Label legível do período selecionado (ex: "03/03/2026" ou "01/03/2026 a 03/03/2026"). */
  const periodLabel = computed(() => {
    if (dateFrom.value === dateTo.value)
      return formatDate(dateFrom.value)
    return `${formatDate(dateFrom.value)} a ${formatDate(dateTo.value)}`
  })

  function setToday() {
    dateFrom.value = today
    dateTo.value = today
  }

  function setYesterday() {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    const iso = toLocalISO(d)
    dateFrom.value = iso
    dateTo.value = iso
  }

  function setThisWeek() {
    const d = new Date()
    const dayOfWeek = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    dateFrom.value = toLocalISO(monday)
    dateTo.value = today
  }

  function setThisMonth() {
    const d = new Date()
    dateFrom.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    dateTo.value = today
  }

  /** Período completo da novena (9 dias a partir de uma data inicial). */
  function setNovena(startDate?: string) {
    const start = startDate ? new Date(startDate) : new Date()
    start.setDate(start.getDate() - 8)
    dateFrom.value = toLocalISO(start)
    dateTo.value = today
  }

  return {
    dateFrom,
    dateTo,
    periodLabel,
    setToday,
    setYesterday,
    setThisWeek,
    setThisMonth,
    setNovena,
  }
}
