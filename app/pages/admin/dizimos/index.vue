<script setup lang="ts">
import { DateTime } from 'luxon'

definePageMeta({
  layout: 'admin',
})

const {
  pagamentos,
  loading,
  error,
  estatisticas,
  fetchDizimistas,
  fetchPagamentos,
} = useDizimos()

// Carrega os dados ao montar o componente
onMounted(async () => {
  await Promise.all([
    fetchDizimistas(),
    fetchPagamentos(),
  ])
})

// Computed para formatação de dados
const estatisticasFormatadas = computed(() => {
  return {
    totalDizimistas: estatisticas.value.totalDizimistas,
    valorMensalTotal: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(estatisticas.value.valorMensalTotal),
    totalRecebidoAno: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(estatisticas.value.totalRecebidoAno),
    pagamentosEsteAno: estatisticas.value.pagamentosEsteAno,
  }
})

// Últimos pagamentos para exibir no dashboard
const ultimosPagamentos = computed(() => {
  return pagamentos.value.slice(0, 5).map((pagamento: any) => ({
    ...pagamento,
    dataFormatada: DateTime.fromISO(pagamento.data_pagamento).toFormat('dd/MM/yyyy'),
    valorFormatado: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(pagamento.valor_pago),
  }))
})
</script>

<template>
  <v-container fluid class="pa-4">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 text-sm-h3 font-weight-bold text-primary mb-1">
          Gestão de Dízimos
        </h1>
        <p class="text-body-1 text-medium-emphasis">
          Gerencie dizimistas e acompanhe os pagamentos
        </p>
      </div>

      <div class="d-flex flex-column flex-sm-row ga-2 mt-4 mt-sm-0">
        <v-btn
          color="primary"
          variant="elevated"
          prepend-icon="mdi-account-plus"
          to="/admin/dizimos/novo-dizimista"
          class="text-none"
        >
          Novo Dizimista
        </v-btn>
        <v-btn
          color="success"
          variant="elevated"
          prepend-icon="mdi-cash-plus"
          to="/admin/dizimos/registrar-pagamento"
          class="text-none"
        >
          Registrar Pagamento
        </v-btn>
      </div>
    </div>

    <!-- Loading State -->
    <v-progress-linear
      v-if="loading"
      indeterminate
      color="primary"
      class="mb-4"
    />

    <!-- Error State -->
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
                  {{ estatisticasFormatadas.totalDizimistas }}
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
                  {{ estatisticasFormatadas.valorMensalTotal }}
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
                  Recebido em {{ new Date().getFullYear() }}
                </p>
                <h3 class="text-h6 text-md-h5 font-weight-bold text-info">
                  {{ estatisticasFormatadas.totalRecebidoAno }}
                </h3>
              </div>
              <v-icon
                size="40"
                color="info"
                class="text-medium-emphasis"
              >
                mdi-chart-line
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
                  Pagamentos em {{ new Date().getFullYear() }}
                </p>
                <h3 class="text-h4 font-weight-bold text-warning">
                  {{ estatisticasFormatadas.pagamentosEsteAno }}
                </h3>
              </div>
              <v-icon
                size="40"
                color="warning"
                class="text-medium-emphasis"
              >
                mdi-calendar-check
              </v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Seção Principal -->
    <v-row>
      <!-- Ações Rápidas -->
      <v-col cols="12" md="4">
        <v-card
          variant="elevated"
          elevation="2"
          class="h-100"
        >
          <v-card-title class="d-flex align-center pa-4">
            <v-icon class="me-2" color="primary">
              mdi-lightning-bolt
            </v-icon>
            <span class="text-h6">Ações Rápidas</span>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-4">
            <v-list density="compact" class="py-0">
              <v-list-item
                to="/admin/dizimos/lista"
                prepend-icon="mdi-format-list-bulleted"
                title="Ver Todos os Dizimistas"
                subtitle="Listar e gerenciar dizimistas"
                class="mb-2"
                rounded="lg"
              />

              <v-list-item
                to="/admin/dizimos/pagamentos"
                prepend-icon="mdi-history"
                title="Histórico de Pagamentos"
                subtitle="Ver todos os pagamentos registrados"
                class="mb-2"
                rounded="lg"
              />

              <v-list-item
                to="/admin/dizimos/relatorios"
                prepend-icon="mdi-chart-box"
                title="Relatórios"
                subtitle="Gerar relatórios de dízimos"
                class="mb-2"
                rounded="lg"
              />

              <v-list-item
                href="#"
                prepend-icon="mdi-download"
                title="Exportar Dados"
                subtitle="Baixar planilha com dados"
                class="mb-2"
                rounded="lg"
                @click="() => {}"
              />
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Últimos Pagamentos -->
      <v-col cols="12" md="8">
        <v-card
          variant="elevated"
          elevation="2"
          class="h-100"
        >
          <v-card-title class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center">
              <v-icon class="me-2" color="success">
                mdi-cash-clock
              </v-icon>
              <span class="text-h6">Últimos Pagamentos</span>
            </div>

            <v-btn
              variant="text"
              size="small"
              to="/admin/dizimos/pagamentos"
              class="text-none"
            >
              Ver Todos
            </v-btn>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-0">
            <v-list
              v-if="ultimosPagamentos.length > 0"
              density="comfortable"
              class="py-0"
            >
              <v-list-item
                v-for="pagamento in ultimosPagamentos"
                :key="pagamento.id"
                class="border-b"
              >
                <template #prepend>
                  <v-avatar
                    size="40"
                    color="success"
                    variant="tonal"
                  >
                    <v-icon>mdi-cash</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-medium">
                  {{ pagamento.dizimista?.catolico?.nome || 'Dizimista' }}
                </v-list-item-title>

                <v-list-item-subtitle class="d-flex flex-column flex-sm-row ga-1">
                  <span>{{ pagamento.dataFormatada }}</span>
                  <span class="text-high-emphasis">{{ pagamento.valorFormatado }}</span>
                </v-list-item-subtitle>

                <template #append>
                  <v-chip
                    :color="pagamento.meio === 'Dinheiro' ? 'success' : 'primary'"
                    variant="tonal"
                    size="small"
                    class="text-caption"
                  >
                    {{ pagamento.meio }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>

            <div
              v-else
              class="text-center py-8"
            >
              <v-icon
                size="64"
                color="grey-lighten-1"
                class="mb-4"
              >
                mdi-cash-off
              </v-icon>
              <p class="text-body-1 text-medium-emphasis">
                Nenhum pagamento registrado ainda
              </p>
              <v-btn
                color="primary"
                variant="tonal"
                to="/admin/dizimos/registrar-pagamento"
                class="mt-4 text-none"
              >
                Registrar Primeiro Pagamento
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.border-b {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.border-b:last-child {
  border-bottom: none;
}
</style>
