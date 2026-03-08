<script setup lang="ts">
// Luxon removido

definePageMeta({
  layout: 'admin',
})

const {
  catolicosDisponiveis,
  loading,
  error,
  fetchDizimistas,
  fetchCatolicosDisponiveis,
  criarDizimista,
} = useDizimos()

// Carrega dizimistas + católicos em paralelo para filtragem client-side
onMounted(async () => {
  await Promise.all([fetchDizimistas(), fetchCatolicosDisponiveis()])
})

// Formulário
const form = ref({
  catolico: '',
  valor_mensal: undefined as number | undefined,
})

// Estados do formulário
const isSubmitting = ref(false)

// Validação simples
const isFormValid = computed(() => {
  return form.value.catolico
    && form.value.valor_mensal
    && form.value.valor_mensal > 0
})

// Lista de católicos formatada para o select (já filtrada pelo computed)
const catolicosOptions = computed(() => {
  return catolicosDisponiveis.value.map((catolico: any) => {
    let dataFormatada = 'N/A'
    if (catolico.nascimento) {
      const [y, m, d] = catolico.nascimento.substring(0, 10).split('-')
      dataFormatada = `${d}/${m}/${y}`
    }
    return {
      value: catolico.id,
      title: catolico.nome,
      subtitle: `Tel: ${catolico.telefone || 'Não informado'} • ${dataFormatada}`,
    }
  })
})

// Função para submeter o formulário
async function submeterFormulario() {
  if (!isFormValid.value)
    return

  isSubmitting.value = true
  try {
    await criarDizimista({
      catolico: form.value.catolico,
      valor_mensal: form.value.valor_mensal!,
    })
    await navigateTo('/admin/dizimos')
  }
  catch (err) {
    console.error('Erro ao criar dizimista:', err)
  }
  finally {
    isSubmitting.value = false
  }
}
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
            Novo Dizimista
          </h1>
        </div>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0 ms-11">
          Converta um católico em dizimista
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
            <v-icon color="primary" class="me-2">
              mdi-account-plus
            </v-icon>
            <span class="text-h6">Dados do Dizimista</span>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-4">
            <v-form @submit.prevent="submeterFormulario">
              <v-row>
                <v-col cols="12">
                  <v-select
                    v-model="form.catolico"
                    :items="catolicosOptions"
                    item-title="title"
                    item-value="value"
                    label="Selecionar Católico"
                    placeholder="Escolha um católico para tornar dizimista"
                    prepend-inner-icon="mdi-account"
                    variant="outlined"
                    :loading="loading"
                    :disabled="isSubmitting"
                    clearable
                    :no-data-text="catolicosDisponiveis.length === 0 ? 'Nenhum católico disponível' : 'Nenhum resultado encontrado'"
                    class="mb-2"
                  />

                  <p class="text-caption text-medium-emphasis mb-4">
                    Apenas católicos que ainda não são dizimistas aparecem na lista
                  </p>
                </v-col>

                <v-col cols="12">
                  <MaskedCurrencyField
                    v-model="form.valor_mensal"
                    label="Valor Mensal do Dízimo"
                    placeholder="R$ 0,00"
                    prepend-inner-icon="mdi-cash"
                    variant="outlined"
                    :disabled="isSubmitting"
                    class="mb-2"
                  />

                  <p class="text-caption text-medium-emphasis">
                    Valor que o dizimista se compromete a contribuir mensalmente
                  </p>
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
                  prepend-icon="mdi-account-plus"
                  class="text-none flex-grow-1 flex-sm-grow-0"
                >
                  Cadastrar Dizimista
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

    <!-- Card Informativo -->
    <v-row justify="center" class="mt-6">
      <v-col cols="12" md="8" lg="6">
        <v-card
          variant="tonal"
          color="info"
          rounded="lg"
        >
          <v-card-text class="pa-4">
            <div class="d-flex align-start">
              <v-icon
                color="info"
                size="24"
                class="me-3 mt-1 flex-shrink-0"
              >
                mdi-information
              </v-icon>
              <div>
                <h3 class="text-subtitle-1 font-weight-bold mb-2">
                  Como funciona o dízimo?
                </h3>
                <p class="text-body-2 mb-0">
                  Ao tornar um católico em dizimista, ele se compromete a contribuir
                  mensalmente com um valor fixo. Este valor pode ser ajustado posteriormente
                  se necessário. Os pagamentos são registrados separadamente no sistema.
                </p>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
