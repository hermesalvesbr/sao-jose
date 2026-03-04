<script setup lang="ts">
const {
  aniversariantes,
  loading,
  error,
  aniversariantesDoMes,
  getPrimeiroNome,
  getDia,
  getMesIndex,
  getSexoIcon,
  getNomeMes,
  MESES,
} = useAniversariantes()

const currentMonth = ref(new Date().getMonth())
const searchTerm = ref('')
const selectedCatolico = ref<import('~/types/schema').Catolico | null>(null)
const showDetailsModal = ref(false)

function handleSearchTerm(val: string | null) {
  searchTerm.value = val ?? ''
}

function openDetailsModal(catolico: import('~/types/schema').Catolico) {
  selectedCatolico.value = catolico
  showDetailsModal.value = true
}

/** Retorna aniversariantes filtrados (busca ou mês selecionado) */
const aniversariantesFiltrados = computed(() => {
  const term = (searchTerm.value || '').trim().toLowerCase()
  if (term !== '') {
    return aniversariantes.value
      .filter(a => a.nome && a.nome.toLowerCase().includes(term))
      .sort((a, b) => {
        const ma = getMesIndex(a.nascimento as string)
        const mb = getMesIndex(b.nascimento as string)
        if (ma !== mb) return ma - mb
        return Number.parseInt(getDia(a.nascimento as string), 10)
          - Number.parseInt(getDia(b.nascimento as string), 10)
      })
  }
  return aniversariantesDoMes(currentMonth.value)
})

const showEmptyMessage = computed(
  () => !loading.value && aniversariantesFiltrados.value.length === 0,
)

function nextMonth() {
  currentMonth.value = (currentMonth.value + 1) % 12
}
function prevMonth() {
  currentMonth.value = (currentMonth.value + 11) % 12
}

usePublicSeo({
  title: 'Aniversariantes',
  description: 'Veja os aniversariantes do mês e celebre a vida de quem faz parte da comunidade.',
  path: '/aniversariantes',
})
</script>

<template>
  <v-container class="pa-6" fluid>
    <v-row justify="center" class="mb-4">
      <v-col cols="12" md="8" class="text-center">
        <h1 class="text-h4 font-weight-bold mb-2 text-secondary">
          <template v-if="(searchTerm || '').trim() === ''">
            Aniversariantes
          </template>
          <template v-else>
            Resultados da busca
          </template>
        </h1>
        <div class="subtitle-1 mb-4 text-secondary">
          <template v-if="(searchTerm || '').trim() === ''">
            Celebre a vida de quem faz parte da nossa comunidade!
          </template>
          <template v-else>
            Veja quem corresponde à sua busca em toda a comunidade.
          </template>
        </div>
        <v-text-field
          v-model="searchTerm"
          label="Buscar aniversariante pelo nome"
          prepend-inner-icon="mdi-magnify"
          class="mb-4"
          hide-details
          clearable
          color="primary"
          variant="outlined"
          density="comfortable"
          autocomplete="off"
          @update:model-value="handleSearchTerm"
        />
        <div v-if="(searchTerm || '').trim() === ''">
          <v-btn icon variant="text" aria-label="Mês anterior" color="primary" @click="prevMonth">
            <v-icon size="32">
              mdi-chevron-left
            </v-icon>
          </v-btn>
          <span class="month-title mx-3 text-secondary text-h5 font-weight-bold">{{ MESES[currentMonth] }}</span>
          <v-btn icon variant="text" aria-label="Próximo mês" color="primary" @click="nextMonth">
            <v-icon size="32">
              mdi-chevron-right
            </v-icon>
          </v-btn>
        </div>
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <template v-if="loading">
          <v-skeleton-loader type="list-item-avatar, list-item-avatar, list-item-avatar" />
        </template>
        <template v-else-if="error">
          <v-alert type="error" class="mt-6">
            {{ error }}
          </v-alert>
        </template>
        <template v-else-if="showEmptyMessage">
          <v-alert type="info" class="mt-6" border="start" color="info">
            <template v-if="(searchTerm || '').trim() === ''">
              Nenhum aniversariante neste mês.
            </template>
            <template v-else>
              Nenhum aniversariante encontrado para sua busca.
            </template>
          </v-alert>
        </template>
        <template v-else>
          <v-slide-group show-arrows>
            <v-slide-group-item v-for="a in aniversariantesFiltrados" :key="a.id">
              <v-card
                class="mx-2 my-4"
                elevation="8"
                color="primary-lighten-1"
                style="cursor: pointer"
                @click="openDetailsModal(a)"
              >
                <v-card-text class="d-flex flex-column align-center justify-center py-6">
                  <v-avatar size="64" class="mb-2" color="primary">
                    <v-icon size="40" :icon="getSexoIcon(a.sexo)" color="black" />
                  </v-avatar>
                  <div class="text-h6 font-weight-bold text-secondary mb-1">
                    {{ getPrimeiroNome(a.nome) }}
                  </div>
                  <div class="text-subtitle-2 text-secondary mb-1 d-flex align-center justify-center">
                    <v-icon size="18" class="mr-1" color="accent">
                      mdi-cake-variant
                    </v-icon>
                    {{ getDia(a.nascimento as string) }} de {{ getNomeMes(getMesIndex(a.nascimento as string)) }}
                  </div>
                </v-card-text>
              </v-card>
            </v-slide-group-item>
          </v-slide-group>
        </template>
      </v-col>
    </v-row>

    <BirthdayDetailsModal
      v-model="showDetailsModal"
      :catolico="selectedCatolico"
    />
  </v-container>
</template>

<style scoped>
/* Removido todo CSS customizado, apenas utilitários Vuetify */
</style>
