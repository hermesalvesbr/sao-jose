<script setup lang="ts">
import { DateTime } from 'luxon'

definePageMeta({
  layout: 'admin',
})

const {
  dizimistas,
  loading,
  error,
  fetchDizimistas,
  atualizarDizimista,
  removerDizimista,
} = useDizimos()

// Estados
const search = ref('')
const dialogEdit = ref(false)
const dialogDelete = ref(false)
const selectedDizimista = ref<any>(null)
const editForm = ref({
  valor_mensal: 0,
})

// Carrega os dizimistas
onMounted(() => {
  fetchDizimistas()
})

// Computed para filtrar dizimistas
const dizimistasFiltrados = computed(() => {
  if (!search.value)
    return dizimistas.value

  return dizimistas.value.filter((dizimista: any) => {
    const nome = dizimista.catolico?.nome?.toLowerCase() || ''
    const telefone = dizimista.catolico?.telefone || ''
    return nome.includes(search.value.toLowerCase())
      || telefone.includes(search.value)
  })
})

// Headers da tabela
const headers = [
  { title: 'Nome', key: 'catolico.nome', sortable: true },
  { title: 'Telefone', key: 'catolico.telefone', sortable: false },
  { title: 'Valor Mensal', key: 'valor_mensal', sortable: true },
  { title: 'Data Cadastro', key: 'date_created', sortable: true },
  { title: 'Ações', key: 'actions', sortable: false, align: 'center' as const },
]

// Funções para ações
function editarDizimista(dizimista: any) {
  selectedDizimista.value = dizimista
  editForm.value.valor_mensal = dizimista.valor_mensal
  dialogEdit.value = true
}

function confirmarRemocao(dizimista: any) {
  selectedDizimista.value = dizimista
  dialogDelete.value = true
}

async function salvarEdicao() {
  if (!selectedDizimista.value)
    return

  try {
    await atualizarDizimista(selectedDizimista.value.id, {
      valor_mensal: editForm.value.valor_mensal,
    })
    dialogEdit.value = false
    selectedDizimista.value = null
  }
  catch (err) {
    console.error('Erro ao atualizar dizimista:', err)
  }
}

async function remover() {
  if (!selectedDizimista.value)
    return

  try {
    await removerDizimista(selectedDizimista.value.id)
    dialogDelete.value = false
    selectedDizimista.value = null
  }
  catch (err) {
    console.error('Erro ao remover dizimista:', err)
  }
}

// Função para formatar data
function formatarData(data: string) {
  return DateTime.fromISO(data).toFormat('dd/MM/yyyy')
}

// Função para formatar valor
function formatarValor(valor: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
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
            Lista de Dizimistas
          </h1>
        </div>
        <p class="text-body-1 text-medium-emphasis">
          Gerencie todos os dizimistas cadastrados
        </p>
      </div>

      <v-btn
        color="primary"
        variant="elevated"
        prepend-icon="mdi-account-plus"
        to="/admin/dizimos/novo-dizimista"
        class="text-none mt-4 mt-sm-0"
      >
        Novo Dizimista
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

    <!-- Card com a tabela -->
    <v-card
      variant="elevated"
      elevation="2"
      rounded="lg"
    >
      <v-card-title class="d-flex align-center justify-space-between pa-4">
        <div class="d-flex align-center">
          <v-icon class="me-2" color="primary">
            mdi-account-group
          </v-icon>
          <span class="text-h6">Dizimistas Cadastrados</span>
        </div>

        <v-chip
          color="primary"
          variant="tonal"
          class="d-none d-sm-flex"
        >
          {{ dizimistasFiltrados.length }} {{ dizimistasFiltrados.length === 1 ? 'dizimista' : 'dizimistas' }}
        </v-chip>
      </v-card-title>

      <v-divider />

      <!-- Barra de pesquisa -->
      <v-card-text class="pa-4 pb-0">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Pesquisar por nome ou telefone"
          variant="outlined"
          density="compact"
          clearable
          hide-details
          class="mb-4"
        />
      </v-card-text>

      <!-- Tabela -->
      <v-data-table
        :headers="headers"
        :items="dizimistasFiltrados"
        :loading="loading"
        :search="search"
        loading-text="Carregando dizimistas..."
        no-data-text="Nenhum dizimista encontrado"
        items-per-page-text="Itens por página:"
        density="comfortable"
        hover
      >
        <!-- Slot para nome -->
        <template #[`item.catolico.nome`]="{ item }">
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
            <div>
              <div class="font-weight-medium">
                {{ item.catolico?.nome || 'Nome não disponível' }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ item.catolico?.sexo || '' }}
              </div>
            </div>
          </div>
        </template>

        <!-- Slot para telefone -->
        <template #[`item.catolico.telefone`]="{ item }">
          <span v-if="item.catolico?.telefone" class="text-body-2">
            {{ item.catolico.telefone }}
          </span>
          <span v-else class="text-caption text-medium-emphasis">
            Não informado
          </span>
        </template>

        <!-- Slot para valor mensal -->
        <template #[`item.valor_mensal`]="{ item }">
          <v-chip
            :color="item.valor_mensal > 0 ? 'success' : 'warning'"
            variant="tonal"
            size="small"
          >
            {{ formatarValor(item.valor_mensal || 0) }}
          </v-chip>
        </template>

        <!-- Slot para data de cadastro -->
        <template #[`item.date_created`]="{ item }">
          <span class="text-body-2">
            {{ formatarData(item.date_created) }}
          </span>
        </template>

        <!-- Slot para ações -->
        <template #[`item.actions`]="{ item }">
          <div class="d-flex ga-1">
            <v-btn
              icon
              variant="text"
              size="small"
              color="primary"
              @click="editarDizimista(item)"
            >
              <v-icon size="16">
                mdi-pencil
              </v-icon>
              <v-tooltip activator="parent" location="top">
                Editar valor mensal
              </v-tooltip>
            </v-btn>

            <v-btn
              icon
              variant="text"
              size="small"
              color="error"
              @click="confirmarRemocao(item)"
            >
              <v-icon size="16">
                mdi-delete
              </v-icon>
              <v-tooltip activator="parent" location="top">
                Remover dizimista
              </v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog de Edição -->
    <v-dialog
      v-model="dialogEdit"
      max-width="400"
      persistent
    >
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon class="me-2" color="primary">
            mdi-pencil
          </v-icon>
          <span>Editar Dizimista</span>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-4">
          <div class="mb-4">
            <p class="text-body-2 mb-1">
              <strong>Nome:</strong> {{ selectedDizimista?.catolico?.nome }}
            </p>
            <p class="text-body-2 text-medium-emphasis">
              Edite o valor mensal do dízimo
            </p>
          </div>

          <MaskedCurrencyField
            v-model="editForm.valor_mensal"
            label="Valor Mensal"
            variant="outlined"
            autofocus
          />
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn
            variant="text"
            @click="dialogEdit = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="salvarEdicao"
          >
            Salvar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de Confirmação de Remoção -->
    <v-dialog
      v-model="dialogDelete"
      max-width="400"
      persistent
    >
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon class="me-2" color="error">
            mdi-alert-circle
          </v-icon>
          <span>Confirmar Remoção</span>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-4">
          <p class="text-body-1 mb-3">
            Tem certeza que deseja remover o dizimista
            <strong>{{ selectedDizimista?.catolico?.nome }}</strong>?
          </p>
          <p class="text-body-2 text-warning">
            ⚠️ Esta ação não pode ser desfeita. O católico voltará a estar
            disponível para se tornar dizimista novamente.
          </p>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn
            variant="text"
            @click="dialogDelete = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            @click="remover"
          >
            Remover
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
