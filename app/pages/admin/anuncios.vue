<script setup lang="ts">
import type { AdsNovenario } from '~/types/schema'

definePageMeta({ layout: 'admin' })

const { anuncios, loading, fetchAnuncios, salvarAnuncio, atualizarAnuncio, removerAnuncio, uploadMidia, getAssetUrl } = useAdsNovenario()

const dialog = ref(false)
const deleteDialog = ref(false)
const editedId = ref<string | null>(null)
const itemToDelete = ref<string | null>(null)
const midiaFile = ref<File | null>(null)
const midiaPreview = ref<string | null>(null)
const uploading = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const defaultItem = {
  anunciante: '',
  tipo_midia: 'imagem' as 'imagem' | 'video',
  duracao: 10,
  valor_pago: 0,
  midia: null as string | null,
  status: 'published',
  status_pagamento: 'pendente' as 'pendente' | 'pago' | 'permuta',
  meio_pagamento: null as string | null,
  data_pagamento: null as string | null,
}
const editedItem = ref({ ...defaultItem })

const headers = [
  { title: 'Anunciante', key: 'anunciante' },
  { title: 'Tipo', key: 'tipo_midia', align: 'center' as const },
  { title: 'Duração', key: 'duracao', align: 'center' as const },
  { title: 'Valor Pago', key: 'valor_pago', align: 'end' as const },
  { title: 'R$/seg', key: 'custo_segundo', align: 'end' as const, sortable: false },
  { title: 'Pagamento', key: 'status_pagamento', align: 'center' as const },
  { title: 'Meio', key: 'meio_pagamento', align: 'center' as const },
  { title: 'Status', key: 'status', align: 'center' as const },
  { title: 'Ações', key: 'actions', sortable: false, align: 'end' as const },
]

// KPIs
const totalAnuncios = computed(() => anuncios.value.length)
const totalArrecadado = computed(() => anuncios.value.reduce((acc, a) => acc + Number(a.valor_pago || 0), 0))
const totalSegundos = computed(() => anuncios.value.reduce((acc, a) => acc + Number(a.duracao || 0), 0))
const custoMedioPorSegundo = computed(() => totalSegundos.value > 0 ? totalArrecadado.value / totalSegundos.value : 0)

onMounted(() => fetchAnuncios())

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

function custoSegundo(item: AdsNovenario): number {
  const duracao = Number(item.duracao) || 0
  const valor = Number(item.valor_pago) || 0
  return duracao > 0 ? valor / duracao : 0
}

function openNew(): void {
  editedId.value = null
  editedItem.value = { ...defaultItem }
  midiaFile.value = null
  midiaPreview.value = null
  dialog.value = true
}

async function editItem(item: AdsNovenario): Promise<void> {
  editedId.value = item.id
  const midiaId = typeof item.midia === 'object' && item.midia ? (item.midia as { id: string }).id : item.midia as string | null
  editedItem.value = {
    anunciante: item.anunciante,
    tipo_midia: item.tipo_midia as 'imagem' | 'video',
    duracao: item.duracao,
    valor_pago: Number(item.valor_pago),
    midia: midiaId,
    status: item.status,
    status_pagamento: (item.status_pagamento ?? 'pendente') as 'pendente' | 'pago' | 'permuta',
    meio_pagamento: item.meio_pagamento ?? null,
    data_pagamento: item.data_pagamento ?? null,
  }
  midiaFile.value = null
  midiaPreview.value = midiaId ? await getAssetUrl(midiaId) : null
  dialog.value = true
}

function openDelete(item: AdsNovenario): void {
  itemToDelete.value = item.id
  deleteDialog.value = true
}

function onMidiaSelected(files: File | File[] | null): void {
  const file = Array.isArray(files) ? (files[0] ?? null) : files
  if (file) {
    midiaFile.value = file
    midiaPreview.value = URL.createObjectURL(file)
    // Auto-detect tipo_midia
    if (file.type.startsWith('video/')) {
      editedItem.value.tipo_midia = 'video'
    }
    else {
      editedItem.value.tipo_midia = 'imagem'
    }
  }
  else {
    midiaFile.value = null
    midiaPreview.value = null
  }
}

async function saveItem(): Promise<void> {
  if (!editedItem.value.anunciante) {
    snackbarText.value = 'Informe o nome do anunciante.'
    snackbarColor.value = 'warning'
    snackbar.value = true
    return
  }

  loading.value = true
  try {
    const payload: Record<string, unknown> = {
      anunciante: editedItem.value.anunciante,
      tipo_midia: editedItem.value.tipo_midia,
      duracao: editedItem.value.duracao,
      valor_pago: Number(editedItem.value.valor_pago),
      status: editedItem.value.status,
      status_pagamento: editedItem.value.status_pagamento,
      meio_pagamento: editedItem.value.meio_pagamento || null,
      data_pagamento: editedItem.value.data_pagamento || null,
    }

    if (midiaFile.value) {
      uploading.value = true
      const fileId = await uploadMidia(midiaFile.value)
      if (fileId)
        payload.midia = fileId
      uploading.value = false
    }

    if (editedId.value) {
      await atualizarAnuncio(editedId.value, payload as Partial<AdsNovenario>)
      snackbarText.value = 'Anúncio atualizado!'
    }
    else {
      if (editedItem.value.midia)
        payload.midia = editedItem.value.midia
      await salvarAnuncio(payload as Partial<AdsNovenario>)
      snackbarText.value = 'Anúncio cadastrado!'
    }
    snackbarColor.value = 'success'
    snackbar.value = true
    dialog.value = false
    midiaFile.value = null
    midiaPreview.value = null
    await fetchAnuncios()
  }
  catch (err) {
    console.error('Erro ao salvar anúncio:', err)
    snackbarText.value = 'Erro ao salvar anúncio.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
  finally {
    loading.value = false
    uploading.value = false
  }
}

async function confirmDelete(): Promise<void> {
  if (!itemToDelete.value)
    return
  loading.value = true
  try {
    await removerAnuncio(itemToDelete.value)
    deleteDialog.value = false
    snackbarText.value = 'Anúncio removido!'
    snackbarColor.value = 'success'
    snackbar.value = true
    await fetchAnuncios()
  }
  catch (err) {
    console.error('Erro ao remover anúncio:', err)
    snackbarText.value = 'Erro ao remover anúncio.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
  finally {
    loading.value = false
  }
}

const duracaoLabel = computed(() => `${editedItem.value.duracao}s`)
const custoSegundoPreview = computed(() => {
  const d = editedItem.value.duracao || 0
  const v = Number(editedItem.value.valor_pago) || 0
  return d > 0 ? v / d : 0
})
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <!-- Page Header -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-5 ga-3">
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
          Anúncios do Novenário
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Gestão de anúncios para o telão de LED
        </p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" size="large" @click="openNew">
        Novo Anúncio
      </v-btn>
    </div>

    <!-- KPI Cards -->
    <v-row class="mb-5">
      <v-col cols="6" md="3">
        <v-card rounded="xl" :elevation="0" class="border">
          <v-card-text class="text-center">
            <v-icon color="primary" size="32" class="mb-2">
              mdi-bullhorn-outline
            </v-icon>
            <div class="text-h5 font-weight-bold">
              {{ totalAnuncios }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Anúncios
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card rounded="xl" :elevation="0" class="border">
          <v-card-text class="text-center">
            <v-icon color="success" size="32" class="mb-2">
              mdi-cash-multiple
            </v-icon>
            <div class="text-h5 font-weight-bold">
              {{ formatCurrency(totalArrecadado) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Arrecadado
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card rounded="xl" :elevation="0" class="border">
          <v-card-text class="text-center">
            <v-icon color="info" size="32" class="mb-2">
              mdi-timer-outline
            </v-icon>
            <div class="text-h5 font-weight-bold">
              {{ totalSegundos }}s
            </div>
            <div class="text-caption text-medium-emphasis">
              Tempo Total
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card rounded="xl" :elevation="0" class="border">
          <v-card-text class="text-center">
            <v-icon color="warning" size="32" class="mb-2">
              mdi-currency-brl
            </v-icon>
            <div class="text-h5 font-weight-bold">
              {{ formatCurrency(custoMedioPorSegundo) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Média R$/seg
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Data Table -->
    <v-card rounded="xl" :elevation="0" class="border">
      <v-data-table
        :headers="headers"
        :items="anuncios"
        :loading="loading"
        hover
        items-per-page="15"
        no-data-text="Nenhum anúncio cadastrado"
        loading-text="Carregando anúncios..."
      >
        <template #[`item.anunciante`]="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar color="primary" variant="tonal" size="36" class="me-3">
              <v-icon icon="mdi-bullhorn-outline" size="18" />
            </v-avatar>
            <span class="font-weight-medium text-body-2">{{ item.anunciante }}</span>
          </div>
        </template>

        <template #[`item.tipo_midia`]="{ item }">
          <v-chip
            :color="item.tipo_midia === 'video' ? 'purple' : 'blue'"
            size="small"
            variant="tonal"
          >
            <v-icon :icon="item.tipo_midia === 'video' ? 'mdi-video-outline' : 'mdi-image-outline'" start size="14" />
            {{ item.tipo_midia === 'video' ? 'Vídeo' : 'Imagem' }}
          </v-chip>
        </template>

        <template #[`item.duracao`]="{ item }">
          <v-chip size="small" variant="tonal" color="info">
            <v-icon icon="mdi-timer-outline" start size="14" />
            {{ item.duracao }}s
          </v-chip>
        </template>

        <template #[`item.valor_pago`]="{ item }">
          <span class="font-weight-bold text-body-2">{{ formatCurrency(Number(item.valor_pago)) }}</span>
        </template>

        <template #[`item.custo_segundo`]="{ item }">
          <v-chip size="small" variant="tonal" color="warning">
            {{ formatCurrency(custoSegundo(item)) }}/s
          </v-chip>
        </template>

        <template #[`item.status_pagamento`]="{ item }">
          <v-chip
            :color="item.status_pagamento === 'pago' ? 'success' : item.status_pagamento === 'permuta' ? 'info' : 'warning'"
            size="small"
            variant="tonal"
          >
            <v-icon start size="12" :icon="item.status_pagamento === 'pago' ? 'mdi-check-circle' : item.status_pagamento === 'permuta' ? 'mdi-swap-horizontal' : 'mdi-clock-outline'" />
            {{ item.status_pagamento === 'pago' ? 'Pago' : item.status_pagamento === 'permuta' ? 'Permuta' : 'Pendente' }}
          </v-chip>
        </template>

        <template #[`item.meio_pagamento`]="{ item }">
          <span v-if="item.meio_pagamento" class="text-body-2">
            <v-icon size="14" class="mr-1">{{ item.meio_pagamento === 'pix' ? 'mdi-qrcode' : item.meio_pagamento === 'cartao' ? 'mdi-credit-card-outline' : 'mdi-cash' }}</v-icon>
            {{ item.meio_pagamento === 'pix' ? 'PIX' : item.meio_pagamento === 'cartao' ? 'Cartão' : 'Dinheiro' }}
          </span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #[`item.status`]="{ item }">
          <v-chip
            :color="item.status === 'published' ? 'success' : 'grey'"
            size="small"
            variant="tonal"
          >
            {{ item.status === 'published' ? 'Ativo' : 'Rascunho' }}
          </v-chip>
        </template>

        <template #[`item.actions`]="{ item }">
          <v-btn icon="mdi-pencil-outline" size="small" variant="text" color="secondary" @click="editItem(item)">
            <v-icon size="20" icon="mdi-pencil-outline" />
            <v-tooltip activator="parent" location="top">
              Editar
            </v-tooltip>
          </v-btn>
          <v-btn icon="mdi-delete-outline" size="small" variant="text" color="error" @click="openDelete(item)">
            <v-icon size="20" icon="mdi-delete-outline" />
            <v-tooltip activator="parent" location="top">
              Excluir
            </v-tooltip>
          </v-btn>
        </template>

        <template #no-data>
          <div class="text-center pa-8">
            <v-icon color="grey-lighten-1" size="64" class="mb-4">
              mdi-bullhorn-variant-outline
            </v-icon>
            <h3 class="text-h6 text-medium-emphasis mb-2">
              Nenhum anúncio cadastrado
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Adicione seu primeiro anúncio para o telão do novenário.
            </p>
            <v-btn color="primary" variant="elevated" prepend-icon="mdi-plus" @click="openNew">
              Novo Anúncio
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center pa-5" style="background: linear-gradient(135deg, #5D4037, #8D6E63); color: white;">
          <v-icon :icon="editedId ? 'mdi-pencil' : 'mdi-plus-circle'" class="me-3" />
          <span class="text-h6">{{ editedId ? 'Editar Anúncio' : 'Novo Anúncio' }}</span>
        </v-card-title>
        <v-card-text class="pa-5">
          <v-form @submit.prevent="saveItem">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.anunciante"
                  label="Nome do Anunciante"
                  prepend-inner-icon="mdi-account-outline"
                  variant="outlined"
                  required
                />
              </v-col>

              <v-col cols="12">
                <v-file-input
                  label="Imagem ou Vídeo"
                  accept="image/*,video/*"
                  prepend-icon=""
                  prepend-inner-icon="mdi-upload"
                  variant="outlined"
                  :hint="editedItem.tipo_midia === 'video' ? 'Selecione um arquivo de vídeo' : 'Selecione uma imagem'"
                  persistent-hint
                  @update:model-value="onMidiaSelected"
                />
              </v-col>

              <!-- Preview -->
              <v-col v-if="midiaPreview" cols="12" class="text-center">
                <video
                  v-if="editedItem.tipo_midia === 'video'"
                  :src="midiaPreview"
                  controls
                  style="max-width: 100%; max-height: 200px; border-radius: 8px;"
                />
                <v-img
                  v-else
                  :src="midiaPreview"
                  max-height="200"
                  contain
                  class="rounded-lg border"
                />
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="editedItem.tipo_midia"
                  :items="[{ title: 'Imagem', value: 'imagem' }, { title: 'Vídeo', value: 'video' }]"
                  label="Tipo de Mídia"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <div class="text-body-2 font-weight-medium mb-1">
                  Duração da exibição: {{ duracaoLabel }}
                </div>
                <v-slider
                  v-model="editedItem.duracao"
                  :min="5"
                  :max="60"
                  :step="5"
                  color="primary"
                  thumb-label="always"
                  show-ticks="always"
                  tick-size="4"
                >
                  <template #thumb-label="{ modelValue }">
                    {{ modelValue }}s
                  </template>
                </v-slider>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="editedItem.valor_pago"
                  label="Valor Pago (R$)"
                  type="number"
                  min="0"
                  step="0.01"
                  prepend-inner-icon="mdi-currency-brl"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-card variant="tonal" color="warning" rounded="lg" class="pa-3 text-center">
                  <div class="text-caption text-medium-emphasis">
                    Custo por segundo
                  </div>
                  <div class="text-h6 font-weight-bold">
                    {{ formatCurrency(custoSegundoPreview) }}/s
                  </div>
                </v-card>
              </v-col>

              <!-- Pagamento -->
              <v-col cols="12">
                <v-divider class="mb-3" />
                <div class="text-body-2 font-weight-bold text-medium-emphasis mb-3">
                  <v-icon size="16" class="mr-1">
                    mdi-cash-check
                  </v-icon>
                  Informações de Pagamento
                </div>
              </v-col>

              <v-col cols="12" md="4">
                <v-select
                  v-model="editedItem.status_pagamento"
                  :items="[
                    { title: 'Pendente', value: 'pendente' },
                    { title: 'Pago', value: 'pago' },
                    { title: 'Permuta', value: 'permuta' },
                  ]"
                  label="Status Pagamento"
                  variant="outlined"
                  prepend-inner-icon="mdi-cash-check"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-select
                  v-model="editedItem.meio_pagamento"
                  :items="[
                    { title: 'Dinheiro', value: 'dinheiro' },
                    { title: 'PIX', value: 'pix' },
                    { title: 'Cartão', value: 'cartao' },
                  ]"
                  label="Meio de Pagamento"
                  variant="outlined"
                  prepend-inner-icon="mdi-credit-card-outline"
                  clearable
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="editedItem.data_pagamento"
                  label="Data do Pagamento"
                  type="date"
                  variant="outlined"
                  prepend-inner-icon="mdi-calendar-check"
                  clearable
                />
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="editedItem.status"
                  :items="[{ title: 'Publicado', value: 'published' }, { title: 'Rascunho', value: 'draft' }]"
                  label="Status"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-5 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">
            Cancelar
          </v-btn>
          <v-btn color="primary" variant="elevated" :loading="loading || uploading" @click="saveItem">
            {{ editedId ? 'Salvar' : 'Cadastrar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card rounded="xl">
        <v-card-title class="text-h6 pa-5">
          Confirmar exclusão
        </v-card-title>
        <v-card-text>
          Tem certeza que deseja remover este anúncio? Esta ação não pode ser desfeita.
        </v-card-text>
        <v-card-actions class="pa-5 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">
            Cancelar
          </v-btn>
          <v-btn color="error" variant="elevated" :loading="loading" @click="confirmDelete">
            Excluir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="top right">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>
