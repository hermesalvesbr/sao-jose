<script setup lang="ts">
/**
 * Pontos de Produção / Barracas
 *
 * Gerencia os pontos de venda separados:
 * - Barracas de Comida (pastéis, cachorro-quente, etc.)
 * - Lojinha (camisetas, chaveiros, santos, etc.)
 *
 * Cada produto é vinculado a um ponto de produção via production_point_id
 */
definePageMeta({ layout: 'admin' })

const {
  fetchProductionPoints,
  createProductionPoint,
  updateProductionPoint,
  deleteProductionPoint,
  fetchProducts,
} = usePdv()

const points = ref<any[]>([])
const productCounts = ref<Record<string, number>>({})
const loading = ref(true)
const dialog = ref(false)
const deleteDialog = ref(false)
const editedId = ref<string | null>(null)
const itemToDelete = ref<string | null>(null)

const defaultItem = {
  name: '',
  active: true,
  status: 'published',
}
const editedItem = ref({ ...defaultItem })

// Icon mapping for display
const pointIcons: Record<string, { icon: string, color: string }> = {
  comida: { icon: 'mdi-food', color: '#E65100' },
  lojinha: { icon: 'mdi-shopping', color: '#6A1B9A' },
  bebida: { icon: 'mdi-cup-water', color: '#1565C0' },
}

function getPointStyle(name: string) {
  const lower = name?.toLowerCase() || ''
  if (lower.includes('comida') || lower.includes('barraca') || lower.includes('food'))
    return pointIcons.comida
  if (lower.includes('loj') || lower.includes('shop') || lower.includes('artigo'))
    return pointIcons.lojinha
  if (lower.includes('bebida') || lower.includes('drink'))
    return pointIcons.bebida
  return { icon: 'mdi-store', color: '#5D4037' }
}

async function loadData() {
  loading.value = true
  try {
    const [res, prodsRes] = await Promise.all([
      fetchProductionPoints({ limit: -1 }),
      fetchProducts({ limit: -1, fields: ['id', 'production_point_id'] }),
    ])
    points.value = res || []

    // Count products per point
    const counts: Record<string, number> = {}
    for (const p of (prodsRes || [])) {
      const ppId = typeof p.production_point_id === 'object' && p.production_point_id
        ? (p.production_point_id as any).id
        : p.production_point_id
      if (ppId) {
        counts[ppId] = (counts[ppId] || 0) + 1
      }
    }
    productCounts.value = counts
  }
  catch (e) {
    console.error('Error loading production points', e)
  }
  finally {
    loading.value = false
  }
}

onMounted(loadData)

function openNew() {
  editedId.value = null
  editedItem.value = { ...defaultItem }
  dialog.value = true
}

function openEdit(item: any) {
  editedId.value = item.id
  editedItem.value = {
    name: item.name || '',
    active: item.active ?? true,
    status: item.status || 'published',
  }
  dialog.value = true
}

async function save() {
  if (!editedItem.value.name.trim())
    return
  try {
    if (editedId.value) {
      await updateProductionPoint(editedId.value, { ...editedItem.value })
    }
    else {
      await createProductionPoint({ ...editedItem.value })
    }
    dialog.value = false
    await loadData()
  }
  catch (e) {
    console.error('Error saving', e)
  }
}

function confirmDelete(id: string) {
  itemToDelete.value = id
  deleteDialog.value = true
}

async function performDelete() {
  if (!itemToDelete.value)
    return
  try {
    await deleteProductionPoint(itemToDelete.value)
    deleteDialog.value = false
    await loadData()
  }
  catch (e) {
    console.error('Error deleting', e)
  }
}
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <!-- Header -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-6 ga-3">
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold text-on-surface">
          Pontos de Produção
        </h1>
        <p class="text-body-2 text-on-surface-variant mt-1 mb-0">
          Separe seus produtos por barraca ou lojinha — cada equipe vende no seu ponto
        </p>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        class="text-none"
        @click="openNew"
      >
        Novo Ponto
      </v-btn>
    </div>

    <!-- Info banner -->
    <v-alert
      type="info"
      variant="tonal"
      rounded="xl"
      class="mb-6"
      closable
    >
      <strong>Dica:</strong> Crie pontos como "Barracas de Comida" e "Lojinha" para separar
      os produtos do Novenário. Depois, vincule cada produto ao seu ponto na página de Produtos.
    </v-alert>

    <!-- Loading -->
    <div v-if="loading" class="d-flex justify-center pa-12">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Cards Grid -->
    <v-row v-else-if="points.length > 0">
      <v-col
        v-for="point in points"
        :key="point.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card rounded="xl" :elevation="0" class="border h-100 d-flex flex-column">
          <v-card-text class="flex-grow-1 text-center pa-6">
            <v-avatar :color="(getPointStyle(point.name || '') || {}).color || '#5D4037'" size="64" class="mb-4">
              <v-icon :icon="(getPointStyle(point.name || '') || {}).icon || 'mdi-store'" color="white" size="32" />
            </v-avatar>

            <h3 class="text-h6 font-weight-bold text-on-surface mb-2">
              {{ point.name }}
            </h3>

            <v-chip
              :color="point.active ? 'success' : 'error'"
              size="small"
              variant="tonal"
              label
              class="mb-3"
            >
              {{ point.active ? 'Ativo' : 'Inativo' }}
            </v-chip>

            <div class="text-body-2 text-on-surface-variant">
              <v-icon icon="mdi-package-variant-closed" size="16" class="me-1" />
              {{ productCounts[point.id] || 0 }} produto(s)
            </div>
          </v-card-text>

          <v-divider />

          <v-card-actions class="justify-center pa-3">
            <v-btn variant="text" color="primary" size="small" class="text-none" @click="openEdit(point)">
              <v-icon icon="mdi-pencil" start size="16" />
              Editar
            </v-btn>
            <v-btn variant="text" color="error" size="small" class="text-none" @click="confirmDelete(point.id)">
              <v-icon icon="mdi-delete" start size="16" />
              Excluir
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty state -->
    <v-card v-else rounded="xl" :elevation="0" class="border text-center pa-12">
      <v-icon icon="mdi-store-alert" size="64" color="on-surface-variant" class="mb-4" />
      <h3 class="text-h6 font-weight-medium text-on-surface mb-2">
        Nenhum ponto de produção cadastrado
      </h3>
      <p class="text-body-2 text-on-surface-variant mb-4">
        Crie seus pontos para organizar as vendas do Novenário
      </p>
      <v-btn color="primary" prepend-icon="mdi-plus" class="text-none" @click="openNew">
        Criar primeiro ponto
      </v-btn>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="420" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-5 text-on-surface">
          <v-icon :icon="editedId ? 'mdi-pencil' : 'mdi-plus'" class="me-2" />
          {{ editedId ? 'Editar Ponto' : 'Novo Ponto de Produção' }}
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-5">
          <v-text-field
            v-model="editedItem.name"
            label="Nome do Ponto"
            placeholder="Ex: Barracas de Comida, Lojinha"
            prepend-inner-icon="mdi-store"
            :rules="[v => !!v || 'Nome é obrigatório']"
            class="mb-4"
          />

          <v-switch
            v-model="editedItem.active"
            label="Ponto ativo"
            color="success"
            hide-details
          />
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" class="text-none" @click="dialog = false">
            Cancelar
          </v-btn>
          <v-btn color="primary" class="text-none" :disabled="!editedItem.name.trim()" @click="save">
            {{ editedId ? 'Salvar' : 'Criar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Dialog -->
    <v-dialog v-model="deleteDialog" max-width="360">
      <v-card rounded="xl" class="text-center pa-6">
        <v-avatar color="error" size="56" class="mb-4">
          <v-icon icon="mdi-alert" color="white" size="28" />
        </v-avatar>
        <h3 class="text-h6 font-weight-bold text-on-surface mb-2">
          Excluir ponto?
        </h3>
        <p class="text-body-2 text-on-surface-variant mb-4">
          Os produtos vinculados ficarão sem ponto de produção.
        </p>
        <v-row dense>
          <v-col cols="6">
            <v-btn block variant="tonal" class="text-none" @click="deleteDialog = false">
              Cancelar
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn block color="error" class="text-none" @click="performDelete">
              Excluir
            </v-btn>
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>
  </v-container>
</template>
