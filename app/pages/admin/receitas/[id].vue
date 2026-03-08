<script setup lang="ts">
import type { ReceitaComprovanteItem } from '~/types/comprovantes'
import { readItems } from '@directus/sdk'
/**
 * Editar Receita — Formulário de edição + gestão de comprovantes
 *
 * Carrega a receita pelo ID, permite editar todos os campos e
 * gerenciar comprovantes (NF/recibos) via upload M2M.
 */
import { brToIsoDate, isoToBrDate } from '~/composables/usePdvReport'
import { MEIO_PAGAMENTO_LABELS, TIPO_RECEITA_LABELS } from '~/composables/useReceitas'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const id = computed(() => route.params.id as string)

const {
  fetchReceitaById,
  atualizarReceita,
  fetchComprovantes,
  uploadComprovante,
  removerComprovante,
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
    snackbarMsg.value = 'Receita atualizada com sucesso!'
    snackbarColor.value = 'success'
    snackbar.value = true
  }
  catch {
    snackbarMsg.value = 'Erro ao salvar receita. Tente novamente.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

// ─── Comprovantes ─────────────────────────────────────────────────────────────
const comprovantes = ref<ReceitaComprovanteItem[]>([])
const uploadingFile = ref(false)
const removeDialog = ref(false)
const comprovantToRemove = ref<ReceitaComprovanteItem | null>(null)

async function loadComprovantes() {
  comprovantes.value = await fetchComprovantes(id.value)
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file)
    return
  uploadingFile.value = true
  try {
    await uploadComprovante(id.value, file)
    await loadComprovantes()
    snackbarMsg.value = 'Comprovante anexado com sucesso!'
    snackbarColor.value = 'success'
    snackbar.value = true
  }
  catch {
    snackbarMsg.value = 'Erro ao fazer upload do comprovante.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
  finally {
    uploadingFile.value = false
    // reset input
    input.value = ''
  }
}

function confirmRemove(item: ReceitaComprovanteItem) {
  comprovantToRemove.value = item
  removeDialog.value = true
}

async function performRemove() {
  if (!comprovantToRemove.value)
    return
  await removerComprovante(comprovantToRemove.value.id)
  removeDialog.value = false
  comprovantToRemove.value = null
  await loadComprovantes()
}

// ─── File helpers ─────────────────────────────────────────────────────────────
const directusUrl = useRuntimeConfig().public.directus.url as string

function fileIcon(mime: string | undefined): string {
  if (!mime)
    return 'mdi-file-outline'
  if (mime.startsWith('image/'))
    return 'mdi-file-image-outline'
  if (mime === 'application/pdf')
    return 'mdi-file-pdf-box'
  return 'mdi-file-document-outline'
}

function fileUrl(fileId: string): string {
  return `${directusUrl}/assets/${fileId}`
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

function getFileId(d: string | { id: string } | null | undefined): string | undefined {
  if (!d)
    return undefined
  return typeof d === 'object' ? d.id : d
}

function getFileField(d: string | { id: string, title?: string, type?: string, filesize?: number, filename_download?: string } | null | undefined) {
  if (!d)
    return null
  return typeof d === 'object' ? d : { id: d, title: d, type: undefined, filesize: undefined, filename_download: d }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([loadForm(), loadCatolicos(), loadComprovantes()])
})
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

      <!-- Comprovantes -->
      <v-card :elevation="0" class="border" rounded="xl">
        <v-card-title class="pa-5 pb-3">
          <v-icon icon="mdi-paperclip" color="secondary" class="me-2" />
          Comprovantes
        </v-card-title>

        <v-card-text class="px-5 pb-0">
          <p class="text-body-2 text-medium-emphasis mb-4">
            Anexe notas fiscais, recibos ou fotos de comprovação.
          </p>

          <!-- Upload button -->
          <div class="mb-4">
            <v-btn
              color="primary"
              variant="tonal"
              prepend-icon="mdi-upload"
              :loading="uploadingFile"
              @click="($el as HTMLElement).querySelector<HTMLInputElement>('input[type=file]')?.click()"
            >
              Anexar comprovante
              <input
                type="file"
                accept="image/*,application/pdf,.doc,.docx"
                style="display:none;"
                @change="handleFileUpload"
              >
            </v-btn>
          </div>

          <!-- List of comprovantes -->
          <v-list v-if="comprovantes.length > 0" lines="two" class="pa-0 mb-4">
            <v-list-item
              v-for="comp in comprovantes"
              :key="comp.id"
              :prepend-icon="fileIcon(getFileField(comp.directus_files_id)?.type)"
              rounded="lg"
              class="border mb-2"
            >
              <v-list-item-title>
                {{ getFileField(comp.directus_files_id)?.title ?? 'Arquivo' }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ formatBytes(getFileField(comp.directus_files_id)?.filesize) }}
              </v-list-item-subtitle>

              <template #append>
                <div class="d-flex ga-1">
                  <v-btn
                    v-if="getFileId(comp.directus_files_id)"
                    icon="mdi-open-in-new"
                    variant="text"
                    size="small"
                    color="primary"
                    :href="fileUrl(getFileId(comp.directus_files_id)!)"
                    target="_blank"
                  >
                    <v-tooltip activator="parent" location="top">
                      Ver arquivo
                    </v-tooltip>
                  </v-btn>
                  <v-btn
                    icon="mdi-delete-outline"
                    variant="text"
                    size="small"
                    color="error"
                    @click="confirmRemove(comp)"
                  >
                    <v-tooltip activator="parent" location="top">
                      Remover
                    </v-tooltip>
                  </v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>

          <v-alert
            v-else
            type="info"
            variant="tonal"
            density="compact"
            class="mb-4"
            icon="mdi-information-outline"
          >
            Nenhum comprovante anexado ainda.
          </v-alert>
        </v-card-text>
      </v-card>
    </template>

    <!-- Dialog: remover comprovante -->
    <v-dialog v-model="removeDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-text class="pa-6 text-center">
          <v-icon icon="mdi-alert-circle-outline" color="error" size="48" class="mb-3" />
          <h3 class="text-h6 font-weight-bold mb-2">
            Remover comprovante?
          </h3>
          <p class="text-body-2 text-medium-emphasis mb-0">
            O arquivo será desvinculado desta receita.
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="removeDialog = false">
            Cancelar
          </v-btn>
          <v-btn color="error" variant="tonal" :loading="loading" @click="performRemove">
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
