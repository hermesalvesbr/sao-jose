<script setup lang="ts">
import type { AdsNovenario } from '~/types/schema'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const paramId = computed(() => route.params.id as string)
const breadcrumbOverride = useState<string | null>('breadcrumb-override', () => null)
const isNew = computed(() => paramId.value === 'novo')

onUnmounted(() => {
  breadcrumbOverride.value = null
})

const { loading, fetchAnuncioById, salvarAnuncio, atualizarAnuncio, uploadMidia, getAssetUrl } = useAdsNovenario()

const midiaFile = ref<File | null>(null)
const midiaPreview = ref<string | null>(null)
const midiaPreviewOriginal = ref<string | null>(null)
const uploading = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref<'success' | 'error' | 'warning'>('success')

const defaultItem = {
  anunciante: '',
  tipo_midia: 'imagem' as 'imagem' | 'video',
  duracao: 30,
  valor_pago: 0,
  midia: null as string | null,
  status: 'published',
  status_pagamento: 'pendente' as 'pendente' | 'pago' | 'permuta',
  meio_pagamento: null as string | null,
  data_pagamento: null as string | null,
  permuta_descricao: null as string | null,
}
const editedItem = ref({ ...defaultItem })

const duracaoLabel = computed(() => `${editedItem.value.duracao}s`)
const custoSegundoPreview = computed(() => {
  const d = editedItem.value.duracao || 0
  const v = Number(editedItem.value.valor_pago) || 0
  return d > 0 ? v / d : 0
})

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

onMounted(async () => {
  if (isNew.value) {
    breadcrumbOverride.value = 'Novo'
  }
  else {
    const ad = await fetchAnuncioById(paramId.value)
    if (ad) {
      const midiaId = typeof ad.midia === 'object' && ad.midia
        ? (ad.midia as { id: string }).id
        : ad.midia as string | null
      editedItem.value = {
        anunciante: ad.anunciante,
        tipo_midia: ad.tipo_midia as 'imagem' | 'video',
        duracao: ad.duracao,
        valor_pago: Number(ad.valor_pago),
        midia: midiaId,
        status: ad.status,
        status_pagamento: (ad.status_pagamento ?? 'pendente') as 'pendente' | 'pago' | 'permuta',
        meio_pagamento: ad.meio_pagamento ?? null,
        data_pagamento: ad.data_pagamento ?? null,
        permuta_descricao: ad.permuta_descricao ?? null,
      }
      breadcrumbOverride.value = ad.anunciante
      midiaPreview.value = midiaId ? await getAssetUrl(midiaId) : null
      midiaPreviewOriginal.value = midiaPreview.value
    }
    else {
      await navigateTo('/admin/anuncio')
    }
  }
})

function onMidiaSelected(files: File | File[] | null): void {
  const file = Array.isArray(files) ? (files[0] ?? null) : files
  if (file) {
    midiaFile.value = file
    midiaPreview.value = URL.createObjectURL(file)
    editedItem.value.tipo_midia = file.type.startsWith('video/') ? 'video' : 'imagem'
  }
  else {
    midiaFile.value = null
    midiaPreview.value = midiaPreviewOriginal.value
  }
}

async function saveItem(): Promise<void> {
  if (!editedItem.value.anunciante) {
    snackbarText.value = 'Informe o nome do anunciante.'
    snackbarColor.value = 'warning'
    snackbar.value = true
    return
  }
  if (editedItem.value.status_pagamento === 'permuta' && !editedItem.value.permuta_descricao?.trim()) {
    snackbarText.value = 'Informe a descrição da permuta.'
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
      permuta_descricao: editedItem.value.status_pagamento === 'permuta'
        ? (editedItem.value.permuta_descricao || null)
        : null,
    }

    if (midiaFile.value) {
      uploading.value = true
      const fileId = await uploadMidia(midiaFile.value)
      if (fileId)
        payload.midia = fileId
      uploading.value = false
    }

    if (!isNew.value) {
      await atualizarAnuncio(paramId.value, payload as Partial<AdsNovenario>)
    }
    else {
      if (editedItem.value.midia)
        payload.midia = editedItem.value.midia
      await salvarAnuncio(payload as Partial<AdsNovenario>)
    }
    await navigateTo('/admin/anuncio')
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
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6" style="max-width: 800px;">
    <!-- Header -->
    <div class="d-flex align-center mb-6 ga-3">
      <v-btn icon variant="text" @click="navigateTo('/admin/anuncio')">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
          {{ isNew ? 'Novo Anúncio' : 'Editar Anúncio' }}
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          {{ isNew ? 'Cadastre um novo anúncio para o telão' : 'Atualize os dados do anúncio' }}
        </p>
      </div>
    </div>

    <v-card rounded="xl" :elevation="0" class="border">
      <v-card-text class="pa-6">
        <v-form @submit.prevent="saveItem">
          <v-row>
            <!-- Dados do Anúncio -->
            <v-col cols="12">
              <div class="text-body-2 font-weight-bold text-medium-emphasis mb-1">
                <v-icon size="16" class="mr-1">
                  mdi-bullhorn-outline
                </v-icon>
                Dados do Anúncio
              </div>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="editedItem.anunciante"
                label="Nome do Anunciante"
                prepend-inner-icon="mdi-account-outline"
                variant="outlined"
                required
              />
            </v-col>

            <!-- Mídia atual (apenas no modo edição) -->
            <v-col v-if="!isNew && midiaPreview && !midiaFile" cols="12">
              <div class="text-body-2 text-medium-emphasis mb-2">
                <v-icon size="15" class="mr-1">
                  mdi-image-outline
                </v-icon>
                Mídia atual
              </div>
              <div class="text-center">
                <video
                  v-if="editedItem.tipo_midia === 'video'"
                  :src="midiaPreview"
                  controls
                  style="max-width: 100%; max-height: 280px; border-radius: 8px;"
                />
                <v-img
                  v-else
                  :src="midiaPreview"
                  max-height="280"
                  contain
                  class="rounded-lg border"
                />
              </div>
            </v-col>

            <v-col cols="12">
              <v-file-input
                :label="isNew ? 'Imagem ou Vídeo' : 'Substituir mídia (opcional)'"
                accept="image/*,video/*"
                prepend-icon=""
                prepend-inner-icon="mdi-upload"
                variant="outlined"
                :hint="isNew ? (editedItem.tipo_midia === 'video' ? 'Selecione um arquivo de vídeo' : 'Selecione uma imagem') : 'Selecione um novo arquivo para substituir a mídia atual'"
                persistent-hint
                clearable
                @update:model-value="onMidiaSelected"
              />
            </v-col>

            <!-- Preview do novo arquivo selecionado -->
            <v-col v-if="midiaFile && midiaPreview" cols="12">
              <div class="text-body-2 text-medium-emphasis mb-2">
                <v-icon size="15" class="mr-1">
                  mdi-eye-outline
                </v-icon>
                Pré-visualização do novo arquivo
              </div>
              <div class="text-center">
                <video
                  v-if="editedItem.tipo_midia === 'video'"
                  :src="midiaPreview"
                  controls
                  style="max-width: 100%; max-height: 280px; border-radius: 8px;"
                />
                <v-img
                  v-else
                  :src="midiaPreview"
                  max-height="280"
                  contain
                  class="rounded-lg border"
                />
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="editedItem.tipo_midia"
                :items="[{ title: 'Imagem', value: 'imagem' }, { title: 'Vídeo', value: 'video' }]"
                label="Tipo de Mídia"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="editedItem.status"
                :items="[{ title: 'Publicado', value: 'published' }, { title: 'Rascunho', value: 'draft' }]"
                label="Status"
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
                <div class="text-body-1 font-weight-bold">
                  {{ formatCurrency(custoSegundoPreview) }}/s
                </div>
              </v-card>
            </v-col>

            <!-- Informações de Pagamento -->
            <v-col cols="12">
              <v-divider class="my-2" />
              <div class="text-body-2 font-weight-bold text-medium-emphasis mb-1 mt-3">
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

            <v-col v-if="editedItem.status_pagamento === 'permuta'" cols="12">
              <v-textarea
                v-model="editedItem.permuta_descricao"
                label="Descrição da Permuta *"
                placeholder="Descreva como foi feita a permuta (ex: troca de serviços, fornecimento de materiais...)"
                prepend-inner-icon="mdi-swap-horizontal"
                variant="outlined"
                rows="3"
                :rules="[v => !!v?.trim() || 'Obrigatório informar a descrição da permuta']"
                required
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-6 pt-2">
        <v-spacer />
        <v-btn variant="text" @click="navigateTo('/admin/anuncio')">
          Cancelar
        </v-btn>
        <v-btn color="primary" variant="elevated" :loading="loading || uploading" @click="saveItem">
          {{ isNew ? 'Cadastrar' : 'Salvar' }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="4000" location="top right">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>
