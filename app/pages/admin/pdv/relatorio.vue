<script setup lang="ts">
/**
 * Relatório de Movimentação Financeira Diária — PDV
 *
 * Exibe vendas agrupadas por operador (colunas: Dinheiro, PIX, Cartão, Total)
 * + seção de despesas + resumo diário (Apurado − Despesas = Saldo Líquido).
 *
 * Geração de PDF via window.print() com estilos @media print.
 */
definePageMeta({ layout: 'admin' })

const { fetchSales, fetchExpenses, fetchOperators } = usePdv()
const { user } = useAuth()

// ─── Dates ─────────────────────────────────────────────────────────────────────
function toLocalISO(d: Date): string {
  return d.toISOString().substring(0, 10)
}

const today = toLocalISO(new Date())
const dateFrom = ref(today)
const dateTo = ref(today)

// ─── State ─────────────────────────────────────────────────────────────────────
const sales = ref<any[]>([])
const expenses = ref<any[]>([])
const operators = ref<any[]>([])
const loading = ref(false)
const reportGenerated = ref(false)

// ─── Quick date shortcuts ──────────────────────────────────────────────────────
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
  // Sunday = 0; start of week = Sunday (pt-BR: Monday)
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

// ─── Load data ─────────────────────────────────────────────────────────────────
async function loadReport() {
  if (!dateFrom.value || !dateTo.value)
    return

  loading.value = true
  try {
    const [salesRes, expensesRes, operatorsRes] = await Promise.all([
      fetchSales({
        fields: [
          'id',
          'total_amount',
          'payment_method',
          'sale_status',
          'created_at',
          'date_created',
          'operator_id.id',
          'operator_id.name',
        ],
        filter: {
          _and: [
            { sale_status: { _eq: 'finalizada' } },
            { date_created: { _gte: `${dateFrom.value}T00:00:00` } },
            { date_created: { _lte: `${dateTo.value}T23:59:59` } },
          ],
        },
        sort: ['operator_id', 'date_created'],
        limit: -1,
      }),
      fetchExpenses({
        fields: ['id', 'descricao', 'valor', 'data_despesa', 'operator_id.id', 'operator_id.name'],
        filter: {
          _and: [
            { data_despesa: { _gte: dateFrom.value } },
            { data_despesa: { _lte: dateTo.value } },
          ],
        },
        sort: ['data_despesa'],
        limit: -1,
      }),
      fetchOperators({
        filter: { active: { _eq: true } },
        sort: ['name'],
        limit: -1,
      }),
    ])

    sales.value = (salesRes as any[]) || []
    expenses.value = (expensesRes as any[]) || []
    operators.value = (operatorsRes as any[]) || []
    reportGenerated.value = true
  }
  catch (e) {
    console.error('Error loading report', e)
  }
  finally {
    loading.value = false
  }
}

onMounted(loadReport)

// ─── Aggregations ──────────────────────────────────────────────────────────────
interface OperatorRow {
  id: string
  name: string
  dinheiro: number
  pix: number
  cartao: number
  total: number
}

const salesByOperator = computed((): OperatorRow[] => {
  const map = new Map<string, OperatorRow>()

  for (const sale of sales.value) {
    const op = sale.operator_id
    const opId: string = typeof op === 'object' && op ? op.id : op ?? 'sem-operador'
    const opName: string = typeof op === 'object' && op ? op.name : 'Sem Operador'

    if (!map.has(opId)) {
      map.set(opId, { id: opId, name: opName, dinheiro: 0, pix: 0, cartao: 0, total: 0 })
    }

    const row = map.get(opId)!
    const amount = Number(sale.total_amount || 0)
    const method: string = sale.payment_method ?? 'dinheiro'

    if (method === 'dinheiro')
      row.dinheiro += amount
    else if (method === 'pix')
      row.pix += amount
    else
      row.cartao += amount

    row.total += amount
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
})

const grandTotal = computed(() => ({
  dinheiro: salesByOperator.value.reduce((s, r) => s + r.dinheiro, 0),
  pix: salesByOperator.value.reduce((s, r) => s + r.pix, 0),
  cartao: salesByOperator.value.reduce((s, r) => s + r.cartao, 0),
  total: salesByOperator.value.reduce((s, r) => s + r.total, 0),
}))

const totalExpenses = computed(() =>
  expenses.value.reduce((s, e) => s + Number(e.valor || 0), 0),
)

const saldoLiquido = computed(() => grandTotal.value.total - totalExpenses.value)

// ─── Period label ─────────────────────────────────────────────────────────────
const periodLabel = computed(() => {
  if (dateFrom.value === dateTo.value) {
    return formatDate(dateFrom.value)
  }
  return `${formatDate(dateFrom.value)} a ${formatDate(dateTo.value)}`
})

// ─── Print ─────────────────────────────────────────────────────────────────────
function printReport() {
  window.print()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  if (!dateStr)
    return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

const responsavelNome = computed(() =>
  `${user.value?.first_name ?? ''} ${user.value?.last_name ?? ''}`.trim() || 'Responsável',
)
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <!-- ─── Screen-only header ──────────────────────────────────────────── -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-5 ga-3 no-print">
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
          Relatório Financeiro Diário
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Movimentação financeira do PDV por período
        </p>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-printer"
        size="large"
        :disabled="!reportGenerated"
        @click="printReport"
      >
        Imprimir / PDF
      </v-btn>
    </div>

    <!-- ─── Filters (screen only) ─────────────────────────────────────── -->
    <v-card rounded="xl" :elevation="0" class="border mb-5 no-print">
      <v-card-text>
        <v-row align="center" dense>
          <v-col cols="12" sm="3">
            <v-text-field
              v-model="dateFrom"
              label="Data Inicial"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
              prepend-inner-icon="mdi-calendar-start"
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field
              v-model="dateTo"
              label="Data Final"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
              prepend-inner-icon="mdi-calendar-end"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <div class="d-flex flex-wrap ga-2">
              <v-btn size="small" variant="tonal" color="secondary" @click="setToday">
                Hoje
              </v-btn>
              <v-btn size="small" variant="tonal" color="secondary" @click="setYesterday">
                Ontem
              </v-btn>
              <v-btn size="small" variant="tonal" color="secondary" @click="setThisWeek">
                Esta Semana
              </v-btn>
              <v-btn size="small" variant="tonal" color="secondary" @click="setThisMonth">
                Este Mês
              </v-btn>
            </div>
          </v-col>
          <v-col cols="12" sm="2">
            <v-btn
              color="primary"
              prepend-icon="mdi-magnify"
              block
              :loading="loading"
              @click="loadReport"
            >
              Carregar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Loading -->
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4 no-print" />

    <!-- ─── Report area (screen + print) ─────────────────────────────── -->
    <div v-if="reportGenerated" class="report-area">
      <!-- Print-only header -->
      <div class="print-header">
        <div class="print-logo-row">
          <strong>Paróquia — Novenário de São José</strong>
        </div>
        <h2 class="print-title">
          CONTROLE DIÁRIO DE MOVIMENTAÇÃO FINANCEIRA
        </h2>
        <p class="print-date">
          DATA: {{ periodLabel }}
        </p>
      </div>

      <!-- ─── Sales by Operator table ───────────────────────────────── -->
      <v-card rounded="xl" :elevation="0" class="border mb-5 report-card">
        <v-card-title class="d-flex align-center pa-4 pb-2 no-print">
          <v-icon icon="mdi-account-group-outline" color="secondary" class="me-2" />
          <span class="text-subtitle-1 font-weight-bold">Vendas por Operador</span>
          <v-chip size="small" variant="tonal" color="secondary" class="ms-3">
            {{ sales.length }} venda(s)
          </v-chip>
        </v-card-title>

        <div class="pa-4">
          <table class="report-table">
            <thead>
              <tr>
                <th class="col-operador text-start">
                  OPERADOR
                </th>
                <th class="col-money text-end">
                  DINHEIRO*
                </th>
                <th class="col-money text-end">
                  PIX
                </th>
                <th class="col-money text-end">
                  CARTÃO
                </th>
                <th class="col-money text-end">
                  TOTAL R$
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="salesByOperator.length === 0">
                <td colspan="5" class="text-center pa-6 text-medium-emphasis">
                  Nenhuma venda finalizada no período informado
                </td>
              </tr>
              <tr v-for="row in salesByOperator" :key="row.id" class="data-row">
                <td class="col-operador font-weight-medium">
                  {{ row.name }}
                </td>
                <td class="col-money text-end">
                  {{ row.dinheiro > 0 ? formatCurrency(row.dinheiro) : '—' }}
                </td>
                <td class="col-money text-end">
                  {{ row.pix > 0 ? formatCurrency(row.pix) : '—' }}
                </td>
                <td class="col-money text-end">
                  {{ row.cartao > 0 ? formatCurrency(row.cartao) : '—' }}
                </td>
                <td class="col-money text-end font-weight-bold">
                  {{ formatCurrency(row.total) }}
                </td>
              </tr>
              <!-- Empty rows to match paper form aesthetic on print -->
              <tr v-for="n in Math.max(0, 8 - salesByOperator.length)" :key="`empty-${n}`" class="empty-row">
                <td colspan="5">
&nbsp;
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td class="font-weight-black text-uppercase">
                  Total Geral
                </td>
                <td class="text-end font-weight-bold">
                  {{ grandTotal.dinheiro > 0 ? formatCurrency(grandTotal.dinheiro) : '—' }}
                </td>
                <td class="text-end font-weight-bold">
                  {{ grandTotal.pix > 0 ? formatCurrency(grandTotal.pix) : '—' }}
                </td>
                <td class="text-end font-weight-bold">
                  {{ grandTotal.cartao > 0 ? formatCurrency(grandTotal.cartao) : '—' }}
                </td>
                <td class="text-end font-weight-black text-success-print">
                  {{ formatCurrency(grandTotal.total) }}
                </td>
              </tr>
            </tfoot>
          </table>
          <p class="text-caption text-medium-emphasis mt-2 print-obs">
            (*) OBS.: INFORMAR O VALOR DO DINHEIRO JÁ RETIRADO O VALOR DO TROCO
          </p>
        </div>
      </v-card>

      <!-- ─── Expenses section ────────────────────────────────────────── -->
      <v-card rounded="xl" :elevation="0" class="border mb-5 report-card">
        <v-card-title class="d-flex align-center pa-4 pb-2 no-print">
          <v-icon icon="mdi-cash-minus" color="error" class="me-2" />
          <span class="text-subtitle-1 font-weight-bold">Despesas</span>
          <v-btn
            class="ms-auto no-print"
            variant="tonal"
            color="error"
            size="small"
            prepend-icon="mdi-plus"
            to="/admin/pdv/despesas"
          >
            Gerenciar
          </v-btn>
        </v-card-title>
        <v-card-title class="pa-4 pb-2 print-only print-section-title">
          DESPESAS
        </v-card-title>

        <div class="pa-4">
          <table class="report-table">
            <thead>
              <tr>
                <th class="text-start" style="width: 75%;">
                  DESCRIÇÃO
                </th>
                <th class="text-end" style="width: 25%;">
                  VALOR R$
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="expenses.length === 0">
                <td colspan="2" class="text-center pa-6 text-medium-emphasis">
                  Nenhuma despesa registrada no período
                </td>
              </tr>
              <tr v-for="exp in expenses" :key="exp.id" class="data-row">
                <td>
                  <span class="font-weight-medium">{{ exp.descricao }}</span>
                  <span v-if="exp.operator_id" class="text-caption text-medium-emphasis ms-2">
                    ({{ typeof exp.operator_id === 'object' ? exp.operator_id.name : exp.operator_id }})
                  </span>
                </td>
                <td class="text-end text-error">
                  {{ formatCurrency(exp.valor) }}
                </td>
              </tr>
              <!-- Empty rows for print -->
              <tr v-for="n in Math.max(0, 5 - expenses.length)" :key="`exp-empty-${n}`" class="empty-row">
                <td colspan="2">
&nbsp;
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td class="font-weight-bold">
                  Total de Despesas R$
                </td>
                <td class="text-end font-weight-black text-error-print">
                  {{ formatCurrency(totalExpenses) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </v-card>

      <!-- ─── Extra totals row ────────────────────────────────────────── -->
      <v-card rounded="xl" :elevation="0" class="border mb-5 report-card">
        <div class="pa-4">
          <table class="report-table">
            <tbody>
              <tr class="total-row">
                <td class="font-weight-bold" style="width: 75%;">
                  TOTAL DO DINHEIRO – <span class="text-error">DESPESAS (R$)</span>
                </td>
                <td class="text-end font-weight-black" style="width: 25%;">
                  {{ formatCurrency(grandTotal.dinheiro - totalExpenses) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card>

      <!-- ─── Resumo Diário ───────────────────────────────────────────── -->
      <v-card rounded="xl" :elevation="0" class="border mb-6 report-card">
        <v-card-title class="pa-4 pb-2 resumo-header">
          RESUMO DIÁRIO
        </v-card-title>

        <div class="pa-4">
          <table class="report-table resumo-table">
            <tbody>
              <tr>
                <td class="font-weight-medium" style="width: 75%;">
                  APURADO (DINHEIRO, CARTÃO/PIX) R$
                </td>
                <td class="text-end font-weight-bold text-success-print" style="width: 25%;">
                  {{ formatCurrency(grandTotal.total) }}
                </td>
              </tr>
              <tr>
                <td class="font-weight-medium text-error">
                  - DESPESAS R$
                </td>
                <td class="text-end font-weight-bold text-error-print">
                  {{ formatCurrency(totalExpenses) }}
                </td>
              </tr>
              <tr class="total-row saldo-row">
                <td class="font-weight-black text-uppercase">
                  Saldo Líquido R$
                </td>
                <td
                  class="text-end font-weight-black"
                  :class="saldoLiquido >= 0 ? 'text-success-print' : 'text-error-print'"
                >
                  {{ formatCurrency(saldoLiquido) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card>

      <!-- ─── Signature ─────────────────────────────────────────────── -->
      <div class="signature-area">
        <div class="signature-responsavel">
          <p class="mb-2">
            RESPONSÁVEL: <strong>{{ responsavelNome }}</strong>
          </p>
        </div>
        <div class="signature-line">
          <div class="line" />
          <p class="mt-1 text-caption">
            ASSINATURA (EQUIPE TESOURARIA)
          </p>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!reportGenerated && !loading" class="text-center pa-12 no-print">
      <v-icon icon="mdi-file-chart-outline" size="64" color="on-surface-variant" class="mb-4" />
      <p class="text-body-1 text-on-surface-variant">
        Selecione o período e clique em Carregar para gerar o relatório
      </p>
    </div>
  </v-container>
</template>

<style scoped>
/* ──────────────────────────────────────────────────────────────────────────────
   Report Table — shared between screen & print
 ───────────────────────────────────────────────────────────────────────────── */
.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.report-table thead tr {
  background-color: rgb(var(--v-theme-surface-variant));
}

.report-table th {
  padding: 10px 12px;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.report-table td {
  padding: 9px 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.report-table .data-row:hover {
  background: rgba(0, 0, 0, 0.02);
}

.report-table .empty-row td {
  height: 36px;
  border-color: rgba(0, 0, 0, 0.06);
}

.report-table tfoot .total-row {
  background-color: rgba(var(--v-theme-secondary), 0.08);
  border-top: 2px solid rgba(0, 0, 0, 0.18);
}

.report-table tfoot .total-row td {
  padding: 12px;
  border-color: rgba(0, 0, 0, 0.12);
}

.report-table .saldo-row {
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
}

.col-money {
  min-width: 110px;
}

.resumo-header {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  background-color: rgba(var(--v-theme-primary), 0.08);
  padding: 12px 16px !important;
}

.resumo-table .total-row td {
  font-size: 1rem;
}

/* ──────────────────────────────────────────────────────────────────────────────
   Print+screen helpers
 ───────────────────────────────────────────────────────────────────────────── */
.text-success-print {
  color: rgb(var(--v-theme-success));
}

.text-error-print {
  color: rgb(var(--v-theme-error));
}

/* Hide print-only elements on screen */
.print-header,
.print-only,
.print-section-title {
  display: none;
}

/* Signature area */
.signature-area {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.signature-line .line {
  border-bottom: 1px solid rgba(0, 0, 0, 0.4);
  max-width: 320px;
  margin-bottom: 4px;
}

/* ──────────────────────────────────────────────────────────────────────────────
   @media print — formats the page for printing / PDF
 ───────────────────────────────────────────────────────────────────────────── */
@media print {
  /* Reset */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  /* Show print-only elements */
  .print-header {
    display: block !important;
    text-align: center;
    margin-bottom: 16px;
  }

  .print-only,
  .print-section-title {
    display: block !important;
  }

  /* Hide screen-only elements */
  .no-print {
    display: none !important;
  }

  /* Page setup */
  @page {
    size: A4 portrait;
    margin: 16mm 12mm 16mm 12mm;
  }

  body {
    font-size: 11px;
  }

  /* Remove shadows/borders that don't print well */
  .report-card {
    box-shadow: none !important;
    border-radius: 0 !important;
    border: 1px solid #ccc !important;
    break-inside: avoid;
    margin-bottom: 8px !important;
  }

  .v-container {
    padding: 0 !important;
  }

  .report-area {
    padding: 0;
  }

  /* Tables */
  .report-table {
    font-size: 10px;
  }

  .report-table th,
  .report-table td {
    padding: 5px 7px;
    border: 1px solid #999;
  }

  .report-table thead tr {
    background-color: #d0c9c0 !important;
  }

  .report-table tfoot .total-row {
    background-color: #ecdbc8 !important;
  }

  .resumo-header {
    background-color: #ecdbc8 !important;
    font-size: 10px;
    padding: 8px 12px !important;
  }

  .text-success-print {
    color: #1b5e20 !important;
  }

  .text-error-print {
    color: #b71c1c !important;
  }

  /* Print header */
  .print-logo-row {
    font-size: 13px;
    font-weight: bold;
    margin-bottom: 4px;
  }

  .print-title {
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 4px;
  }

  .print-date {
    font-size: 11px;
    margin: 0 0 12px;
  }

  .print-obs {
    font-size: 8px;
  }

  /* Signature */
  .signature-area {
    margin-top: 24px;
  }

  .signature-line .line {
    border-bottom: 1px solid #333;
    max-width: 280px;
  }
}
</style>
