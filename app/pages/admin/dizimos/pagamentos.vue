<script setup lang="ts">
// Luxon removido

definePageMeta({
  layout: 'admin',
})

const {
  pagamentos,
  loading,
  error,
  fetchPagamentos,
} = useDizimos()

// Estados
const search = useState<string>('dizimos-pagamentos-search', () => '')
const filtroMes = useState<string>('dizimos-pagamentos-mes', () => '')
const filtroAno = useState<string>('dizimos-pagamentos-ano', () => new Date().getFullYear().toString())

// Carrega os pagamentos
onMounted(() => {
  fetchPagamentos()
})

// Computed para filtrar pagamentos
const pagamentosFiltrados = computed(() => {
  let filtered = pagamentos.value

  // Filtro por texto
  if (search.value) {
    filtered = filtered.filter((pagamento: any) => {
      const nome = pagamento.dizimista?.catolico?.nome?.toLowerCase() || ''
      return nome.includes(search.value.toLowerCase())
    })
  }

  // Filtro por ano
  if (filtroAno.value) {
    filtered = filtered.filter((pagamento: any) => {
      if (!pagamento.data_pagamento)
        return false
      const dataValida = new Date(pagamento.data_pagamento)
      if (Number.isNaN(dataValida.getTime()))
        return false
      const ano = dataValida.getFullYear().toString()
      return ano === filtroAno.value
    })
  }

  // Filtro por mês
  if (filtroMes.value) {
    filtered = filtered.filter((pagamento: any) => {
      if (!pagamento.data_pagamento)
        return false
      const dataValida = new Date(pagamento.data_pagamento)
      if (Number.isNaN(dataValida.getTime()))
        return false
      const mes = (dataValida.getMonth() + 1).toString().padStart(2, '0')
      return mes === filtroMes.value
    })
  }

  return filtered
})

// Headers da tabela
const headers = [
  { title: 'Dizimista', key: 'dizimista.catolico.nome', sortable: true },
  { title: 'Valor Pago', key: 'valor_pago', sortable: true },
  { title: 'Meio', key: 'meio', sortable: true },
  { title: 'Data Pagamento', key: 'data_pagamento', sortable: true },
]

// Opções para filtros
const meses = [
  { value: '', title: 'Todos os meses' },
  { value: '01', title: 'Janeiro' },
  { value: '02', title: 'Fevereiro' },
  { value: '03', title: 'Março' },
  { value: '04', title: 'Abril' },
  { value: '05', title: 'Maio' },
  { value: '06', title: 'Junho' },
  { value: '07', title: 'Julho' },
  { value: '08', title: 'Agosto' },
  { value: '09', title: 'Setembro' },
  { value: '10', title: 'Outubro' },
  { value: '11', title: 'Novembro' },
  { value: '12', title: 'Dezembro' },
]

const anos = computed(() => {
  const anosDisponiveis = new Set<string>()
  pagamentos.value.forEach((pagamento: any) => {
    if (pagamento.data_pagamento) {
      const ano = new Date(pagamento.data_pagamento).getFullYear().toString()
      if (!Number.isNaN(Number(ano))) {
        anosDisponiveis.add(ano)
      }
    }
  })
  return [...anosDisponiveis].toSorted().reverse().map((ano: string) => ({
    value: ano,
    title: ano,
  }))
})

// Estatísticas dos pagamentos filtrados
const estatisticas = computed(() => {
  const totalPagamentos = pagamentosFiltrados.value.length
  const valorTotal = pagamentosFiltrados.value.reduce((sum: number, pagamento: any) => {
    const valor = Number(pagamento.valor_pago) || 0
    return sum + valor
  }, 0)

  return {
    totalPagamentos,
    valorTotal: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valorTotal),
  }
})

// Função para formatar data
function formatarData(data: string) {
  if (!data)
    return ''
  // Assume que data é algo como "YYYY-MM-DD" ou Data ISO completa
  const dataCorte = data.substring(0, 10)
  const [y, m, d] = dataCorte.split('-')
  return `${d}/${m}/${y}`
}

// Função para formatar valor
function formatarValor(valor: number | string | undefined) {
  const numeroValor = Number(valor) || 0
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numeroValor)
}

// Função para cor do chip do meio de pagamento
function corMeioPagamento(meio: string) {
  switch (meio) {
    case 'dinheiro': return 'success'
    case 'pix': return 'purple'
    case 'credito': return 'blue'
    case 'transferencia': return 'teal'
    default: return 'grey'
  }
}

const labelMeio: Record<string, string> = {
  dinheiro: 'Dinheiro em espécie',
  pix: 'Pix',
  credito: 'Cartão de crédito',
  transferencia: 'Transferência',
}

function printList() {
  window.print()
}

const periodLabel = computed(() => {
  const mes = meses.find(item => item.value === filtroMes.value)?.title
  if (filtroMes.value && filtroAno.value && mes)
    return `${mes} de ${filtroAno.value}`
  if (filtroAno.value)
    return `Ano de ${filtroAno.value}`
  return 'Todos os registros'
})

const generatedAtLabel = computed(() => {
  return `Gerado em ${new Date().toLocaleDateString('pt-BR')}`
})
</script>

<template>
  <v-container fluid class="pa-2 pa-md-6">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between mb-4 mb-sm-6 no-print">
      <div>
        <div class="d-flex align-center mb-2">
          <v-btn
            variant="text"
            icon="mdi-arrow-left"
            class="me-2"
            to="/admin/dizimos"
          />
          <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
            Histórico de Pagamentos
          </h1>
        </div>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0 ms-11">
          Visualize todos os pagamentos de dízimos registrados
        </p>
      </div>

      <div class="d-flex ga-2 mt-3 mt-sm-0 d-print-none">
        <v-btn
          variant="tonal"
          color="info"
          prepend-icon="mdi-printer"
          @click="printList"
        >
          Imprimir
        </v-btn>
        <v-btn
          variant="elevated"
          color="success"
          prepend-icon="mdi-cash-plus"
          to="/admin/dizimos/registrar-pagamento"
        >
          Novo Pagamento
        </v-btn>
      </div>
    </div>

    <!-- Alerta de Erro -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      closable
      class="mb-4 no-print"
    >
      {{ error }}
    </v-alert>

    <!-- Cards de Estatísticas -->
    <v-row class="mb-6 no-print">
      <v-col cols="12" md="6">
        <v-card
          variant="elevated"
          elevation="2"
          class="h-100"
        >
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  Total de Pagamentos
                </p>
                <h3 class="text-h4 font-weight-bold text-primary">
                  {{ estatisticas.totalPagamentos }}
                </h3>
              </div>
              <v-icon
                size="40"
                color="primary"
                class="text-medium-emphasis"
              >
                mdi-calendar-check
              </v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card
          variant="elevated"
          elevation="2"
          class="h-100"
        >
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  Valor Total
                </p>
                <h3 class="text-h6 text-md-h5 font-weight-bold text-success">
                  {{ estatisticas.valorTotal }}
                </h3>
              </div>
              <v-icon
                size="40"
                color="success"
                class="text-medium-emphasis"
              >
                mdi-cash-multiple
              </v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Card com a tabela -->
    <v-card
      variant="elevated"
      elevation="2"
      rounded="lg"
      class="no-print"
    >
      <v-card-title class="d-flex align-center justify-space-between pa-4">
        <div class="d-flex align-center">
          <v-icon class="me-2" color="success">
            mdi-cash-clock
          </v-icon>
          <span class="text-h6">Pagamentos Registrados</span>
        </div>
      </v-card-title>

      <v-divider />

      <!-- Filtros -->
      <v-card-text class="pa-4 pb-0">
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Pesquisar por nome do dizimista"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>

          <v-col cols="6" md="3">
            <v-select
              v-model="filtroMes"
              :items="meses"
              label="Mês"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>

          <v-col cols="6" md="3">
            <v-select
              v-model="filtroAno"
              :items="anos"
              label="Ano"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>
        </v-row>
      </v-card-text>

      <!-- Tabela -->
      <v-data-table
        :headers="headers"
        :items="pagamentosFiltrados"
        :loading="loading"
        loading-text="Carregando pagamentos..."
        no-data-text="Nenhum pagamento encontrado"
        items-per-page-text="Itens por página:"
        density="comfortable"
        hover
        class="ma-4 mt-0"
      >
        <!-- Slot para dizimista -->
        <template #[`item.dizimista.catolico.nome`]="{ item }">
          <div class="d-flex align-center">
            <v-avatar
              color="primary"
              variant="tonal"
              size="32"
              class="me-3"
            >
              <v-icon size="16">
                mdi-account
              </v-icon>
            </v-avatar>
            <div class="font-weight-medium">
              {{ item.dizimista?.catolico?.nome || 'Nome não disponível' }}
            </div>
          </div>
        </template>

        <!-- Slot para valor -->
        <template #[`item.valor_pago`]="{ item }">
          <v-chip
            color="success"
            variant="tonal"
            size="small"
          >
            {{ formatarValor(item.valor_pago) }}
          </v-chip>
        </template>

        <!-- Slot para meio -->
        <template #[`item.meio`]="{ item }">
          <v-chip
            :color="corMeioPagamento(item.meio)"
            variant="tonal"
            size="small"
          >
            {{ labelMeio[item.meio] ?? item.meio }}
          </v-chip>
        </template>

        <!-- Slot para data -->
        <template #[`item.data_pagamento`]="{ item }">
          <span class="text-body-2">
            {{ formatarData(item.data_pagamento) }}
          </span>
        </template>
      </v-data-table>
    </v-card>

    <PrintReportLayout
      class="d-none d-print-block mt-8"
      title="Relatório de Pagamentos de Dízimos"
      subtitle="Histórico de pagamentos registrados"
      :period-label="periodLabel"
      :generated-at-label="generatedAtLabel"
    >
      <section>
        <PrintReportSectionTitle title="Pagamentos do período" />
        <div class="pa-4">
          <table class="report-table">
            <thead>
              <tr>
                <th class="text-start">
                  Dizimista
                </th>
                <th class="text-end">
                  Valor pago
                </th>
                <th class="text-start">
                  Meio
                </th>
                <th class="text-center">
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in pagamentosFiltrados" :key="item.id" class="data-row">
                <td>{{ item.dizimista?.catolico?.nome || 'Nome não disponível' }}</td>
                <td class="text-end">
                  {{ formatarValor(item.valor_pago) }}
                </td>
                <td>{{ labelMeio[item.meio] ?? item.meio }}</td>
                <td class="text-center">
                  {{ formatarData(item.data_pagamento) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td class="text-end font-weight-bold" colspan="3">
                  Total
                </td>
                <td class="text-center font-weight-bold">
                  {{ estatisticas.valorTotal }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </PrintReportLayout>
  </v-container>
</template>
