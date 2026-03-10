<script setup lang="ts">
import type { ReceitasFile } from '~/types/schema'
import { createItem, deleteItem, readItems, uploadFiles } from '@directus/sdk'
/**
 * Editar Receita — Formulário de edição
 *
 * Carrega a receita pelo ID e permite editar todos os campos.
 */
import { brToIsoDate, isoToBrDate } from '~/composables/usePdvReport'
import { MEIO_PAGAMENTO_LABELS, TIPO_RECEITA_LABELS } from '~/composables/useReceitas'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const id = computed(() => route.params.id as string)

const {
  fetchReceitaById,
  atualizarReceita,
  loading,
} = useReceitas()

// ─── Opções de select ─────────────────────────────────────────────────────────
const tipoOpcoes = Object.entries(TIPO_RECEITA_LABELS).map(([value, title]) => ({ value, title }))
const meioOpcoes = Object.entries(MEIO_PAGAMENTO_LABELS).map(([value, title]) => ({ value, title }))

// ─── Católicos para autocomplete ──────────────────────────────────────────────
const catolicos = ref<{ id: string, nome: string }[]>([])

async function loadCatolicos() {
  try {
    const client = await useAuth().getAuthClient()
    const result = await client.request(readItems('catolico', {
      filter: { status: { _eq: 'published' } },
      sort: ['nome'],
      fields: ['id', 'nome'],
      limit: -1,
    }))
    catolicos.value = (result as { id: string, nome: string }[]) ?? []
  }
  catch (e) {
    console.error('Erro ao carregar católicos:', e)
  }
}

// ─── Form state ───────────────────────────────────────────────────────────────
const formRef = ref()
const formValid = ref(false)
const notFound = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

const form = ref({
  tipo: null as string | null,
  descricao: '',
  valor: undefined as number | undefined,
  data: '',
  meio_pagamento: null as string | null,
  responsavel_id: null as string | null,
  observacao: '',
})

// ─── Comprovantes ─────────────────────────────────────────────────────────────────
const directusUrl = useRuntimeConfig().public.directus.url as string
const comprovantes = ref<ReceitasFile[]>([])
const pendingFiles = ref<File[]>([])
const removeComprDialog = ref(false)
const comprToRemove = ref<ReceitasFile | null>(null)

async function loadForm() {
  const receita = await fetchReceitaById(id.value)
  if (!receita) {
    notFound.value = true
    return
  }
  const resp = receita.responsavel_id
  form.value = {
    tipo: receita.tipo ?? null,
    descricao: receita.descricao ?? '',
    valor: receita.valor ?? undefined,
    data: isoToBrDate(receita.data as string),
    meio_pagamento: receita.meio_pagamento ?? null,
    responsavel_id: (typeof resp === 'object' && resp) ? (resp as any).id : resp ?? null,
    observacao: receita.observacao ?? '',
  }
}

// ─── Regras de validação ──────────────────────────────────────────────────────
const rules = {
  required: (v: unknown) => !!v || 'Campo obrigatório',
  positive: (v: unknown) => {
    const n = Number(v)
    return (!Number.isNaN(n) && n > 0) || 'Informe um valor positivo'
  },
}

// ─── Submit ───────────────────────────────────────────────────────────────────
async function submit() {
  const { valid } = await formRef.value?.validate()
  if (!valid)
    return

  try {
    const payload: Record<string, unknown> = {
      tipo: form.value.tipo,
      descricao: form.value.descricao,
      valor: Number(form.value.valor),
      data: brToIsoDate(form.value.data),
      meio_pagamento: form.value.meio_pagamento,
      observacao: form.value.observacao || null,
    }
    if (form.value.responsavel_id)
      payload.responsavel_id = form.value.responsavel_id
    else
      payload.responsavel_id = null

    await atualizarReceita(id.value, payload as any)

    // Upload pending files
    if (pendingFiles.value.length) {
      await attachFiles(pendingFiles.value)
      pendingFiles.value = []
    }

    await navigateTo('/admin/receitas')
  }
  catch {
    snackbarMsg.value = 'Erro ao salvar receita. Tente novamente.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([loadForm(), loadCatolicos(), loadComprovantes()])
})

// ─── Comprovantes helpers ──────────────────────────────────────────────────────
async function loadComprovantes() {
  try {
    const c = await useAuth().getAuthClient()
    const res = await c.request(readItems('receitas_files', {
      filter: { receitas_id: { _eq: id.value } },
      fields: ['id', 'receitas_id', 'directus_files_id.*'],
      sort: ['-id'],
      limit: -1,
    } as never))
    comprovantes.value = (res as unknown as ReceitasFile[]) ?? []
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
    await c.request(createItem('receitas_files', {
      receitas_id: id.value,
      directus_files_id: uploaded.id,
    } as never))
  }
}

function confirmRemoveCompr(item: ReceitasFile) {
  comprToRemove.value = item
  removeComprDialog.value = true
}

async function performRemoveCompr() {
  if (!comprToRemove.value)
    return
  try {
    const c = await useAuth().getAuthClient()
    await c.request(deleteItem('receitas_files', comprToRemove.value.id as never))
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
</script>

<template>
  <v-container fluid class="pa-2 pa-md-6" style="max-width: 700px;">
    <!-- Not found -->
    <v-alert v-if="notFound" type="error" variant="tonal" class="mb-4">
      Receita não encontrada.
      <template #append>
        <v-btn variant="text" to="/admin/receitas" :exact="true">
          Voltar
        </v-btn>
      </template>
    </v-alert>

    <template v-if="!notFound">
      <!-- Header -->
      <div class="d-flex align-center mb-5">
        <v-btn
          icon="mdi-arrow-left"
          variant="text"
          color="secondary"
          class="me-2"
          to="/admin/receitas"
          :exact="true"
        />
        <div>
          <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1 mb-0">
            Editar Receita
          </h1>
          <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
            Atualize os dados e gerencie os comprovantes
          </p>
        </div>
      </div>

      <!-- Form card -->
      <v-card :elevation="0" class="border mb-4" rounded="xl">
        <v-card-text class="pa-5 pa-md-6">
          <v-form ref="formRef" v-model="formValid" validate-on="input lazy">
            <v-row>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="form.tipo"
                  :items="tipoOpcoes"
                  item-title="title"
                  item-value="value"
                  label="Tipo *"
                  variant="outlined"
                  :rules="[rules.required]"
                  prepend-inner-icon="mdi-tag-outline"
                />
              </v-col>

              <v-col cols="12" sm="6">
                <MaskedDateField
                  v-model="form.data"
                  label="Data *"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="form.descricao"
                  label="Descrição *"
                  variant="outlined"
                  :rules="[rules.required]"
                  prepend-inner-icon="mdi-text-short"
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
                <v-select
                  v-model="form.meio_pagamento"
                  :items="meioOpcoes"
                  item-title="title"
                  item-value="value"
                  label="Meio de recebimento *"
                  variant="outlined"
                  :rules="[rules.required]"
                  prepend-inner-icon="mdi-cash"
                />
              </v-col>

              <v-col cols="12">
                <v-autocomplete
                  v-model="form.responsavel_id"
                  :items="catolicos"
                  item-title="nome"
                  item-value="id"
                  label="Responsável pelo recebimento (opcional)"
                  variant="outlined"
                  prepend-inner-icon="mdi-account-outline"
                  clearable
                  no-data-text="Nenhum paroquiano encontrado"
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

        <v-divider />
        <v-card-actions class="pa-5">
          <v-btn variant="text" color="secondary" to="/admin/receitas" :exact="true">
            Cancelar
          </v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            variant="elevated"
            :loading="loading"
            prepend-icon="mdi-content-save"
            @click="submit"
          >
            Salvar Alterações
          </v-btn>
        </v-card-actions>
      </v-card>

      <!-- Comprovantes / Anexos -->
      <v-card :elevation="0" class="border mt-4" rounded="xl">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon color="primary" class="me-2">
            mdi-paperclip
          </v-icon>
          <span class="text-h6">Comprovantes</span>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
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
    </template>

    <!-- Dialog: Remover comprovante -->
    <v-dialog v-model="removeComprDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center pa-5 pb-3">
          <v-icon color="warning" class="me-2">
            mdi-alert-outline
          </v-icon>
          Remover comprovante?
        </v-card-title>
        <v-card-text class="px-5">
          O arquivo será desvinculado desta receita.
        </v-card-text>
        <v-card-actions class="pa-5 pt-0">
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

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="bottom end">
      {{ snackbarMsg }}
    </v-snackbar>
  </v-container>
</template>
