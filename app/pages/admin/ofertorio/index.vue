<script setup lang="ts">
import type { VDataTable } from 'vuetify/components'
import type { ValorDetalhado } from '~/types/ofertorio'
import type { OfertaFinanceira } from '~/types/schema'
import { updateItem } from '@directus/sdk'
import { brToIsoDate, isoToBrDate } from '~/composables/usePdvReport'

definePageMeta({
  layout: 'admin',
})

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const { ofertas, loading, fetchOfertas } = useOfertas()
const sortBy = ref<VDataTable['sortBy']>([{ key: 'data_entrada', order: 'desc' }])

// ── Soft-delete (archive) ───────────────────────────────────────────────────
const confirmDialog = ref(false)
const arquivandoId = ref<string | null>(null)
const arquivando = ref(false)

function confirmarArquivar(item: OfertaFinanceira): void {
  arquivandoId.value = item.id
  confirmDialog.value = true
}

async function arquivarOferta(): Promise<void> {
  if (!arquivandoId.value)
    return
  arquivando.value = true
  try {
    const directus = await useDirectusClient()
    await directus.request(updateItem('oferta_financeira', arquivandoId.value, { status: 'archived' }))
    await fetchOfertas()
    confirmDialog.value = false
  }
  catch (err) {
    console.error('Erro ao arquivar oferta:', err)
  }
  finally {
    arquivando.value = false
    arquivandoId.value = null
  }
}
function mesAtualPrimeiro(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

function mesAtualUltimo(): string {
  const now = new Date()
  const ultimo = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return `${ultimo.getFullYear()}-${String(ultimo.getMonth() + 1).padStart(2, '0')}-${String(ultimo.getDate()).padStart(2, '0')}`
}

const dataInicio = ref(mesAtualPrimeiro())
const dataFim = ref(mesAtualUltimo())
const dataInicioField = computed({
  get: () => isoToBrDate(dataInicio.value),
  set: (value: string) => {
    dataInicio.value = brToIsoDate(value)
  },
})
const dataFimField = computed({
  get: () => isoToBrDate(dataFim.value),
  set: (value: string) => {
    dataFim.value = brToIsoDate(value)
  },
})

const hojeIso = computed(() => {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
})

const headers: any[] = [
  {
    title: 'Evento',
    key: 'evento',
    sortable: true,
    align: 'start' as const,
    sort: (a: any, b: any) => {
      const nameA = getEventoNome(a)
      const nameB = getEventoNome(b)
      return nameA.localeCompare(nameB)
    },
  },
  {
    title: 'Valor',
    key: 'valor',
    sortable: true,
    align: 'end' as const,
  },
  {
    title: 'Data',
    key: 'data_entrada',
    sortable: true,
    align: 'center' as const,
  },
  {
    title: '',
    key: 'acoes',
    sortable: false,
    align: 'end' as const,
    width: '100px',
  },
]

onMounted(async () => {
  await fetchOfertas()
})

const ofertasFiltradas = computed(() => {
  return ofertas.value.filter((item) => {
    const dateOnly = getDateOnly(item.data_entrada)
    if (!dateOnly)
      return false

    if (dataInicio.value && dateOnly < dataInicio.value)
      return false
    if (dataFim.value && dateOnly > dataFim.value)
      return false

    return true
  })
})

const totalValorOfertas = computed(() => {
  return ofertasFiltradas.value.reduce((total, item) => total + (Number(item.valor) || 0), 0)
})

const periodoFiltroLabel = computed(() => {
  if (dataInicio.value && dataFim.value)
    return `${formatDate(dataInicio.value)} – ${formatDate(dataFim.value)}`
  if (dataInicio.value)
    return `A partir de ${formatDate(dataInicio.value)}`
  if (dataFim.value)
    return `Até ${formatDate(dataFim.value)}`
  return 'Todos os registros'
})

const generatedAtLabel = computed(() => `Gerado em ${formatDate(new Date())}`)

function printList(): void {
  window.print()
}

function aplicarHoje(): void {
  dataInicio.value = hojeIso.value
  dataFim.value = hojeIso.value
}

function aplicarMesAtual(): void {
  dataInicio.value = mesAtualPrimeiro()
  dataFim.value = mesAtualUltimo()
}

function limparFiltroDatas(): void {
  dataInicio.value = ''
  dataFim.value = ''
}

function getDateOnly(date: any): string | null {
  if (!date)
    return null
  if (typeof date === 'string') {
    if (ISO_DATE_RE.test(date))
      return date
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime()))
      return null
    const yyyy = parsed.getFullYear()
    const mm = String(parsed.getMonth() + 1).padStart(2, '0')
    const dd = String(parsed.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime()))
    return null
  const yyyy = parsed.getFullYear()
  const mm = String(parsed.getMonth() + 1).padStart(2, '0')
  const dd = String(parsed.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function detalhesFiltrados(detalhes: unknown): ValorDetalhado[] {
  if (!Array.isArray(detalhes))
    return []
  return detalhes.filter((item): item is ValorDetalhado => {
    return typeof item === 'object'
      && item !== null
      && typeof item.quantidade === 'number'
      && typeof item.label === 'string'
      && typeof item.valor === 'number'
      && typeof item.tipo === 'string'
      && item.quantidade > 0
  })
}

function formatarDetalhesTexto(detalhes: unknown): string {
  return detalhesFiltrados(detalhes).map(d => `${d.quantidade}× ${d.label}`).join(', ')
}

function getEventoNome(evento: any): string {
  if (!evento)
    return 'Sem evento especificado'
  if (typeof evento === 'string')
    return evento
  return evento.titulo || evento.id || 'Evento sem título'
}

function formatCurrency(valor: number): string {
  if (!valor && valor !== 0)
    return 'R$ 0,00'
  const numericValue = typeof valor === 'string' ? Number.parseFloat(valor) : valor
  if (Number.isNaN(numericValue))
    return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)
}

function formatDate(date: any): string {
  if (!date)
    return 'Data não informada'
  let d: Date
  if (typeof date === 'string') {
    if (ISO_DATE_RE.test(date))
      d = new Date(`${date}T12:00:00`)
    else
      d = new Date(date)
  }
  else {
    d = new Date(date)
  }
  if (Number.isNaN(d.getTime()))
    return 'Data inválida'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getValorColor(valor: number): string {
  if (!valor || valor <= 0)
    return 'grey'
  if (valor < 100)
    return 'blue'
  if (valor < 300)
    return 'green'
  if (valor < 500)
    return 'orange'
  return 'purple'
}
</script>

<template>
  <v-container fluid class="pa-2 pa-md-6">
    <!-- Header com botão imprimir — Pattern 1 consistente com outras telas -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-4 ga-3 d-print-none">
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
          Ofertas Financeiras
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Total: {{ formatCurrency(totalValorOfertas) }} em {{ ofertasFiltradas.length }} {{ ofertasFiltradas.length === 1 ? 'oferta' : 'ofertas' }}
        </p>
      </div>
      <div class="d-flex ga-2">
        <v-btn
          variant="tonal"
          color="info"
          prepend-icon="mdi-printer"
          size="large"
          :disabled="ofertasFiltradas.length === 0"
          @click="printList"
        >
          Imprimir / PDF
        </v-btn>
        <v-btn
          to="/admin/ofertorio/add"
          color="primary"
          prepend-icon="mdi-plus"
          size="large"
        >
          Nova Oferta
        </v-btn>
      </div>
    </div>

    <v-row class="d-print-none">
      <v-col cols="12">
        <v-card rounded="xl" :elevation="0" class="border mb-3">
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" sm="6" md="3">
                <MaskedDateField
                  v-model="dataInicioField"
                  label="Data inicial"
                  hide-details
                  prepend-inner-icon="mdi-calendar-start"
                />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <MaskedDateField
                  v-model="dataFimField"
                  label="Data final"
                  hide-details
                  prepend-inner-icon="mdi-calendar-end"
                />
              </v-col>
              <v-col cols="12" md="6">
                <div class="d-flex flex-wrap ga-2">
                  <v-btn size="small" variant="tonal" color="secondary" prepend-icon="mdi-calendar-today" @click="aplicarHoje">
                    Hoje
                  </v-btn>
                  <v-btn size="small" variant="tonal" color="secondary" prepend-icon="mdi-calendar-month" @click="aplicarMesAtual">
                    Este mês
                  </v-btn>
                  <v-btn size="small" variant="text" prepend-icon="mdi-filter-off" @click="limparFiltroDatas">
                    Limpar filtro
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card elevation="2" rounded="lg">
          <v-data-table
            v-model:sort-by="sortBy"
            :headers="headers"
            :items="ofertasFiltradas"
            :items-per-page="15"
            :loading="loading"
            loading-text="Carregando ofertas financeiras..."
            no-data-text="Nenhuma oferta encontrada"
            items-per-page-text="Itens por página:"
            page-text="{0}-{1} de {2}"
            density="compact"
            :hover="true"
            :sticky="true"
            :mobile-breakpoint="600"
            :show-current-page="true"
            :show-first-last-page="true"
            :items-per-page-options="[
              { value: 10, title: '10' },
              { value: 15, title: '15' },
              { value: 25, title: '25' },
              { value: 50, title: '50' },
              { value: -1, title: 'Todos' },
            ]"
          >
            <template #[`item.evento`]="{ item }">
              <div>
                <div class="font-weight-medium">
                  {{ getEventoNome(item.evento) }}
                </div>
                <div v-if="item.observacao" class="text-caption text-medium-emphasis">
                  {{ item.observacao }}
                </div>
              </div>
            </template>

            <template #[`item.valor`]="{ item }">
              <div class="d-flex flex-column align-end">
                <v-chip
                  :color="getValorColor(item.valor)"
                  variant="tonal"
                  size="small"
                  class="font-weight-bold mb-1"
                >
                  {{ formatCurrency(item.valor) }}
                </v-chip>
                <div v-if="detalhesFiltrados(item.valores_detalhados).length" class="d-flex flex-wrap justify-end ga-1 mt-1">
                  <v-chip
                    v-for="d in detalhesFiltrados(item.valores_detalhados)"
                    :key="d.label"
                    size="x-small"
                    variant="outlined"
                  >
                    {{ d.quantidade }}× {{ d.label }}
                  </v-chip>
                </div>
              </div>
            </template>

            <template #[`item.data_entrada`]="{ item }">
              <span class="text-body-2">{{ formatDate(item.data_entrada) }}</span>
            </template>

            <template #[`item.acoes`]="{ item }">
              <div class="d-flex justify-end ga-1">
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  color="primary"
                  :to="`/admin/ofertorio/${item.id}`"
                />
                <v-btn
                  icon="mdi-archive-arrow-down-outline"
                  size="small"
                  variant="text"
                  color="error"
                  @click="confirmarArquivar(item)"
                />
              </div>
            </template>

            <template #loading>
              <div class="d-flex justify-center align-center pa-8">
                <v-progress-circular indeterminate color="primary" size="40" width="4" />
                <span class="ml-4 text-body-1">Carregando ofertas...</span>
              </div>
            </template>

            <template #no-data>
              <div class="text-center pa-8">
                <v-icon color="grey-lighten-1" size="64" class="mb-4">
                  mdi-database-off
                </v-icon>
                <h3 class="text-h6 text-medium-emphasis mb-2">
                  Nenhuma oferta encontrada
                </h3>
                <p class="text-body-2 text-medium-emphasis mb-4">
                  Não há registros de ofertas financeiras no momento.
                </p>
                <v-btn
                  to="/admin/ofertorio/add"
                  color="primary"
                  variant="elevated"
                  prepend-icon="mdi-plus"
                >
                  Registrar primeira oferta
                </v-btn>
              </div>
            </template>

            <template #bottom>
              <div class="d-flex justify-center pa-4">
                <div class="text-body-2 text-medium-emphasis">
                  Total de {{ ofertasFiltradas.length }} {{ ofertasFiltradas.length === 1 ? 'oferta' : 'ofertas' }} encontradas
                </div>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Dialog: Confirmar arquivamento ────────────────────────────────────── -->
    <v-dialog v-model="confirmDialog" max-width="400">
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon color="error" class="me-2">
            mdi-archive-arrow-down-outline
          </v-icon>
          <span class="text-h6">Arquivar Oferta</span>
        </v-card-title>
        <v-card-text class="pa-4">
          Esta oferta será arquivada e não aparecerá mais na listagem. A operação pode ser revertida pelo Directus.
        </v-card-text>
        <v-card-actions class="pa-3 justify-end ga-2">
          <v-btn variant="text" @click="confirmDialog = false">
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            variant="tonal"
            prepend-icon="mdi-archive-arrow-down-outline"
            :loading="arquivando"
            @click="arquivarOferta"
          >
            Arquivar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Versão de impressão -->
    <PrintReportLayout
      v-if="ofertasFiltradas.length > 0"
      class="d-none d-print-block mt-8"
      title="Relatório de Ofertório"
      subtitle="Conferência dos lançamentos financeiros do ofertório"
      :period-label="periodoFiltroLabel"
      :generated-at-label="generatedAtLabel"
      footer-note="São José, rogai por nós."
    >
      <section class="report-card ofertorio-print-card">
        <PrintReportSectionTitle title="Lançamentos do período" />

        <div class="pa-4">
          <table class="report-table ofertorio-print-table mt-2 w-100">
            <thead>
              <tr>
                <th class="text-start">
                  Evento
                </th>
                <th class="text-center">
                  Data
                </th>
                <th class="text-start">
                  Moedas / Cédulas
                </th>
                <th class="text-start">
                  Observação
                </th>
                <th class="text-end">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, i) in ofertasFiltradas"
                :key="`print-${item.id}`"
                class="data-row"
                :class="i % 2 === 0 ? 'ofertorio-print-row-even' : 'ofertorio-print-row-odd'"
              >
                <td class="py-1">
                  {{ getEventoNome(item.evento) }}
                </td>
                <td class="py-1 text-center">
                  {{ formatDate(item.data_entrada) }}
                </td>
                <td class="py-1 text-caption">
                  {{ formatarDetalhesTexto(item.valores_detalhados) }}
                </td>
                <td class="py-1 text-caption">
                  {{ item.observacao || '' }}
                </td>
                <td class="py-1 text-end font-weight-bold">
                  {{ formatCurrency(item.valor) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="4" class="text-end font-weight-bold">
                  Total geral
                </td>
                <td class="text-end font-weight-black text-success-print">
                  {{ formatCurrency(totalValorOfertas) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </PrintReportLayout>
  </v-container>
</template>

<style scoped>
@media print {
  .ofertorio-print-row-even {
    background-color: #fdf6ec !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .ofertorio-print-row-odd {
    background-color: #fff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
