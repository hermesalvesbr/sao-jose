<script setup lang="ts">
import { createItem, readItems, uploadFiles } from '@directus/sdk'
import { brToIsoDate, isoToBrDate, toLocalISO } from '~/composables/usePdvReport'

definePageMeta({ layout: 'admin' })

const { createExpense, fetchOperators, createOperator } = usePdv()

const loading = ref(false)
const creatingResponsavel = ref(false)
const responsavelDialog = ref(false)
const responsavelSearch = ref('')
const catolicos = ref<{ id: string, nome: string }[]>([])
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref<'success' | 'error'>('success')
const currentOperatorId = ref<string | null>(null)

const formRef = ref()
const formValid = ref(false)
const responsavelFormRef = ref()
const responsavelFormValid = ref(false)

const form = ref({
  descricao: '',
  valor: undefined as number | undefined,
  data_despesa: isoToBrDate(toLocalISO(new Date())),
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

const pendingComprovantes = ref<File[]>([])

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

function normalizeName(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .trim()
    .toLowerCase()
}

async function loadCatolicos() {
  const c = await useAuth().getAuthClient()
  const catRes = await c.request(readItems('catolico', {
    filter: { status: { _eq: 'published' } },
    sort: ['nome'],
    fields: ['id', 'nome'],
    limit: -1,
  } as never))

  catolicos.value = (catRes as unknown as { id: string, nome: string }[]) || []
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
  const existing = operators.find((operator) => {
    const normalizedOperator = normalizeName(operator?.name)
    return normalizedOperator === normalizedDesired || (normalizedFirstName && normalizedOperator === normalizedFirstName)
  })

  if (existing?.id) {
    currentOperatorId.value = existing.id
    return currentOperatorId.value
  }

  const created = await createOperator({
    name: desiredName,
    active: true,
  } as never) as { id: string }

  currentOperatorId.value = created.id
  return currentOperatorId.value
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
    } as never))
  }
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

function openResponsavelDialog() {
  responsavelForm.value = {
    nome: responsavelSearch.value?.trim() || '',
    telefone: '',
    sexo: null,
    nascimento: '',
  }
  responsavelDialog.value = true
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
      paid: form.value.paid,
      payment_method: form.value.payment_method,
      status: 'published',
    }

    const createdExpense = await createExpense(payload as never) as { id?: number }

    if (!createdExpense?.id)
      throw new Error('Não foi possível criar a despesa')

    if (pendingComprovantes.value.length)
      await attachFilesToExpense(createdExpense.id, pendingComprovantes.value)

    snackbarMsg.value = 'Despesa salva com sucesso!'
    snackbarColor.value = 'success'
    snackbar.value = true

    await navigateTo('/admin/pdv/despesas')
  }
  catch (error) {
    console.error('Error creating expense', error)
    snackbarMsg.value = 'Erro ao salvar despesa.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
  finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadCatolicos(), ensureCurrentOperatorId()])
})
</script>

<template>
  <v-container fluid class="pa-2 pa-md-6">
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between mb-4 mb-sm-6">
      <div>
        <div class="d-flex align-center mb-2">
          <v-btn variant="text" icon="mdi-arrow-left" class="me-2" to="/admin/pdv/despesas" />
          <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
            Nova Despesa
          </h1>
        </div>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0 ms-11">
          Cadastre a despesa e anexe recibos ou notas fiscais
        </p>
      </div>
    </div>

    <v-card elevation="2" rounded="lg">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon color="error" class="me-2">
          mdi-cash-minus
        </v-icon>
        <span class="text-h6">Dados da Despesa</span>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        <v-form ref="formRef" v-model="formValid" validate-on="input lazy" @submit.prevent="saveForm">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="form.descricao"
                label="Descrição *"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-text-short"
                autofocus
              />
            </v-col>

            <v-col cols="12" md="6">
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

            <v-col cols="12" md="6">
              <MaskedCurrencyField
                v-model="form.valor"
                label="Valor R$ *"
                :rules="[rules.required]"
                :min-value="0.01"
              />
            </v-col>

            <v-col cols="12" md="6">
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

            <v-col cols="12">
              <div class="text-subtitle-2 font-weight-medium mb-2 d-flex align-center ga-2">
                <v-icon icon="mdi-paperclip" size="16" />
                <span>Comprovantes (recibo / nota fiscal)</span>
              </div>

              <v-file-upload
                v-model="pendingComprovantes"
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
            </v-col>
          </v-row>

          <div class="d-flex justify-end ga-2 mt-4">
            <v-btn variant="text" to="/admin/pdv/despesas">
              Cancelar
            </v-btn>
            <v-btn
              color="primary"
              variant="elevated"
              :loading="loading"
              prepend-icon="mdi-content-save"
              type="submit"
            >
              Salvar
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

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

    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="bottom end">
      {{ snackbarMsg }}
    </v-snackbar>
  </v-container>
</template>
