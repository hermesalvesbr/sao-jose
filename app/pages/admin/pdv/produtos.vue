<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { fetchProducts, createProduct, updateProduct, deleteProduct, fetchCategories, fetchProductionPoints, uploadFile, getAssetUrl } = usePdv()

const items = ref<any[]>([])
const categories = ref<any[]>([])
const productionPoints = ref<any[]>([])
const loading = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const editedId = ref<string | null>(null)
const search = ref('')
const selectedCategory = ref<string | null>(null)
const selectedPoint = ref<string | null>(null)

const defaultItem = {
  name: '',
  status: 'published',
  active: true,
  price: 0,
  category_id: null as string | null,
  production_point_id: null as string | null,
  imagem: null as string | null,
  stock_quantity: 0,
  sort_order: 1,
}
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const uploadingImage = ref(false)
const editedItem = ref({ ...defaultItem })
const itemToDelete = ref<string | null>(null)

const headers = [
  { title: 'Produto', key: 'name' },
  { title: 'Categoria', key: 'category_id' },
  { title: 'Preço', key: 'price', align: 'end' as const },
  { title: 'Estoque', key: 'stock_quantity', align: 'center' as const },
  { title: 'Status', key: 'active', align: 'center' as const },
  { title: 'Ações', key: 'actions', sortable: false, align: 'end' as const },
]

const filteredCategories = computed(() => {
  if (!selectedPoint.value)
    return categories.value
  return categories.value.filter((cat) => {
    const pointId = typeof cat.points_id === 'object' && cat.points_id ? cat.points_id.id : cat.points_id
    return pointId === selectedPoint.value
  })
})

const filteredItems = computed(() => {
  let result = items.value
  // Filter by production point first
  if (selectedPoint.value) {
    result = result.filter((p) => {
      const ppId = typeof p.production_point_id === 'object' && p.production_point_id ? p.production_point_id.id : p.production_point_id
      return ppId === selectedPoint.value
    })
  }
  // Then by category
  if (selectedCategory.value) {
    result = result.filter((p) => {
      const catId = typeof p.category_id === 'object' && p.category_id ? p.category_id.id : p.category_id
      return catId === selectedCategory.value
    })
  }
  return result
})

async function loadData() {
  loading.value = true
  try {
    const [prodRes, catRes, ppRes] = await Promise.all([
      fetchProducts({ limit: -1, fields: ['*', 'category_id.name', 'category_id.id', 'category_id.points_id', 'production_point_id.name', 'production_point_id.id'], sort: 'sort_order' }),
      fetchCategories({ limit: -1, fields: ['*', 'points_id.*'], sort: 'sort_order' }),
      fetchProductionPoints({ limit: -1, filter: { active: { _eq: true } }, sort: 'name' }),
    ])
    items.value = prodRes || []
    categories.value = catRes || []
    productionPoints.value = ppRes || []
  }
  catch (error) {
    console.error(error)
  }
  finally {
    loading.value = false
  }
}

// Auto-fill production_point_id when category changes
watch(() => editedItem.value.category_id, (newCatId) => {
  if (!newCatId)
    return
  const category = categories.value.find(c => c.id === newCatId)
  if (category && category.points_id) {
    const pointId = typeof category.points_id === 'object' && category.points_id ? category.points_id.id : category.points_id
    if (pointId) {
      editedItem.value.production_point_id = pointId
    }
  }
})

onMounted(() => {
  loadData()
})

function openNew() {
  editedId.value = null
  editedItem.value = { ...defaultItem }
  imageFile.value = null
  imagePreview.value = null
  dialog.value = true
}

async function editItem(item: any) {
  editedId.value = item.id
  const imgId = typeof item.imagem === 'object' && item.imagem ? item.imagem.id : item.imagem
  editedItem.value = {
    ...item,
    category_id: typeof item.category_id === 'object' && item.category_id ? item.category_id.id : item.category_id,
    production_point_id: typeof item.production_point_id === 'object' && item.production_point_id ? item.production_point_id.id : item.production_point_id,
    imagem: imgId || null,
  }
  imageFile.value = null
  imagePreview.value = imgId ? await getAssetUrl(imgId) : null
  dialog.value = true
}

function openDelete(item: any) {
  itemToDelete.value = item.id
  deleteDialog.value = true
}

async function saveItem() {
  loading.value = true
  try {
    const payload = { ...editedItem.value } as any
    if (payload.name)
      payload.name = titleCase(payload.name)

    // Upload image if selected
    if (imageFile.value) {
      uploadingImage.value = true
      const fileId = await uploadFile(imageFile.value)
      if (fileId) {
        payload.imagem = fileId
      }
      uploadingImage.value = false
    }

    if (editedId.value) {
      await updateProduct(editedId.value, payload)
    }
    else {
      await createProduct(payload)
    }
    dialog.value = false
    imageFile.value = null
    imagePreview.value = null
    loadData()
  }
  catch (err) {
    console.error(err)
  }
  finally {
    loading.value = false
    uploadingImage.value = false
  }
}

function onImageSelected(files: File | File[] | null) {
  const file = Array.isArray(files) ? (files[0] ?? null) : files
  if (file) {
    imageFile.value = file
    imagePreview.value = URL.createObjectURL(file)
  }
  else {
    imageFile.value = null
    imagePreview.value = null
  }
}

async function confirmDelete() {
  if (!itemToDelete.value)
    return
  loading.value = true
  try {
    await deleteProduct(itemToDelete.value)
    deleteDialog.value = false
    loadData()
  }
  catch (err) {
    console.error(err)
  }
  finally {
    loading.value = false
  }
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

function getStockColor(qty: number) {
  if (qty <= 0)
    return 'error'
  if (qty <= 5)
    return 'warning'
  return 'success'
}

function getCategoryName(item: any) {
  if (item.category_id && typeof item.category_id === 'object')
    return item.category_id.name
  return '-'
}

function getProductionPointName(item: any) {
  if (item.production_point_id && typeof item.production_point_id === 'object')
    return item.production_point_id.name
  return '-'
}
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <!-- Page Header -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-5 ga-3">
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
          Produtos
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Gerenciamento do catálogo de produtos do PDV
        </p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" size="large" @click="openNew">
        Novo Produto
      </v-btn>
    </div>

    <!-- Filters -->
    <v-card rounded="xl" :elevation="0" class="border mb-5">
      <v-card-text class="py-3">
        <v-row align="center" no-gutters>
          <v-col cols="12" sm="5" md="4">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Buscar produto..."
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" sm="7" md="8" class="ps-sm-4 pt-3 pt-sm-0">
            <!-- Production Point Filter -->
            <div class="mb-2">
              <v-chip-group v-model="selectedPoint" selected-class="text-primary" column>
                <v-chip
                  :value="null"
                  variant="tonal"
                  filter
                  size="small"
                >
                  <v-icon start icon="mdi-store-outline" />
                  Todos os Pontos
                </v-chip>
                <v-chip
                  v-for="point in productionPoints"
                  :key="point.id"
                  :value="point.id"
                  variant="tonal"
                  filter
                  size="small"
                >
                  {{ point.name }}
                </v-chip>
              </v-chip-group>
            </div>
            <!-- Category Filter -->
            <v-chip-group v-model="selectedCategory" selected-class="text-primary" column>
              <v-chip
                :value="null"
                variant="outlined"
                filter
                size="small"
              >
                Todas Categorias
              </v-chip>
              <v-chip
                v-for="cat in filteredCategories"
                :key="cat.id"
                :value="cat.id"
                variant="outlined"
                filter
                size="small"
              >
                {{ cat.name }}
              </v-chip>
            </v-chip-group>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Data Table -->
    <v-card rounded="xl" :elevation="0" class="border">
      <v-data-table
        :headers="headers"
        :items="filteredItems"
        :loading="loading"
        :search="search"
        hover
        items-per-page="15"
      >
        <!-- Product Name -->
        <template #[`item.name`]="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar color="primary" variant="tonal" size="36" class="me-3">
              <v-icon icon="mdi-package-variant" size="18" />
            </v-avatar>
            <div>
              <div class="font-weight-medium text-body-2">
                {{ item.name }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ getProductionPointName(item) }}
              </div>
            </div>
          </div>
        </template>

        <!-- Category (hidden on mobile, shown in name column) -->
        <template #[`item.category_id`]="{ item }">
          <v-chip v-if="getCategoryName(item) !== '-'" size="small" variant="tonal" color="secondary">
            {{ getCategoryName(item) }}
          </v-chip>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <!-- Price -->
        <template #[`item.price`]="{ item }">
          <span class="font-weight-bold text-body-2">{{ formatCurrency(item.price) }}</span>
        </template>

        <!-- Stock -->
        <template #[`item.stock_quantity`]="{ item }">
          <v-chip
            :color="getStockColor(item.stock_quantity)"
            size="small"
            variant="tonal"
            label
          >
            <v-icon start icon="mdi-package-variant-closed" size="14" />
            {{ item.stock_quantity }} un
          </v-chip>
        </template>

        <!-- Active -->
        <template #[`item.active`]="{ item }">
          <v-icon
            :icon="item.active ? 'mdi-check-circle' : 'mdi-close-circle'"
            :color="item.active ? 'success' : 'error'"
            size="22"
          />
        </template>

        <!-- Actions -->
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
      </v-data-table>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center pa-5" style="background: linear-gradient(135deg, #1565C0, #42A5F5); color: white;">
          <v-icon :icon="editedId ? 'mdi-pencil' : 'mdi-plus-circle'" class="me-3" />
          <span class="text-h6">{{ editedId ? 'Editar Produto' : 'Novo Produto' }}</span>
        </v-card-title>
        <v-card-text class="pa-5">
          <v-form @submit.prevent>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.name"
                  label="Nome do Produto"
                  variant="outlined"
                  prepend-inner-icon="mdi-package-variant"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="editedItem.category_id"
                  :items="categories"
                  item-title="name"
                  item-value="id"
                  label="Categoria"
                  variant="outlined"
                  prepend-inner-icon="mdi-tag-outline"
                  clearable
                  hint="Ao selecionar, o ponto de produção será preenchido automaticamente"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="editedItem.production_point_id"
                  :items="productionPoints"
                  item-title="name"
                  item-value="id"
                  label="Ponto de Produção"
                  variant="outlined"
                  prepend-inner-icon="mdi-store-outline"
                  clearable
                  hint="Preenchido automaticamente pela categoria"
                  persistent-hint
                  readonly
                />
              </v-col>
              <v-col cols="12" md="6">
                <MaskedCurrencyField
                  v-model="editedItem.price"
                  label="Preço de Venda"
                  :min-value="0"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="editedItem.stock_quantity"
                  label="Estoque Atual"
                  type="number"
                  variant="outlined"
                  prepend-inner-icon="mdi-warehouse"
                  required
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="editedItem.sort_order"
                  label="Ordem"
                  type="number"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="6" class="d-flex align-center">
                <v-switch v-model="editedItem.active" color="success" label="Ativo" hide-details />
              </v-col>

              <!-- Image upload -->
              <v-col cols="12">
                <v-file-input
                  label="Imagem do Produto (opcional)"
                  variant="outlined"
                  prepend-inner-icon="mdi-camera"
                  prepend-icon=""
                  accept="image/*"
                  :loading="uploadingImage"
                  hint="JPEG, PNG ou WebP"
                  persistent-hint
                  @update:model-value="onImageSelected"
                />
              </v-col>

              <!-- Image preview -->
              <v-col v-if="imagePreview" cols="12" class="text-center">
                <v-img
                  :src="imagePreview"
                  max-height="160"
                  max-width="200"
                  class="rounded-lg mx-auto border"
                  cover
                />
                <v-btn
                  variant="text"
                  color="error"
                  size="small"
                  class="mt-2 text-none"
                  prepend-icon="mdi-close"
                  @click="imageFile = null; imagePreview = null"
                >
                  Remover imagem
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" color="secondary" @click="dialog = false">
            Cancelar
          </v-btn>
          <v-btn color="primary" variant="elevated" :loading="loading" prepend-icon="mdi-content-save" @click="saveItem">
            Salvar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="420px">
      <v-card rounded="xl">
        <v-card-text class="text-center pa-6">
          <v-avatar color="error" variant="tonal" size="64" class="mb-4">
            <v-icon icon="mdi-delete-alert-outline" size="32" />
          </v-avatar>
          <h3 class="text-h6 mb-2">
            Confirmar Exclusão
          </h3>
          <p class="text-body-2 text-medium-emphasis">
            Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
          </p>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" color="secondary" @click="deleteDialog = false">
            Cancelar
          </v-btn>
          <v-btn color="error" variant="elevated" :loading="loading" prepend-icon="mdi-delete" @click="confirmDelete">
            Excluir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
