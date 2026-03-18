<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

const {
  dizimistas,
  loading,
  error,
  fetchDizimistas,
  registrarPagamento,
} = useDizimos()

// Carrega os dizimistas
onMounted(() => {
  fetchDizimistas()
})

// Formulário
const hoje = new Date()
const form = ref({
  dizimista: '',
  valor_pago: undefined as number | undefined,
  meio: 'dinheiro',
  data_pagamento: `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`,
})

// Converte DD/MM/YYYY → YYYY-MM-DD para o Directus
function dataParaISO(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split('/')
  return `${y}-${m}-${d}`
}

// Estados do formulário
const isSubmitting = ref(false)

// Validação simples
const isFormValid = computed(() => {
  return form.value.dizimista
    && form.value.valor_pago
    && form.value.valor_pago > 0
    && form.value.data_pagamento.length === 10
})

// Lista de dizimistas formatada para o select
const dizimistasOptions = computed(() => {
  return dizimistas.value.map((dizimista: any) => ({
    value: dizimista.id,
    title: dizimista.catolico?.nome || 'Nome não disponível',
    subtitle: `Valor mensal: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dizimista.valor_mensal || 0)}`,
  }))
})

// Opções de meio de pagamento (valores conforme schema Directus)
const meiosPagamento = [
  { title: 'Dinheiro em espécie', value: 'dinheiro' },
  { title: 'Pix', value: 'pix' },
  { title: 'Cartão de crédito', value: 'credito' },
  { title: 'Transferência', value: 'transferencia' },
]

// Função para submeter o formulário
async function submeterFormulario() {
  if (!isFormValid.value)
    return

  isSubmitting.value = true
  try {
    await registrarPagamento({
      dizimista: form.value.dizimista,
      valor_pago: form.value.valor_pago!,
      meio: form.value.meio,
      data_pagamento: dataParaISO(form.value.data_pagamento),
    })
    await navigateTo('/admin/dizimos/pagamentos')
  }
  catch (err) {
    console.error('Erro ao registrar pagamento:', err)
  }
  finally {
    isSubmitting.value = false
  }
}

// Função para preencher valor mensal automaticamente
function preencherValorMensal() {
  const dizimistaSelect = dizimistas.value.find((d: any) => d.id === form.value.dizimista)
  if (dizimistaSelect && dizimistaSelect.valor_mensal) {
    form.value.valor_pago = dizimistaSelect.valor_mensal
  }
}

// Watch para detectar mudança de dizimista
watch(() => form.value.dizimista, () => {
  if (form.value.dizimista && !form.value.valor_pago) {
    preencherValorMensal()
  }
})
</script>

<template>
  <v-container fluid class="pa-2 pa-md-6">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between mb-4 mb-sm-6">
      <div>
        <div class="d-flex align-center mb-2">
          <v-btn
            variant="text"
            icon="mdi-arrow-left"
            class="me-2"
            to="/admin/dizimos"
          />
          <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
            Registrar Pagamento
          </h1>
        </div>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0 ms-11">
          Registre um pagamento de dízimo
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

    <!-- Formulário -->
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card
          variant="elevated"
          elevation="2"
          rounded="lg"
        >
          <v-card-title class="d-flex align-center pa-4">
            <v-icon color="success" class="me-2">
              mdi-cash-plus
            </v-icon>
            <span class="text-h6">Dados do Pagamento</span>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-4">
            <v-form @submit.prevent="submeterFormulario">
              <v-row>
                <v-col cols="12">
                  <v-select
                    v-model="form.dizimista"
                    :items="dizimistasOptions"
                    item-title="title"
                    item-value="value"
                    label="Selecionar Dizimista"
                    placeholder="Escolha o dizimista que está pagando"
                    prepend-inner-icon="mdi-account"
                    variant="outlined"
                    :loading="loading"
                    :disabled="isSubmitting"
                    clearable
                    :no-data-text="dizimistas.length === 0 ? 'Nenhum dizimista cadastrado' : 'Nenhum resultado encontrado'"
                    class="mb-2"
                  />

                  <p class="text-caption text-medium-emphasis mb-4">
                    Apenas dizimistas cadastrados aparecem na lista
                  </p>
                </v-col>

                <v-col cols="12" md="6">
                  <MaskedCurrencyField
                    v-model="form.valor_pago"
                    label="Valor Pago"
                    placeholder="R$ 0,00"
                    prepend-inner-icon="mdi-cash"
                    variant="outlined"
                    :disabled="isSubmitting"
                    class="mb-2"
                  />

                  <v-btn
                    v-if="form.dizimista && !form.valor_pago"
                    variant="text"
                    size="small"
                    color="primary"
                    class="text-none text-caption"
                    @click="preencherValorMensal"
                  >
                    Usar valor mensal
                  </v-btn>
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="form.meio"
                    :items="meiosPagamento"
                    item-title="title"
                    item-value="value"
                    label="Meio de Pagamento"
                    prepend-inner-icon="mdi-credit-card"
                    :disabled="isSubmitting"
                  />
                </v-col>

                <v-col cols="12">
                  <MaskedDateField
                    v-model="form.data_pagamento"
                    label="Data do Pagamento"
                    prepend-inner-icon="mdi-calendar"
                    :disabled="isSubmitting"
                  />
                </v-col>
              </v-row>

              <!-- Ações -->
              <div class="d-flex flex-column flex-sm-row ga-2 mt-6">
                <v-btn
                  type="submit"
                  color="success"
                  variant="elevated"
                  size="large"
                  :loading="isSubmitting"
                  :disabled="!isFormValid || loading"
                  prepend-icon="mdi-content-save"
                  class="text-none flex-grow-1 flex-sm-grow-0"
                >
                  Registrar Pagamento
                </v-btn>

                <v-btn
                  variant="text"
                  size="large"
                  :disabled="isSubmitting"
                  class="text-none flex-grow-1 flex-sm-grow-0"
                  to="/admin/dizimos"
                >
                  Cancelar
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Card com Informações do Dizimista Selecionado -->
    <v-row v-if="form.dizimista" justify="center" class="mt-6">
      <v-col cols="12" md="8" lg="6">
        <v-card
          variant="tonal"
          color="primary"
          rounded="lg"
        >
          <v-card-text class="pa-4">
            <div class="d-flex align-start">
              <v-icon
                color="primary"
                size="24"
                class="me-3 mt-1 flex-shrink-0"
              >
                mdi-account-check
              </v-icon>
              <div>
                <h3 class="text-subtitle-1 font-weight-bold mb-2">
                  Dizimista Selecionado
                </h3>
                <p class="text-body-2 mb-1">
                  <strong>Nome:</strong>
                  {{ dizimistas.find((d: any) => d.id === form.dizimista)?.catolico?.nome || 'Nome não disponível' }}
                </p>
                <p class="text-body-2 mb-0">
                  <strong>Valor mensal:</strong>
                  {{ new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    dizimistas.find((d: any) => d.id === form.dizimista)?.valor_mensal || 0,
                  ) }}
                </p>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
