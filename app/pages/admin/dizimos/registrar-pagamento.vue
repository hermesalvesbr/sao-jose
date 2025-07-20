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
const form = ref({
  dizimista: '',
  valor_pago: undefined as number | undefined,
  meio: 'Dinheiro',
  data_pagamento: new Date().toISOString().split('T')[0],
})

// Estados do formulário
const isSubmitting = ref(false)
const showSuccess = ref(false)

// Validação simples
const isFormValid = computed(() => {
  return form.value.dizimista
    && form.value.valor_pago
    && form.value.valor_pago > 0
    && form.value.data_pagamento
})

// Lista de dizimistas formatada para o select
const dizimistasOptions = computed(() => {
  return dizimistas.value.map((dizimista: any) => ({
    value: dizimista.id,
    title: dizimista.catolico?.nome || 'Nome não disponível',
    subtitle: `Valor mensal: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dizimista.valor_mensal || 0)}`,
  }))
})

// Opções de meio de pagamento
const meiosPagamento = [
  'Dinheiro',
  'Pix',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Transferência Bancária',
  'Cheque',
]

// Função para submeter o formulário
async function submeterFormulario() {
  if (!isFormValid.value || !form.value.data_pagamento)
    return

  isSubmitting.value = true
  try {
    await registrarPagamento({
      dizimista: form.value.dizimista,
      valor_pago: form.value.valor_pago!,
      meio: form.value.meio,
      data_pagamento: form.value.data_pagamento,
    })

    // Mostra sucesso e limpa alguns campos
    showSuccess.value = true
    form.value.valor_pago = undefined

    // Esconde mensagem de sucesso após 3 segundos
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
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
            Registrar Pagamento
          </h1>
        </div>
        <p class="text-body-1 text-medium-emphasis">
          Registre um pagamento de dízimo
        </p>
      </div>
    </div>

    <!-- Alerta de Sucesso -->
    <v-alert
      v-if="showSuccess"
      type="success"
      variant="tonal"
      closable
      class="mb-4"
      @click:close="showSuccess = false"
    >
      <v-alert-title>Sucesso!</v-alert-title>
      Pagamento registrado com sucesso.
    </v-alert>

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
                    label="Meio de Pagamento"
                    prepend-inner-icon="mdi-credit-card"
                    variant="outlined"
                    :disabled="isSubmitting"
                  />
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="form.data_pagamento"
                    label="Data do Pagamento"
                    type="date"
                    prepend-inner-icon="mdi-calendar"
                    variant="outlined"
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
                  variant="outlined"
                  size="large"
                  :disabled="isSubmitting"
                  class="text-none flex-grow-1 flex-sm-grow-0"
                  @click="voltar"
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
