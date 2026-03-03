<script setup lang="ts">
import { onMounted, ref } from 'vue'

definePageMeta({ layout: 'admin' })

const { fetchCategories, createCategory, updateCategory, deleteCategory, fetchProducts } = usePdv()

const items = ref<any[]>([])
const productCounts = ref<Record<string, number>>({})
const loading = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const editedId = ref<string | null>(null)
const editedItem = ref({ name: '', active: true, status: 'published', icon: '', sort_order: 1 })
const defaultItem = { name: '', active: true, status: 'published', icon: '', sort_order: 1 }
const itemToDelete = ref<string | null>(null)

async function loadItems() {
  loading.value = true
  try {
    const [catRes, prodRes] = await Promise.all([
      fetchCategories({ limit: -1, sort: 'sort_order' }),
      fetchProducts({ limit: -1, fields: ['id', 'category_id'] }),
    ])
    items.value = catRes || []

    // Count products per category
    const counts: Record<string, number> = {}
    ;(prodRes || []).forEach((p: any) => {
      const catId = typeof p.category_id === 'object' && p.category_id ? p.category_id.id : p.category_id
      if (catId) {
        counts[catId] = (counts[catId] || 0) + 1
      }
    })
    productCounts.value = counts
  }
  catch (error) {
    console.error(error)
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  loadItems()
})

function openNew() {
  editedId.value = null
  editedItem.value = { ...defaultItem }
  dialog.value = true
}

function editItem(item: any) {
  editedId.value = item.id
  editedItem.value = { ...item }
  dialog.value = true
}

function openDelete(item: any) {
  itemToDelete.value = item.id
  deleteDialog.value = true
}

async function saveItem() {
  loading.value = true
  try {
    if (editedId.value) {
      await updateCategory(editedId.value, editedItem.value)
    }
    else {
      await createCategory(editedItem.value)
    }
    dialog.value = false
    loadItems()
  }
  catch (err) {
    console.error(err)
  }
  finally {
    loading.value = false
  }
}

async function confirmDelete() {
  if (!itemToDelete.value)
    return
  loading.value = true
  try {
    await deleteCategory(itemToDelete.value)
    deleteDialog.value = false
    loadItems()
  }
  catch (err) {
    console.error(err)
  }
  finally {
    loading.value = false
  }
}

const categoryColors = ['primary', 'secondary', 'info', 'success', 'warning', 'accent']
function getCategoryColor(index: number) {
  return categoryColors[index % categoryColors.length]
}
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <!-- Page Header -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-5 ga-3">
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
          Categorias
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Organize seus produtos em categorias
        </p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" size="large" @click="openNew">
        Nova Categoria
      </v-btn>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="d-flex justify-center pa-12">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Empty State -->
    <v-card v-else-if="items.length === 0" rounded="xl" :elevation="0" class="border text-center pa-12">
      <v-icon icon="mdi-tag-plus-outline" size="64" color="grey-lighten-1" />
      <h3 class="text-h6 mt-4 mb-2">
        Nenhuma categoria criada
      </h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Crie sua primeira categoria para organizar os produtos
      </p>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openNew">
        Criar Categoria
      </v-btn>
    </v-card>

    <!-- Category Cards Grid -->
    <v-row v-else>
      <v-col
        v-for="(item, index) in items"
        :key="item.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card
          rounded="xl"
          :elevation="0"
          class="category-card border h-100"
          :class="{ 'opacity-60': !item.active }"
        >
          <v-card-text class="text-center pa-5">
            <!-- Icon -->
            <v-avatar :color="getCategoryColor(index)" variant="tonal" size="56" class="mb-3">
              <v-icon
                :icon="item.icon ? `mdi-${item.icon}` : 'mdi-tag-outline'"
                size="28"
              />
            </v-avatar>

            <!-- Name -->
            <h3 class="text-subtitle-1 font-weight-bold mb-1">
              {{ item.name }}
            </h3>

            <!-- Product Count -->
            <v-chip size="small" variant="tonal" color="secondary" class="mb-3">
              {{ productCounts[item.id] || 0 }} produto(s)
            </v-chip>

            <!-- Status -->
            <div class="d-flex justify-center">
              <v-chip
                :color="item.active ? 'success' : 'error'"
                size="x-small"
                variant="tonal"
                label
              >
                {{ item.active ? 'Ativa' : 'Inativa' }}
              </v-chip>
            </div>
          </v-card-text>

          <v-divider />

          <!-- Actions -->
          <v-card-actions class="justify-center pa-3">
            <v-btn variant="text" color="secondary" size="small" prepend-icon="mdi-pencil-outline" @click="editItem(item)">
              Editar
            </v-btn>
            <v-btn variant="text" color="error" size="small" prepend-icon="mdi-delete-outline" @click="openDelete(item)">
              Excluir
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center pa-5" style="background: linear-gradient(135deg, #5D4037, #8D6E63); color: white;">
          <v-icon :icon="editedId ? 'mdi-pencil' : 'mdi-plus-circle'" class="me-3" />
          <span class="text-h6">{{ editedId ? 'Editar Categoria' : 'Nova Categoria' }}</span>
        </v-card-title>
        <v-card-text class="pa-5">
          <v-form @submit.prevent>
            <v-text-field
              v-model="editedItem.name"
              label="Nome"
              variant="outlined"
              prepend-inner-icon="mdi-tag-outline"
              required
              class="mb-2"
            />
            <v-text-field
              v-model="editedItem.icon"
              label="Ícone MDI (sem prefixo mdi-)"
              variant="outlined"
              prepend-inner-icon="mdi-emoticon-outline"
              hint="Ex: food, cup, beer, gift"
              persistent-hint
              class="mb-2"
            />
            <v-text-field
              v-model.number="editedItem.sort_order"
              label="Ordem de exibição"
              type="number"
              variant="outlined"
              prepend-inner-icon="mdi-sort-numeric-ascending"
              class="mb-2"
            />
            <v-switch v-model="editedItem.active" color="success" label="Categoria Ativa" hide-details />
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
            Tem certeza que deseja excluir esta categoria?
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

<style scoped>
.category-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
}

.opacity-60 {
  opacity: 0.6;
}
</style>
