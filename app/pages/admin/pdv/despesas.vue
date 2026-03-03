<script setup lang="ts">
/**
 * Página de Registro de Despesas do PDV
 *
 * Permite cadastrar, editar e excluir despesas diárias vinculadas a operadores.
 * Inclui filtros por período e operador.
 */
definePageMeta({ layout: 'admin' })

const { fetchExpenses, createExpense, updateExpense, deleteExpense, fetchOperators } = usePdv()

// ─── State ────────────────────────────────────────────────────────────────────
const items = ref<any[]>([])
const operators = ref<any[]>([])
const loading = ref(false)

// Filters
const search = ref('')
const filterDateFrom = ref<string | null>(null)
const filterDateTo = ref<string | null>(null)
const filterOperator = ref<string | null>(null)

// Dialog
const dialog = ref(false)
const deleteDialog = ref(false)
const editingId = ref<string | null>(null)
const itemToDelete = ref<any>(null)

// Form
const form = ref({
  descricao: '',
  valor: null as number | null,
  data_despesa: new Date().toISOString().substring(0, 10),
  operator_id: null as string | null,
  observacao: '',
  status: 'published',
})

const formRef = ref()
const formValid = ref(false)

// ─── Table headers ─────────────────────────────────────────────────────────────
const headers = [
  { title: 'Data', key: 'data_despesa', width: '120px' },
  { title: 'Descrição', key: 'descricao' },
  { title: 'Operador', key: 'operator_id' },
  { title: 'Valor', key: 'valor', align: 'end' as const },
  { title: '', key: 'actions', sortable: false, align: 'end' as const, width: '80px' },
]

// ─── Computed ─────────────────────────────────────────────────────────────────
const filteredItems = computed(() => {
  let result = items.value
  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(i =>
      i.descricao?.toLowerCase().includes(term)
      || i.observacao?.toLowerCase().includes(term),
    )
  }
  if (filterDateFrom.value) {
    result = result.filter(i => i.data_despesa >= filterDateFrom.value!)
  }
  if (filterDateTo.value) {
    result = result.filter(i => i.data_despesa <= filterDateTo.value!)
  }
  if (filterOperator.value) {
    result = result.filter((i) => {
      const opId = typeof i.operator_id === 'object' ? i.operator_id?.id : i.operator_id
      return opId === filterOperator.value
    })
  }
  return result
})

const totalFiltered = computed(() =>
  filteredItems.value.reduce((sum, i) => sum + Number(i.valor || 0), 0),
)

const isEditing = computed(() => editingId.value !== null)

const dialogTitle = computed(() => isEditing.value ? 'Editar Despesa' : 'Nova Despesa')

// ─── Validation rules ─────────────────────────────────────────────────────────
const rules = {
  required: (v: unknown) => !!v || 'Campo obrigatório',
  positiveNumber: (v: unknown) => {
    const n = Number(v)
    return (!Number.isNaN(n) && n > 0) || 'Informe um valor positivo'
  },
}

// ─── Data loading ─────────────────────────────────────────────────────────────
async function loadData() {
  loading.value = true
  try {
    const [expRes, opRes] = await Promise.all([
      fetchExpenses({
        fields: ['*', 'operator_id.id', 'operator_id.name'],
        sort: ['-data_despesa', '-date_created'],
        limit: -1,
      }),
      fetchOperators({
        filter: { active: { _eq: true } },
        sort: ['name'],
        limit: -1,
      }),
    ])
    items.value = (expRes as any[]) || []
    operators.value = (opRes as any[]) || []
  }
  catch (e) {
    console.error('Error loading expenses', e)
  }
  finally {
    loading.value = false
  }
}

onMounted(loadData)

// ─── Dialog actions ────────────────────────────────────────────────────────────
function openNew() {
  editingId.value = null
  form.value = {
    descricao: '',
    valor: null,
    data_despesa: new Date().toISOString().substring(0, 10),
    operator_id: null,
    observacao: '',
    status: 'published',
  }
  dialog.value = true
}

function openEdit(item: any) {
  editingId.value = item.id
  const opId = typeof item.operator_id === 'object' ? item.operator_id?.id : item.operator_id
  form.value = {
    descricao: item.descricao ?? '',
    valor: item.valor ?? null,
    data_despesa: item.data_despesa ?? new Date().toISOString().substring(0, 10),
    operator_id: opId ?? null,
    observacao: item.observacao ?? '',
    status: item.status ?? 'published',
  }
  dialog.value = true
}

async function saveForm() {
  const { valid } = await formRef.value?.validate()
  if (!valid)
    return

  loading.value = true
  try {
    const payload = {
      descricao: form.value.descricao,
      valor: Number(form.value.valor),
      data_despesa: form.value.data_despesa,
      operator_id: form.value.operator_id as string,
      observacao: form.value.observacao || null,
      status: form.value.status,
    }

    if (isEditing.value) {
      await updateExpense(editingId.value!, payload as any)
    }
    else {
      await createExpense(payload as any)
    }

    dialog.value = false
    await loadData()
  }
  catch (e) {
    console.error('Error saving expense', e)
  }
  finally {
    loading.value = false
  }
}

function confirmDelete(item: any) {
  itemToDelete.value = item
  deleteDialog.value = true
}

async function performDelete() {
  if (!itemToDelete.value)
    return
  loading.value = true
  try {
    await deleteExpense(itemToDelete.value.id)
    deleteDialog.value = false
    itemToDelete.value = null
    await loadData()
  }
  catch (e) {
    console.error('Error deleting expense', e)
  }
  finally {
    loading.value = false
  }
}

function clearFilters() {
  search.value = ''
  filterDateFrom.value = null
  filterDateTo.value = null
  filterOperator.value = null
}

// ─── Formatting helpers ───────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  if (!dateStr)
    return '-'
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

function getOperatorName(opField: any): string {
  if (!opField)
    return '—'
  if (typeof opField === 'object')
    return opField.name ?? '—'
  const found = operators.value.find(o => o.id === opField)
  return found?.name ?? '—'
}
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <!-- Header -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-5 ga-3">
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
          Despesas
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Registre as despesas diárias do PDV
        </p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" size="large" @click="openNew">
        Nova Despesa
      </v-btn>
    </div>

    <!-- Filters -->
    <v-card rounded="xl" :elevation="0" class="border mb-5">
      <v-card-text class="py-3">
        <v-row align="center" dense>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Buscar descrição..."
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="6" sm="2">
            <v-text-field
              v-model="filterDateFrom"
              label="De"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="6" sm="2">
            <v-text-field
              v-model="filterDateTo"
              label="Até"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              v-model="filterOperator"
              :items="operators"
              item-title="name"
              item-value="id"
              label="Operador"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" sm="1" class="d-flex justify-end">
            <v-btn
              icon="mdi-close"
              variant="text"
              color="secondary"
              density="compact"
              @click="clearFilters"
            >
              <v-tooltip activator="parent" location="top">
                Limpar filtros
              </v-tooltip>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Summary card -->
    <div class="d-flex justify-end mb-4">
      <v-chip color="error" variant="tonal" prepend-icon="mdi-cash-minus" size="large">
        Total: {{ formatCurrency(totalFiltered) }}
      </v-chip>
    </div>

    <!-- Table -->
    <v-card rounded="xl" :elevation="0" class="border">
      <v-data-table
        :headers="headers"
        :items="filteredItems"
        :loading="loading"
        hover
        items-per-page="15"
        no-data-text="Nenhuma despesa registrada"
      >
        <template #[`item.data_despesa`]="{ item }">
          <span class="text-body-2 font-weight-medium">{{ formatDate(item.data_despesa) }}</span>
        </template>

        <template #[`item.descricao`]="{ item }">
          <div>
            <div class="text-body-2 font-weight-medium">
              {{ item.descricao }}
            </div>
            <div v-if="item.observacao" class="text-caption text-medium-emphasis text-truncate" style="max-width: 280px;">
              {{ item.observacao }}
            </div>
          </div>
        </template>

        <template #[`item.operator_id`]="{ item }">
          <v-chip size="small" variant="tonal" color="secondary" label>
            <v-icon start size="14" icon="mdi-account" />
            {{ getOperatorName(item.operator_id) }}
          </v-chip>
        </template>

        <template #[`item.valor`]="{ item }">
          <span class="font-weight-bold text-error text-body-2">{{ formatCurrency(item.valor) }}</span>
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="d-flex ga-1">
            <v-btn
              icon="mdi-pencil-outline"
              variant="text"
              size="small"
              color="primary"
              @click="openEdit(item)"
            >
              <v-tooltip activator="parent" location="top">
                Editar
              </v-tooltip>
            </v-btn>
            <v-btn
              icon="mdi-delete-outline"
              variant="text"
              size="small"
              color="error"
              @click="confirmDelete(item)"
            >
              <v-tooltip activator="parent" location="top">
                Excluir
              </v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- New/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="560px" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center pa-5 pb-3">
          <v-icon icon="mdi-cash-minus" color="error" class="me-3" />
          {{ dialogTitle }}
        </v-card-title>

        <v-card-text class="px-5 pb-0">
          <v-form ref="formRef" v-model="formValid" validate-on="input lazy">
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  v-model="form.descricao"
                  label="Descrição *"
                  variant="outlined"
                  :rules="[rules.required]"
                  prepend-inner-icon="mdi-text-short"
                  autofocus
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.valor"
                  label="Valor R$ *"
                  variant="outlined"
                  type="number"
                  min="0.01"
                  step="0.01"
                  :rules="[rules.required, rules.positiveNumber]"
                  prepend-inner-icon="mdi-currency-brl"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.data_despesa"
                  label="Data *"
                  variant="outlined"
                  type="date"
                  :rules="[rules.required]"
                  prepend-inner-icon="mdi-calendar"
                />
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="form.operator_id"
                  :items="operators"
                  item-title="name"
                  item-value="id"
                  label="Operador Responsável *"
                  variant="outlined"
                  :rules="[rules.required]"
                  prepend-inner-icon="mdi-account"
                  clearable
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="form.observacao"
                  label="Observação (opcional)"
                  variant="outlined"
                  rows="3"
                  auto-grow
                  prepend-inner-icon="mdi-note-outline"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-5 pt-2">
          <v-spacer />
          <v-btn variant="text" color="secondary" @click="dialog = false">
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="loading"
            :disabled="!formValid"
            prepend-icon="mdi-content-save"
            @click="saveForm"
          >
            Salvar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card rounded="xl">
        <v-card-text class="pa-6 text-center">
          <v-icon icon="mdi-alert-circle-outline" color="error" size="56" class="mb-4" />
          <h3 class="text-h6 font-weight-bold mb-2">
            Excluir despesa?
          </h3>
          <p class="text-body-2 text-medium-emphasis mb-0">
            Esta ação não pode ser desfeita. A despesa
            <strong>"{{ itemToDelete?.descricao }}"</strong> será removida permanentemente.
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" color="secondary" @click="deleteDialog = false">
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="loading"
            prepend-icon="mdi-delete"
            @click="performDelete"
          >
            Excluir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
