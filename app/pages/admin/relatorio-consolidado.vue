<script setup lang="ts">
/**
 * Relatório Financeiro Consolidado — Paróquia Novenário de São José
 *
 * Consolida TODAS as receitas da paróquia em um único documento:
 *   • Quermesse (PDV)
 *   • Ofertório
 *   • Dízimos
 * Subtraindo Despesas + Sangrias para apurar o Saldo Líquido do período.
 *
 * DRY: usa usePdvReport para formatação e seleção de período.
 */
import { readItems } from '@directus/sdk'
import { formatCurrency, formatDate } from '~/composables/usePdvReport'

definePageMeta({ layout: 'admin' })

const { fetchSales, fetchSaleItems, fetchExpenses, fetchCashWithdrawals } = usePdv()

const LOJINHA_POINT_ID = '771786ea-9431-411b-8274-28b224bfb5ad'
const { user } = useAuth()
const {
  dateFrom,
  dateTo,
  periodLabel,
  setToday,
  setYesterday,
  setThisWeek,
  setThisMonth,
  setNovena,
} = usePdvReportPeriod()

const directusClient = useDirectusClient()

// ─── State ─────────────────────────────────────────────────────────────────
const loading = ref(false)
const reportGenerated = ref(false)

// Quermesse + Lojinha (PDV)
const pdvSales = ref<any[]>([])
const pdvSaleItems = ref<any[]>([])
const pdvExpenses = ref<any[]>([])
const pdvWithdrawals = ref<any[]>([])

// Ofertório
const ofertaItems = ref<any[]>([])

// Dízimos
const dizimoItems = ref<any[]>([])

// Anúncios
const adsItems = ref<any[]>([])

// Receitas avulsas do novenário
const receitasItems = ref<any[]>([])

// ─── Load data ───────────────────────────────────────────────────────────────
async function loadReport() {
  if (!dateFrom.value || !dateTo.value)
    return
  loading.value = true

  try {
    const client = await directusClient

    const [salesRes, saleItemsRes, expensesRes, withdrawalsRes, ofertasRes, dizimosRes, adsRes, receitasRes] = await Promise.all([
      // Vendas PDV finalizadas
      fetchSales({
        fields: ['id', 'total_amount', 'payment_method', 'sale_status', 'date_created'],
        filter: {
          _and: [
            { sale_status: { _eq: 'completed' } },
            { date_created: { _gte: `${dateFrom.value}T00:00:00` } },
            { date_created: { _lte: `${dateTo.value}T23:59:59` } },
          ],
        },
        limit: -1,
      }),
      // Itens de venda com produto (para separar Lojinha x Quermesse)
      fetchSaleItems({
        fields: ['id', 'total_price', 'product_id.production_point_id', 'sale_id.id', 'sale_id.payment_method', 'sale_id.sale_status', 'sale_id.date_created', 'sale_id.total_amount'],
        filter: {
          _and: [
            { sale_id: { sale_status: { _eq: 'completed' } } },
            { sale_id: { date_created: { _gte: `${dateFrom.value}T00:00:00` } } },
            { sale_id: { date_created: { _lte: `${dateTo.value}T23:59:59` } } },
          ],
        },
        limit: -1,
      }),
      // Despesas PDV
      fetchExpenses({
        fields: ['id', 'valor', 'data_despesa', 'descricao'],
        filter: {
          _and: [
            { status: { _neq: 'archived' } },
            { data_despesa: { _gte: dateFrom.value } },
            { data_despesa: { _lte: dateTo.value } },
          ],
        },
        limit: -1,
      }),
      // Sangrias de caixa
      fetchCashWithdrawals({
        fields: ['id', 'valor', 'motivo', 'data_hora'],
        filter: {
          _and: [
            { data_hora: { _gte: `${dateFrom.value}T00:00:00` } },
            { data_hora: { _lte: `${dateTo.value}T23:59:59` } },
          ],
        },
        limit: -1,
      }),
      // Ofertório (oferta_financeira)
      client.request(readItems('oferta_financeira', {
        fields: ['id', 'valor', 'data_entrada', 'meio'],
        filter: {
          _and: [
            { status: { _neq: 'archived' } },
            { data_entrada: { _gte: `${dateFrom.value}T00:00:00` } },
            { data_entrada: { _lte: `${dateTo.value}T23:59:59` } },
          ],
        },
        limit: -1,
      } as any)),
      // Dízimos (pagamento_dizimo)
      client.request(readItems('pagamento_dizimo', {
        fields: ['id', 'valor_pago', 'data_pagamento', 'meio'],
        filter: {
          _and: [
            { status: { _neq: 'archived' } },
            { data_pagamento: { _gte: `${dateFrom.value}T00:00:00` } },
            { data_pagamento: { _lte: `${dateTo.value}T23:59:59` } },
          ],
        },
        limit: -1,
      } as any)),
      // Anúncios (ads_novenario)
      client.request(readItems('ads_novenario', {
        fields: ['id', 'anunciante', 'valor_pago', 'date_created', 'status', 'status_pagamento', 'meio_pagamento', 'data_pagamento'],
        filter: {
          _and: [
            { status: { _eq: 'published' } },
            { date_created: { _gte: `${dateFrom.value}T00:00:00` } },
            { date_created: { _lte: `${dateTo.value}T23:59:59` } },
          ],
        },
        limit: -1,
      } as any)),
      // Receitas avulsas do novenário
      client.request(readItems('receitas', {
        fields: ['id', 'tipo', 'descricao', 'valor', 'data', 'meio_pagamento'],
        filter: {
          _and: [
            { status: { _eq: 'published' } },
            { data: { _gte: dateFrom.value } },
            { data: { _lte: dateTo.value } },
          ],
        },
        limit: -1,
      } as any)),
    ])

    pdvSales.value = (salesRes as any[]) || []
    pdvSaleItems.value = (saleItemsRes as any[]) || []
    pdvExpenses.value = (expensesRes as any[]) || []
    pdvWithdrawals.value = (withdrawalsRes as any[]) || []
    ofertaItems.value = (ofertasRes as any[]) || []
    dizimoItems.value = (dizimosRes as any[]) || []
    adsItems.value = (adsRes as any[]) || []
    receitasItems.value = (receitasRes as any[]) || []
    reportGenerated.value = true
  }
  catch (e) {
    console.error('Error loading consolidated report', e)
  }
  finally {
    loading.value = false
  }
}

onMounted(loadReport)

// ─── Aggregations ─────────────────────────────────────────────────────────────

/**
 * Agrega vendas PDV separando Lojinha de Quermesse.
 * Distribui desconto proporcionalmente: se uma venda tem desconto,
 * o valor de cada item é ajustado pela razão (total_amount / soma_itens).
 */
function aggregateByProductionPoint() {
  const lojinha = { dinheiro: 0, pix: 0, cartao: 0, total: 0 }
  const quermesse = { dinheiro: 0, pix: 0, cartao: 0, total: 0 }

  // Agrupar itens por venda
  const bySale = new Map<string, any[]>()
  for (const item of pdvSaleItems.value) {
    const saleId = typeof item.sale_id === 'object' ? item.sale_id?.id : item.sale_id
    if (!saleId)
      continue
    if (!bySale.has(saleId))
      bySale.set(saleId, [])
    bySale.get(saleId)!.push(item)
  }

  for (const [, items] of bySale) {
    const sale = typeof items[0].sale_id === 'object' ? items[0].sale_id : null
    const saleTotalAmount = Number(sale?.total_amount || 0)
    const method: string = (sale?.payment_method ?? 'dinheiro')
    const itemsSum = items.reduce((s: number, i: any) => s + Number(i.total_price || 0), 0)
    const ratio = itemsSum > 0 ? saleTotalAmount / itemsSum : 1

    for (const item of items) {
      const ppId = typeof item.product_id === 'object' ? item.product_id?.production_point_id : null
      const amt = Number(item.total_price || 0) * ratio
      const target = ppId === LOJINHA_POINT_ID ? lojinha : quermesse
      if (method === 'dinheiro')
        target.dinheiro += amt
      else if (method === 'pix')
        target.pix += amt
      else
        target.cartao += amt
      target.total += amt
    }
  }

  return { lojinha, quermesse }
}

const pdvAggregated = computed(() => aggregateByProductionPoint())
const quermesseByMethod = computed(() => pdvAggregated.value.quermesse)
const lojinhaByMethod = computed(() => pdvAggregated.value.lojinha)

/** Soma total PDV (compatibilidade). */
const pdvByMethod = computed(() => ({
  dinheiro: quermesseByMethod.value.dinheiro + lojinhaByMethod.value.dinheiro,
  pix: quermesseByMethod.value.pix + lojinhaByMethod.value.pix,
  cartao: quermesseByMethod.value.cartao + lojinhaByMethod.value.cartao,
  total: quermesseByMethod.value.total + lojinhaByMethod.value.total,
}))

/** Soma do ofertório por meio. */
const ofertaByMethod = computed(() => {
  const acc = { dinheiro: 0, pix: 0, cartao: 0, total: 0 }
  for (const o of ofertaItems.value) {
    const amt = Number(o.valor || 0)
    const meio: string = (o.meio ?? 'dinheiro').toLowerCase()
    if (meio.includes('pix'))
      acc.pix += amt
    else if (meio.includes('cart'))
      acc.cartao += amt
    else
      acc.dinheiro += amt
    acc.total += amt
  }
  return acc
})

/** Soma de dízimos por meio. */
const dizimoByMethod = computed(() => {
  const acc = { dinheiro: 0, pix: 0, cartao: 0, total: 0 }
  for (const d of dizimoItems.value) {
    const amt = Number(d.valor_pago || 0)
    const meio: string = (d.meio ?? 'dinheiro').toLowerCase()
    if (meio.includes('pix'))
      acc.pix += amt
    else if (meio.includes('cart'))
      acc.cartao += amt
    else
      acc.dinheiro += amt
    acc.total += amt
  }
  return acc
})

/** Valor pendente de receber (status = pendente). */
const adsPendente = computed(() =>
  adsItems.value
    .filter(a => !a.status_pagamento || a.status_pagamento === 'pendente')
    .reduce((s, a) => s + Number(a.valor_pago || 0), 0),
)

/** Anúncios pagos por meio de pagamento. */
const adsByMethod = computed(() => {
  const acc = { dinheiro: 0, pix: 0, cartao: 0, total: 0 }
  for (const a of adsItems.value) {
    if (a.status_pagamento !== 'pago' && a.status_pagamento !== 'permuta')
      continue
    const amt = Number(a.valor_pago || 0)
    const meio: string = (a.meio_pagamento ?? 'dinheiro').toLowerCase()
    if (meio === 'pix')
      acc.pix += amt
    else if (meio === 'cartao')
      acc.cartao += amt
    else
      acc.dinheiro += amt
    acc.total += amt
  }
  return acc
})

const TIPO_RECEITA_LABELS: Record<string, string> = {
  doacao: 'Doação / Contribuição',
  campanha: 'Campanha / Rifa / Bingo / Leilão',
  taxa: 'Taxa / Ingresso',
  subsidio: 'Subsídio / Repasse',
  reembolso: 'Reembolso',
  outro: 'Outro',
}

/** Receitas agrupadas por tipo. */
const receitasByTipo = computed(() => {
  const map = new Map<string, number>()
  for (const r of receitasItems.value) {
    const tipo = r.tipo ?? 'outro'
    map.set(tipo, (map.get(tipo) ?? 0) + Number(r.valor || 0))
  }
  return map
})

/** Receitas por meio de pagamento (para colunas). */
const receitasByMethod = computed(() => {
  const acc = { dinheiro: 0, pix: 0, cartao: 0, total: 0 }
  for (const r of receitasItems.value) {
    const amt = Number(r.valor || 0)
    const meio: string = (r.meio_pagamento ?? 'dinheiro').toLowerCase()
    if (meio === 'pix')
      acc.pix += amt
    else if (meio === 'cartao')
      acc.cartao += amt
    else
      acc.dinheiro += amt
    acc.total += amt
  }
  return acc
})

/** Totais por coluna de pagamento. */
const grandByMethod = computed(() => ({
  dinheiro: pdvByMethod.value.dinheiro + ofertaByMethod.value.dinheiro + dizimoByMethod.value.dinheiro + adsByMethod.value.dinheiro + receitasByMethod.value.dinheiro,
  pix: pdvByMethod.value.pix + ofertaByMethod.value.pix + dizimoByMethod.value.pix + adsByMethod.value.pix + receitasByMethod.value.pix,
  cartao: pdvByMethod.value.cartao + ofertaByMethod.value.cartao + dizimoByMethod.value.cartao + adsByMethod.value.cartao + receitasByMethod.value.cartao,
  total: pdvByMethod.value.total + ofertaByMethod.value.total + dizimoByMethod.value.total + adsByMethod.value.total + receitasByMethod.value.total,
}))

const totalExpenses = computed(() =>
  pdvExpenses.value.reduce((s, e) => s + Number(e.valor || 0), 0),
)

const totalWithdrawals = computed(() =>
  pdvWithdrawals.value.reduce((s, w) => s + Number(w.valor || 0), 0),
)

const saldoLiquido = computed(() =>
  grandByMethod.value.total - totalExpenses.value - totalWithdrawals.value,
)

const responsavelNome = computed(() =>
  `${user.value?.first_name ?? ''} ${user.value?.last_name ?? ''}`.trim() || 'Responsável',
)

const generatedAtLabel = computed(() =>
  `Gerado em ${formatDate(new Date().toISOString().substring(0, 10))}`,
)

function fmtOrDash(val: number) {
  return val > 0 ? formatCurrency(val) : '—'
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
          Relatório Financeiro Consolidado
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Prestação de contas completa — Dízimos, Ofertório e Quermesse
        </p>
      </div>
      <v-btn
        variant="tonal"
        color="info"
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
        <v-row align="center">
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
              <v-btn size="small" variant="tonal" color="warning" @click="setNovena()">
                Novena (9 dias)
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
    <PrintReportLayout
      v-if="reportGenerated"
      class="report-area"
      title="Prestação de Contas — Financeiro Consolidado"
      subtitle="Receitas e saídas consolidadas do período"
      :period-label="periodLabel"
      :generated-at-label="generatedAtLabel"
      :left-signature-name="responsavelNome"
    >
      <!-- ─── Receitas por Fonte ─────────────────────────────────────── -->
      <v-card rounded="xl" :elevation="0" class="border mb-5 report-card">
        <v-card-title class="d-flex align-center pa-4 pb-2 no-print">
          <v-icon icon="mdi-cash-multiple" color="success" class="me-2" />
          <span class="text-subtitle-1 font-weight-bold">Receitas por Fonte</span>
        </v-card-title>
        <PrintReportSectionTitle title="Receitas por fonte" />

        <div class="pa-4">
          <table class="report-table">
            <thead>
              <tr>
                <th class="text-start">
                  FONTE
                </th>
                <th class="col-money text-end">
                  DINHEIRO
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
              <tr class="data-row">
                <td class="font-weight-medium">
                  <v-icon size="16" icon="mdi-store-outline" class="me-1 no-print" />
                  Quermesse (Comida / Bebida)
                </td>
                <td class="col-money text-end">
                  {{ fmtOrDash(quermesseByMethod.dinheiro) }}
                </td>
                <td class="col-money text-end">
                  {{ fmtOrDash(quermesseByMethod.pix) }}
                </td>
                <td class="col-money text-end">
                  {{ fmtOrDash(quermesseByMethod.cartao) }}
                </td>
                <td class="col-money text-end font-weight-bold">
                  {{ formatCurrency(quermesseByMethod.total) }}
                </td>
              </tr>
              <tr class="data-row">
                <td class="font-weight-medium">
                  <v-icon size="16" icon="mdi-shopping-outline" class="me-1 no-print" />
                  Lojinha (Artigos Religiosos)
                </td>
                <td class="col-money text-end">
                  {{ fmtOrDash(lojinhaByMethod.dinheiro) }}
                </td>
                <td class="col-money text-end">
                  {{ fmtOrDash(lojinhaByMethod.pix) }}
                </td>
                <td class="col-money text-end">
                  {{ fmtOrDash(lojinhaByMethod.cartao) }}
                </td>
                <td class="col-money text-end font-weight-bold">
                  {{ formatCurrency(lojinhaByMethod.total) }}
                </td>
              </tr>
              <tr class="data-row">
                <td class="font-weight-medium">
                  <v-icon size="16" icon="mdi-cash-multiple" class="me-1 no-print" />
                  Ofertório
                </td>
                <td class="col-money text-end">
                  {{ fmtOrDash(ofertaByMethod.dinheiro) }}
                </td>
                <td class="col-money text-end">
                  {{ fmtOrDash(ofertaByMethod.pix) }}
                </td>
                <td class="col-money text-end">
                  {{ fmtOrDash(ofertaByMethod.cartao) }}
                </td>
                <td class="col-money text-end font-weight-bold">
                  {{ formatCurrency(ofertaByMethod.total) }}
                </td>
              </tr>
              <tr class="data-row">
                <td class="font-weight-medium">
                  <v-icon size="16" icon="mdi-account-cash-outline" class="me-1 no-print" />
                  Dízimos
                </td>
                <td class="col-money text-end">
                  {{ fmtOrDash(dizimoByMethod.dinheiro) }}
                </td>
                <td class="col-money text-end">
                  {{ fmtOrDash(dizimoByMethod.pix) }}
                </td>
                <td class="col-money text-end">
                  {{ fmtOrDash(dizimoByMethod.cartao) }}
                </td>
                <td class="col-money text-end font-weight-bold">
                  {{ formatCurrency(dizimoByMethod.total) }}
                </td>
              </tr>
              <tr class="data-row">
                <td class="font-weight-medium">
                  <v-icon size="16" icon="mdi-bullhorn-outline" class="me-1 no-print" />
                  Anúncios ({{ adsItems.length }}× — {{ adsItems.filter(a => a.status_pagamento === 'pago' || a.status_pagamento === 'permuta').length }} pago(s))
                  <v-chip v-if="adsPendente > 0" size="x-small" color="warning" label class="ml-2 no-print">
                    {{ formatCurrency(adsPendente) }} pendente
                  </v-chip>
                </td>
                <td class="col-money text-end">
                  {{ fmtOrDash(adsByMethod.dinheiro) }}
                </td>
                <td class="col-money text-end">
                  {{ fmtOrDash(adsByMethod.pix) }}
                </td>
                <td class="col-money text-end">
                  {{ fmtOrDash(adsByMethod.cartao) }}
                </td>
                <td class="col-money text-end font-weight-bold">
                  {{ formatCurrency(adsByMethod.total) }}
                </td>
              </tr>
              <tr v-if="receitasItems.length > 0" class="data-row">
                <td class="font-weight-medium">
                  <v-icon size="16" icon="mdi-cash-plus" class="me-1 no-print" />
                  Receitas ({{ receitasItems.length }}×)
                  <template v-if="receitasByTipo.size > 0">
                    <span class="text-caption text-medium-emphasis ms-1">
                      ({{ Array.from(receitasByTipo.keys()).map(t => TIPO_RECEITA_LABELS[t] ?? t).join(', ') }})
                    </span>
                  </template>
                </td>
                <td class="col-money text-end">
                  {{ fmtOrDash(receitasByMethod.dinheiro) }}
                </td>
                <td class="col-money text-end">
                  {{ fmtOrDash(receitasByMethod.pix) }}
                </td>
                <td class="col-money text-end">
                  {{ fmtOrDash(receitasByMethod.cartao) }}
                </td>
                <td class="col-money text-end font-weight-bold">
                  {{ formatCurrency(receitasByMethod.total) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td class="font-weight-black text-uppercase">
                  Total Receitas
                </td>
                <td class="col-money text-end font-weight-bold">
                  {{ fmtOrDash(grandByMethod.dinheiro) }}
                </td>
                <td class="col-money text-end font-weight-bold">
                  {{ fmtOrDash(grandByMethod.pix) }}
                </td>
                <td class="col-money text-end font-weight-bold">
                  {{ fmtOrDash(grandByMethod.cartao) }}
                </td>
                <td class="col-money text-end font-weight-black text-success-print">
                  {{ formatCurrency(grandByMethod.total) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </v-card>

      <!-- ─── Saídas (Despesas + Sangrias) ─────────────────────────── -->
      <v-card rounded="xl" :elevation="0" class="border mb-5 report-card">
        <v-card-title class="d-flex align-center pa-4 pb-2 no-print">
          <v-icon icon="mdi-cash-minus" color="error" class="me-2" />
          <span class="text-subtitle-1 font-weight-bold">Saídas Financeiras</span>
        </v-card-title>
        <PrintReportSectionTitle title="Saídas financeiras" />

        <div class="pa-4">
          <table class="report-table">
            <thead>
              <tr>
                <th class="text-start" style="width: 75%;">
                  DESCRIÇÃO
                </th>
                <th class="col-money text-end" style="width: 25%;">
                  VALOR R$
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="data-row">
                <td class="font-weight-medium">
                  Despesas operacionais ({{ pdvExpenses.length }} lançamento(s))
                </td>
                <td class="col-money text-end text-error font-weight-bold">
                  {{ formatCurrency(totalExpenses) }}
                </td>
              </tr>
              <tr class="data-row">
                <td class="font-weight-medium">
                  Sangrias de caixa ({{ pdvWithdrawals.length }} retirada(s))
                </td>
                <td class="col-money text-end text-error font-weight-bold">
                  {{ formatCurrency(totalWithdrawals) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td class="font-weight-black text-uppercase">
                  Total de Saídas
                </td>
                <td class="col-money text-end font-weight-black text-error-print">
                  {{ formatCurrency(totalExpenses + totalWithdrawals) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </v-card>

      <!-- ─── Resultado Final ────────────────────────────────────────── -->
      <v-card rounded="xl" :elevation="0" class="border mb-6 report-card">
        <v-card-title class="resumo-header">
          RESULTADO FINANCEIRO DO PERÍODO
        </v-card-title>
        <div class="pa-4">
          <table class="report-table resumo-table">
            <tbody>
              <tr>
                <td class="font-weight-medium" style="width: 75%;">
                  TOTAL DE RECEITAS R$
                </td>
                <td class="text-end font-weight-bold text-success-print" style="width: 25%;">
                  {{ formatCurrency(grandByMethod.total) }}
                </td>
              </tr>
              <tr>
                <td class="font-weight-medium text-error">
                  - DESPESAS E SANGRIAS R$
                </td>
                <td class="text-end font-weight-bold text-error-print">
                  {{ formatCurrency(totalExpenses + totalWithdrawals) }}
                </td>
              </tr>
              <tr class="total-row saldo-row">
                <td class="font-weight-black text-uppercase">
                  SALDO LÍQUIDO R$
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
    </PrintReportLayout>

    <!-- Empty state -->
    <div v-if="!reportGenerated && !loading" class="text-center pa-12 no-print">
      <v-icon icon="mdi-finance" size="64" color="on-surface-variant" class="mb-4" />
      <p class="text-body-1 text-on-surface-variant">
        Selecione o período e clique em Carregar para gerar a prestação de contas consolidada
      </p>
    </div>
  </v-container>
</template>

<style scoped>
.report-table .saldo-row {
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
}

.col-money {
  min-width: 120px;
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
</style>
