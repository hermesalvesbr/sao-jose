<script setup lang="ts">
/**
 * Listagem de Receitas do Novenário
 *
 * Cobre: doações, campanhas, rifas, leilões, taxas, subsídios e outros.
 * Filtros: tipo, período, meio de pagamento.
 * UX: simples, mobile-first, ícones e cores por tipo para facilitar identificação.
 */
import { formatCurrency, formatDate, usePdvReportPeriod } from '~/composables/usePdvReport'
import { MEIO_PAGAMENTO_LABELS, TIPO_RECEITA_LABELS } from '~/composables/useReceitas'

definePageMeta({ layout: 'admin' })

const { fetchReceitas, arquivarReceita, loading } = useReceitas()

const items = ref<any[]>([])
const filterTipo = ref<string | null>(null)
const filterMeio = ref<string | null>(null)
const { dateFrom, dateTo, setToday, setThisMonth, setNovena } = usePdvReportPeriod()

const tipoOpcoes = Object.entries(TIPO_RECEITA_LABELS).map(([value, title]) => ({ value, title }))
const meioOpcoes = Object.entries(MEIO_PAGAMENTO_LABELS).map(([value, title]) => ({ value, title }))

// ─── Ícones e cores por tipo ─────────────────────────────────────────────────
const TIPO_META: Record<string, { icon: string, color: string }> = {
  doacao: { icon: 'mdi-hand-heart-outline', color: 'success' },
  campanha: { icon: 'mdi-ticket-percent-outline', color: 'warning' },
  taxa: { icon: 'mdi-ticket-outline', color: 'info' },
  subsidio: { icon: 'mdi-bank-transfer-in', color: 'secondary' },
  reembolso: { icon: 'mdi-cash-refund', color: 'primary' },
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
  { title: 'Meio', key: 'meio_pagamento', width: '120px', sortable: true },
  { title: 'Valor', key: 'valor', align: 'end' as const, width: '120px', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'end' as const, width: '90px' },
]

// ─── Filtros aplicados ────────────────────────────────────────────────────────
const filteredItems = computed(() => {
  let result = items.value
  if (filterTipo.value)
    result = result.filter(i => i.tipo === filterTipo.value)
  if (filterMeio.value)
    result = result.filter(i => i.meio_pagamento === filterMeio.value)
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
  items.value = await fetchReceitas()
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
</script>

<template>
  <v-container fluid class="pa-2 pa-md-6">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between mb-4 mb-sm-6">
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
          Receitas
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Doações, campanhas, rifas, taxas e subsídios do novenário
        </p>
      </div>
      <div class="d-flex ga-2 mt-3 mt-sm-0 d-print-none">
        <v-btn variant="tonal" prepend-icon="mdi-printer" color="info" @click="printPage">
          Imprimir
        </v-btn>
        <v-btn variant="elevated" prepend-icon="mdi-plus" color="success" to="/admin/receitas/add">
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
    <div class="d-flex justify-end mb-4">
      <v-chip color="success" variant="tonal" prepend-icon="mdi-cash-plus" size="large">
        Total: {{ formatCurrency(totalFiltrado) }}
      </v-chip>
    </div>

    <!-- Tabela -->
    <v-card :elevation="0" class="border" rounded="xl">
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
          </div>
        </template>

        <template #[`item.meio_pagamento`]="{ item }">
          <v-chip v-if="item.meio_pagamento" size="small" variant="outlined" label>
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
          <div class="d-flex ga-1">
            <v-btn
              icon="mdi-pencil"
              variant="text"
              size="small"
              color="primary"
              :to="`/admin/receitas/${item.id}`"
            >
              <v-tooltip activator="parent" location="top">
                Editar
              </v-tooltip>
            </v-btn>
            <v-btn
              icon="mdi-archive-arrow-down-outline"
              variant="text"
              size="small"
              color="error"
              @click="confirmArquivar(item)"
            >
              <v-tooltip activator="parent" location="top">
                Arquivar
              </v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Print layout -->
    <div class="d-none d-print-block mt-4">
      <h2 class="text-h6 mb-2">
        RECEITAS DO NOVENÁRIO
      </h2>
      <table style="width:100%; border-collapse:collapse; font-size:12px;">
        <thead>
          <tr style="border-bottom:2px solid #000;">
            <th style="text-align:left; padding:4px;">
              Data
            </th>
            <th style="text-align:left; padding:4px;">
              Tipo
            </th>
            <th style="text-align:left; padding:4px;">
              Descrição
            </th>
            <th style="text-align:left; padding:4px;">
              Meio
            </th>
            <th style="text-align:right; padding:4px;">
              Valor
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredItems" :key="item.id" style="border-bottom:1px solid #ddd;">
            <td style="padding:4px;">
              {{ formatDate(item.data) }}
            </td>
            <td style="padding:4px;">
              {{ tipoLabel(item.tipo) }}
            </td>
            <td style="padding:4px;">
              {{ item.descricao }}
            </td>
            <td style="padding:4px;">
              {{ meioLabel(item.meio_pagamento) }}
            </td>
            <td style="text-align:right; padding:4px; font-weight:bold;">
              {{ formatCurrency(item.valor) }}
            </td>
          </tr>
          <tr style="border-top:2px solid #000; font-weight:bold;">
            <td colspan="4" style="padding:4px; text-align:right;">
              Total
            </td>
            <td style="padding:4px; text-align:right;">
              {{ formatCurrency(totalFiltrado) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

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
