<script setup lang="ts">
import type { ReceitaPagamento } from '~/types/custom'
import type { ReceitasFile } from '~/types/schema'
import { createItem, deleteItem, readItems, uploadFiles } from '@directus/sdk'
import { brToIsoDate, formatCurrency, isoToBrDate } from '~/composables/usePdvReport'
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

async function loadCatolicos(): Promise<void> {
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
const notFound = ref(false)
const salvando = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

const form = ref({
  tipo: null as string | null,
  descricao: '',
  data: '',
  pagamentos: [{ meio: null as string | null, valor: undefined as number | undefined }],
  responsavel_id: null as string | null,
  observacao: '',
})

const totalPagamentos = computed(() =>
  form.value.pagamentos.reduce((sum, p) => sum + (Number(p.valor) || 0), 0),
)

function addPagamento(): void {
  form.value.pagamentos.push({ meio: null, valor: undefined })
}

function removePagamento(index: number): void {
  form.value.pagamentos.splice(index, 1)
}

// ─── Comprovantes ─────────────────────────────────────────────────────────────
const directusUrl = useRuntimeConfig().public.directus.url as string
const comprovantes = ref<ReceitasFile[]>([])
const pendingFiles = ref<File[]>([])
const uploading = ref(false)
const removeComprDialog = ref(false)
const comprToRemove = ref<ReceitasFile | null>(null)

async function loadForm(): Promise<void> {
  const receita = await fetchReceitaById(id.value)
  if (!receita) {
    notFound.value = true
    return
  }
  const resp = receita.responsavel_id
  // Backward compat: se pagamentos não estiver salvo, sintetiza do valor+meio_pagamento legado
  const rawPag = receita.pagamentos
  const pagamentos: Array<{ meio: string | null, valor: number | undefined }>
    = Array.isArray(rawPag) && rawPag.length > 0
      ? rawPag.map((p: ReceitaPagamento) => ({ meio: p.meio, valor: p.valor }))
      : [{ meio: receita.meio_pagamento ?? null, valor: receita.valor ?? undefined }]

  form.value = {
    tipo: receita.tipo ?? null,
    descricao: receita.descricao ?? '',
    data: isoToBrDate(receita.data as string),
    pagamentos,
    responsavel_id: (typeof resp === 'object' && resp) ? (resp as { id: string }).id : resp ?? null,
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
async function submit(): Promise<void> {
  const { valid } = await formRef.value?.validate()
  if (!valid)
    return

  salvando.value = true
  try {
    const pagamentos: ReceitaPagamento[] = form.value.pagamentos
      .filter(p => p.meio && Number(p.valor) > 0)
      .map(p => ({ meio: p.meio!, valor: Number(p.valor) }))

    const valor = pagamentos.reduce((s, p) => s + p.valor, 0)
    const meio_pagamento = pagamentos.length === 1 ? (pagamentos[0]?.meio ?? null) : null

    const payload: Record<string, unknown> = {
      tipo: form.value.tipo,
      descricao: form.value.descricao,
      valor,
      data: brToIsoDate(form.value.data),
      pagamentos,
      meio_pagamento,
      observacao: form.value.observacao || null,
      responsavel_id: form.value.responsavel_id || null,
    }

    await atualizarReceita(id.value, payload as never)
    await navigateTo('/admin/receitas')
  }
  catch {
    snackbarMsg.value = 'Erro ao salvar receita. Tente novamente.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
  finally {
    salvando.value = false
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([loadForm(), loadCatolicos(), loadComprovantes()])
})

// ─── Upload imediato ao selecionar arquivos ────────────────────────────────────
watch(pendingFiles, async (files) => {
  if (!files.length)
    return
  uploading.value = true
  try {
    await attachFiles(files)
    pendingFiles.value = []
    await loadComprovantes()
    snackbarMsg.value = `${files.length} arquivo(s) anexado(s) com sucesso!`
    snackbarColor.value = 'success'
    snackbar.value = true
  }
  catch {
    snackbarMsg.value = 'Erro ao enviar arquivo(s). Tente novamente.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
  finally {
    uploading.value = false
  }
})

// ─── Comprovantes helpers ──────────────────────────────────────────────────────
async function loadComprovantes(): Promise<void> {
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

async function attachFiles(files: File[]): Promise<void> {
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

function confirmRemoveCompr(item: ReceitasFile): void {
  comprToRemove.value = item
  removeComprDialog.value = true
}

async function performRemoveCompr(): Promise<void> {
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
  <v-container fluid class="pa-2 pa-md-6">
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
      <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between mb-4 mb-sm-6">
        <div>
          <div class="d-flex align-center mb-2">
            <v-btn variant="text" icon="mdi-arrow-left" class="me-2" to="/admin/receitas" :exact="true" />
            <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
              Editar Receita
            </h1>
          </div>
          <p class="text-body-2 text-medium-emphasis mt-1 mb-0 ms-11">
            Atualize os dados e gerencie os comprovantes
          </p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="d-flex justify-center pa-12">
        <v-progress-circular indeterminate color="primary" size="48" />
      </div>

      <v-row v-else>
        <!-- Coluna: Dados da receita -->
        <v-col cols="12" md="7">
          <v-card elevation="2" rounded="lg">
            <v-card-title class="d-flex align-center pa-4">
              <v-icon color="success" class="me-2">
                mdi-cash-plus
              </v-icon>
              <span class="text-h6">Dados da Receita</span>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-4">
              <v-form ref="formRef" validate-on="input lazy" @submit.prevent="submit">
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-select
                      v-model="form.tipo"
                      :items="tipoOpcoes"
                      item-title="title"
                      item-value="value"
                      label="Tipo *"
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
                      :rules="[rules.required]"
                      prepend-inner-icon="mdi-text-short"
                    />
                  </v-col>

                  <!-- Meios de pagamento -->
                  <v-col cols="12">
                    <div class="text-subtitle-2 font-weight-medium mb-3">
                      Meios de recebimento *
                    </div>
                    <div
                      v-for="(pag, i) in form.pagamentos"
                      :key="i"
                      class="d-flex ga-2 align-start mb-2"
                    >
                      <v-select
                        v-model="pag.meio"
                        :items="meioOpcoes"
                        item-title="title"
                        item-value="value"
                        label="Meio *"
                        class="flex-shrink-0"
                        style="min-width: 170px; max-width: 220px;"
                        :rules="[rules.required]"
                        prepend-inner-icon="mdi-cash"
                      />
                      <MaskedCurrencyField
                        v-model="pag.valor"
                        label="Valor R$ *"
                        class="flex-grow-1"
                        :rules="[rules.positive]"
                        :min-value="0.01"
                      />
                      <v-btn
                        v-if="form.pagamentos.length > 1"
                        icon="mdi-delete-outline"
                        variant="text"
                        color="error"
                        size="small"
                        class="mt-1 flex-shrink-0"
                        @click="removePagamento(i)"
                      />
                    </div>
                    <div class="d-flex align-center justify-space-between mt-2">
                      <v-btn
                        variant="tonal"
                        color="primary"
                        prepend-icon="mdi-plus"
                        size="small"
                        @click="addPagamento"
                      >
                        Adicionar meio
                      </v-btn>
                      <span v-if="form.pagamentos.length > 1" class="text-body-2 font-weight-medium text-success">
                        Total: {{ formatCurrency(totalPagamentos) }}
                      </span>
                    </div>
                  </v-col>

                  <v-col cols="12">
                    <v-autocomplete
                      v-model="form.responsavel_id"
                      :items="catolicos"
                      item-title="nome"
                      item-value="id"
                      label="Responsável pelo recebimento (opcional)"
                      prepend-inner-icon="mdi-account-outline"
                      clearable
                      no-data-text="Nenhum paroquiano encontrado"
                    />
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
                </v-row>

                <div class="d-flex justify-end ga-2 mt-4">
                  <v-btn variant="text" to="/admin/receitas" :exact="true">
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
              <v-spacer />
              <v-chip v-if="comprovantes.length > 0" size="small" color="primary" variant="tonal">
                {{ comprovantes.length }}
              </v-chip>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-4">
              <!-- Upload novos -->
              <v-file-upload
                v-model="pendingFiles"
                :disabled="uploading"
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

              <!-- Upload em andamento -->
              <div v-if="uploading" class="d-flex align-center ga-2 mt-3">
                <v-progress-circular indeterminate color="primary" size="18" width="2" />
                <span class="text-caption text-medium-emphasis">Enviando...</span>
              </div>

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
              <p v-else-if="!uploading" class="text-caption text-disabled mt-4 mb-0">
                Nenhum comprovante anexado.
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Dialog: Remover comprovante -->
    <v-dialog v-model="removeComprDialog" max-width="380">
      <v-card rounded="xl">
        <v-card-text class="pa-5 text-center">
          <v-icon icon="mdi-alert-circle-outline" color="error" size="48" class="mb-3" />
          <p class="text-body-1 mb-0">
            Remover este comprovante?
          </p>
          <p class="text-caption text-disabled mt-1 mb-0">
            O arquivo será desvinculado desta receita.
          </p>
        </v-card-text>
        <v-card-actions class="pa-5 pt-0 justify-end ga-2">
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
