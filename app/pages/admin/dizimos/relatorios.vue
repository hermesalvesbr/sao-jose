<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

const {
  dizimistas,
  pagamentos,
  loading,
  error,
  fetchDizimistas,
  fetchPagamentos,
} = useDizimos()

// Estados para filtros de relatório
const anoSelecionado = ref(new Date().getFullYear().toString())
const mesSelecionado = ref('')

// Carrega os dados
onMounted(async () => {
  await Promise.all([
    fetchDizimistas(),
    fetchPagamentos(),
  ])
})

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
    const ano = new Date(pagamento.data_pagamento).getFullYear().toString()
    anosDisponiveis.add(ano)
  })

  // Adiciona o ano atual se não existir
  anosDisponiveis.add(new Date().getFullYear().toString())

  return Array.from(anosDisponiveis).sort().reverse().map(ano => ({
    value: ano,
    title: ano,
  }))
})

// Computeds para estatísticas do período selecionado
const estatisticasPeriodo = computed(() => {
  let pagamentosFiltrados = pagamentos.value

  // Filtro por ano
  if (anoSelecionado.value) {
    pagamentosFiltrados = pagamentosFiltrados.filter((pagamento: any) => {
      const ano = new Date(pagamento.data_pagamento).getFullYear().toString()
      return ano === anoSelecionado.value
    })
  }

  // Filtro por mês
  if (mesSelecionado.value) {
    pagamentosFiltrados = pagamentosFiltrados.filter((pagamento: any) => {
      const mes = (new Date(pagamento.data_pagamento).getMonth() + 1).toString().padStart(2, '0')
      return mes === mesSelecionado.value
    })
  }

  const totalPagamentos = pagamentosFiltrados.length
  const valorTotal = pagamentosFiltrados.reduce((sum: number, pagamento: any) => {
    return sum + (pagamento.valor_pago || 0)
  }, 0)

  // Estatísticas por meio de pagamento
  const porMeio = pagamentosFiltrados.reduce((acc: any, pagamento: any) => {
    const meio = pagamento.meio || 'Não informado'
    if (!acc[meio]) {
      acc[meio] = { quantidade: 0, valor: 0 }
    }
    acc[meio].quantidade++
    acc[meio].valor += pagamento.valor_pago || 0
    return acc
  }, {})

  return {
    totalPagamentos,
    valorTotal,
    valorTotalFormatado: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valorTotal),
    porMeio,
  }
})

// Estatísticas gerais dos dizimistas
const estatisticasDizimistas = computed(() => {
  const totalDizimistas = dizimistas.value.length
  const valorMensalTotal = dizimistas.value.reduce((sum: number, dizimista: any) => {
    return sum + (dizimista.valor_mensal || 0)
  }, 0)

  const valorMensalTotalFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valorMensalTotal)

  return {
    totalDizimistas,
    valorMensalTotal,
    valorMensalTotalFormatado,
  }
})

// Função para formatar valor
function formatarValor(valor: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

// Função para cor do chip do meio de pagamento
function corMeioPagamento(meio: string) {
  switch (meio) {
    case 'Dinheiro': return 'success'
    case 'Pix': return 'purple'
    case 'Cartão de Crédito': return 'blue'
    case 'Cartão de Débito': return 'indigo'
    case 'Transferência Bancária': return 'teal'
    case 'Cheque': return 'orange'
    default: return 'grey'
  }
}

// Nome do período selecionado
const nomePeriodo = computed(() => {
  if (mesSelecionado.value) {
    const nomesMeses = {
      '01': 'Janeiro',
      '02': 'Fevereiro',
      '03': 'Março',
      '04': 'Abril',
      '05': 'Maio',
      '06': 'Junho',
      '07': 'Julho',
      '08': 'Agosto',
      '09': 'Setembro',
      '10': 'Outubro',
      '11': 'Novembro',
      '12': 'Dezembro',
    }
    return `${nomesMeses[mesSelecionado.value as keyof typeof nomesMeses]} de ${anoSelecionado.value}`
  }
  return `Ano de ${anoSelecionado.value}`
})

// Navegar de volta
function voltar() {
  navigateTo('/admin/dizimos')
}
</script>

<template>
  <v-container fluid class="pa-4">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between mb-6">
      <div>
        <div class="d-flex align-center mb-2">
          <v-btn
            variant="text"
            icon="mdi-arrow-left"
            class="me-2"
            @click="voltar"
          />
          <h1 class="text-h4 text-sm-h3 font-weight-bold text-primary">
            Relatórios de Dízimos
          </h1>
        </div>
        <p class="text-body-1 text-medium-emphasis">
          Visualize estatísticas e relatórios dos dízimos
        </p>
      </div>
    </div>

    <!-- Alerta de Erro -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
    >
      {{ error }}
    </v-alert>

    <!-- Loading State -->
    <v-progress-linear
      v-if="loading"
      indeterminate
      color="primary"
      class="mb-4"
    />

    <!-- Filtros de Período -->
    <v-card
      variant="elevated"
      elevation="2"
      rounded="lg"
      class="mb-6"
    >
      <v-card-title class="d-flex align-center pa-4">
        <v-icon class="me-2" color="primary">
          mdi-filter
        </v-icon>
        <span class="text-h6">Filtros do Relatório</span>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="anoSelecionado"
              :items="anos"
              label="Ano"
              variant="outlined"
              prepend-inner-icon="mdi-calendar"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="mesSelecionado"
              :items="meses"
              label="Mês (opcional)"
              variant="outlined"
              prepend-inner-icon="mdi-calendar-month"
              clearable
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Estatísticas Gerais -->
    <v-row class="mb-6">
      <v-col cols="12">
        <h2 class="text-h5 font-weight-bold text-primary mb-4">
          Estatísticas Gerais
        </h2>
      </v-col>

      <v-col cols="12" sm="6" lg="3">
        <v-card
          variant="elevated"
          elevation="2"
          class="h-100"
        >
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  Total de Dizimistas
                </p>
                <h3 class="text-h4 font-weight-bold text-primary">
                  {{ estatisticasDizimistas.totalDizimistas }}
                </h3>
              </div>
              <v-icon
                size="40"
                color="primary"
                class="text-medium-emphasis"
              >
                mdi-account-group
              </v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" lg="3">
        <v-card
          variant="elevated"
          elevation="2"
          class="h-100"
        >
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  Valor Mensal Total
                </p>
                <h3 class="text-h6 text-md-h5 font-weight-bold text-success">
                  {{ estatisticasDizimistas.valorMensalTotalFormatado }}
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

      <v-col cols="12" sm="6" lg="3">
        <v-card
          variant="elevated"
          elevation="2"
          class="h-100"
        >
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  Pagamentos em {{ nomePeriodo }}
                </p>
                <h3 class="text-h4 font-weight-bold text-info">
                  {{ estatisticasPeriodo.totalPagamentos }}
                </h3>
              </div>
              <v-icon
                size="40"
                color="info"
                class="text-medium-emphasis"
              >
                mdi-calendar-check
              </v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" lg="3">
        <v-card
          variant="elevated"
          elevation="2"
          class="h-100"
        >
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  Valor Recebido em {{ nomePeriodo }}
                </p>
                <h3 class="text-h6 text-md-h5 font-weight-bold text-warning">
                  {{ estatisticasPeriodo.valorTotalFormatado }}
                </h3>
              </div>
              <v-icon
                size="40"
                color="warning"
                class="text-medium-emphasis"
              >
                mdi-cash-clock
              </v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Relatório por Meio de Pagamento -->
    <v-row>
      <v-col cols="12">
        <v-card
          variant="elevated"
          elevation="2"
          rounded="lg"
        >
          <v-card-title class="d-flex align-center pa-4">
            <v-icon class="me-2" color="primary">
              mdi-chart-pie
            </v-icon>
            <span class="text-h6">Pagamentos por Meio em {{ nomePeriodo }}</span>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-4">
            <div v-if="Object.keys(estatisticasPeriodo.porMeio).length === 0" class="text-center py-8">
              <v-icon
                size="64"
                color="grey-lighten-1"
                class="mb-4"
              >
                mdi-chart-pie
              </v-icon>
              <p class="text-body-1 text-medium-emphasis">
                Nenhum pagamento encontrado no período selecionado
              </p>
            </div>

            <v-row v-else>
              <v-col
                v-for="(dados, meio) in estatisticasPeriodo.porMeio"
                :key="meio"
                cols="12"
                sm="6"
                md="4"
              >
                <v-card variant="tonal" class="h-100">
                  <v-card-text class="pa-4">
                    <div class="d-flex align-center justify-space-between mb-3">
                      <v-chip
                        :color="corMeioPagamento(String(meio))"
                        variant="elevated"
                        size="small"
                      >
                        {{ meio }}
                      </v-chip>
                      <span class="text-h6 font-weight-bold">
                        {{ dados.quantidade }}
                      </span>
                    </div>

                    <div class="text-center">
                      <p class="text-caption text-medium-emphasis mb-1">
                        Valor Total
                      </p>
                      <p class="text-h6 font-weight-bold text-success">
                        {{ formatarValor(dados.valor) }}
                      </p>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
