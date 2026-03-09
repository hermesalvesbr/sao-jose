<script setup lang="ts">
/**
 * Sangria de Caixa — PDV
 *
 * Registra retiradas de dinheiro do caixa durante o expediente da quermesse.
 * Cada sangria gera um comprovante impresso via window.print().
 *
 * DRY: formatação via usePdvReport; composable via usePdv.
 */
import { formatCurrency, formatDateTime } from '~/composables/usePdvReport'

definePageMeta({ layout: 'admin' })

const {
  fetchCashWithdrawals,
  createCashWithdrawal,
  updateCashWithdrawal,
  deleteCashWithdrawal,
  fetchOperators,
} = usePdv()

// ─── State ──────────────────────────────────────────────────────────────────
const items = ref<any[]>([])
const operators = ref<any[]>([])
const loading = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const filterDateFrom = useState<string | null>('pdv-sangria-from', () => null)
const filterDateTo = useState<string | null>('pdv-sangria-to', () => null)
const filterOperator = useState<string | null>('pdv-sangria-operador', () => null)

// Dialog
const dialog = ref(false)
const deleteDialog = ref(false)
const editingId = ref<string | null>(null)
const itemToDelete = ref<any>(null)
const receiptItem = ref<any>(null)

// Form
function defaultForm() {
  return {
    valor: null as number | null,
    motivo: '',
    data_hora: new Date().toISOString().substring(0, 16),
    operator_id: null as string | null,
    observacao: '',
    status: 'published',
  }
}
const form = ref(defaultForm())
const formRef = ref()
const formValid = ref(false)

// ─── Table headers ───────────────────────────────────────────────────────────
const headers = [
  { title: 'Data/Hora', key: 'data_hora', width: '160px' },
  { title: 'Motivo', key: 'motivo' },
  { title: 'Operador', key: 'operator_id' },
  { title: 'Valor', key: 'valor', align: 'end' as const },
  { title: '', key: 'actions', sortable: false, align: 'end' as const, width: '100px' },
]

// ─── Computed ────────────────────────────────────────────────────────────────
const filteredItems = computed(() => {
  let result = items.value
  if (filterDateFrom.value) {
    result = result.filter(i => (i.data_hora ?? '').substring(0, 10) >= filterDateFrom.value!)
  }
  if (filterDateTo.value) {
    result = result.filter(i => (i.data_hora ?? '').substring(0, 10) <= filterDateTo.value!)
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function operatorName(op: any): string {
  if (typeof op === 'object' && op?.name)
    return op.name
  const found = operators.value.find(o => o.id === op)
  return found?.name ?? '—'
}

function showSnack(text: string, color = 'success') {
  snackbar.value = { show: true, text, color }
}

// ─── Data Loading ─────────────────────────────────────────────────────────────
async function loadData() {
  loading.value = true
  try {
    const [withdrawalsRes, operatorsRes] = await Promise.all([
      fetchCashWithdrawals({
        fields: ['id', 'valor', 'motivo', 'data_hora', 'observacao', 'date_created', 'operator_id.id', 'operator_id.name'],
        sort: ['-data_hora'],
        limit: -1,
      }),
      fetchOperators({ filter: { active: { _eq: true } }, sort: ['name'], limit: -1 }),
    ])
    items.value = (withdrawalsRes as any[]) || []
    operators.value = (operatorsRes as any[]) || []
  }
  catch {
    showSnack('Erro ao carregar sangrias', 'error')
  }
  finally {
    loading.value = false
  }
}

onMounted(loadData)

// ─── CRUD ─────────────────────────────────────────────────────────────────────
function openCreate() {
  editingId.value = null
  form.value = defaultForm()
  dialog.value = true
}

function openEdit(item: any) {
  editingId.value = item.id
  form.value = {
    valor: item.valor,
    motivo: item.motivo ?? '',
    data_hora: (item.data_hora ?? '').substring(0, 16),
    operator_id: typeof item.operator_id === 'object' ? item.operator_id?.id : item.operator_id,
    observacao: item.observacao ?? '',
    status: item.status ?? 'published',
  }
  dialog.value = true
}

async function saveForm() {
  const { valid } = await formRef.value.validate()
  if (!valid)
    return

  loading.value = true
  try {
    const payload = {
      ...form.value,
      valor: form.value.valor ?? undefined,
      operator_id: form.value.operator_id ?? undefined,
      data_hora: form.value.data_hora ? `${form.value.data_hora}:00` : new Date().toISOString(),
    }
    if (isEditing.value) {
      await updateCashWithdrawal(editingId.value!, payload as any)
      showSnack('Sangria atualizada com sucesso')
    }
    else {
      const created = await createCashWithdrawal(payload as any)
      showSnack('Sangria registrada com sucesso')
      // Offer print immediately after creation
      receiptItem.value = created
      setTimeout(printReceipt, 300, receiptItem.value)
    }
    dialog.value = false
    await loadData()
  }
  catch {
    showSnack('Erro ao salvar sangria', 'error')
  }
  finally {
    loading.value = false
  }
}

function confirmDelete(item: any) {
  itemToDelete.value = item
  deleteDialog.value = true
}

async function executeDelete() {
  if (!itemToDelete.value)
    return
  loading.value = true
  try {
    await deleteCashWithdrawal(itemToDelete.value.id)
    showSnack('Sangria excluída')
    deleteDialog.value = false
    await loadData()
  }
  catch {
    showSnack('Erro ao excluir sangria', 'error')
  }
  finally {
    loading.value = false
  }
}

// ─── Receipt ─────────────────────────────────────────────────────────────────
/** Define o item de recibo e dispara window.print() */
function printReceipt(item: any) {
  receiptItem.value = item
  nextTick(() => window.print())
}

const receiptOperatorName = computed(() => {
  if (!receiptItem.value)
    return ''
  return operatorName(receiptItem.value.operator_id)
})
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <!-- ─── Header (screen only) ──────────────────────────────────────── -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-5 ga-3 no-print">
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
          Sangria de Caixa
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Registro de retiradas de dinheiro do caixa durante o expediente
        </p>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        size="large"
        @click="openCreate"
      >
        Nova Sangria
      </v-btn>
    </div>

    <!-- ─── Filters (screen only) ─────────────────────────────────────── -->
    <v-card rounded="xl" :elevation="0" class="border mb-5 no-print">
      <v-card-text>
        <v-row align="center" dense>
          <v-col cols="12" sm="3">
            <v-text-field
              v-model="filterDateFrom"
              label="Data Inicial"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              prepend-inner-icon="mdi-calendar-start"
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field
              v-model="filterDateTo"
              label="Data Final"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              prepend-inner-icon="mdi-calendar-end"
            />
          </v-col>
          <v-col cols="12" sm="4">
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
              prepend-inner-icon="mdi-account-outline"
            />
          </v-col>
          <v-col cols="12" sm="2">
            <v-btn color="secondary" variant="tonal" block @click="loadData">
              Atualizar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4 no-print" />

    <!-- ─── Table ─────────────────────────────────────────────────────── -->
    <v-card rounded="xl" :elevation="0" class="border no-print">
      <v-data-table
        :headers="headers"
        :items="filteredItems"
        :loading="loading"
        density="comfortable"
        hover
      >
        <template #item.data_hora="{ item }">
          {{ formatDateTime(item.data_hora) }}
        </template>
        <template #item.operator_id="{ item }">
          {{ operatorName(item.operator_id) }}
        </template>
        <template #item.valor="{ item }">
          <span class="font-weight-bold text-error">{{ formatCurrency(item.valor) }}</span>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex ga-1 justify-end">
            <v-btn
              icon="mdi-printer"
              size="small"
              variant="text"
              color="primary"
              title="Imprimir recibo"
              @click="printReceipt(item)"
            />
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              color="secondary"
              @click="openEdit(item)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="confirmDelete(item)"
            />
          </div>
        </template>
        <template #bottom>
          <div class="d-flex justify-end align-center pa-3 border-t">
            <span class="text-body-2 text-medium-emphasis me-3">
              {{ filteredItems.length }} registro(s)
            </span>
            <span class="font-weight-bold text-error text-body-1">
              Total: {{ formatCurrency(totalFiltered) }}
            </span>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- ─── Create / Edit Dialog ──────────────────────────────────────── -->
    <v-dialog v-model="dialog" max-width="520" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3 text-h6 font-weight-bold">
          {{ isEditing ? 'Editar Sangria' : 'Nova Sangria de Caixa' }}
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-5">
          <v-form ref="formRef" v-model="formValid" @submit.prevent="saveForm">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.valor"
                  label="Valor (R$) *"
                  type="number"
                  step="0.01"
                  min="0.01"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v && v > 0 || 'Informe o valor']"
                  prepend-inner-icon="mdi-cash-minus"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.data_hora"
                  label="Data e Hora *"
                  type="datetime-local"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Informe a data e hora']"
                  prepend-inner-icon="mdi-clock-outline"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="form.motivo"
                  label="Motivo *"
                  placeholder="Ex: Troco para a barraca, Pagamento fornecedor..."
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Informe o motivo']"
                  prepend-inner-icon="mdi-text"
                />
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="form.operator_id"
                  :items="operators"
                  item-title="name"
                  item-value="id"
                  label="Operador *"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Selecione o operador']"
                  prepend-inner-icon="mdi-account-outline"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="form.observacao"
                  label="Observações"
                  variant="outlined"
                  density="comfortable"
                  rows="2"
                  auto-grow
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4 ga-2 justify-end">
          <v-btn variant="text" @click="dialog = false">
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="loading"
            @click="saveForm"
          >
            {{ isEditing ? 'Salvar' : 'Registrar e Imprimir' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── Delete Confirm Dialog ──────────────────────────────────────── -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-5 text-h6">
          Excluir Sangria?
        </v-card-title>
        <v-card-text class="px-5 pb-2">
          Esta ação não poderá ser desfeita.
        </v-card-text>
        <v-card-actions class="pa-4 ga-2 justify-end">
          <v-btn variant="text" @click="deleteDialog = false">
            Cancelar
          </v-btn>
          <v-btn color="error" variant="flat" :loading="loading" @click="executeDelete">
            Excluir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── Recibo (print only) ───────────────────────────────────────── -->
    <div v-if="receiptItem" class="print-receipt">
      <div class="receipt-header">
        <strong>Paróquia — Novenário de São José</strong>
      </div>
      <h2 class="receipt-title">
        COMPROVANTE DE RETIRADA DE CAIXA
      </h2>
      <table class="receipt-table">
        <tbody>
          <tr>
            <td class="receipt-label">
              Data/Hora:
            </td>
            <td class="receipt-value">
              {{ formatDateTime(receiptItem.data_hora) }}
            </td>
          </tr>
          <tr>
            <td class="receipt-label">
              Motivo:
            </td>
            <td class="receipt-value">
              {{ receiptItem.motivo }}
            </td>
          </tr>
          <tr>
            <td class="receipt-label">
              Operador:
            </td>
            <td class="receipt-value">
              {{ receiptOperatorName }}
            </td>
          </tr>
          <tr v-if="receiptItem.observacao">
            <td class="receipt-label">
              Observação:
            </td>
            <td class="receipt-value">
              {{ receiptItem.observacao }}
            </td>
          </tr>
          <tr class="receipt-total-row">
            <td class="receipt-label font-weight-black">
              Valor Retirado R$:
            </td>
            <td class="receipt-value font-weight-black">
              {{ formatCurrency(receiptItem.valor) }}
            </td>
          </tr>
        </tbody>
      </table>
      <div class="receipt-signatures">
        <div class="receipt-sig-block">
          <div class="receipt-sig-line" />
          <p>Operador Responsável</p>
        </div>
        <div class="receipt-sig-block">
          <div class="receipt-sig-line" />
          <p>Equipe Tesouraria</p>
        </div>
      </div>
      <p class="receipt-copy-note">
        Via única — arquivar na pasta financeira da novena
      </p>
    </div>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<style scoped>
/* Screen: hide print-only receipt */
.print-receipt {
  display: none;
}

@media print {
  /* Hide all screen content */
  .no-print,
  .v-navigation-drawer,
  .v-app-bar,
  header,
  nav {
    display: none !important;
  }

  /* Show receipt */
  .print-receipt {
    display: block !important;
    font-family: Arial, sans-serif;
    max-width: 300px;
    margin: 0 auto;
    padding: 16px;
    font-size: 11px;
  }

  .receipt-header {
    text-align: center;
    font-size: 12px;
    font-weight: bold;
    margin-bottom: 6px;
  }

  .receipt-title {
    text-align: center;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    margin: 0 0 12px;
    border-bottom: 1px solid #333;
    padding-bottom: 6px;
  }

  .receipt-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
  }

  .receipt-table td {
    padding: 4px 2px;
    border-bottom: 1px dotted #ccc;
    vertical-align: top;
  }

  .receipt-label {
    width: 40%;
    font-weight: bold;
    font-size: 10px;
    text-transform: uppercase;
  }

  .receipt-value {
    width: 60%;
  }

  .receipt-total-row td {
    font-size: 13px;
    border-top: 2px solid #333;
    border-bottom: 2px solid #333;
    padding: 6px 2px;
  }

  .receipt-signatures {
    display: flex;
    gap: 16px;
    margin-top: 24px;
  }

  .receipt-sig-block {
    flex: 1;
    text-align: center;
    font-size: 9px;
  }

  .receipt-sig-line {
    border-bottom: 1px solid #333;
    margin-bottom: 4px;
    height: 24px;
  }

  .receipt-copy-note {
    text-align: center;
    font-size: 8px;
    margin-top: 12px;
    font-style: italic;
    color: #666;
  }

  @page {
    size: 80mm auto;
    margin: 4mm;
  }
}
</style>
