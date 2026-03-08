<script setup lang="ts">
import type { PdvExpensesComprovante } from '~/types/schema'
/**
 * Página de Registro de Despesas do PDV
 *
 * Permite cadastrar, editar e excluir despesas diárias.
 * Responsável vinculado ao cadastro de Católicos; categoria obrigatória.
 * Comprovantes (NF/recibos) via M2M → pdv_expenses_comprovantes.
 * Backward-compat: exibe operator_id de registros antigos.
 */
import { createItem, deleteItem, readItems, uploadFiles } from '@directus/sdk'
import { brToIsoDate, formatCurrency, formatDate, isoToBrDate, toLocalISO, usePdvReportPeriod } from '~/composables/usePdvReport'

definePageMeta({ layout: 'admin' })

const { fetchExpenses, createExpense, updateExpense, deleteExpense, fetchOperators, createOperator } = usePdv()

// ─── Categorias de despesa ────────────────────────────────────────────────────
const CATEGORIA_LABELS: Record<string, string> = {
  decoracao: 'Decoração e Estrutura',
  alimentacao: 'Alimentação e Bebidas',
  servicos: 'Serviços / Pessoal',
  divulgacao: 'Impressão e Divulgação',
  transporte: 'Transporte e Logística',
  utilidades: 'Utilidades (Água/Luz)',
  manutencao: 'Manutenção',
  impostos: 'Impostos / Taxas Retidas',
  repasse: 'Repasse Interno',
  outro: 'Outro',
}
const categoriaOpcoes = Object.entries(CATEGORIA_LABELS).map(([value, title]) => ({ value, title }))

// ─── State ────────────────────────────────────────────────────────────────────
const items = ref<any[]>([])
const catolicos = ref<{ id: string, nome: string }[]>([])
const loading = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref<'success' | 'error'>('success')
const responsavelSearch = ref('')
const currentOperatorId = ref<string | null>(null)

// Filters
const search = ref('')
const { dateFrom, dateTo, setToday, setThisMonth, setNovena } = usePdvReportPeriod()
const filterCategoria = ref<string | null>(null)
const dateFromField = computed({
  get: () => isoToBrDate(dateFrom.value),
  set: (value: string) => {
    dateFrom.value = brToIsoDate(value)
  },
})
const dateToField = computed({
  get: () => isoToBrDate(dateTo.value),
  set: (value: string) => {
    dateTo.value = brToIsoDate(value)
  },
})

// Dialog
const dialog = ref(false)
const deleteDialog = ref(false)
const editingId = ref<number | null>(null)
const itemToDelete = ref<any>(null)
const responsavelDialog = ref(false)
const creatingResponsavel = ref(false)

// Form
const form = ref({
  descricao: '',
  valor: undefined as number | undefined,
  data_despesa: isoToBrDate(toLocalISO(new Date())),
  categoria: null as string | null,
  responsavel_id: null as string | null,
  observacao: '',
})

const responsavelForm = ref({
  nome: '',
  telefone: '',
  sexo: null as 'M' | 'F' | null,
  nascimento: '',
})

const formRef = ref()
const formValid = ref(false)
const responsavelFormRef = ref()
const responsavelFormValid = ref(false)

// ─── Comprovantes de despesa ──────────────────────────────────────────────────
const comprovantes = ref<PdvExpensesComprovante[]>([])
const uploadingFile = ref(false)
const removeComprDialog = ref(false)
const comprToRemove = ref<PdvExpensesComprovante | null>(null)
const pendingComprovantes = ref<File[]>([])
const directusUrl = useRuntimeConfig().public.directus.url as string

// ─── Table headers ─────────────────────────────────────────────────────────────
const headers = [
  { title: 'Data', key: 'data_despesa', width: '110px', sortable: true },
  { title: 'Categoria', key: 'categoria', width: '170px', sortable: true },
  { title: 'Descrição', key: 'descricao', sortable: true },
  { title: 'Responsável', key: 'responsavel', sortable: false },
  { title: 'Valor', key: 'valor', align: 'end' as const, width: '120px', sortable: true },
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
  if (dateFrom.value)
    result = result.filter(i => i.data_despesa >= dateFrom.value)
  if (dateTo.value)
    result = result.filter(i => i.data_despesa <= dateTo.value)
  if (filterCategoria.value)
    result = result.filter(i => i.categoria === filterCategoria.value)
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
}

const responsavelRules = {
  required: (v: unknown) => !!v || 'Campo obrigatório',
}

// ─── Data loading ─────────────────────────────────────────────────────────────
async function loadCatolicos() {
  const c = await useAuth().getAuthClient()
  const catRes = await c.request(readItems('catolico', {
    filter: { status: { _eq: 'published' } },
    sort: ['nome'],
    fields: ['id', 'nome'],
    limit: -1,
  } as any))
  catolicos.value = (catRes as unknown as { id: string, nome: string }[]) || []
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .trim()
    .toLowerCase()
}

async function ensureCurrentOperatorId() {
  if (currentOperatorId.value)
    return currentOperatorId.value

  const auth = useAuth()
  const currentUser = auth.user.value ?? await auth.fetchCurrentUser()
  const fullName = [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(' ').trim()
  const fallbackName = currentUser?.first_name?.trim() || currentUser?.email?.split('@')[0] || 'Operador'
  const desiredName = fullName || fallbackName

  const operators = await fetchOperators({
    filter: { active: { _eq: true } },
    sort: ['name'],
    limit: -1,
  }) as any[]

  const normalizedDesired = normalizeName(desiredName)
  const normalizedFirstName = normalizeName(currentUser?.first_name)
  const existing = operators.find((operator) => {
    const normalizedOperator = normalizeName(operator?.name)
    return normalizedOperator === normalizedDesired || (normalizedFirstName && normalizedOperator === normalizedFirstName)
  })

  if (existing?.id) {
    currentOperatorId.value = existing.id as string
    return currentOperatorId.value
  }

  const created = await createOperator({
    name: desiredName,
    active: true,
  } as any) as { id: string }

  currentOperatorId.value = created.id
  return currentOperatorId.value
}

async function loadData() {
  loading.value = true
  try {
    const [expRes] = await Promise.all([
      fetchExpenses({
        fields: [
          'id',
          'status',
          'descricao',
          'valor',
          'data_despesa',
          'categoria',
          'observacao',
          'date_created',
          'operator_id.id',
          'operator_id.name',
          'responsavel_id.id',
          'responsavel_id.nome',
        ],
        sort: ['-data_despesa', '-date_created'],
        limit: -1,
      }),
    ])
    items.value = (expRes as any[]) || []
    await Promise.all([loadCatolicos(), ensureCurrentOperatorId()])
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
  comprovantes.value = []
  pendingComprovantes.value = []
  responsavelSearch.value = ''
  form.value = {
    descricao: '',
    valor: undefined,
    data_despesa: isoToBrDate(toLocalISO(new Date())),
    categoria: null,
    responsavel_id: null,
    observacao: '',
  }
  dialog.value = true
}

function openEdit(item: any) {
  editingId.value = item.id
  pendingComprovantes.value = []
  responsavelSearch.value = ''
  const respId = typeof item.responsavel_id === 'object' ? item.responsavel_id?.id : item.responsavel_id
  form.value = {
    descricao: item.descricao ?? '',
    valor: item.valor ?? undefined,
    data_despesa: isoToBrDate(item.data_despesa ?? toLocalISO(new Date())),
    categoria: item.categoria ?? null,
    responsavel_id: respId ?? null,
    observacao: item.observacao ?? '',
  }
  dialog.value = true
  loadExpenseComprovantes(item.id)
}

function openResponsavelDialog() {
  responsavelForm.value = {
    nome: responsavelSearch.value?.trim() || '',
    telefone: '',
    sexo: null,
    nascimento: '',
  }
  responsavelDialog.value = true
}

async function saveResponsavel() {
  const { valid } = await responsavelFormRef.value?.validate()
  if (!valid)
    return

  creatingResponsavel.value = true
  try {
    const c = await useAuth().getAuthClient()
    const payload: Record<string, unknown> = {
      nome: responsavelForm.value.nome,
      status: 'published',
    }

    if (responsavelForm.value.telefone)
      payload.telefone = responsavelForm.value.telefone
    if (responsavelForm.value.sexo)
      payload.sexo = responsavelForm.value.sexo
    if (responsavelForm.value.nascimento)
      payload.nascimento = brToIsoDate(responsavelForm.value.nascimento)

    const created = await c.request(createItem('catolico', payload as any)) as { id: string }
    await loadCatolicos()
    form.value.responsavel_id = created.id
    responsavelSearch.value = ''
    responsavelDialog.value = false
    snackbarMsg.value = 'Responsável criado com sucesso!'
    snackbarColor.value = 'success'
    snackbar.value = true
  }
  catch (error) {
    console.error('Error creating responsavel', error)
    snackbarMsg.value = 'Erro ao criar responsável.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
  finally {
    creatingResponsavel.value = false
  }
}

async function attachFilesToExpense(expenseId: number, files: File[]) {
  if (!files.length)
    return

  const c = await useAuth().getAuthClient()

  for (const file of files) {
    const fd = new FormData()
    fd.append('file', file)
    const uploaded = await c.request(uploadFiles(fd)) as { id: string }
    if (!uploaded?.id)
      throw new Error('Upload falhou')

    await c.request(createItem('pdv_expenses_comprovantes', {
      expense_id: expenseId,
      directus_files_id: uploaded.id,
    } as any))
  }
}

async function saveForm() {
  const { valid } = await formRef.value?.validate()
  if (!valid)
    return

  loading.value = true
  try {
    const operatorId = await ensureCurrentOperatorId()
    const payload = {
      descricao: form.value.descricao,
      valor: Number(form.value.valor),
      data_despesa: brToIsoDate(form.value.data_despesa),
      operator_id: operatorId,
      categoria: form.value.categoria,
      responsavel_id: form.value.responsavel_id || null,
      observacao: form.value.observacao || null,
      status: 'published',
    }

    let savedExpenseId = editingId.value

    if (isEditing.value) {
      await updateExpense(editingId.value!, payload as any)
    }
    else {
      const createdExpense = await createExpense(payload as any) as { id?: number }
      savedExpenseId = createdExpense?.id ?? null
    }

    if (savedExpenseId && pendingComprovantes.value.length) {
      await attachFilesToExpense(savedExpenseId, pendingComprovantes.value)
      pendingComprovantes.value = []
    }

    dialog.value = false
    snackbarMsg.value = 'Despesa salva com sucesso!'
    snackbarColor.value = 'success'
    snackbar.value = true
    await loadData()
  }
  catch (e) {
    console.error('Error saving expense', e)
    snackbarMsg.value = 'Erro ao salvar despesa.'
    snackbarColor.value = 'error'
    snackbar.value = true
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
  dateFrom.value = ''
  dateTo.value = ''
  filterCategoria.value = null
}

// ─── Comprovantes de despesa ──────────────────────────────────────────────────
async function loadExpenseComprovantes(expId: number) {
  try {
    const c = await useAuth().getAuthClient()
    const res = await c.request(readItems('pdv_expenses_comprovantes', {
      filter: { expense_id: { _eq: expId } },
      fields: ['id', 'expense_id', 'directus_files_id.*'],
      sort: ['-id'],
      limit: -1,
    } as any))
    comprovantes.value = (res as unknown as PdvExpensesComprovante[]) ?? []
  }
  catch (e) {
    console.error('loadExpenseComprovantes error', e)
    comprovantes.value = []
  }
}

async function handleComprUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (!files.length)
    return

  if (!editingId.value) {
    pendingComprovantes.value = [...pendingComprovantes.value, ...files]
    snackbarMsg.value = files.length > 1
      ? 'Arquivos adicionados. Eles serão enviados ao salvar a despesa.'
      : 'Arquivo adicionado. Ele será enviado ao salvar a despesa.'
    snackbarColor.value = 'success'
    snackbar.value = true
    input.value = ''
    return
  }

  uploadingFile.value = true
  try {
    await attachFilesToExpense(editingId.value, files)
    await loadExpenseComprovantes(editingId.value)
    snackbarMsg.value = 'Comprovante anexado!'
    snackbarColor.value = 'success'
    snackbar.value = true
  }
  catch {
    snackbarMsg.value = 'Erro ao fazer upload.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
  finally {
    uploadingFile.value = false
    input.value = ''
  }
}

function removePendingCompr(index: number) {
  pendingComprovantes.value.splice(index, 1)
}

function confirmRemoveCompr(item: PdvExpensesComprovante) {
  comprToRemove.value = item
  removeComprDialog.value = true
}

async function performRemoveCompr() {
  if (!comprToRemove.value)
    return
  try {
    const c = await useAuth().getAuthClient()
    await c.request(deleteItem('pdv_expenses_comprovantes', comprToRemove.value.id as any))
    removeComprDialog.value = false
    comprToRemove.value = null
    if (editingId.value)
      await loadExpenseComprovantes(editingId.value)
  }
  catch {
    snackbarMsg.value = 'Erro ao remover comprovante.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

function getComprFile(d: any) {
  if (!d)
    return null
  return typeof d === 'object' ? d : { id: d, title: d, type: undefined, filesize: undefined }
}

function fileIcon(mime: string | undefined): string {
  if (!mime)
    return 'mdi-file-outline'
  if (mime.startsWith('image/'))
    return 'mdi-file-image-outline'
  if (mime === 'application/pdf')
    return 'mdi-file-pdf-box'
  return 'mdi-file-document-outline'
}

function formatBytes(bytes: number | undefined): string {
  if (!bytes)
    return ''
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getResponsavelName(item: any): string {
  if (item.responsavel_id) {
    const r = item.responsavel_id
    return typeof r === 'object' ? r.nome ?? '—' : '—'
  }
  if (item.operator_id) {
    const op = item.operator_id
    return `(op.) ${typeof op === 'object' ? op.name ?? '—' : '—'}`
  }
  return '—'
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
      <v-btn color="success" variant="elevated" prepend-icon="mdi-plus" size="large" @click="openNew">
        Nova Despesa
      </v-btn>
    </div>

    <!-- Filters -->
    <v-card rounded="xl" :elevation="0" class="border mb-5">
      <v-card-text class="py-3">
        <v-row align="center">
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
            <MaskedDateField
              v-model="dateFromField"
              label="De"
              prepend-inner-icon="mdi-calendar-start"
              hide-details
            />
          </v-col>
          <v-col cols="6" sm="2">
            <MaskedDateField
              v-model="dateToField"
              label="Até"
              prepend-inner-icon="mdi-calendar-end"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              v-model="filterCategoria"
              :items="categoriaOpcoes"
              item-title="title"
              item-value="value"
              label="Categoria"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" sm="12" class="d-flex flex-wrap ga-2">
            <v-btn size="small" variant="tonal" color="secondary" @click="setToday">
              Hoje
            </v-btn>
            <v-btn size="small" variant="tonal" color="secondary" @click="setThisMonth">
              Este mês
            </v-btn>
            <v-btn size="small" variant="tonal" color="warning" @click="setNovena()">
              Novena
            </v-btn>
            <v-btn size="small" variant="text" color="secondary" @click="clearFilters">
              Limpar
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

        <template #[`item.categoria`]="{ item }">
          <v-chip v-if="item.categoria" size="small" variant="tonal" color="warning" label>
            {{ CATEGORIA_LABELS[item.categoria] ?? item.categoria }}
          </v-chip>
          <span v-else class="text-disabled">—</span>
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

        <template #[`item.responsavel`]="{ item }">
          <v-chip size="small" variant="tonal" color="secondary" label>
            <v-icon start size="14" icon="mdi-account" />
            {{ getResponsavelName(item) }}
          </v-chip>
        </template>

        <template #[`item.valor`]="{ item }">
          <span class="font-weight-bold text-error text-body-2">{{ formatCurrency(item.valor) }}</span>
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="d-flex ga-1">
            <v-btn
              icon="mdi-pencil"
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
              icon="mdi-trash-can-outline"
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
            <v-row>
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
                <v-select
                  v-model="form.categoria"
                  :items="categoriaOpcoes"
                  item-title="title"
                  item-value="value"
                  label="Categoria *"
                  variant="outlined"
                  :rules="[rules.required]"
                  prepend-inner-icon="mdi-tag-outline"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <MaskedCurrencyField
                  v-model="form.valor"
                  label="Valor R$ *"
                  :rules="[rules.required]"
                  :min-value="0.01"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <MaskedDateField
                  v-model="form.data_despesa"
                  label="Data *"
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col cols="12">
                <v-autocomplete
                  v-model="form.responsavel_id"
                  v-model:search="responsavelSearch"
                  :items="catolicos"
                  item-title="nome"
                  item-value="id"
                  label="Responsável (opcional)"
                  variant="outlined"
                  prepend-inner-icon="mdi-account-outline"
                  clearable
                  no-data-text="Nenhum paroquiano encontrado"
                >
                  <template #append-item>
                    <v-divider class="mt-2" />
                    <v-list-item class="text-primary" @click="openResponsavelDialog">
                      <template #prepend>
                        <v-icon icon="mdi-account-plus-outline" color="primary" />
                      </template>
                      <v-list-item-title>Cadastrar novo responsável</v-list-item-title>
                      <v-list-item-subtitle v-if="responsavelSearch">
                        Usar "{{ responsavelSearch }}" como nome inicial
                      </v-list-item-subtitle>
                    </v-list-item>
                  </template>
                  <template #no-data>
                    <div class="pa-3 d-flex flex-column align-start ga-2">
                      <div class="text-body-2 text-medium-emphasis">
                        Nenhum paroquiano encontrado.
                      </div>
                      <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-account-plus-outline" @click="openResponsavelDialog">
                        Novo responsável
                      </v-btn>
                    </div>
                  </template>
                </v-autocomplete>
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
              <v-col cols="12">
                <div class="text-subtitle-2 font-weight-medium mb-2 d-flex align-center ga-2">
                  <v-icon icon="mdi-paperclip" size="16" />
                  <span>Recibo / Nota Fiscal</span>
                </div>
                <v-btn
                  size="small"
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-upload"
                  :loading="uploadingFile"
                  class="mb-3"
                  @click="($el as HTMLElement).querySelector<HTMLInputElement>('input[type=file]')?.click()"
                >
                  Anexar arquivo
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    style="display:none;"
                    @change="handleComprUpload"
                  >
                </v-btn>

                <p v-if="!isEditing" class="text-caption text-medium-emphasis mb-3">
                  Os arquivos selecionados serão enviados automaticamente após salvar a despesa.
                </p>

                <v-list v-if="!isEditing && pendingComprovantes.length > 0" lines="one" density="compact" class="pa-0">
                  <v-list-item
                    v-for="(file, index) in pendingComprovantes"
                    :key="`${file.name}-${file.size}-${index}`"
                    prepend-icon="mdi-file-document-outline"
                    rounded="lg"
                    class="border mb-1"
                  >
                    <v-list-item-title class="text-body-2">
                      {{ file.name }}
                      <span class="text-caption text-disabled ms-2">{{ formatBytes(file.size) }}</span>
                    </v-list-item-title>
                    <template #append>
                      <v-btn icon="mdi-delete-outline" variant="text" size="x-small" color="error" @click="removePendingCompr(index)" />
                    </template>
                  </v-list-item>
                </v-list>
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
            variant="elevated"
            :loading="loading"
            :disabled="!formValid"
            prepend-icon="mdi-content-save"
            @click="saveForm"
          >
            Salvar
          </v-btn>
        </v-card-actions>

        <!-- Comprovantes já enviados — apenas no modo edição -->
        <template v-if="isEditing">
          <v-divider />
          <v-card-text class="px-5 pb-4">
            <div class="text-subtitle-2 font-weight-medium mb-3">
              <v-icon icon="mdi-paperclip" size="16" class="me-1" />
              Comprovantes
            </div>
            <v-btn
              size="small"
              color="primary"
              variant="tonal"
              prepend-icon="mdi-upload"
              :loading="uploadingFile"
              class="mb-3"
              @click="($el as HTMLElement).querySelector<HTMLInputElement>('input[type=file]')?.click()"
            >
              Anexar
              <input
                type="file"
                accept="image/*,application/pdf"
                multiple
                style="display:none;"
                @change="handleComprUpload"
              >
            </v-btn>
            <v-list v-if="comprovantes.length > 0" lines="one" density="compact" class="pa-0">
              <v-list-item
                v-for="comp in comprovantes"
                :key="comp.id"
                :prepend-icon="fileIcon(getComprFile(comp.directus_files_id)?.type)"
                rounded="lg"
                class="border mb-1"
              >
                <v-list-item-title class="text-body-2">
                  {{ getComprFile(comp.directus_files_id)?.title ?? 'Arquivo' }}
                  <span class="text-caption text-disabled ms-2">{{ formatBytes(getComprFile(comp.directus_files_id)?.filesize) }}</span>
                </v-list-item-title>
                <template #append>
                  <v-btn
                    v-if="getComprFile(comp.directus_files_id)?.id"
                    icon="mdi-open-in-new"
                    variant="text"
                    size="x-small"
                    color="primary"
                    :href="`${directusUrl}/assets/${getComprFile(comp.directus_files_id)?.id}`"
                    target="_blank"
                  />
                  <v-btn
                    icon="mdi-delete-outline"
                    variant="text"
                    size="x-small"
                    color="error"
                    @click="confirmRemoveCompr(comp)"
                  />
                </template>
              </v-list-item>
            </v-list>
            <p v-else class="text-caption text-disabled mb-0">
              Nenhum comprovante anexado.
            </p>
          </v-card-text>
        </template>
      </v-card>
    </v-dialog>

    <v-dialog v-model="responsavelDialog" max-width="520" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center pa-5 pb-3">
          <v-icon icon="mdi-account-plus-outline" color="primary" class="me-2" />
          Novo Responsável
        </v-card-title>

        <v-card-text class="px-5 pb-0">
          <v-form ref="responsavelFormRef" v-model="responsavelFormValid" validate-on="input lazy">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="responsavelForm.nome"
                  label="Nome completo *"
                  :rules="[responsavelRules.required]"
                  prepend-inner-icon="mdi-account-outline"
                  autofocus
                />
              </v-col>
              <v-col cols="12" sm="7">
                <v-text-field
                  v-model="responsavelForm.telefone"
                  label="Telefone / WhatsApp"
                  prepend-inner-icon="mdi-phone-outline"
                  placeholder="(00) 00000-0000"
                />
              </v-col>
              <v-col cols="12" sm="5">
                <v-select
                  v-model="responsavelForm.sexo"
                  :items="[{ title: 'Masculino', value: 'M' }, { title: 'Feminino', value: 'F' }]"
                  item-title="title"
                  item-value="value"
                  label="Sexo"
                  prepend-inner-icon="mdi-gender-male-female"
                  clearable
                />
              </v-col>
              <v-col cols="12" sm="6">
                <MaskedDateField
                  v-model="responsavelForm.nascimento"
                  label="Data de nascimento"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-5 pt-2">
          <v-spacer />
          <v-btn variant="text" color="secondary" @click="responsavelDialog = false">
            Cancelar
          </v-btn>
          <v-btn color="primary" variant="elevated" prepend-icon="mdi-content-save" :loading="creatingResponsavel" @click="saveResponsavel">
            Salvar responsável
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

    <!-- Remove comprovante dialog -->
    <v-dialog v-model="removeComprDialog" max-width="380">
      <v-card rounded="xl">
        <v-card-text class="pa-5 text-center">
          <v-icon icon="mdi-alert-circle-outline" color="error" size="48" class="mb-3" />
          <p class="text-body-1 mb-0">
            Remover este comprovante?
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="removeComprDialog = false">
            Cancelar
          </v-btn>
          <v-btn color="error" variant="tonal" :loading="loading" @click="performRemoveCompr">
            Remover
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="bottom end">
      {{ snackbarMsg }}
    </v-snackbar>
  </v-container>
</template>
