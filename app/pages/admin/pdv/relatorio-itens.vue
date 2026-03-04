<script setup lang="ts">
/**
 * Relatório de Vendas por Item e Categoria — PDV (Quermesse)
 *
 * Exibe itens vendidos agrupados por categoria e por produto,
 * além de resumo por operador. Imprimível via window.print().
 *
 * DRY: formatação e seleção de período via usePdvReport.
 */
import { formatCurrency } from '~/composables/usePdvReport'

definePageMeta({ layout: 'admin' })

const { fetchSaleItems } = usePdv()
const { user } = useAuth()
const {
  dateFrom,
  dateTo,
  periodLabel,
  setToday,
  setYesterday,
  setThisWeek,
  setThisMonth,
} = usePdvReportPeriod()

// ─── State ───────────────────────────────────────────────────────────────────
const saleItems = ref<any[]>([])
const loading = ref(false)
const reportGenerated = ref(false)

// ─── Load data ────────────────────────────────────────────────────────────────
async function loadReport() {
  if (!dateFrom.value || !dateTo.value)
    return
  loading.value = true
  try {
    const res = await fetchSaleItems({
      fields: [
        'id',
        'quantity',
        'unit_price',
        'total_price',
        'sale_id.id',
        'sale_id.date_created',
        'sale_id.sale_status',
        'sale_id.payment_method',
        'sale_id.operator_id.id',
        'sale_id.operator_id.name',
        'product_id.id',
        'product_id.name',
        'product_id.category_id.id',
        'product_id.category_id.name',
      ],
      filter: {
        _and: [
          { sale_id: { sale_status: { _eq: 'finalizada' } } },
          { sale_id: { date_created: { _gte: `${dateFrom.value}T00:00:00` } } },
          { sale_id: { date_created: { _lte: `${dateTo.value}T23:59:59` } } },
        ],
      },
      limit: -1,
    })
    saleItems.value = (res as any[]) || []
    reportGenerated.value = true
  }
  catch (e) {
    console.error('Error loading sale items report', e)
  }
  finally {
    loading.value = false
  }
}

onMounted(loadReport)

// ─── Aggregations ─────────────────────────────────────────────────────────────

interface ProductRow {
  id: string
  name: string
  categoryId: string
  categoryName: string
  qtd: number
  unitPrice: number
  total: number
}

interface CategoryRow {
  id: string
  name: string
  qtd: number
  total: number
  products: ProductRow[]
}

interface OperatorRow {
  id: string
  name: string
  qtd: number
  total: number
}

/** Agrupa itens por produto e retorna lista de produtos ordenada por total desc. */
const productRows = computed((): ProductRow[] => {
  const map = new Map<string, ProductRow>()
  for (const si of saleItems.value) {
    const prod = si.product_id
    const prodId: string = typeof prod === 'object' && prod ? prod.id : prod ?? 'sem-produto'
    const prodName: string = typeof prod === 'object' && prod ? prod.name : 'Sem Produto'
    const cat = typeof prod === 'object' && prod ? prod.category_id : null
    const catId: string = typeof cat === 'object' && cat ? cat.id : cat ?? 'sem-categoria'
    const catName: string = typeof cat === 'object' && cat ? cat.name : 'Sem Categoria'

    if (!map.has(prodId)) {
      map.set(prodId, {
        id: prodId,
        name: prodName,
        categoryId: catId,
        categoryName: catName,
        qtd: 0,
        unitPrice: Number(si.unit_price || 0),
        total: 0,
      })
    }
    const row = map.get(prodId)!
    row.qtd += Number(si.quantity || 0)
    row.total += Number(si.total_price || 0)
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total)
})

/** Agrupa produtos por categoria. */
const categoryRows = computed((): CategoryRow[] => {
  const map = new Map<string, CategoryRow>()
  for (const p of productRows.value) {
    if (!map.has(p.categoryId)) {
      map.set(p.categoryId, {
        id: p.categoryId,
        name: p.categoryName,
        qtd: 0,
        total: 0,
        products: [],
      })
    }
    const cat = map.get(p.categoryId)!
    cat.qtd += p.qtd
    cat.total += p.total
    cat.products.push(p)
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total)
})

/** Agrupa por operador. */
const operatorRows = computed((): OperatorRow[] => {
  const map = new Map<string, OperatorRow>()
  for (const si of saleItems.value) {
    const sale = si.sale_id
    const op = typeof sale === 'object' && sale ? sale.operator_id : null
    const opId: string = typeof op === 'object' && op ? op.id : op ?? 'sem-operador'
    const opName: string = typeof op === 'object' && op ? op.name : 'Sem Operador'

    if (!map.has(opId)) {
      map.set(opId, { id: opId, name: opName, qtd: 0, total: 0 })
    }
    const row = map.get(opId)!
    row.qtd += Number(si.quantity || 0)
    row.total += Number(si.total_price || 0)
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total)
})

const grandTotalQtd = computed(() => productRows.value.reduce((s, r) => s + r.qtd, 0))
const grandTotalValue = computed(() => productRows.value.reduce((s, r) => s + r.total, 0))

const responsavelNome = computed(() =>
  `${user.value?.first_name ?? ''} ${user.value?.last_name ?? ''}`.trim() || 'Responsável',
)

// ─── Categoria expandida  ─────────────────────────────────────────────────────
const expandedCategories = ref<Set<string>>(new Set())
function toggleCategory(id: string) {
  if (expandedCategories.value.has(id))
    expandedCategories.value.delete(id)
  else
    expandedCategories.value.add(id)
}
function isCategoryExpanded(id: string) {
  return expandedCategories.value.has(id)
}

function printPage() {
  window.print()
}
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <!-- ─── Screen header ─────────────────────────────────────────────── -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-5 ga-3 no-print">
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
          Vendas por Item e Categoria
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Detalhamento de itens vendidos na quermesse
        </p>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-printer"
        size="large"
        :disabled="!reportGenerated"
        @click="printPage"
      >
        Imprimir / PDF
      </v-btn>
    </div>

    <!-- ─── Filters ───────────────────────────────────────────────────── -->
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
            <v-btn color="primary" prepend-icon="mdi-magnify" block :loading="loading" @click="loadReport">
              Carregar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4 no-print" />

    <!-- ─── Report area ───────────────────────────────────────────────── -->
    <div v-if="reportGenerated" class="report-area">
      <!-- Print-only header -->
      <div class="print-header">
        <strong>Paróquia — Novenário de São José</strong>
        <h2 class="print-title">
          CONTROLE DIÁRIO DE VENDAS POR ITEM — QUERMESSE
        </h2>
        <p class="print-date">
          DATA: {{ periodLabel }}
        </p>
      </div>

      <!-- ─── Vendas por Categoria ──────────────────────────────────── -->
      <v-card rounded="xl" :elevation="0" class="border mb-5 report-card">
        <v-card-title class="d-flex align-center pa-4 pb-2 no-print">
          <v-icon icon="mdi-tag-multiple-outline" color="secondary" class="me-2" />
          <span class="text-subtitle-1 font-weight-bold">Vendas por Categoria</span>
          <v-chip size="small" variant="tonal" color="secondary" class="ms-3">
            {{ categoryRows.length }} categoria(s)
          </v-chip>
        </v-card-title>
        <div class="print-section-title print-only">
          VENDAS POR CATEGORIA
        </div>

        <div class="pa-4">
          <table class="report-table">
            <thead>
              <tr>
                <th class="text-start">
                  CATEGORIA
                </th>
                <th class="col-qty text-end">
                  QTD ITENS
                </th>
                <th class="col-money text-end">
                  TOTAL R$
                </th>
                <th class="col-action no-print" />
              </tr>
            </thead>
            <tbody>
              <template v-if="categoryRows.length === 0">
                <tr>
                  <td colspan="4" class="text-center pa-6 text-medium-emphasis">
                    Nenhum item vendido no período informado
                  </td>
                </tr>
              </template>
              <template v-for="cat in categoryRows" :key="cat.id">
                <!-- Category row -->
                <tr class="data-row cat-row">
                  <td class="font-weight-bold">
                    {{ cat.name }}
                  </td>
                  <td class="col-qty text-end">
                    {{ cat.qtd }}
                  </td>
                  <td class="col-money text-end font-weight-bold">
                    {{ formatCurrency(cat.total) }}
                  </td>
                  <td class="col-action no-print text-end">
                    <v-btn
                      :icon="isCategoryExpanded(cat.id) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                      size="x-small"
                      variant="text"
                      @click="toggleCategory(cat.id)"
                    />
                  </td>
                </tr>
                <!-- Product sub-rows (screen: toggle; print: always show) -->
                <tr
                  v-for="prod in cat.products"
                  :key="prod.id"
                  class="product-row"
                  :class="{ 'hidden-screen': !isCategoryExpanded(cat.id) }"
                >
                  <td class="ps-6 text-body-2 text-medium-emphasis">
                    ↳ {{ prod.name }}
                  </td>
                  <td class="col-qty text-end text-body-2">
                    {{ prod.qtd }}
                  </td>
                  <td class="col-money text-end text-body-2">
                    {{ formatCurrency(prod.total) }}
                  </td>
                  <td class="no-print" />
                </tr>
              </template>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td class="font-weight-black text-uppercase">
                  Total Geral
                </td>
                <td class="col-qty text-end font-weight-bold">
                  {{ grandTotalQtd }}
                </td>
                <td class="col-money text-end font-weight-black text-success-print">
                  {{ formatCurrency(grandTotalValue) }}
                </td>
                <td class="no-print" />
              </tr>
            </tfoot>
          </table>
        </div>
      </v-card>

      <!-- ─── Ranking de Produtos ──────────────────────────────────────── -->
      <v-card rounded="xl" :elevation="0" class="border mb-5 report-card">
        <v-card-title class="d-flex align-center pa-4 pb-2 no-print">
          <v-icon icon="mdi-chart-bar" color="primary" class="me-2" />
          <span class="text-subtitle-1 font-weight-bold">Ranking de Produtos</span>
        </v-card-title>
        <div class="print-section-title print-only">
          RANKING DE PRODUTOS (MAIS VENDIDOS)
        </div>

        <div class="pa-4">
          <table class="report-table">
            <thead>
              <tr>
                <th class="col-rank text-end">
                  #
                </th>
                <th class="text-start">
                  PRODUTO
                </th>
                <th class="text-start">
                  CATEGORIA
                </th>
                <th class="col-qty text-end">
                  QTD
                </th>
                <th class="col-money text-end">
                  UNIT. R$
                </th>
                <th class="col-money text-end">
                  TOTAL R$
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="productRows.length === 0">
                <td colspan="6" class="text-center pa-6 text-medium-emphasis">
                  Nenhum dado disponível
                </td>
              </tr>
              <tr
                v-for="(prod, idx) in productRows"
                :key="prod.id"
                class="data-row"
              >
                <td class="col-rank text-end text-medium-emphasis font-weight-medium">
                  {{ idx + 1 }}
                </td>
                <td class="font-weight-medium">
                  {{ prod.name }}
                </td>
                <td class="text-medium-emphasis">
                  {{ prod.categoryName }}
                </td>
                <td class="col-qty text-end">
                  {{ prod.qtd }}
                </td>
                <td class="col-money text-end">
                  {{ formatCurrency(prod.unitPrice) }}
                </td>
                <td class="col-money text-end font-weight-bold">
                  {{ formatCurrency(prod.total) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3" class="font-weight-black text-uppercase">
                  Total
                </td>
                <td class="col-qty text-end font-weight-bold">
                  {{ grandTotalQtd }}
                </td>
                <td />
                <td class="col-money text-end font-weight-black text-success-print">
                  {{ formatCurrency(grandTotalValue) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </v-card>

      <!-- ─── Resumo por Operador ──────────────────────────────────────── -->
      <v-card rounded="xl" :elevation="0" class="border mb-5 report-card">
        <v-card-title class="d-flex align-center pa-4 pb-2 no-print">
          <v-icon icon="mdi-account-group-outline" color="secondary" class="me-2" />
          <span class="text-subtitle-1 font-weight-bold">Resumo por Operador</span>
        </v-card-title>
        <div class="print-section-title print-only">
          RESUMO POR OPERADOR
        </div>

        <div class="pa-4">
          <table class="report-table">
            <thead>
              <tr>
                <th class="text-start">
                  OPERADOR
                </th>
                <th class="col-qty text-end">
                  QTD ITENS
                </th>
                <th class="col-money text-end">
                  TOTAL R$
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="op in operatorRows" :key="op.id" class="data-row">
                <td class="font-weight-medium">
                  {{ op.name }}
                </td>
                <td class="col-qty text-end">
                  {{ op.qtd }}
                </td>
                <td class="col-money text-end font-weight-bold">
                  {{ formatCurrency(op.total) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td class="font-weight-black text-uppercase">
                  Total Geral
                </td>
                <td class="col-qty text-end font-weight-bold">
                  {{ grandTotalQtd }}
                </td>
                <td class="col-money text-end font-weight-black text-success-print">
                  {{ formatCurrency(grandTotalValue) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </v-card>

      <!-- ─── Signature ─────────────────────────────────────────────── -->
      <div class="signature-area">
        <div>
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
      <v-icon icon="mdi-chart-bar" size="64" color="on-surface-variant" class="mb-4" />
      <p class="text-body-1 text-on-surface-variant">
        Selecione o período e clique em Carregar para gerar o relatório
      </p>
    </div>
  </v-container>
</template>

<style scoped>
/* Shared report table styles */
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
  padding: 8px 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.report-table .data-row:hover {
  background: rgba(0, 0, 0, 0.02);
}

.report-table tfoot .total-row {
  background-color: rgba(var(--v-theme-secondary), 0.08);
  border-top: 2px solid rgba(0, 0, 0, 0.18);
}

.report-table tfoot .total-row td {
  padding: 12px;
  border-color: rgba(0, 0, 0, 0.12);
}

.col-qty {
  min-width: 80px;
}
.col-money {
  min-width: 110px;
}
.col-rank {
  min-width: 36px;
}
.col-action {
  width: 40px;
}

.cat-row {
  background-color: rgba(var(--v-theme-secondary), 0.04);
}
.product-row td {
  color: rgba(0, 0, 0, 0.65);
}
.hidden-screen {
  display: none;
}

.text-success-print {
  color: rgb(var(--v-theme-success));
}

.print-header,
.print-only,
.print-section-title {
  display: none;
}

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

@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .print-header {
    display: block !important;
    text-align: center;
    margin-bottom: 16px;
  }

  .print-title {
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    margin: 0 0 4px;
  }

  .print-date {
    font-size: 11px;
    margin: 0 0 12px;
  }

  .print-only,
  .print-section-title {
    display: block !important;
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    background-color: #ecdbc8 !important;
    padding: 6px 12px;
    margin: 0;
  }

  .no-print {
    display: none !important;
  }
  .hidden-screen {
    display: table-row !important;
  }

  @page {
    size: A4 portrait;
    margin: 16mm 12mm 16mm 12mm;
  }

  body {
    font-size: 11px;
  }

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

  .report-table {
    font-size: 10px;
  }

  .report-table th,
  .report-table td {
    padding: 4px 6px;
    border: 1px solid #999;
  }

  .report-table thead tr {
    background-color: #d0c9c0 !important;
  }
  .report-table tfoot .total-row {
    background-color: #ecdbc8 !important;
  }

  .text-success-print {
    color: #1b5e20 !important;
  }

  .signature-line .line {
    border-bottom: 1px solid #333;
    max-width: 280px;
  }
}
</style>
