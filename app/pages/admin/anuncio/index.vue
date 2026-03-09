<script setup lang="ts">
import type { AdsNovenario } from '~/types/schema'

definePageMeta({ layout: 'admin' })

const { anuncios, loading, fetchAnuncios, removerAnuncio } = useAdsNovenario()
const { user } = useAuth()

const deleteDialog = ref(false)
const itemToDelete = ref<string | null>(null)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const search = useState<string>('anuncios-search', () => '')
const filterPagamento = useState<string | null>('anuncios-pagamento', () => null)

const STATUS_PAGAMENTO_LABELS: Record<string, string> = {
  pago: 'Pago',
  permuta: 'Permuta',
  pendente: 'Pendente',
}
const pagamentoOpcoes = Object.entries(STATUS_PAGAMENTO_LABELS).map(([value, title]) => ({ value, title }))

const headers = [
  { title: 'Anunciante', key: 'anunciante' },
  { title: 'Duração', key: 'duracao', align: 'center' as const },
  { title: 'Valor Pago', key: 'valor_pago', align: 'end' as const },
  { title: 'Pagamento', key: 'status_pagamento', align: 'center' as const },
  { title: 'Meio', key: 'meio_pagamento', align: 'center' as const },
  { title: 'Status', key: 'status', align: 'center' as const },
  { title: '', key: 'actions', sortable: false, align: 'end' as const, width: '100px' },
]

const filteredAnuncios = computed(() => {
  let result = anuncios.value
  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(a => a.anunciante?.toLowerCase().includes(term))
  }
  if (filterPagamento.value)
    result = result.filter(a => a.status_pagamento === filterPagamento.value)
  return result
})

// KPIs
const totalAnuncios = computed(() => filteredAnuncios.value.length)
const totalArrecadado = computed(() => filteredAnuncios.value.reduce((acc, a) => acc + Number(a.valor_pago || 0), 0))
const totalSegundos = computed(() => filteredAnuncios.value.reduce((acc, a) => acc + Number(a.duracao || 0), 0))
const generatedAtLabel = computed(() => `Gerado em ${new Date().toLocaleDateString('pt-BR')}`)
const responsavelNome = computed(() => `${user.value?.first_name ?? ''} ${user.value?.last_name ?? ''}`.trim() || 'Responsável')

onMounted(() => fetchAnuncios())

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

function openDelete(item: AdsNovenario): void {
  itemToDelete.value = item.id
  deleteDialog.value = true
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

function printList() {
  window.print()
}
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <!-- Page Header -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-5 ga-3 no-print">
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
          Anúncios do Novenário
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Gestão de anúncios para o telão de LED
        </p>
      </div>
      <div class="d-flex ga-3 d-print-none">
        <v-btn variant="tonal" color="info" size="large" prepend-icon="mdi-printer" @click="printList">
          Imprimir
        </v-btn>
        <v-btn color="primary" variant="elevated" prepend-icon="mdi-plus" size="large" @click="navigateTo('/admin/anuncio/novo')">
          Novo Anúncio
        </v-btn>
      </div>
    </div>

    <!-- Filtros -->
    <v-card rounded="xl" :elevation="0" class="border mb-5 d-print-none">
      <v-card-text class="py-3">
        <v-row align="center">
          <v-col cols="12" sm="5">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Buscar anunciante..."
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="filterPagamento"
              :items="pagamentoOpcoes"
              item-title="title"
              item-value="value"
              label="Status de pagamento"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              prepend-inner-icon="mdi-cash-check"
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-btn
              size="small"
              variant="text"
              color="secondary"
              @click="search = ''; filterPagamento = null"
            >
              Limpar filtros
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- KPI Cards -->
    <v-row class="mb-5 no-print">
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
    </v-row>

    <!-- Data Table -->
    <v-card rounded="xl" :elevation="0" class="border no-print">
      <v-data-table
        :headers="headers"
        :items="filteredAnuncios"
        :loading="loading"
        hover
        items-per-page="15"
        no-data-text="Nenhum anúncio cadastrado"
        loading-text="Carregando anúncios..."
      >
        <template #[`item.anunciante`]="{ item }">
          <div class="d-flex align-center py-2">
            <v-icon
              :icon="item.tipo_midia === 'video' ? 'mdi-video-outline' : 'mdi-image-outline'"
              :color="item.tipo_midia === 'video' ? 'purple' : 'blue'"
              size="20"
              class="me-2"
            />
            <span class="font-weight-medium text-body-2">{{ item.anunciante }}</span>
          </div>
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
          <v-btn icon="mdi-pencil-outline" size="small" variant="text" color="secondary" @click="navigateTo(`/admin/anuncio/${item.id}`)">
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
            <v-btn color="primary" variant="elevated" prepend-icon="mdi-plus" @click="navigateTo('/admin/anuncio/novo')">
              Novo Anúncio
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400px" class="no-print">
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

    <!-- Print layout -->
    <PrintReportLayout
      class="d-none d-print-block mt-8"
      title="Anúncios do Novenário"
      subtitle="Gestão de anúncios para o telão de LED"
      :generated-at-label="generatedAtLabel"
      :left-signature-name="responsavelNome"
    >
      <section>
        <PrintReportSectionTitle title="Lista de anúncios" />
        <div class="pa-4">
          <table class="report-table">
            <thead>
              <tr>
                <th class="text-start">
                  Anunciante
                </th>
                <th class="text-start">
                  Tipo
                </th>
                <th class="text-end">
                  Duração
                </th>
                <th class="text-end">
                  Valor Pago
                </th>
                <th class="text-start">
                  Pagamento
                </th>
                <th class="text-start">
                  Obs. Permuta
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredAnuncios" :key="item.id" class="data-row">
                <td class="font-weight-medium">
                  {{ item.anunciante }}
                </td>
                <td>{{ item.tipo_midia === 'video' ? 'Vídeo' : 'Imagem' }}</td>
                <td class="text-end">
                  {{ item.duracao }}s
                </td>
                <td class="text-end font-weight-bold">
                  {{ formatCurrency(Number(item.valor_pago)) }}
                </td>
                <td>{{ STATUS_PAGAMENTO_LABELS[item.status_pagamento] ?? item.status_pagamento }}</td>
                <td class="text-caption">
                  {{ item.status_pagamento === 'permuta' && item.permuta_descricao ? item.permuta_descricao : '—' }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="4" class="text-end font-weight-bold">
                  Total arrecadado
                </td>
                <td class="text-end font-weight-black">
                  {{ formatCurrency(totalArrecadado) }}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </PrintReportLayout>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="top right" class="no-print">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>
