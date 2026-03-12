<script setup lang="ts">
/**
 * Listagem de Receitas do Novenário
 *
 * Cobre: doações, campanhas, rifas, leilões, taxas, subsídios e outros.
 * Filtros: tipo, período, meio de pagamento.
 * UX: simples, mobile-first, ícones e cores por tipo para facilitar identificação.
 */
import { readItems } from '@directus/sdk'
import { formatCurrency, formatDate, toLocalISO } from '~/composables/usePdvReport'
import { MEIO_PAGAMENTO_LABELS, TIPO_RECEITA_LABELS } from '~/composables/useReceitas'

definePageMeta({ layout: 'admin' })

const directusUrl = useRuntimeConfig().public.directus.url as string

const { fetchReceitas, arquivarReceita, loading } = useReceitas()

const items = ref<any[]>([])
const filterTipo = useState<string | null>('receitas-filter-tipo', () => null)
const filterMeio = useState<string | null>('receitas-filter-meio', () => null)
const dateFrom = useState<string>('receitas-filter-from', () => '')
const dateTo = useState<string>('receitas-filter-to', () => '')

function setToday() {
  const today = toLocalISO(new Date())
  dateFrom.value = today
  dateTo.value = today
}
function setThisMonth() {
  const d = new Date()
  dateFrom.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  dateTo.value = toLocalISO(d)
}
function setNovena() {
  const start = new Date()
  start.setDate(start.getDate() - 8)
  dateFrom.value = toLocalISO(start)
  dateTo.value = toLocalISO(new Date())
}

const tipoOpcoes = Object.entries(TIPO_RECEITA_LABELS).map(([value, title]) => ({ value, title }))
const meioOpcoes = Object.entries(MEIO_PAGAMENTO_LABELS).map(([value, title]) => ({ value, title }))

// ─── Ícones e cores por tipo ─────────────────────────────────────────────────
const TIPO_META: Record<string, { icon: string, color: string }> = {
  doacao: { icon: 'mdi-hand-heart-outline', color: 'success' },
  campanha: { icon: 'mdi-ticket-percent-outline', color: 'warning' },
  taxa: { icon: 'mdi-ticket-outline', color: 'info' },
  subsidio: { icon: 'mdi-bank-transfer-in', color: 'secondary' },
  reembolso: { icon: 'mdi-cash-refund', color: 'primary' },
  intencoes: { icon: 'mdi-candelabra', color: 'purple' },
  anuncio: { icon: 'mdi-bullhorn-outline', color: 'teal' },
  outro: { icon: 'mdi-dots-horizontal-circle-outline', color: 'default' },
}

// ─── Dialog arquivar ─────────────────────────────────────────────────────────
const confirmDialog = ref(false)
const itemToArchive = ref<any>(null)
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

// ─── Table headers ────────────────────────────────────────────────────────────
const headers = [
  { title: 'Data', key: 'data', width: '110px', sortable: true },
  { title: 'Tipo', key: 'tipo', width: '160px', sortable: true },
  { title: 'Descrição', key: 'descricao', sortable: true },
  { title: 'Meio', key: 'meio_pagamento', width: '180px', sortable: false },
  { title: 'Valor', key: 'valor', align: 'end' as const, width: '120px', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'end' as const, width: '90px' },
]

// ─── Filtros aplicados ────────────────────────────────────────────────────────
const filteredItems = computed(() => {
  let result = items.value
  if (filterTipo.value)
    result = result.filter(i => i.tipo === filterTipo.value)
  if (filterMeio.value) {
    const meio = filterMeio.value
    result = result.filter((i) => {
      if (Array.isArray(i.pagamentos) && i.pagamentos.length > 0)
        return i.pagamentos.some((p: { meio: string }) => p.meio === meio)
      return i.meio_pagamento === meio
    })
  }
  if (dateFrom.value)
    result = result.filter(i => !i.data || i.data >= dateFrom.value!)
  if (dateTo.value)
    result = result.filter(i => !i.data || i.data <= dateTo.value!)
  return result
})

const totalFiltrado = computed(() =>
  filteredItems.value.reduce((sum, i) => sum + Number(i.valor || 0), 0),
)

// ─── Data loading ─────────────────────────────────────────────────────────────
async function loadData() {
  const receitas = await fetchReceitas()

  // Load comprovantes
  try {
    const c = await useAuth().getAuthClient()
    const compRes = await c.request(readItems('receitas_files', {
      filter: { receitas_id: { _in: receitas.map(r => r.id) } },
      fields: ['id', 'receitas_id', 'directus_files_id.id', 'directus_files_id.title', 'directus_files_id.type'],
      limit: -1,
    } as never)) as any[]

    const compByReceita = new Map<string, any[]>()
    for (const comp of compRes) {
      const rId = typeof comp.receitas_id === 'object' ? comp.receitas_id?.id : comp.receitas_id
      if (!compByReceita.has(rId))
        compByReceita.set(rId, [])
      compByReceita.get(rId)!.push(comp)
    }

    for (const r of receitas)
      (r as any)._comprovantes = compByReceita.get(r.id) || []
  }
  catch (e) {
    console.error('Erro ao carregar comprovantes:', e)
    for (const r of receitas)
      (r as any)._comprovantes = []
  }

  items.value = receitas
}

onMounted(loadData)

// ─── Ações ────────────────────────────────────────────────────────────────────
function confirmArquivar(item: any) {
  itemToArchive.value = item
  confirmDialog.value = true
}

async function performArquivar() {
  if (!itemToArchive.value)
    return
  try {
    await arquivarReceita(itemToArchive.value.id)
    confirmDialog.value = false
    itemToArchive.value = null
    snackbarMsg.value = 'Receita arquivada com sucesso'
    snackbarColor.value = 'success'
    await loadData()
  }
  catch {
    snackbarMsg.value = 'Erro ao arquivar receita'
    snackbarColor.value = 'error'
  }
  finally {
    snackbar.value = true
  }
}

function clearFilters() {
  filterTipo.value = null
  filterMeio.value = null
  dateFrom.value = ''
  dateTo.value = ''
}

function printPage() {
  window.print()
}

const periodLabel = computed(() => {
  if (dateFrom.value && dateTo.value)
    return `${formatDate(dateFrom.value)} – ${formatDate(dateTo.value)}`
  if (dateFrom.value)
    return `A partir de ${formatDate(dateFrom.value)}`
  if (dateTo.value)
    return `Até ${formatDate(dateTo.value)}`
  return 'Todos os registros'
})

// ─── Formatters ───────────────────────────────────────────────────────────────
function tipoLabel(tipo: string) {
  return TIPO_RECEITA_LABELS[tipo] ?? tipo
}

function meioLabel(meio: string) {
  return MEIO_PAGAMENTO_LABELS[meio] ?? meio
}

function tipoMeta(tipo: string): { icon: string, color: string } {
  return TIPO_META[tipo] ?? { icon: 'mdi-dots-horizontal-circle-outline', color: 'default' }
}

function getComprovantes(item: any): { id: string, title: string, type: string }[] {
  if (!Array.isArray(item._comprovantes))
    return []
  return item._comprovantes
    .map((c: any) => {
      const f = typeof c.directus_files_id === 'object' ? c.directus_files_id : null
      return f ? { id: f.id, title: f.title || 'Arquivo', type: f.type || '' } : null
    })
    .filter(Boolean) as { id: string, title: string, type: string }[]
}

function fileIcon(mime: string): string {
  if (mime.startsWith('image/'))
    return 'mdi-file-image-outline'
  if (mime === 'application/pdf')
    return 'mdi-file-pdf-box'
  return 'mdi-file-document-outline'
}
</script>

<template>
  <v-container fluid class="pa-2 pa-md-6">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between mb-4 mb-sm-6 no-print">
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
          Receitas
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Doações, campanhas, rifas, taxas e subsídios do novenário
        </p>
      </div>
      <div class="d-flex ga-2 mt-3 mt-sm-0 d-print-none">
        <v-btn
          variant="tonal"
          color="info"
          prepend-icon="mdi-printer"
          size="large" @click="printPage"
        >
          Imprimir / PDF
        </v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          size="large"
          to="/admin/receitas/add"
        >
          Nova Receita
        </v-btn>
      </div>
    </div>

    <!-- Filtros -->
    <v-card :elevation="0" class="border mb-4 d-print-none" rounded="xl">
      <v-card-text class="py-3">
        <v-row align="center">
          <v-col cols="12" sm="3">
            <v-select
              v-model="filterTipo"
              :items="tipoOpcoes"
              label="Tipo de receita"
              item-title="title"
              item-value="value"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              prepend-inner-icon="mdi-tag-outline"
            />
          </v-col>
          <v-col cols="12" sm="2">
            <v-select
              v-model="filterMeio"
              :items="meioOpcoes"
              label="Meio"
              item-title="title"
              item-value="value"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              prepend-inner-icon="mdi-cash"
            />
          </v-col>
          <v-col cols="6" sm="2">
            <v-text-field
              v-model="dateFrom"
              label="De"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="6" sm="2">
            <v-text-field
              v-model="dateTo"
              label="Até"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" sm="3">
            <div class="d-flex flex-wrap ga-2">
              <v-btn size="small" variant="tonal" color="secondary" @click="setToday">
                Hoje
              </v-btn>
              <v-btn size="small" variant="tonal" color="secondary" @click="setThisMonth">
                Este mês
              </v-btn>
              <v-btn size="small" variant="tonal" color="warning" @click="setNovena()">
                Novena
              </v-btn>
              <v-btn size="small" variant="text" color="secondary" @click="clearFilters">
                Limpar
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Total -->
    <div class="d-flex justify-end mb-4 no-print">
      <v-chip color="success" variant="tonal" prepend-icon="mdi-cash-plus" size="large">
        Total: {{ formatCurrency(totalFiltrado) }}
      </v-chip>
    </div>

    <!-- Tabela -->
    <v-card :elevation="0" class="border no-print" rounded="xl">
      <v-data-table
        :headers="headers"
        :items="filteredItems"
        :loading="loading"
        hover
        items-per-page="20"
        no-data-text="Nenhuma receita registrada"
      >
        <template #[`item.data`]="{ item }">
          <span class="text-body-2 font-weight-medium">{{ formatDate(item.data) }}</span>
        </template>

        <template #[`item.tipo`]="{ item }">
          <v-chip
            :color="tipoMeta(item.tipo).color"
            size="small"
            variant="tonal"
            label
          >
            <v-icon :icon="tipoMeta(item.tipo).icon" start size="14" />
            {{ tipoLabel(item.tipo) }}
          </v-chip>
        </template>

        <template #[`item.descricao`]="{ item }">
          <div>
            <div class="text-body-2 font-weight-medium">
              {{ item.descricao }}
            </div>
            <div v-if="item.observacao" class="text-caption text-medium-emphasis text-truncate" style="max-width: 240px;">
              {{ item.observacao }}
            </div>
            <div v-if="getComprovantes(item).length" class="d-flex flex-wrap ga-1 mt-1">
              <v-chip
                v-for="file in getComprovantes(item)"
                :key="file.id"
                size="x-small"
                variant="tonal"
                color="primary"
                label
                :prepend-icon="fileIcon(file.type)"
                :href="`${directusUrl}/assets/${file.id}`"
                target="_blank"
              >
                {{ file.title }}
              </v-chip>
            </div>
          </div>
        </template>

        <template #[`item.meio_pagamento`]="{ item }">
          <div v-if="Array.isArray(item.pagamentos) && item.pagamentos.length > 1" class="d-flex flex-column ga-1 py-1">
            <v-chip
              v-for="(pag, i) in item.pagamentos"
              :key="i"
              size="x-small"
              variant="outlined"
              label
            >
              {{ meioLabel(pag.meio) }}: {{ formatCurrency(pag.valor) }}
            </v-chip>
          </div>
          <v-chip v-else-if="item.meio_pagamento" size="small" variant="outlined" label>
            {{ meioLabel(item.meio_pagamento) }}
          </v-chip>
          <span v-else class="text-disabled">—</span>
        </template>

        <template #[`item.valor`]="{ item }">
          <span class="font-weight-bold text-success text-body-2">
            {{ formatCurrency(item.valor) }}
          </span>
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="d-flex justify-end ga-1">
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              color="primary"
              :to="`/admin/receitas/${item.id}`"
            />
            <v-btn
              icon="mdi-archive-arrow-down-outline"
              size="small"
              variant="text"
              color="error"
              @click="confirmArquivar(item)"
            />
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Print layout -->
    <PrintReportLayout
      class="d-none d-print-block mt-8"
      title="Relatório de Receitas"
      subtitle="Doações, campanhas, rifas, taxas e subsídios"
      :period-label="periodLabel"
    >
      <section>
        <PrintReportSectionTitle title="Lançamentos do período" />
        <div class="pa-4">
          <table class="report-table">
            <thead>
              <tr>
                <th class="text-start">
                  Data
                </th>
                <th class="text-start">
                  Tipo
                </th>
                <th class="text-start">
                  Descrição
                </th>
                <th class="text-start">
                  Meio
                </th>
                <th class="text-end">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredItems" :key="item.id" class="data-row">
                <td>{{ formatDate(item.data) }}</td>
                <td>{{ tipoLabel(item.tipo) }}</td>
                <td>{{ item.descricao }}</td>
                <td>{{ meioLabel(item.meio_pagamento) }}</td>
                <td class="text-end font-weight-bold">
                  {{ formatCurrency(item.valor) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="4" class="text-end font-weight-bold">
                  Total
                </td>
                <td class="text-end font-weight-black">
                  {{ formatCurrency(totalFiltrado) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </PrintReportLayout>

    <!-- Dialog: Confirmar arquivamento -->
    <v-dialog v-model="confirmDialog" max-width="420">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center pa-5 pb-3">
          <v-icon color="warning" class="me-2">
            mdi-alert-outline
          </v-icon>
          Arquivar receita?
        </v-card-title>
        <v-card-text class="px-5">
          A receita <strong>"{{ itemToArchive?.descricao }}"</strong> será arquivada e não
          aparecerá mais nos relatórios padrão.
        </v-card-text>
        <v-card-actions class="pa-5 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="confirmDialog = false">
            Cancelar
          </v-btn>
          <v-btn color="error" variant="tonal" :loading="loading" @click="performArquivar">
            Arquivar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="bottom end">
      {{ snackbarMsg }}
    </v-snackbar>
  </v-container>
</template>
