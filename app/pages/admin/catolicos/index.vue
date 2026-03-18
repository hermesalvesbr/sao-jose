<script setup lang="ts">
import type { Catolico } from '~/types/schema'
/**
 * Cadastro de Católicos — CRUD completo
 *
 * Gerencia o cadastro de paroquianos usados como responsável
 * em despesas, receitas e dízimos.
 */
import { createItem, readItems, updateItem } from '@directus/sdk'
import { brToIsoDate, formatDate, isoToBrDate } from '~/composables/usePdvReport'

definePageMeta({ layout: 'admin' })

// ─── State ────────────────────────────────────────────────────────────────────
const items = ref<Partial<Catolico>[]>([])
const loading = ref(false)
const search = ref('')
const dialog = ref(false)
const archiveDialog = ref(false)
const editingId = ref<string | null>(null)
const itemToArchive = ref<Partial<Catolico> | null>(null)
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

const formRef = ref()
const formValid = ref(false)

const form = ref({
  nome: '',
  telefone: '',
  sexo: '' as '' | 'M' | 'F',
  nascimento: '' as string,
})

// ─── Table headers ────────────────────────────────────────────────────────────
const headers = [
  { title: 'Nome', key: 'nome', sortable: true },
  { title: 'Telefone', key: 'telefone', width: '160px', sortable: false },
  { title: 'Sexo', key: 'sexo', width: '80px', sortable: true },
  { title: 'Nascimento', key: 'nascimento', width: '130px', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'end' as const, width: '80px' },
]

// ─── Computed ─────────────────────────────────────────────────────────────────
const filteredItems = computed(() => {
  if (!search.value)
    return items.value
  const term = search.value.toLowerCase()
  return items.value.filter(i =>
    i.nome?.toLowerCase().includes(term)
    || i.telefone?.includes(term),
  )
})

const isEditing = computed(() => editingId.value !== null)
const dialogTitle = computed(() => isEditing.value ? 'Editar Católico' : 'Novo Católico')

// ─── Validation ───────────────────────────────────────────────────────────────
const rules = {
  required: (v: unknown) => !!v || 'Campo obrigatório',
}

// ─── Data loading ─────────────────────────────────────────────────────────────
async function loadData() {
  loading.value = true
  try {
    const c = await useAuth().getAuthClient()
    const result = await c.request(readItems('catolico', {
      filter: { status: { _eq: 'published' } },
      sort: ['nome'],
      limit: -1,
      fields: ['id', 'status', 'nome', 'telefone', 'sexo', 'nascimento'],
    }))
    items.value = (result as Partial<Catolico>[]) ?? []
  }
  catch (e) {
    console.error('Erro ao carregar católicos:', e)
  }
  finally {
    loading.value = false
  }
}

onMounted(loadData)

// ─── Dialog actions ───────────────────────────────────────────────────────────
function openNew() {
  editingId.value = null
  form.value = { nome: '', telefone: '', sexo: '', nascimento: '' }
  dialog.value = true
}

function openEdit(item: Partial<Catolico>) {
  editingId.value = item.id ?? null
  form.value = {
    nome: item.nome ?? '',
    telefone: item.telefone ?? '',
    sexo: (item.sexo as '' | 'M' | 'F') ?? '',
    nascimento: isoToBrDate(item.nascimento as string),
  }
  dialog.value = true
}

async function saveForm() {
  const { valid } = await formRef.value?.validate()
  if (!valid)
    return

  loading.value = true
  try {
    const c = await useAuth().getAuthClient()
    const payload: Record<string, unknown> = {
      nome: form.value.nome,
      status: 'published',
    }
    if (form.value.telefone)
      payload.telefone = form.value.telefone
    if (form.value.sexo)
      payload.sexo = form.value.sexo
    if (form.value.nascimento)
      payload.nascimento = brToIsoDate(form.value.nascimento)

    if (isEditing.value) {
      await c.request(updateItem('catolico', editingId.value!, payload as any))
    }
    else {
      await c.request(createItem('catolico', payload as any))
    }
    dialog.value = false
    snackbarMsg.value = 'Católico salvo com sucesso!'
    snackbarColor.value = 'success'
    snackbar.value = true
    await loadData()
  }
  catch (e) {
    console.error('Erro ao salvar católico:', e)
    snackbarMsg.value = 'Erro ao salvar. Tente novamente.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
  finally {
    loading.value = false
  }
}

function confirmArchive(item: Partial<Catolico>) {
  itemToArchive.value = item
  archiveDialog.value = true
}

async function performArchive() {
  if (!itemToArchive.value?.id)
    return
  loading.value = true
  try {
    const c = await useAuth().getAuthClient()
    await c.request(updateItem('catolico', itemToArchive.value.id, { status: 'archived' } as any))
    archiveDialog.value = false
    itemToArchive.value = null
    snackbarMsg.value = 'Cadastro arquivado.'
    snackbarColor.value = 'success'
    snackbar.value = true
    await loadData()
  }
  catch (e) {
    console.error('Erro ao arquivar:', e)
    snackbarMsg.value = 'Erro ao arquivar.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
  finally {
    loading.value = false
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const NON_DIGIT_RE = /\D/g

function formatPhone(phone: string | undefined | null): string {
  if (!phone)
    return '—'
  const digits = phone.replace(NON_DIGIT_RE, '')
  if (digits.length === 11)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  if (digits.length === 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return phone
}
</script>

<template>
  <v-container fluid class="pa-2 pa-md-6">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between mb-5">
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
          Católicos
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Paroquianos vinculados a despesas, receitas e dízimos
        </p>
      </div>
      <v-btn
        color="primary"
        variant="elevated"
        prepend-icon="mdi-plus"
        class="mt-3 mt-sm-0"
        size="large"
        @click="openNew"
      >
        Novo Cadastro
      </v-btn>
    </div>

    <!-- Filtro -->
    <v-card :elevation="0" class="border mb-4" rounded="xl">
      <v-card-text class="py-3">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Buscar por nome ou telefone..."
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="max-width: 400px;"
        />
      </v-card-text>
    </v-card>

    <!-- Contador -->
    <div class="d-flex justify-end mb-3">
      <v-chip prepend-icon="mdi-account-group-outline" variant="tonal" color="secondary">
        {{ filteredItems.length }} cadastro{{ filteredItems.length !== 1 ? 's' : '' }}
      </v-chip>
    </div>

    <!-- Tabela -->
    <v-card :elevation="0" class="border" rounded="xl">
      <v-data-table
        :headers="headers"
        :items="filteredItems"
        :loading="loading"
        hover
        items-per-page="25"
        no-data-text="Nenhum cadastro encontrado"
      >
        <template #[`item.nome`]="{ item }">
          <div class="d-flex align-center ga-2">
            <v-avatar
              :color="item.sexo === 'F' ? 'pink-lighten-4' : 'blue-lighten-4'"
              size="32"
            >
              <v-icon :icon="item.sexo === 'F' ? 'mdi-human-female' : 'mdi-human-male'" size="18" />
            </v-avatar>
            <span class="text-body-2 font-weight-medium">{{ item.nome }}</span>
          </div>
        </template>

        <template #[`item.telefone`]="{ item }">
          <span class="text-body-2">{{ formatPhone(item.telefone) }}</span>
        </template>

        <template #[`item.sexo`]="{ item }">
          <v-chip
            v-if="item.sexo"
            size="small"
            :color="item.sexo === 'F' ? 'pink' : 'blue'"
            variant="tonal"
            label
          >
            {{ item.sexo === 'F' ? 'F' : 'M' }}
          </v-chip>
          <span v-else class="text-disabled">—</span>
        </template>

        <template #[`item.nascimento`]="{ item }">
          <span class="text-body-2">{{ formatDate(item.nascimento as string) || '—' }}</span>
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
              icon="mdi-archive-arrow-down-outline"
              variant="text"
              size="small"
              color="error"
              @click="confirmArchive(item)"
            >
              <v-tooltip activator="parent" location="top">
                Arquivar
              </v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- New/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="480" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center pa-5 pb-3">
          <v-icon icon="mdi-account-plus-outline" color="primary" class="me-2" />
          {{ dialogTitle }}
        </v-card-title>

        <v-card-text class="px-5 pb-0">
          <v-form ref="formRef" v-model="formValid" validate-on="input lazy">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="form.nome"
                  label="Nome completo *"
                  variant="outlined"
                  :rules="[rules.required]"
                  prepend-inner-icon="mdi-account-outline"
                  autofocus
                />
              </v-col>
              <v-col cols="12" sm="7">
                <v-text-field
                  v-model="form.telefone"
                  label="Telefone / WhatsApp"
                  variant="outlined"
                  prepend-inner-icon="mdi-phone-outline"
                  placeholder="(00) 00000-0000"
                />
              </v-col>
              <v-col cols="12" sm="5">
                <v-select
                  v-model="form.sexo"
                  :items="[{ value: 'M', title: 'Masculino' }, { value: 'F', title: 'Feminino' }]"
                  item-title="title"
                  item-value="value"
                  label="Sexo"
                  variant="outlined"
                  prepend-inner-icon="mdi-gender-male-female"
                  clearable
                />
              </v-col>
              <v-col cols="12" sm="6">
                <MaskedDateField
                  v-model="form.nascimento"
                  label="Data de nascimento"
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
            variant="elevated"
            :loading="loading"
            prepend-icon="mdi-content-save"
            @click="saveForm"
          >
            Salvar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Archive dialog -->
    <v-dialog v-model="archiveDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-text class="pa-6 text-center">
          <v-icon icon="mdi-archive-outline" color="warning" size="56" class="mb-4" />
          <h3 class="text-h6 font-weight-bold mb-2">
            Arquivar cadastro?
          </h3>
          <p class="text-body-2 text-medium-emphasis mb-0">
            <strong>{{ itemToArchive?.nome }}</strong> não aparecerá mais
            nos seletores de responsável.
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="archiveDialog = false">
            Cancelar
          </v-btn>
          <v-btn color="error" variant="tonal" prepend-icon="mdi-archive-arrow-down-outline" :loading="loading" @click="performArchive">
            Arquivar
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
