<script setup lang="ts">
/**
 * Página de listagem de Despesas do PDV
 *
 * Exibe despesas com filtros por data, categoria e texto.
 * Edição e detalhes via rota /admin/pdv/despesas/:id.
 * Arquivamento (soft-delete) via status = 'archived'.
 */
import { readItems, updateItem } from '@directus/sdk'
import { brToIsoDate, formatCurrency, formatDate, isoToBrDate, toLocalISO } from '~/composables/usePdvReport'

definePageMeta({ layout: 'admin' })

const { fetchExpenses } = usePdv()
const directusUrl = useRuntimeConfig().public.directus.url as string

// ─── Categorias de despesa ────────────────────────────────────────────────────
const CATEGORIA_LABELS: Record<string, string> = {
  decoracao: 'Decoração e Estrutura',
  alimentacao: 'Alimentação e Bebidas',
  servicos: 'Serviços / Pessoal',
  divulgacao: 'Impressão e Divulgação',
  transporte: 'Transporte e Logística',
  utilidades: 'Utilidades (Água/Luz)',
  manutencao: 'Manutenção',
  impostos: 'Impostos / Taxas Retidas',
  repasse: 'Repasse Interno',
  permuta_anuncio: 'Permuta de Anúncio',
  outro: 'Outro',
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  transferencia: 'Transferência Bancária',
  outro: 'Outro',
}
const categoriaOpcoes = Object.entries(CATEGORIA_LABELS).map(([value, title]) => ({ value, title }))

// ─── State ────────────────────────────────────────────────────────────────────
const items = ref<any[]>([])
const loading = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

// Filters
const search = useState<string>('pdv-despesas-search', () => '')
const dateFrom = useState<string>('pdv-despesas-from', () => '')
const dateTo = useState<string>('pdv-despesas-to', () => '')
const filterCategoria = useState<string | null>('pdv-despesas-categoria', () => null)
const filterPago = useState<'todos' | 'pago' | 'pendente'>('pdv-despesas-pago', () => 'todos')
const activeQuickFilter = useState<'hoje' | 'mes' | 'novena' | null>('pdv-despesas-quick-filter', () => null)

function applyToday() {
  const today = toLocalISO(new Date())
  dateFrom.value = today
  dateTo.value = today
  activeQuickFilter.value = 'hoje'
}

function applyThisMonth() {
  const d = new Date()
  dateFrom.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  dateTo.value = toLocalISO(d)
  activeQuickFilter.value = 'mes'
}

function applyNovena() {
  const d = new Date()
  const start = new Date(d)
  start.setDate(d.getDate() - 8)
  dateFrom.value = toLocalISO(start)
  dateTo.value = toLocalISO(d)
  activeQuickFilter.value = 'novena'
}
const dateFromField = computed({
  get: () => isoToBrDate(dateFrom.value),
  set: (value: string) => {
    dateFrom.value = brToIsoDate(value)
  },
})
const dateToField = computed({
  get: () => isoToBrDate(dateTo.value),
  set: (value: string) => {
    dateTo.value = brToIsoDate(value)
  },
})

// ─── Arquivar ─────────────────────────────────────────────────────────────────
const archiveDialog = ref(false)
const archiving = ref(false)
const itemToArchive = ref<any>(null)

// ─── Computed ─────────────────────────────────────────────────────────────────
const filteredItems = computed(() => {
  let result = items.value.filter(i => i.status !== 'archived')
  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(i =>
      i.descricao?.toLowerCase().includes(term)
      || i.observacao?.toLowerCase().includes(term),
    )
  }
  if (dateFrom.value)
    result = result.filter(i => i.data_despesa >= dateFrom.value)
  if (dateTo.value)
    result = result.filter(i => i.data_despesa <= dateTo.value)
  if (filterCategoria.value)
    result = result.filter(i => i.categoria === filterCategoria.value)
  if (filterPago.value === 'pago')
    result = result.filter(i => i.paid === true)
  else if (filterPago.value === 'pendente')
    result = result.filter(i => i.paid === false)
  return result
})

const receiptItem = ref<any>(null)

const totalFiltered = computed(() =>
  filteredItems.value.reduce((sum, i) => sum + Number(i.valor || 0), 0),
)

// ─── Data loading ─────────────────────────────────────────────────────────────
async function loadData() {
  loading.value = true
  try {
    const expRes = await fetchExpenses({
      fields: [
        'id',
        'status',
        'descricao',
        'valor',
        'data_despesa',
        'categoria',
        'observacao',
        'date_created',
        'paid',
        'payment_method',
        'operator_id.id',
        'operator_id.name',
        'responsavel_id.id',
        'responsavel_id.nome',
      ],
      sort: ['-data_despesa', '-date_created'],
      limit: -1,
    })
    const expenses = (expRes as any[]) || []

    // Fetch comprovantes via the actual junction table
    const c = await useAuth().getAuthClient()
    const compRes = await c.request(readItems('pdv_expenses_comprovantes', {
      filter: { expense_id: { _in: expenses.map(e => e.id) } },
      fields: ['id', 'expense_id', 'directus_files_id.id', 'directus_files_id.title', 'directus_files_id.type'],
      limit: -1,
    } as never)) as any[]

    // Group comprovantes by expense_id
    const compByExpense = new Map<number, any[]>()
    for (const comp of compRes) {
      const expId = typeof comp.expense_id === 'object' ? comp.expense_id?.id : comp.expense_id
      if (!compByExpense.has(expId))
        compByExpense.set(expId, [])
      compByExpense.get(expId)!.push(comp)
    }

    // Attach to each expense
    for (const exp of expenses)
      exp._comprovantes = compByExpense.get(exp.id) || []

    items.value = expenses
  }
  catch (e) {
    console.error('Error loading expenses', e)
  }
  finally {
    loading.value = false
  }
}

onMounted(loadData)

function confirmarArquivar(item: any) {
  itemToArchive.value = item
  archiveDialog.value = true
}

async function arquivarDespesa() {
  if (!itemToArchive.value)
    return
  archiving.value = true
  try {
    const c = await useAuth().getAuthClient()
    await c.request(updateItem('pdv_expenses', itemToArchive.value.id, { status: 'archived' } as never))
    archiveDialog.value = false
    itemToArchive.value = null
    snackbarMsg.value = 'Despesa arquivada com sucesso!'
    snackbarColor.value = 'success'
    snackbar.value = true
    await loadData()
  }
  catch (e) {
    console.error('Error archiving expense', e)
    snackbarMsg.value = 'Erro ao arquivar despesa.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
  finally {
    archiving.value = false
  }
}

function clearFilters() {
  search.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  filterCategoria.value = null
  filterPago.value = 'todos'
  activeQuickFilter.value = null
}

function printList() {
  window.print()
}

function printReceipt(item: any) {
  receiptItem.value = item
  nextTick(() => window.print())
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

function getComprovantes(item: any): { id: string, title: string, type: string }[] {
  if (!Array.isArray(item._comprovantes))
    return []
  return item._comprovantes
    .map((c: any) => {
      const f = typeof c.directus_files_id === 'object' ? c.directus_files_id : null
      if (!f?.id)
        return null
      return { id: f.id, title: f.title || 'Arquivo', type: f.type || '' }
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

function getResponsavelName(item: any): string {
  if (item.responsavel_id) {
    const r = item.responsavel_id
    return typeof r === 'object' ? r.nome ?? '—' : '—'
  }
  if (item.operator_id) {
    const op = item.operator_id
    return `(op.) ${typeof op === 'object' ? op.name ?? '—' : '—'}`
  }
  return '—'
}
</script>

<template>
  <v-container fluid class="pa-2 pa-md-6" :class="{ 'print-receipt-active': receiptItem !== null }">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between mb-4 mb-sm-6 no-print">
      <div>
        <div class="d-flex align-center mb-2">
          <v-btn variant="text" icon="mdi-arrow-left" class="me-2" to="/admin/pdv" />
          <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
            Despesas
          </h1>
        </div>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0 ms-11">
          Total: {{ formatCurrency(totalFiltered) }} em {{ filteredItems.length }} {{ filteredItems.length === 1 ? 'despesa' : 'despesas' }}
        </p>
      </div>
      <div class="d-flex ga-3 mt-3 mt-sm-0 d-print-none">
        <v-btn variant="tonal" color="info" size="large" prepend-icon="mdi-printer" @click="printList">
          Imprimir / PDF
        </v-btn>
        <v-btn color="primary" variant="elevated" size="large" prepend-icon="mdi-plus" to="/admin/pdv/despesas/nova">
          Nova Despesa
        </v-btn>
      </div>
    </div>

    <!-- Filters -->
    <v-card rounded="xl" :elevation="0" class="border mb-5 d-print-none">
      <v-card-text class="py-3">
        <v-row align="center">
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Buscar descrição..."
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="6" sm="2">
            <MaskedDateField
              v-model="dateFromField"
              label="De"
              prepend-inner-icon="mdi-calendar-start"
              hide-details
            />
          </v-col>
          <v-col cols="6" sm="2">
            <MaskedDateField
              v-model="dateToField"
              label="Até"
              prepend-inner-icon="mdi-calendar-end"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              v-model="filterCategoria"
              :items="categoriaOpcoes"
              item-title="title"
              item-value="value"
              label="Categoria"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" sm="3">
            <div class="text-caption text-medium-emphasis mb-1">
              Status
            </div>
            <v-btn-toggle
              v-model="filterPago"
              density="compact"
              color="primary"
              mandatory
              class="d-flex flex-wrap"
            >
              <v-btn
                value="todos"
                size="small"
                variant="tonal"
              >
                Todos
              </v-btn>
              <v-btn
                value="pago"
                size="small"
                variant="tonal"
                color="success"
              >
                <v-icon start size="small" icon="mdi-check-circle" />
                Pago
              </v-btn>
              <v-btn
                value="pendente"
                size="small"
                variant="tonal"
                color="error"
              >
                <v-icon start size="small" icon="mdi-clock-outline" />
                Pendente
              </v-btn>
            </v-btn-toggle>
          </v-col>
          <v-col cols="12" sm="12" class="d-flex flex-wrap ga-2">
            <v-btn
              size="small"
              :variant="activeQuickFilter === 'hoje' ? 'elevated' : 'tonal'"
              color="secondary"
              @click="applyToday"
            >
              Hoje
            </v-btn>
            <v-btn
              size="small"
              :variant="activeQuickFilter === 'mes' ? 'elevated' : 'tonal'"
              color="secondary"
              @click="applyThisMonth"
            >
              Este mês
            </v-btn>
            <v-btn
              size="small"
              :variant="activeQuickFilter === 'novena' ? 'elevated' : 'tonal'"
              color="warning"
              @click="applyNovena"
            >
              Novena
            </v-btn>
            <v-btn size="small" variant="text" color="secondary" @click="clearFilters">
              Limpar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Summary -->
    <div class="d-flex justify-end mb-4 no-print">
      <v-chip color="error" variant="tonal" prepend-icon="mdi-cash-minus" size="large">
        Total: {{ formatCurrency(totalFiltered) }}
      </v-chip>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="d-flex justify-center align-center pa-12 no-print">
      <v-progress-circular indeterminate color="primary" size="40" width="4" />
      <span class="ml-4 text-body-1">Carregando despesas...</span>
    </div>

    <!-- Empty state -->
    <v-card v-else-if="filteredItems.length === 0" elevation="0" rounded="lg" class="border no-print">
      <div class="text-center pa-8">
        <v-icon color="grey-lighten-1" size="64" class="mb-4">
          mdi-database-off
        </v-icon>
        <h3 class="text-h6 text-medium-emphasis mb-2">
          Nenhuma despesa encontrada
        </h3>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Não há registros de despesas no momento.
        </p>
        <v-btn
          to="/admin/pdv/despesas/nova"
          color="success"
          variant="elevated"
          prepend-icon="mdi-plus"
        >
          Registrar primeira despesa
        </v-btn>
      </div>
    </v-card>

    <!-- Expansion Panels -->
    <v-expansion-panels v-else variant="accordion" class="no-print">
      <v-expansion-panel
        v-for="item in filteredItems"
        :key="item.id"
        rounded="lg"
        class="mb-2"
        elevation="1"
      >
        <v-expansion-panel-title>
          <div class="d-flex flex-column flex-sm-row align-start align-sm-center w-100 ga-2 ga-sm-4 pe-2">
            <span class="text-caption text-medium-emphasis text-no-wrap">{{ formatDate(item.data_despesa) }}</span>
            <span class="text-body-2 font-weight-medium flex-grow-1">{{ item.descricao }}</span>
            <span class="font-weight-bold text-error text-body-2 text-no-wrap">{{ formatCurrency(item.valor) }}</span>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-row class="mt-1">
            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">
                Categoria
              </div>
              <v-chip v-if="item.categoria" size="small" variant="tonal" color="warning" label class="mt-1">
                {{ CATEGORIA_LABELS[item.categoria] ?? item.categoria }}
              </v-chip>
              <span v-else class="text-disabled text-body-2">Sem categoria</span>
            </v-col>

            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">
                Status
              </div>
              <v-chip
                :color="item.paid ? 'success' : 'error'"
                size="small"
                variant="tonal"
                label
                class="mt-1"
                :prepend-icon="item.paid ? 'mdi-check-circle' : 'mdi-clock-outline'"
              >
                {{ item.paid ? 'Pago' : 'Pendente' }}
              </v-chip>
            </v-col>

            <v-col v-if="item.paid && item.payment_method" cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">
                Forma de Pagamento
              </div>
              <v-chip size="small" variant="tonal" color="primary" label class="mt-1">
                <v-icon start size="14" icon="mdi-cash-multiple" />
                {{ PAYMENT_METHOD_LABELS[item.payment_method] ?? item.payment_method }}
              </v-chip>
            </v-col>

            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">
                Responsável
              </div>
              <v-chip size="small" variant="tonal" color="secondary" label class="mt-1">
                <v-icon start size="14" icon="mdi-account" />
                {{ getResponsavelName(item) }}
              </v-chip>
            </v-col>

            <v-col v-if="item.observacao" cols="12">
              <div class="text-caption text-medium-emphasis">
                Observação
              </div>
              <div class="text-body-2 mt-1">
                {{ item.observacao }}
              </div>
            </v-col>

            <v-col v-if="getComprovantes(item).length" cols="12">
              <div class="text-caption text-medium-emphasis mb-1">
                Anexos
              </div>
              <div class="d-flex flex-wrap ga-2">
                <v-chip
                  v-for="file in getComprovantes(item)"
                  :key="file.id"
                  size="small"
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
            </v-col>
          </v-row>

          <v-divider class="my-3" />

          <div class="d-flex justify-end ga-2">
            <v-btn
              v-if="item.paid"
              variant="text"
              color="secondary"
              size="small"
              prepend-icon="mdi-printer-outline"
              @click.stop="printReceipt(item)"
            >
              Recibo
            </v-btn>
            <v-btn
              variant="tonal"
              color="primary"
              size="small"
              prepend-icon="mdi-pencil"
              :to="`/admin/pdv/despesas/${item.id}`"
            >
              Editar
            </v-btn>
            <v-btn
              variant="tonal"
              color="error"
              size="small"
              prepend-icon="mdi-archive-arrow-down-outline"
              @click.stop="confirmarArquivar(item)"
            >
              Arquivar
            </v-btn>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Count -->
    <div v-if="filteredItems.length > 0" class="d-flex justify-center pa-4 no-print">
      <div class="text-body-2 text-medium-emphasis">
        Total de {{ filteredItems.length }} {{ filteredItems.length === 1 ? 'despesa' : 'despesas' }}
      </div>
    </div>

    <!-- Print layout -->
    <PrintReportLayout
      class="d-none d-print-block mt-8"
      title="Relatório de Despesas"
      subtitle="Listagem de despesas do PDV"
      :period-label="periodLabel"
    >
      <section>
        <PrintReportSectionTitle title="Despesas do período" />
        <div class="pa-4">
          <table class="report-table">
            <thead>
              <tr>
                <th class="text-start">
                  Data
                </th>
                <th class="text-start">
                  Categoria
                </th>
                <th class="text-start">
                  Descrição
                </th>
                <th class="text-start">
                  Status
                </th>
                <th class="text-start">
                  Pagamento
                </th>
                <th class="text-start">
                  Responsável
                </th>
                <th class="text-end">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredItems" :key="item.id" class="data-row">
                <td>{{ formatDate(item.data_despesa) }}</td>
                <td>{{ CATEGORIA_LABELS[item.categoria] ?? item.categoria }}</td>
                <td>{{ item.descricao }}</td>
                <td>
                  <span :class="item.paid ? 'text-success' : 'text-error'">
                    {{ item.paid ? 'Pago' : 'Pendente' }}
                  </span>
                </td>
                <td>{{ item.paid && item.payment_method ? (PAYMENT_METHOD_LABELS[item.payment_method] ?? item.payment_method) : '—' }}</td>
                <td>{{ getResponsavelName(item) }}</td>
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
                  {{ formatCurrency(totalFiltered) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </PrintReportLayout>

    <!-- Dialog: Confirmar arquivamento -->
    <v-dialog v-model="archiveDialog" max-width="400">
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon color="error" class="me-2">
            mdi-archive-arrow-down-outline
          </v-icon>
          <span class="text-h6">Arquivar Despesa</span>
        </v-card-title>
        <v-card-text class="pa-4">
          A despesa <strong>"{{ itemToArchive?.descricao }}"</strong> será arquivada e não aparecerá mais na listagem.
          A operação pode ser revertida pelo Directus.
        </v-card-text>
        <v-card-actions class="pa-3 justify-end ga-2">
          <v-btn variant="text" @click="archiveDialog = false">
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            variant="tonal"
            prepend-icon="mdi-archive-arrow-down-outline"
            :loading="archiving"
            @click="arquivarDespesa"
          >
            Arquivar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="bottom end">
      {{ snackbarMsg }}
    </v-snackbar>

    <!-- ─── Recibo (print only) ───────────────────────────────────────── -->
    <div v-if="receiptItem" class="print-receipt">
      <div class="receipt-header">
        <strong>Paróquia Imaculada Conceição — Capela São José</strong>
      </div>
      <h2 class="receipt-title">
        RECIBO DE PAGAMENTO
      </h2>

      <p class="receipt-body-text">
        Recebi(emos) da <strong>Capela São José</strong> o valor de
        <strong>{{ formatCurrency(receiptItem.valor) }}</strong>
        referente a {{ receiptItem.descricao }}.
      </p>

      <table class="receipt-table">
        <tbody>
          <tr>
            <td class="receipt-label">
              Data do Pagamento:
            </td>
            <td class="receipt-value">
              {{ formatDate(receiptItem.data_despesa) }}
            </td>
          </tr>
          <tr v-if="receiptItem.categoria">
            <td class="receipt-label">
              Categoria:
            </td>
            <td class="receipt-value">
              {{ CATEGORIA_LABELS[receiptItem.categoria] ?? receiptItem.categoria }}
            </td>
          </tr>
          <tr v-if="receiptItem.payment_method">
            <td class="receipt-label">
              Forma de Pagamento:
            </td>
            <td class="receipt-value">
              {{ PAYMENT_METHOD_LABELS[receiptItem.payment_method] ?? receiptItem.payment_method }}
            </td>
          </tr>
          <tr v-if="receiptItem.observacao">
            <td class="receipt-label">
              Observação:
            </td>
            <td class="receipt-value">
              {{ receiptItem.observacao }}
            </td>
          </tr>
          <tr>
            <td class="receipt-label">
              Responsável pelo Recebimento:
            </td>
            <td class="receipt-value">
              {{ getResponsavelName(receiptItem) }}
            </td>
          </tr>
        </tbody>
      </table>

      <div class="receipt-declaration">
        <p>
          Por ser verdade, firmo(amos) o presente recibo para os devidos fins.
        </p>
      </div>

      <div class="receipt-signatures">
        <div class="receipt-sig-block">
          <div class="receipt-sig-line" />
          <p>Responsável pelo Recebimento</p>
        </div>
        <div class="receipt-sig-block">
          <div class="receipt-sig-line" />
          <p>Tesouraria - Capela São José</p>
        </div>
      </div>

      <p class="receipt-copy-note">
        Via única — Beneficiário
      </p>
    </div>
  </v-container>
</template>

<style scoped>
/* Screen: hide print-only receipt */
.print-receipt {
  display: none;
}

/* Quando recibo estiver ativo, esconder todo o resto na tela também */
.print-receipt-active .no-print,
.print-receipt-active > :not(.print-receipt) {
  display: none !important;
}

@media print {
  /* Hide ALL screen content including PrintReportLayout */
  .no-print,
  .v-navigation-drawer,
  .v-app-bar,
  header,
  nav,
  .d-print-block {
    display: none !important;
  }

  /* Show receipt ONLY */
  .print-receipt {
    display: block !important;
    font-family: Arial, sans-serif;
    padding: 30px;
    max-width: 210mm;
    margin: 0 auto;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
  }

  .receipt-header {
    text-align: center;
    margin-bottom: 12px;
    color: #5d4037;
    font-size: 14px;
  }

  .receipt-title {
    text-align: center;
    font-size: 18px;
    font-weight: 700;
    margin: 12px 0 24px;
    color: #3e2723;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .receipt-body-text {
    font-size: 13px;
    line-height: 1.6;
    margin-bottom: 20px;
    text-align: justify;
  }

  .receipt-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }

  .receipt-table td {
    padding: 6px 0;
    vertical-align: top;
  }

  .receipt-label {
    font-weight: 600;
    color: #6d6d6d;
    width: 180px;
  }

  .receipt-value {
    color: #1a1a1a;
  }

  .receipt-declaration {
    margin-top: 24px;
    margin-bottom: 32px;
  }

  .receipt-declaration p {
    font-size: 13px;
    font-style: italic;
    color: #555;
  }

  .receipt-signatures {
    display: flex;
    justify-content: space-around;
    gap: 40px;
    margin-top: 40px;
    margin-bottom: 24px;
  }

  .receipt-sig-block {
    flex: 1;
    text-align: center;
  }

  .receipt-sig-line {
    border-bottom: 1px solid #333;
    height: 50px;
    margin-bottom: 8px;
  }

  .receipt-sig-block p {
    font-size: 12px;
    color: #666;
    margin: 0;
  }

  .receipt-copy-note {
    font-size: 11px;
    color: #888;
    text-align: center;
    margin-top: 20px;
  }

  @page {
    size: A5 landscape;
    margin: 15mm;
  }
}
</style>
