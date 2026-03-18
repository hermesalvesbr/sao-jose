<script setup lang="ts">
/**
 * Relatório — Festa de Padroeiro
 *
 * Prestação de contas no formato padrão diocesano, consolidando:
 *   • Ofertas (ofertório)
 *   • Receitas avulsas (doações, campanhas/bingo/rifa, etc.)
 *   • Quermesse e Lojinha (vendas PDV)
 * Com deduções:
 *   • % para a Matriz
 *   • % para a Cúria
 *   • Despesas operacionais + sangrias
 * Intenções de missa exibidas em separado.
 *
 * NOTA: As vendas do PDV utilizam receita líquida (total_amount com descontos aplicados),
 * refletindo o valor efetivamente recebido após deduções comerciais.
 *
 * DRY: reutiliza usePdv, usePdvReportPeriod, useAuth, useDirectusClient.
 */
import { readItems } from '@directus/sdk'
import { dayEndBRT, dayStartBRT, formatCurrency, formatDate } from '~/composables/usePdvReport'
import { TIPO_RECEITA_LABELS } from '~/composables/useReceitas'

definePageMeta({ layout: 'admin' })

const LOJINHA_POINT_ID = '771786ea-9431-411b-8274-28b224bfb5ad'

const { fetchSaleItems, fetchExpenses, fetchCashWithdrawals } = usePdv()
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

// ─── Editable form fields ──────────────────────────────────────────────────
const comunidade = ref('Capela São José')
const pctMatriz = ref(30)
const pctCuria = ref(10)
const pagador = ref('')
const recebedor = ref('')

// Toggle para alternar entre receita bruta e líquida
const mostrarReceitaBruta = ref(false)

// ─── State ─────────────────────────────────────────────────────────────────
const loading = ref(false)
const reportGenerated = ref(false)

const ofertaItems = ref<any[]>([])
const pdvSaleItems = ref<any[]>([])
const pdvExpenses = ref<any[]>([])
const pdvWithdrawals = ref<any[]>([])
const receitasItems = ref<any[]>([])

// ─── Load Data ─────────────────────────────────────────────────────────────
async function loadReport(): Promise<void> {
  if (!dateFrom.value || !dateTo.value)
    return
  loading.value = true

  try {
    const client = await directusClient

    const [saleItemsRes, expensesRes, withdrawalsRes, ofertasRes, receitasRes] = await Promise.all([
      fetchSaleItems({
        fields: [
          'id',
          'total_price',
          'product_id.production_point_id',
          'sale_id.id',
          'sale_id.payment_method',
          'sale_id.sale_status',
          'sale_id.date_created',
          'sale_id.total_amount',
          'sale_id.discount_amount',
        ],
        filter: {
          _and: [
            { sale_id: { sale_status: { _eq: 'completed' } } },
            { sale_id: { date_created: { _gte: dayStartBRT(dateFrom.value) } } },
            { sale_id: { date_created: { _lte: dayEndBRT(dateTo.value) } } },
          ],
        },
        limit: -1,
      }),
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
      fetchCashWithdrawals({
        fields: ['id', 'valor', 'motivo', 'data_hora'],
        filter: {
          _and: [
            { data_hora: { _gte: dayStartBRT(dateFrom.value) } },
            { data_hora: { _lte: dayEndBRT(dateTo.value) } },
          ],
        },
        limit: -1,
      }),
      client.request(readItems('oferta_financeira', {
        fields: ['id', 'valor', 'data_entrada', 'meio'],
        filter: {
          _and: [
            { status: { _neq: 'archived' } },
            { data_entrada: { _gte: dayStartBRT(dateFrom.value) } },
            { data_entrada: { _lte: dayEndBRT(dateTo.value) } },
          ],
        },
        limit: -1,
      } as any)),
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

    pdvSaleItems.value = (saleItemsRes as any[]) || []
    pdvExpenses.value = (expensesRes as any[]) || []
    pdvWithdrawals.value = (withdrawalsRes as any[]) || []
    ofertaItems.value = (ofertasRes as any[]) || []
    receitasItems.value = (receitasRes as any[]) || []
    reportGenerated.value = true
  }
  catch (e) {
    console.error('Erro ao carregar relatório festa de padroeiro:', e)
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  setThisMonth()
  loadReport()
})

// ─── PDV Aggregation (Quermesse vs Lojinha) ────────────────────────────────
/**
 * Calcula a receita do PDV separando por ponto de produção.
 * - Receita líquida: usa total_amount da venda (já com descontos aplicados)
 * - Receita bruta: usa total_price dos itens (sem descontos)
 * Rateia o valor líquido da venda entre os itens para separar Quermesse vs Lojinha.
 */
const pdvAggregated = computed(() => {
  let lojinha = 0
  let quermesse = 0
  let lojinhaBruto = 0
  let quermesseBruto = 0

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
    if (sale?.sale_status !== 'completed')
      continue
    // Receita líquida da venda (já com descontos aplicados)
    const saleNetAmount = Number(sale?.total_amount || 0)
    // Soma dos preços unitários dos itens (base para rateio)
    const itemsGrossSum = items.reduce((s: number, i: any) => s + Number(i.total_price || 0), 0)
    // Fator de rateio: converte valor bruto dos itens em valor líquido da venda
    const netRatio = itemsGrossSum > 0 ? saleNetAmount / itemsGrossSum : 1

    for (const item of items) {
      const ppId = typeof item.product_id === 'object' ? item.product_id?.production_point_id : null
      // Valor bruto do item (sem rateio de desconto)
      const itemGrossAmount = Number(item.total_price || 0)
      // Aplica o fator de rateio para obter a parcela líquida do item
      const itemNetAmount = itemGrossAmount * netRatio

      if (ppId === LOJINHA_POINT_ID) {
        lojinha += itemNetAmount
        lojinhaBruto += itemGrossAmount
      }
      else {
        quermesse += itemNetAmount
        quermesseBruto += itemGrossAmount
      }
    }
  }

  return { lojinha, quermesse, lojinhaBruto, quermesseBruto }
})

// ─── Revenue Lines ─────────────────────────────────────────────────────────
const ofertasTotal = computed(() =>
  ofertaItems.value.reduce((s, o) => s + Number(o.valor || 0), 0),
)

const receitasByTipo = computed(() => {
  const map = new Map<string, number>()
  for (const r of receitasItems.value) {
    if (r.tipo === 'intencoes')
      continue
    const tipo = r.tipo ?? 'outro'
    map.set(tipo, (map.get(tipo) ?? 0) + Number(r.valor || 0))
  }
  return map
})

const intencoesTotal = computed(() =>
  receitasItems.value
    .filter(r => r.tipo === 'intencoes')
    .reduce((s, r) => s + Number(r.valor || 0), 0),
)

const TIPO_ORDER = ['campanha', 'doacao', 'outro', 'taxa', 'subsidio', 'reembolso', 'anuncio']

const revenueLines = computed(() => {
  const lines: { label: string, value: number }[] = []

  if (ofertasTotal.value > 0)
    lines.push({ label: 'OFERTAS', value: ofertasTotal.value })

  for (const tipo of TIPO_ORDER) {
    const total = receitasByTipo.value.get(tipo)
    if (total && total > 0) {
      lines.push({
        label: (TIPO_RECEITA_LABELS[tipo] ?? tipo).toUpperCase(),
        value: total,
      })
    }
  }

  for (const [tipo, total] of receitasByTipo.value) {
    if (TIPO_ORDER.includes(tipo) || total <= 0)
      continue
    lines.push({
      label: (TIPO_RECEITA_LABELS[tipo] ?? tipo).toUpperCase(),
      value: total,
    })
  }

  // Usa receita bruta ou líquida conforme toggle
  const lojinhaValue = mostrarReceitaBruta.value ? pdvAggregated.value.lojinhaBruto : pdvAggregated.value.lojinha
  const quermesseValue = mostrarReceitaBruta.value ? pdvAggregated.value.quermesseBruto : pdvAggregated.value.quermesse

  if (lojinhaValue > 0)
    lines.push({ label: 'LOJINHA', value: lojinhaValue })

  if (quermesseValue > 0)
    lines.push({ label: 'QUERMESSE', value: quermesseValue })

  return lines
})

// ─── Totals ────────────────────────────────────────────────────────────────
const soma = computed(() =>
  revenueLines.value.reduce((s, l) => s + l.value, 0),
)

const deducaoMatriz = computed(() => soma.value * pctMatriz.value / 100)
const deducaoCuria = computed(() => soma.value * pctCuria.value / 100)

const totalDespesas = computed(() =>
  pdvExpenses.value.reduce((s, e) => s + Number(e.valor || 0), 0),
)
const totalSangrias = computed(() =>
  pdvWithdrawals.value.reduce((s, w) => s + Number(w.valor || 0), 0),
)
const totalSaidas = computed(() =>
  totalDespesas.value + totalSangrias.value,
)

const totalDeducoes = computed(() =>
  deducaoMatriz.value + deducaoCuria.value + totalSaidas.value,
)

const saldoFinal = computed(() =>
  soma.value - totalDeducoes.value,
)

// ─── Labels ────────────────────────────────────────────────────────────────
const responsavelNome = computed(() =>
  `${user.value?.first_name ?? ''} ${user.value?.last_name ?? ''}`.trim() || 'Responsável',
)

const generatedAtLabel = computed(() =>
  `Gerado em ${formatDate(new Date().toISOString().substring(0, 10))}`,
)

function printPage(): void {
  window.print()
}
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <!-- ─── Screen header ─────────────────────────────────────────── -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-5 ga-3 no-print">
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
          Festa de Padroeiro
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Prestação de contas — formato padrão diocesano
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

    <!-- ─── Filters ───────────────────────────────────────────────── -->
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

        <v-row class="mt-2">
          <v-col cols="12" sm="4">
            <v-switch
              v-model="mostrarReceitaBruta"
              label="Exibir receita bruta (sem descontos)"
              color="primary"
              density="compact"
              hide-details
              class="no-print"
            />
          </v-col>
        </v-row>

        <v-row class="mt-2">
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="comunidade"
              label="Comunidade"
              variant="outlined"
              density="compact"
              hide-details
              prepend-inner-icon="mdi-church"
            />
          </v-col>
          <v-col cols="6" sm="2">
            <v-text-field
              v-model.number="pctMatriz"
              label="% Matriz"
              type="number"
              variant="outlined"
              density="compact"
              hide-details
              suffix="%"
              :min="0"
              :max="100"
            />
          </v-col>
          <v-col cols="6" sm="2">
            <v-text-field
              v-model.number="pctCuria"
              label="% Cúria"
              type="number"
              variant="outlined"
              density="compact"
              hide-details
              suffix="%"
              :min="0"
              :max="100"
            />
          </v-col>
          <v-col cols="12" sm="2">
            <v-text-field
              v-model="pagador"
              label="Pagador"
              variant="outlined"
              density="compact"
              hide-details
              prepend-inner-icon="mdi-account-arrow-right"
            />
          </v-col>
          <v-col cols="12" sm="2">
            <v-text-field
              v-model="recebedor"
              label="Recebedor"
              variant="outlined"
              density="compact"
              hide-details
              prepend-inner-icon="mdi-account-arrow-left"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4 no-print" />

    <!-- ─── Report area ───────────────────────────────────────────── -->
    <PrintReportLayout
      v-if="reportGenerated"
      class="report-area"
      title="Festa de Padroeiro"
      :subtitle="`Comunidade: ${comunidade}`"
      :period-label="periodLabel"
      :generated-at-label="generatedAtLabel"
      :left-signature-name="pagador || responsavelNome"
      left-signature-role="Pagador"
      :right-signature-name="recebedor || ''"
      right-signature-role="Recebedor"
    >
      <!-- ─── Receitas ──────────────────────────────────────────── -->
      <v-card rounded="xl" :elevation="0" class="border mb-5 report-card">
        <v-card-title class="d-flex align-center pa-4 pb-2 no-print">
          <v-icon icon="mdi-cash-multiple" color="success" class="me-2" />
          <span class="text-subtitle-1 font-weight-bold">
            {{ mostrarReceitaBruta ? 'Receitas Brutas' : 'Receitas Líquidas' }}
          </span>
        </v-card-title>
        <PrintReportSectionTitle :title="mostrarReceitaBruta ? 'Receitas Brutas' : 'Receitas Líquidas'" />

        <div class="pa-4">
          <!-- Nota explicativa -->
          <p class="text-caption text-medium-emphasis mb-3">
            <v-icon icon="mdi-information-outline" size="small" class="me-1" />
            {{ mostrarReceitaBruta
              ? 'Valores do PDV (Quermesse e Lojinha) mostram o total das vendas antes dos descontos comerciais.'
              : 'Valores do PDV (Quermesse e Lojinha) já incluem descontos comerciais aplicados nas vendas.'
            }}
          </p>
          <table class="report-table">
            <thead>
              <tr>
                <th class="text-start" style="width: 70%;">
                  DESCRIÇÃO
                </th>
                <th class="col-money text-end" style="width: 30%;">
                  R$
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(line, idx) in revenueLines" :key="idx" class="data-row">
                <td class="font-weight-medium">
                  {{ line.label }}
                </td>
                <td class="col-money text-end font-weight-bold">
                  {{ formatCurrency(line.value) }}
                </td>
              </tr>
              <tr v-if="revenueLines.length === 0" class="data-row">
                <td colspan="2" class="text-center text-medium-emphasis">
                  Nenhuma receita no período
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td class="font-weight-black text-uppercase">
                  SOMA
                </td>
                <td class="col-money text-end font-weight-black text-success-print">
                  {{ formatCurrency(soma) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </v-card>

      <!-- ─── Deduções ──────────────────────────────────────────── -->
      <v-card rounded="xl" :elevation="0" class="border mb-5 report-card">
        <v-card-title class="d-flex align-center pa-4 pb-2 no-print">
          <v-icon icon="mdi-cash-minus" color="error" class="me-2" />
          <span class="text-subtitle-1 font-weight-bold">Deduções</span>
        </v-card-title>
        <PrintReportSectionTitle title="Deduções" />

        <div class="pa-4">
          <table class="report-table">
            <thead>
              <tr>
                <th class="text-start" style="width: 70%;">
                  DESCRIÇÃO
                </th>
                <th class="col-money text-end" style="width: 30%;">
                  R$
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="data-row">
                <td class="font-weight-medium">
                  (-) {{ pctMatriz }}% PARA A MATRIZ
                </td>
                <td class="col-money text-end font-weight-bold text-error">
                  {{ formatCurrency(deducaoMatriz) }}
                </td>
              </tr>
              <tr class="data-row">
                <td class="font-weight-medium">
                  (-) {{ pctCuria }}% PARA A CÚRIA
                </td>
                <td class="col-money text-end font-weight-bold text-error">
                  {{ formatCurrency(deducaoCuria) }}
                </td>
              </tr>
              <tr class="data-row">
                <td class="font-weight-medium">
                  (-) DESPESAS ({{ pdvExpenses.length }} lançamento(s))
                </td>
                <td class="col-money text-end font-weight-bold text-error">
                  {{ formatCurrency(totalDespesas) }}
                </td>
              </tr>
              <tr v-if="totalSangrias > 0" class="data-row">
                <td class="font-weight-medium">
                  (-) SANGRIAS DE CAIXA ({{ pdvWithdrawals.length }} retirada(s))
                </td>
                <td class="col-money text-end font-weight-bold text-error">
                  {{ formatCurrency(totalSangrias) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td class="font-weight-black text-uppercase">
                  TOTAL DEDUÇÕES
                </td>
                <td class="col-money text-end font-weight-black text-error-print">
                  {{ formatCurrency(totalDeducoes) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </v-card>

      <!-- ─── Resultado Final ───────────────────────────────────── -->
      <v-card rounded="xl" :elevation="0" class="border mb-5 report-card">
        <v-card-title class="resumo-header">
          RESULTADO FINANCEIRO
        </v-card-title>
        <div class="pa-4">
          <table class="report-table resumo-table">
            <tbody>
              <tr>
                <td class="font-weight-medium" style="width: 70%;">
                  SOMA (RECEITAS)
                </td>
                <td class="text-end font-weight-bold text-success-print" style="width: 30%;">
                  {{ formatCurrency(soma) }}
                </td>
              </tr>
              <tr>
                <td class="font-weight-medium text-error">
                  - TOTAL DEDUÇÕES
                </td>
                <td class="text-end font-weight-bold text-error-print">
                  {{ formatCurrency(totalDeducoes) }}
                </td>
              </tr>
              <tr class="total-row saldo-row">
                <td class="font-weight-black text-uppercase">
                  SALDO FINAL
                </td>
                <td
                  class="text-end font-weight-black"
                  :class="saldoFinal >= 0 ? 'text-success-print' : 'text-error-print'"
                >
                  {{ formatCurrency(saldoFinal) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card>

      <!-- ─── Intenções (separado) ──────────────────────────────── -->
      <v-card v-if="intencoesTotal > 0" rounded="xl" :elevation="0" class="border mb-5 report-card">
        <div class="pa-4">
          <table class="report-table">
            <tbody>
              <tr class="total-row">
                <td class="font-weight-black" style="width: 70%;">
                  INTENÇÕES
                </td>
                <td class="col-money text-end font-weight-black" style="width: 30%;">
                  {{ formatCurrency(intencoesTotal) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card>
    </PrintReportLayout>

    <!-- Empty state -->
    <div v-if="!reportGenerated && !loading" class="text-center pa-12 no-print">
      <v-icon icon="mdi-party-popper" size="64" color="on-surface-variant" class="mb-4" />
      <p class="text-body-1 text-on-surface-variant">
        Selecione o período e clique em Carregar para gerar a prestação de contas da Festa de Padroeiro
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
