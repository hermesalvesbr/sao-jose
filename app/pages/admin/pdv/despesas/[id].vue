<script setup lang="ts">
import type { PdvExpensesComprovante } from '~/types/schema'
import { createItem, deleteItem, readItem, readItems, updateItem, uploadFiles } from '@directus/sdk'
import { brToIsoDate, isoToBrDate } from '~/composables/usePdvReport'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const id = Number(route.params.id)

const { fetchOperators, createOperator } = usePdv()

// ─── State ────────────────────────────────────────────────────────────────────
const loading = ref(true)
const salvando = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref<'success' | 'error' | 'warning'>('success')
const currentOperatorId = ref<string | null>(null)

const formRef = ref()

const catolicos = ref<{ id: string, nome: string }[]>([])
const responsavelSearch = ref('')
const responsavelDialog = ref(false)
const creatingResponsavel = ref(false)
const responsavelFormRef = ref()
const responsavelFormValid = ref(false)

const form = ref({
  descricao: '',
  valor: undefined as number | undefined,
  data_despesa: '',
  categoria: null as string | null,
  responsavel_id: null as string | null,
  observacao: '',
  paid: false,
  payment_method: null as string | null,
})

const PAYMENT_METHOD_OPTIONS = [
  { value: 'dinheiro', title: 'Dinheiro' },
  { value: 'pix', title: 'PIX' },
  { value: 'cartao_credito', title: 'Cartão de Crédito' },
  { value: 'cartao_debito', title: 'Cartão de Débito' },
  { value: 'transferencia', title: 'Transferência Bancária' },
  { value: 'outro', title: 'Outro' },
]

const responsavelForm = ref({
  nome: '',
  telefone: '',
  sexo: null as 'M' | 'F' | null,
  nascimento: '',
})

// ─── Comprovantes ─────────────────────────────────────────────────────────────
const comprovantes = ref<PdvExpensesComprovante[]>([])
const pendingFiles = ref<File[]>([])
const removeComprDialog = ref(false)
const comprToRemove = ref<PdvExpensesComprovante | null>(null)
const directusUrl = useRuntimeConfig().public.directus.url as string

// ─── Arquivar ─────────────────────────────────────────────────────────────────
const archiveDialog = ref(false)
const archiving = ref(false)

// ─── Categorias ───────────────────────────────────────────────────────────────
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

const DIACRITICS_RE = /[\u0300-\u036F]/g
const categoriaOpcoes = Object.entries(CATEGORIA_LABELS).map(([value, title]) => ({ value, title }))

const rules = {
  required: (v: unknown) => !!v || 'Campo obrigatório',
}

// ─── Load data ────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const c = await useAuth().getAuthClient()
    const [item, catRes] = await Promise.all([
      c.request(readItem('pdv_expenses', id, {
        fields: [
          'id',
          'status',
          'descricao',
          'valor',
          'data_despesa',
          'categoria',
          'observacao',
          'paid',
          'payment_method',
          'operator_id',
          'responsavel_id.id',
          'responsavel_id.nome',
        ],
      } as never)),
      c.request(readItems('catolico', {
        filter: { status: { _eq: 'published' } },
        sort: ['nome'],
        fields: ['id', 'nome'],
        limit: -1,
      } as never)),
      ensureCurrentOperatorId(),
    ])

    const expense = item as Record<string, unknown>
    const respId = typeof expense.responsavel_id === 'object' && expense.responsavel_id !== null
      ? (expense.responsavel_id as { id: string }).id
      : expense.responsavel_id as string | null

    form.value = {
      descricao: (expense.descricao as string) ?? '',
      valor: expense.valor as number | undefined,
      data_despesa: isoToBrDate(String(expense.data_despesa ?? '').substring(0, 10)),
      categoria: (expense.categoria as string) ?? null,
      responsavel_id: respId ?? null,
      observacao: (expense.observacao as string) ?? '',
      paid: (expense.paid as boolean) ?? false,
      payment_method: (expense.payment_method as string | null) ?? null,
    }

    catolicos.value = (catRes as unknown as { id: string, nome: string }[]) || []
    await loadComprovantes()
  }
  catch (err) {
    console.error('Erro ao carregar despesa:', err)
    snackbarMsg.value = 'Erro ao carregar despesa.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
  finally {
    loading.value = false
  }
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizeName(value: string | null | undefined): string {
  return (value ?? '').normalize('NFD').replace(DIACRITICS_RE, '').trim().toLowerCase()
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
  }) as unknown as Array<{ id?: string, name?: string }>

  const normalizedDesired = normalizeName(desiredName)
  const normalizedFirstName = normalizeName(currentUser?.first_name)
  const existing = operators.find((op) => {
    const n = normalizeName(op?.name)
    return n === normalizedDesired || (normalizedFirstName && n === normalizedFirstName)
  })

  if (existing?.id) {
    currentOperatorId.value = existing.id
    return currentOperatorId.value
  }

  const created = await createOperator({ name: desiredName, active: true } as never) as { id: string }
  currentOperatorId.value = created.id
  return currentOperatorId.value
}

// ─── Save ─────────────────────────────────────────────────────────────────────
async function salvar() {
  const { valid } = await formRef.value?.validate()
  if (!valid)
    return

  salvando.value = true
  try {
    const operatorId = await ensureCurrentOperatorId()
    const c = await useAuth().getAuthClient()

    await c.request(updateItem('pdv_expenses', id, {
      descricao: form.value.descricao,
      valor: Number(form.value.valor),
      data_despesa: brToIsoDate(form.value.data_despesa),
      operator_id: operatorId,
      categoria: form.value.categoria,
      responsavel_id: form.value.responsavel_id || null,
      observacao: form.value.observacao || null,
      paid: form.value.paid,
      payment_method: form.value.payment_method,
    } as never))

    // Upload novos comprovantes pendentes
    if (pendingFiles.value.length) {
      await attachFiles(pendingFiles.value)
      pendingFiles.value = []
      await loadComprovantes()
    }

    snackbarMsg.value = 'Despesa salva com sucesso!'
    snackbarColor.value = 'success'
    snackbar.value = true

    await navigateTo('/admin/pdv/despesas')
  }
  catch (err) {
    console.error('Erro ao salvar despesa:', err)
    snackbarMsg.value = 'Erro ao salvar despesa.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
  finally {
    salvando.value = false
  }
}

// ─── Comprovantes ─────────────────────────────────────────────────────────────
async function loadComprovantes() {
  try {
    const c = await useAuth().getAuthClient()
    const res = await c.request(readItems('pdv_expenses_comprovantes', {
      filter: { expense_id: { _eq: id } },
      fields: ['id', 'expense_id', 'directus_files_id.*'],
      sort: ['-id'],
      limit: -1,
    } as never))
    comprovantes.value = (res as unknown as PdvExpensesComprovante[]) ?? []
  }
  catch (e) {
    console.error('loadComprovantes error', e)
    comprovantes.value = []
  }
}

async function attachFiles(files: File[]) {
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
      expense_id: id,
      directus_files_id: uploaded.id,
    } as never))
  }
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
    await c.request(deleteItem('pdv_expenses_comprovantes', comprToRemove.value.id as never))
    removeComprDialog.value = false
    comprToRemove.value = null
    await loadComprovantes()
  }
  catch {
    snackbarMsg.value = 'Erro ao remover comprovante.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

function getComprFile(d: unknown): { id?: string, title?: string, type?: string, filesize?: number } | null {
  if (!d)
    return null
  return typeof d === 'object' ? d as { id?: string, title?: string, type?: string, filesize?: number } : { id: d as string }
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

// ─── Arquivar ─────────────────────────────────────────────────────────────────
async function arquivarDespesa() {
  archiving.value = true
  try {
    const c = await useAuth().getAuthClient()
    await c.request(updateItem('pdv_expenses', id, { status: 'archived' } as never))
    archiveDialog.value = false
    await navigateTo('/admin/pdv/despesas')
  }
  catch (err) {
    console.error('Erro ao arquivar despesa:', err)
    snackbarMsg.value = 'Erro ao arquivar despesa.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
  finally {
    archiving.value = false
  }
}

// ─── Responsável ──────────────────────────────────────────────────────────────
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

    const created = await c.request(createItem('catolico', payload as never)) as { id: string }

    // Recarrega lista de católicos
    const catRes = await c.request(readItems('catolico', {
      filter: { status: { _eq: 'published' } },
      sort: ['nome'],
      fields: ['id', 'nome'],
      limit: -1,
    } as never))
    catolicos.value = (catRes as unknown as { id: string, nome: string }[]) || []

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
</script>

<template>
  <v-container fluid class="pa-2 pa-md-6">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between mb-4 mb-sm-6">
      <div>
        <div class="d-flex align-center mb-2">
          <v-btn variant="text" icon="mdi-arrow-left" class="me-2" to="/admin/pdv/despesas" />
          <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
            Editar Despesa
          </h1>
        </div>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0 ms-11">
          Altere os dados, anexe comprovantes ou arquive a despesa
        </p>
      </div>
      <div class="mt-3 mt-sm-0">
        <v-btn
          variant="tonal"
          color="error"
          prepend-icon="mdi-archive-arrow-down-outline"
          @click="archiveDialog = true"
        >
          Arquivar
        </v-btn>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="d-flex justify-center pa-12">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <template v-else>
      <v-row>
        <!-- Coluna: Dados da despesa -->
        <v-col cols="12" md="7">
          <v-card elevation="2" rounded="lg">
            <v-card-title class="d-flex align-center pa-4">
              <v-icon color="error" class="me-2">
                mdi-cash-minus
              </v-icon>
              <span class="text-h6">Dados da Despesa</span>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-4">
              <v-form ref="formRef" validate-on="input lazy" @submit.prevent="salvar">
                <v-row>
                  <v-col cols="12">
                    <v-text-field
                      v-model="form.descricao"
                      label="Descrição *"
                      :rules="[rules.required]"
                      prepend-inner-icon="mdi-text-short"
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-select
                      v-model="form.categoria"
                      :items="categoriaOpcoes"
                      item-title="title"
                      item-value="value"
                      label="Categoria *"
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
                    </v-autocomplete>
                  </v-col>

                  <v-col cols="12">
                    <v-textarea
                      v-model="form.observacao"
                      label="Observação (opcional)"
                      rows="3"
                      auto-grow
                      prepend-inner-icon="mdi-note-outline"
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-switch
                      v-model="form.paid"
                      label="Pago?"
                      color="success"
                      inset
                    />
                  </v-col>

                  <v-col v-if="form.paid" cols="12" sm="6">
                    <v-select
                      v-model="form.payment_method"
                      :items="PAYMENT_METHOD_OPTIONS"
                      item-title="title"
                      item-value="value"
                      label="Forma de Pagamento *"
                      prepend-inner-icon="mdi-cash-multiple"
                    />
                  </v-col>
                </v-row>

                <div class="d-flex justify-end ga-2 mt-4">
                  <v-btn variant="text" to="/admin/pdv/despesas">
                    Cancelar
                  </v-btn>
                  <v-btn
                    color="primary"
                    variant="elevated"
                    :loading="salvando"
                    prepend-icon="mdi-content-save"
                    type="submit"
                  >
                    Salvar Alterações
                  </v-btn>
                </div>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Coluna: Comprovantes -->
        <v-col cols="12" md="5">
          <v-card elevation="2" rounded="lg">
            <v-card-title class="d-flex align-center pa-4">
              <v-icon color="primary" class="me-2">
                mdi-paperclip
              </v-icon>
              <span class="text-h6">Comprovantes</span>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-4">
              <!-- Upload novos -->
              <v-file-upload
                v-model="pendingFiles"
                multiple
                clearable
                density="comfortable"
                accept="image/*,application/pdf"
                icon="mdi-cloud-upload-outline"
                title="Arraste e solte os arquivos aqui"
                subtitle="PNG, JPG e PDF"
                browse-text="Selecionar arquivos"
                divider-text="ou"
                inset-file-list
              />

              <!-- Comprovantes existentes -->
              <div v-if="comprovantes.length > 0" class="mt-4">
                <div class="text-subtitle-2 font-weight-medium mb-2">
                  Anexados
                </div>
                <v-list lines="one" density="compact" class="pa-0">
                  <v-list-item
                    v-for="comp in comprovantes"
                    :key="comp.id"
                    :prepend-icon="fileIcon(getComprFile(comp.directus_files_id)?.type)"
                    rounded="lg"
                    class="border mb-1"
                  >
                    <v-list-item-title class="text-body-2">
                      {{ getComprFile(comp.directus_files_id)?.title ?? 'Arquivo' }}
                      <span class="text-caption text-disabled ms-2">
                        {{ formatBytes(getComprFile(comp.directus_files_id)?.filesize) }}
                      </span>
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
              </div>
              <p v-else class="text-caption text-disabled mt-4 mb-0">
                Nenhum comprovante anexado.
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Dialog: Arquivar -->
    <v-dialog v-model="archiveDialog" max-width="400">
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon color="error" class="me-2">
            mdi-archive-arrow-down-outline
          </v-icon>
          <span class="text-h6">Arquivar Despesa</span>
        </v-card-title>
        <v-card-text class="pa-4">
          Esta despesa será arquivada e não aparecerá mais na listagem. A operação pode ser revertida pelo Directus.
        </v-card-text>
        <v-card-actions class="pa-3 justify-end ga-2">
          <v-btn variant="text" @click="archiveDialog = false">
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            variant="tonal"
            prepend-icon="mdi-archive-arrow-down-outline"
            :loading="archiving"
            @click="arquivarDespesa"
          >
            Arquivar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog: Novo Responsável -->
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
                  :rules="[rules.required]"
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
          <v-btn
            color="primary"
            variant="elevated"
            :loading="creatingResponsavel"
            :disabled="!responsavelFormValid"
            prepend-icon="mdi-content-save"
            @click="saveResponsavel"
          >
            Salvar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog: Remover comprovante -->
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
          <v-btn color="error" variant="tonal" @click="performRemoveCompr">
            Remover
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="bottom end">
      {{ snackbarMsg }}
    </v-snackbar>
  </v-container>
</template>
