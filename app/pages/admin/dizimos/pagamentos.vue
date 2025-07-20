<script setup lang="ts">
import { DateTime } from 'luxon'

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
const search = ref('')
const filtroMes = ref('')
const filtroAno = ref(new Date().getFullYear().toString())

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
  return Array.from(anosDisponiveis).sort().reverse().map(ano => ({
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
  return DateTime.fromISO(data).toFormat('dd/MM/yyyy')
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
    case 'Dinheiro': return 'success'
    case 'Pix': return 'purple'
    case 'Cartão de Crédito': return 'blue'
    case 'Cartão de Débito': return 'indigo'
    case 'Transferência Bancária': return 'teal'
    case 'Cheque': return 'orange'
    default: return 'grey'
  }
}

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
            Histórico de Pagamentos
          </h1>
        </div>
        <p class="text-body-1 text-medium-emphasis">
          Visualize todos os pagamentos de dízimos registrados
        </p>
      </div>

      <v-btn
        color="success"
        variant="elevated"
        prepend-icon="mdi-cash-plus"
        to="/admin/dizimos/registrar-pagamento"
        class="text-none mt-4 mt-sm-0"
      >
        Novo Pagamento
      </v-btn>
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

    <!-- Cards de Estatísticas -->
    <v-row class="mb-6">
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
            {{ item.meio }}
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
  </v-container>
</template>
