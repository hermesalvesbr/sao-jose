<script setup lang="ts">
import { useDisplay } from 'vuetify'

definePageMeta({
  layout: 'admin',
})

const { mobile } = useDisplay()
const { user } = useAuth()
const { ofertas, loading: ofertasLoading, fetchOfertas } = useOfertas()
const { estatisticas, loading: dizimosLoading, fetchDizimistas, fetchPagamentos } = useDizimos()

// Computed values para estatísticas
const ofertasHoje = computed(() => {
  const hoje = new Date().toDateString()
  return ofertas.value.filter(oferta =>
    new Date(oferta.data_entrada).toDateString() === hoje,
  ).reduce((total, oferta) => total + (Number(oferta.valor) || 0), 0)
})

const ofertasEsteAno = computed(() => {
  const anoAtual = new Date().getFullYear()
  return ofertas.value.filter(oferta =>
    new Date(oferta.data_entrada).getFullYear() === anoAtual,
  ).reduce((total, oferta) => total + (Number(oferta.valor) || 0), 0)
})

const saudacao = computed(() => {
  const hora = new Date().getHours()
  if (hora < 12)
    return 'Bom dia'
  if (hora < 18)
    return 'Boa tarde'
  return 'Boa noite'
})

const loading = computed(() => ofertasLoading.value || dizimosLoading.value)

// Função para formatar valores em reais
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Buscar dados ao montar o componente
onMounted(async () => {
  await Promise.all([
    fetchOfertas(),
    fetchDizimistas(),
    fetchPagamentos(),
  ])
})
</script>

<template>
  <v-container fluid class="pa-4">
    <!-- Saudação personalizada -->
    <div class="text-h5 text-lg-h4 font-weight-light mb-6">
      {{ saudacao }}, {{ user?.first_name || 'Administrador' }}! 👋
    </div>

    <!-- Cards de estatísticas principais -->
    <v-row>
      <!-- Card Ofertório Hoje -->
      <v-col cols="12" sm="6" lg="3">
        <v-card
          variant="elevated"
          :loading="loading"
          class="pa-4"
          color="primary"
          theme="dark"
        >
          <div class="d-flex align-center">
            <v-avatar size="48" color="primary-lighten-2" class="me-4">
              <v-icon size="28">
                mdi-cash-multiple
              </v-icon>
            </v-avatar>
            <div class="flex-grow-1">
              <div class="text-body-2 text-primary-lighten-3">
                Hoje
              </div>
              <div class="text-h6 font-weight-bold">
                {{ formatCurrency(ofertasHoje) }}
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Card Dízimos Mensais -->
      <v-col cols="12" sm="6" lg="3">
        <v-card
          variant="elevated"
          :loading="loading"
          class="pa-4"
          color="secondary"
          theme="dark"
        >
          <div class="d-flex align-center">
            <v-avatar size="48" color="secondary-lighten-2" class="me-4">
              <v-icon size="28">
                mdi-account-cash
              </v-icon>
            </v-avatar>
            <div class="flex-grow-1">
              <div class="text-body-2 text-secondary-lighten-3">
                Dízimo Mensal
              </div>
              <div class="text-h6 font-weight-bold">
                {{ formatCurrency(estatisticas.valorMensalTotal) }}
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Card Total Dizimistas -->
      <v-col cols="12" sm="6" lg="3">
        <v-card
          variant="elevated"
          :loading="loading"
          class="pa-4"
          color="success"
          theme="dark"
        >
          <div class="d-flex align-center">
            <v-avatar size="48" color="success-lighten-2" class="me-4">
              <v-icon size="28">
                mdi-account-group
              </v-icon>
            </v-avatar>
            <div class="flex-grow-1">
              <div class="text-body-2 text-success-lighten-3">
                Dizimistas
              </div>
              <div class="text-h6 font-weight-bold">
                {{ estatisticas.totalDizimistas }}
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Card Ofertório Anual -->
      <v-col cols="12" sm="6" lg="3">
        <v-card
          variant="elevated"
          :loading="loading"
          class="pa-4"
          color="info"
          theme="dark"
        >
          <div class="d-flex align-center">
            <v-avatar size="48" color="info-lighten-2" class="me-4">
              <v-icon size="28">
                mdi-chart-line
              </v-icon>
            </v-avatar>
            <div class="flex-grow-1">
              <div class="text-body-2 text-info-lighten-3">
                Este Ano
              </div>
              <div class="text-h6 font-weight-bold">
                {{ formatCurrency(ofertasEsteAno) }}
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Cards de resumo detalhado -->
    <v-row class="mt-4">
      <!-- Card Resumo Dízimos -->
      <v-col cols="12" :md="mobile ? 12 : 6">
        <v-card variant="outlined" class="h-100">
          <v-card-item>
            <v-card-title class="d-flex align-center">
              <v-icon class="me-2" color="secondary">
                mdi-account-cash
              </v-icon>
              Resumo de Dízimos
            </v-card-title>
          </v-card-item>

          <v-card-text>
            <v-list density="compact" class="bg-transparent">
              <v-list-item>
                <template #prepend>
                  <v-icon color="success">
                    mdi-check-circle
                  </v-icon>
                </template>
                <v-list-item-title>Total de Dizimistas</v-list-item-title>
                <template #append>
                  <v-chip color="success" size="small">
                    {{ estatisticas.totalDizimistas }}
                  </v-chip>
                </template>
              </v-list-item>

              <v-divider />

              <v-list-item>
                <template #prepend>
                  <v-icon color="primary">
                    mdi-calendar-month
                  </v-icon>
                </template>
                <v-list-item-title>Receita Mensal Esperada</v-list-item-title>
                <template #append>
                  <v-chip color="primary" size="small">
                    {{ formatCurrency(estatisticas.valorMensalTotal) }}
                  </v-chip>
                </template>
              </v-list-item>

              <v-divider />

              <v-list-item>
                <template #prepend>
                  <v-icon color="info">
                    mdi-chart-bar
                  </v-icon>
                </template>
                <v-list-item-title>Total Recebido ({{ new Date().getFullYear() }})</v-list-item-title>
                <template #append>
                  <v-chip color="info" size="small">
                    {{ formatCurrency(estatisticas.totalRecebidoAno) }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>

          <v-card-actions>
            <v-btn
              variant="text"
              color="secondary"
              to="/admin/dizimos"
              append-icon="mdi-arrow-right"
            >
              Gerenciar Dízimos
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Card Resumo Ofertório -->
      <v-col cols="12" :md="mobile ? 12 : 6">
        <v-card variant="outlined" class="h-100">
          <v-card-item>
            <v-card-title class="d-flex align-center">
              <v-icon class="me-2" color="primary">
                mdi-cash-multiple
              </v-icon>
              Resumo do Ofertório
            </v-card-title>
          </v-card-item>

          <v-card-text>
            <v-list density="compact" class="bg-transparent">
              <v-list-item>
                <template #prepend>
                  <v-icon color="warning">
                    mdi-calendar-today
                  </v-icon>
                </template>
                <v-list-item-title>Ofertas Hoje</v-list-item-title>
                <template #append>
                  <v-chip color="warning" size="small">
                    {{ formatCurrency(ofertasHoje) }}
                  </v-chip>
                </template>
              </v-list-item>

              <v-divider />

              <v-list-item>
                <template #prepend>
                  <v-icon color="success">
                    mdi-trending-up
                  </v-icon>
                </template>
                <v-list-item-title>Total do Ano</v-list-item-title>
                <template #append>
                  <v-chip color="success" size="small">
                    {{ formatCurrency(ofertasEsteAno) }}
                  </v-chip>
                </template>
              </v-list-item>

              <v-divider />

              <v-list-item>
                <template #prepend>
                  <v-icon color="info">
                    mdi-chart-line
                  </v-icon>
                </template>
                <v-list-item-title>Registros Totais</v-list-item-title>
                <template #append>
                  <v-chip color="info" size="small">
                    {{ ofertas.length }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>

          <v-card-actions>
            <v-btn
              variant="text"
              color="primary"
              to="/admin/ofertorio"
              append-icon="mdi-arrow-right"
            >
              Ver Ofertório
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Ações rápidas -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-item>
            <v-card-title class="d-flex align-center">
              <v-icon class="me-2" color="primary">
                mdi-lightning-bolt
              </v-icon>
              Ações Rápidas
            </v-card-title>
          </v-card-item>

          <v-card-text>
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-btn
                  block
                  variant="outlined"
                  color="primary"
                  size="large"
                  to="/admin/ofertorio/add"
                  prepend-icon="mdi-plus"
                >
                  Nova Oferta
                </v-btn>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-btn
                  block
                  variant="outlined"
                  color="secondary"
                  size="large"
                  to="/admin/dizimos"
                  prepend-icon="mdi-account-plus"
                >
                  Novo Dizimista
                </v-btn>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-btn
                  block
                  variant="outlined"
                  color="success"
                  size="large"
                  prepend-icon="mdi-refresh"
                  :loading="loading"
                  @click="() => { fetchOfertas(); fetchDizimistas(); fetchPagamentos(); }"
                >
                  Atualizar Dados
                </v-btn>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-btn
                  block
                  variant="outlined"
                  color="info"
                  size="large"
                  to="/aniversariantes"
                  prepend-icon="mdi-cake"
                >
                  Aniversariantes
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
