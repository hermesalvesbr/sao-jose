<script setup lang="ts">
/**
 * PDV Terminal — Tela de venda dedicada (fullscreen)
 *
 * Fluxo otimizado para operador:
 * 1. Selecionar categoria (chip-group)
 * 2. Clicar em produto (grid de cards)
 * 3. Ajustar quantidade no carrinho (+/-)
 * 4. Escolher forma de pagamento (botões grandes)
 * 5. Finalizar venda (botão destaque)
 *
 * Usa as collections existentes:
 * - pdv_categories, pdv_products, pdv_sales, pdv_sale_items
 */
import { useDisplay } from 'vuetify'

definePageMeta({ layout: false })

useHead({
  titleTemplate: '%s | Administracao | Capela Sao Jose',
})

useSeoMeta({
  title: 'Terminal PDV',
  description: 'Terminal de vendas do PDV da Capela Sao Jose.',
  ogTitle: 'Terminal PDV | Administracao | Capela Sao Jose',
  ogDescription: 'Terminal de vendas do PDV da Capela Sao Jose.',
  robots: 'noindex,nofollow',
})

const router = useRouter()
const { mobile } = useDisplay()
const {
  fetchProducts,
  fetchCategories,
  fetchProductionPoints,
  fetchOperators,
  createOperator,
  createSale,
  createSaleItem,
  updateProduct,
} = usePdv()

// State
const products = ref<any[]>([])
const categories = ref<any[]>([])
const productionPoints = ref<any[]>([])
const operators = ref<any[]>([])
const selectedOperator = ref<any>(null)
const operatorComboValue = ref<any>(null)
const operatorSearch = ref('')
const creatingOperator = ref(false)
const loading = ref(true)
const processing = ref(false)
const selectedPoint = ref<string | null>(null)
const selectedCategory = ref<string | null>(null)
const productSearch = ref('')
const cart = ref<any[]>([])
const paymentMethod = ref('dinheiro')
const showCartSheet = ref(false)
const successDialog = ref(false)
const lastSaleTotal = ref(0)
const discountType = ref<'percent' | 'fixed'>('percent')
const discountInput = ref<number | null>(null)

// Payment methods
const paymentMethods = [
  { value: 'dinheiro', title: 'Dinheiro', icon: 'mdi-cash', color: '#2E7D32' },
  { value: 'pix', title: 'PIX', icon: 'mdi-qrcode', color: '#1565C0' },
  { value: 'cartao', title: 'Cartão', icon: 'mdi-credit-card-outline', color: '#E65100' },
]

// Operator selection
const showOperatorDialog = computed(() => !selectedOperator.value)

// True when an existing item is picked from the list
const operatorIsSelected = computed(() => operatorComboValue.value && typeof operatorComboValue.value === 'object')
// True when user typed a name not in the list
const operatorIsNew = computed(() => !operatorIsSelected.value && !!operatorSearch.value?.trim())

const canConfirmOperator = computed(() => operatorIsSelected.value || operatorIsNew.value)

async function confirmOperator() {
  if (operatorIsSelected.value) {
    selectedOperator.value = operatorComboValue.value
    return
  }
  const name = operatorSearch.value.trim()
  if (!name)
    return
  creatingOperator.value = true
  try {
    const newOp = await createOperator({ name: titleCase(name), active: true })
    operators.value = [...operators.value, newOp].sort((a: any, b: any) =>
      a.name.localeCompare(b.name, 'pt-BR'),
    )
    selectedOperator.value = newOp
  }
  catch (e) {
    console.error('Failed to create operator', e)
  }
  finally {
    creatingOperator.value = false
  }
}

// Computed
const filteredCategories = computed(() => {
  if (!selectedPoint.value)
    return categories.value
  return categories.value.filter((cat) => {
    const pointId = typeof cat.points_id === 'object' && cat.points_id ? cat.points_id.id : cat.points_id
    return pointId === selectedPoint.value
  })
})

const filteredProducts = computed(() => {
  let result = products.value
  // Filter by production point
  if (selectedPoint.value) {
    result = result.filter((p) => {
      const ppId = typeof p.production_point_id === 'object' && p.production_point_id ? p.production_point_id.id : p.production_point_id
      const catPointId = p.category_id && typeof p.category_id === 'object' && p.category_id.points_id
        ? typeof p.category_id.points_id === 'object' ? p.category_id.points_id.id : p.category_id.points_id
        : null
      return ppId === selectedPoint.value || catPointId === selectedPoint.value
    })
  }
  // Filter by category
  if (selectedCategory.value) {
    result = result.filter((p) => {
      const catId = typeof p.category_id === 'object' && p.category_id ? p.category_id.id : p.category_id
      return catId === selectedCategory.value
    })
  }
  // Filter by search
  if (productSearch.value) {
    const term = productSearch.value.toLowerCase()
    result = result.filter(p => p.name?.toLowerCase().includes(term))
  }
  return result
})

const cartTotal = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0),
)

const discountValue = computed(() => {
  const input = Number(discountInput.value) || 0
  if (input <= 0)
    return 0
  if (discountType.value === 'percent')
    return Math.min(cartTotal.value, cartTotal.value * Math.min(input, 100) / 100)
  return Math.min(cartTotal.value, input)
})

const finalTotal = computed(() =>
  Math.max(0, cartTotal.value - discountValue.value),
)

const hasDiscount = computed(() => discountValue.value > 0)

const cartItemCount = computed(() =>
  cart.value.reduce((sum, item) => sum + item.quantity, 0),
)

// Load data
async function loadData() {
  loading.value = true
  try {
    const [prodRes, catRes, pointsRes, opsRes] = await Promise.all([
      fetchProducts({
        limit: -1,
        fields: ['*', 'category_id.name', 'category_id.id', 'category_id.points_id.*', 'production_point_id.*'],
        sort: ['sort_order', 'name'],
      }),
      fetchCategories({
        limit: -1,
        fields: ['*', 'points_id.*'],
        sort: 'sort_order',
      }),
      fetchProductionPoints({
        limit: -1,
        filter: { active: { _eq: true } },
        sort: 'name',
      }),
      fetchOperators({
        limit: -1,
        filter: { active: { _eq: true } },
        sort: ['name'],
      }),
    ])
    products.value = prodRes || []
    categories.value = catRes || []
    productionPoints.value = pointsRes || []
    operators.value = (opsRes || []).filter((op: any) => op.name !== 'Caixa Principal')
  }
  catch (e) {
    console.error('Failed to load POS data', e)
  }
  finally {
    loading.value = false
  }
}

onMounted(loadData)

// Cart operations
function addToCart(product: any) {
  const existing = cart.value.find(i => i.product_id === product.id)
  const maxStock = Number(product.stock_quantity) || 999
  if (existing) {
    if (existing.quantity < maxStock) {
      existing.quantity++
    }
  }
  else {
    cart.value.push({
      product_id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      max_stock: maxStock,
    })
  }
}

function incrementQty(item: any) {
  if (item.quantity < item.max_stock) {
    item.quantity++
  }
}

function decrementQty(item: any) {
  if (item.quantity > 1) {
    item.quantity--
  }
  else {
    removeFromCart(item)
  }
}

function removeFromCart(item: any) {
  const idx = cart.value.indexOf(item)
  if (idx > -1)
    cart.value.splice(idx, 1)
}

function clearCart() {
  cart.value = []
}

// Finalize sale
async function finishSale() {
  if (cart.value.length === 0 || processing.value)
    return

  processing.value = true
  try {
    // Create sale
    const sale = await createSale({
      sale_status: 'completed',
      total_amount: finalTotal.value,
      payment_method: paymentMethod.value,
      operator_id: selectedOperator.value.id,
      discount_amount: discountValue.value,
    })

    // Create sale items + update stock
    for (const item of cart.value) {
      await createSaleItem({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        status: 'published',
      })

      // Decrement stock
      const prod = products.value.find(p => p.id === item.product_id)
      if (prod) {
        const newStock = Math.max(0, Number(prod.stock_quantity) - item.quantity)
        await updateProduct(prod.id, { stock_quantity: newStock })
        prod.stock_quantity = newStock
      }
    }

    lastSaleTotal.value = finalTotal.value
    cart.value = []
    paymentMethod.value = 'dinheiro'
    discountInput.value = null
    showCartSheet.value = false
    successDialog.value = true

    // Auto-close success after 3s
    setTimeout(() => {
      successDialog.value = false
    }, 3000)
  }
  catch (e) {
    console.error('Sale failed', e)
  }
  finally {
    processing.value = false
  }
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

function goBack() {
  router.push('/admin/pdv')
}
</script>

<template>
  <v-app theme="cidadeTema">
    <!-- Top Bar -->
    <v-app-bar flat color="secondary-darken-1" density="compact" class="px-2">
      <v-btn icon="mdi-arrow-left" variant="text" color="white" size="small" @click="goBack" />

      <v-app-bar-title class="text-body-1 font-weight-bold text-white">
        <v-icon icon="mdi-point-of-sale" class="me-2" size="20" />
        PDV — Ponto de Venda
      </v-app-bar-title>

      <!-- Operator badge -->
      <v-chip
        v-if="selectedOperator"
        color="white"
        variant="outlined"
        size="small"
        prepend-icon="mdi-account"
        class="me-2"
        @click="selectedOperator = null"
      >
        {{ selectedOperator.name }}
      </v-chip>

      <v-spacer />

      <!-- Cart badge (mobile) -->
      <v-btn
        v-if="mobile"
        icon
        variant="text"
        color="white"
        @click="showCartSheet = true"
      >
        <v-badge :content="cartItemCount" :model-value="cartItemCount > 0" color="error" floating>
          <v-icon icon="mdi-cart" />
        </v-badge>
      </v-btn>
    </v-app-bar>

    <v-main class="bg-background">
      <v-container fluid class="pa-0 fill-height">
        <v-row no-gutters class="fill-height">
          <!-- LEFT: Product Grid -->
          <v-col cols="12" :md="8" :lg="8" class="d-flex flex-column" style="height: calc(100vh - 48px); overflow-y: auto;">
            <!-- Search + Category Filters -->
            <div class="pa-3 bg-surface border-b">
              <v-text-field
                v-model="productSearch"
                prepend-inner-icon="mdi-magnify"
                placeholder="Buscar produto..."
                variant="solo-filled"
                density="compact"
                hide-details
                clearable
                flat
                class="mb-3"
              />

              <!-- Production Point Tabs -->
              <v-tabs
                v-model="selectedPoint"
                color="primary"
                density="compact"
                class="mb-2"
              >
                <v-tab :value="null" class="text-none">
                  <v-icon start icon="mdi-view-grid-outline" />
                  Todos os Pontos
                </v-tab>
                <v-tab
                  v-for="point in productionPoints"
                  :key="point.id"
                  :value="point.id"
                  class="text-none"
                >
                  {{ point.name }}
                </v-tab>
              </v-tabs>

              <!-- Category Chips -->
              <v-chip-group v-model="selectedCategory" selected-class="text-on-primary bg-primary" mandatory>
                <v-chip :value="null" variant="tonal" filter size="small" label>
                  Todas
                </v-chip>
                <v-chip
                  v-for="cat in filteredCategories"
                  :key="cat.id"
                  :value="cat.id"
                  variant="tonal"
                  filter
                  size="small"
                  label
                >
                  <v-icon v-if="cat.icon" :icon="`mdi-${cat.icon}`" start size="16" />
                  {{ cat.name }}
                </v-chip>
              </v-chip-group>
            </div>

            <!-- Products Grid -->
            <div v-if="loading" class="d-flex justify-center align-center flex-grow-1">
              <v-progress-circular indeterminate color="primary" size="48" />
            </div>

            <div v-else-if="filteredProducts.length === 0" class="d-flex flex-column justify-center align-center flex-grow-1 text-center pa-6">
              <v-icon icon="mdi-package-variant-remove" size="64" color="on-surface-variant" class="mb-3" />
              <p class="text-body-1 text-on-surface">
                Nenhum produto encontrado
              </p>
              <p class="text-body-2 text-on-surface-variant">
                Tente outra categoria ou busca
              </p>
            </div>

            <v-container v-else fluid class="flex-grow-1 pa-3 overflow-y-auto">
              <v-row dense>
                <v-col
                  v-for="product in filteredProducts"
                  :key="product.id"
                  cols="6"
                  sm="4"
                  md="3"
                  lg="3"
                >
                  <v-card
                    class="pos-product-card h-100 d-flex flex-column"
                    rounded="lg"
                    variant="outlined"
                    @click="addToCart(product)"
                  >
                    <v-card-text class="text-center pa-3 flex-grow-1 d-flex flex-column justify-center">
                      <v-avatar color="surface-light" size="44" class="mx-auto mb-2">
                        <v-icon icon="mdi-package-variant" color="secondary" size="22" />
                      </v-avatar>
                      <div class="text-body-2 font-weight-medium text-on-surface" style="line-height: 1.3;">
                        {{ product.name }}
                      </div>
                      <div class="text-subtitle-1 font-weight-bold text-primary mt-1">
                        {{ formatCurrency(product.price) }}
                      </div>
                      <div class="text-caption text-on-surface-variant">
                        {{ product.stock_quantity }} em estoque
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-container>
          </v-col>

          <!-- RIGHT: Cart Panel (desktop) -->
          <v-col v-if="!mobile" cols="4" class="d-flex flex-column border-s bg-surface" style="height: calc(100vh - 48px);">
            <!-- Cart Header -->
            <div class="pa-4 border-b d-flex justify-space-between align-center">
              <div class="d-flex align-center">
                <v-icon icon="mdi-cart" color="secondary" class="me-2" />
                <span class="text-subtitle-1 font-weight-bold text-on-surface">Carrinho</span>
              </div>
              <v-chip v-if="cartItemCount > 0" size="small" color="primary" variant="tonal" label>
                {{ cartItemCount }} item(ns)
              </v-chip>
            </div>

            <!-- Cart Items -->
            <div class="flex-grow-1 overflow-y-auto pa-3">
              <div v-if="cart.length === 0" class="text-center pa-8">
                <v-icon icon="mdi-cart-off" size="48" color="on-surface-variant" class="mb-3" />
                <p class="text-body-2 text-on-surface-variant">
                  Toque em um produto para adicionar
                </p>
              </div>

              <div v-for="(item, index) in cart" :key="index" class="d-flex align-center pa-2 mb-2 rounded-lg bg-surface-light">
                <div class="flex-grow-1">
                  <div class="text-body-2 font-weight-medium text-on-surface">
                    {{ item.name }}
                  </div>
                  <div class="text-caption text-on-surface-variant">
                    {{ formatCurrency(item.price) }} / un
                  </div>
                </div>

                <!-- Qty controls -->
                <div class="d-flex align-center ga-1 mx-2">
                  <v-btn icon="mdi-minus" size="x-small" variant="tonal" color="secondary" density="compact" @click="decrementQty(item)" />
                  <span class="text-body-2 font-weight-bold text-on-surface" style="min-width: 24px; text-align: center;">{{ item.quantity }}</span>
                  <v-btn icon="mdi-plus" size="x-small" variant="tonal" color="primary" density="compact" @click="incrementQty(item)" />
                </div>

                <div class="text-body-2 font-weight-bold text-on-surface text-right" style="min-width: 70px;">
                  {{ formatCurrency(item.price * item.quantity) }}
                </div>

                <v-btn icon="mdi-close" size="x-small" variant="text" color="error" density="compact" class="ms-1" @click="removeFromCart(item)" />
              </div>
            </div>

            <!-- Payment + Total (sticky bottom) -->
            <div class="pa-4 border-t">
              <!-- Subtotal -->
              <div class="d-flex justify-space-between align-center" :class="hasDiscount ? 'mb-1' : 'mb-4'">
                <span class="text-body-1 text-on-surface">{{ hasDiscount ? 'Subtotal' : 'Total' }}</span>
                <span :class="hasDiscount ? 'text-body-1 text-decoration-line-through text-on-surface-variant' : 'text-h5 font-weight-bold text-success'">{{ formatCurrency(cartTotal) }}</span>
              </div>

              <!-- Discount section -->
              <div class="mb-3">
                <div class="d-flex align-center ga-2 mb-2">
                  <v-btn-toggle v-model="discountType" density="compact" mandatory color="warning" variant="outlined" divided>
                    <v-btn value="percent" size="x-small">
                      %
                    </v-btn>
                    <v-btn value="fixed" size="x-small">
                      R$
                    </v-btn>
                  </v-btn-toggle>
                  <v-text-field
                    v-model.number="discountInput"
                    :label="discountType === 'percent' ? 'Desconto %' : 'Desconto R$'"
                    type="number"
                    variant="outlined"
                    density="compact"
                    hide-details
                    :min="0"
                    :max="discountType === 'percent' ? 100 : cartTotal"
                    clearable
                    style="max-width: 160px;"
                  />
                </div>
              </div>

              <!-- Total final com desconto -->
              <div v-if="hasDiscount" class="d-flex justify-space-between align-center mb-1">
                <span class="text-caption text-error">Desconto</span>
                <span class="text-caption text-error font-weight-bold">- {{ formatCurrency(discountValue) }}</span>
              </div>
              <div v-if="hasDiscount" class="d-flex justify-space-between align-center mb-4">
                <span class="text-h6 text-on-surface">Total</span>
                <span class="text-h5 font-weight-bold text-success">{{ formatCurrency(finalTotal) }}</span>
              </div>

              <!-- Payment method buttons -->
              <div class="text-caption text-uppercase font-weight-bold text-on-surface-variant mb-2" style="letter-spacing: 1px;">
                Pagamento
              </div>
              <v-row dense class="mb-4">
                <v-col v-for="pm in paymentMethods" :key="pm.value" cols="6">
                  <v-btn
                    block
                    :variant="paymentMethod === pm.value ? 'flat' : 'outlined'"
                    :color="paymentMethod === pm.value ? pm.color : undefined"
                    class="justify-start text-none"
                    size="small"
                    @click="paymentMethod = pm.value"
                  >
                    <v-icon :icon="pm.icon" start size="18" />
                    {{ pm.title }}
                  </v-btn>
                </v-col>
              </v-row>

              <!-- Actions -->
              <v-row dense>
                <v-col cols="4">
                  <v-btn
                    block
                    variant="tonal"
                    color="error"
                    :disabled="cart.length === 0"
                    @click="clearCart"
                  >
                    Limpar
                  </v-btn>
                </v-col>
                <v-col cols="8">
                  <v-btn
                    block
                    color="success"
                    size="large"
                    class="font-weight-bold"
                    :disabled="cart.length === 0"
                    :loading="processing"
                    prepend-icon="mdi-check-circle"
                    @click="finishSale"
                  >
                    Finalizar
                  </v-btn>
                </v-col>
              </v-row>
            </div>
          </v-col>
        </v-row>
      </v-container>

      <!-- Mobile: Cart Bottom Sheet -->
      <v-bottom-sheet v-if="mobile" v-model="showCartSheet" fullscreen>
        <v-card class="d-flex flex-column" style="height: 100%;">
          <v-card-title class="d-flex align-center justify-space-between bg-secondary-darken-1 text-white pa-4">
            <div class="d-flex align-center">
              <v-icon icon="mdi-cart" class="me-2" />
              <span>Carrinho ({{ cartItemCount }})</span>
            </div>
            <v-btn icon="mdi-close" variant="text" color="white" size="small" @click="showCartSheet = false" />
          </v-card-title>

          <v-card-text class="flex-grow-1 overflow-y-auto pa-3">
            <div v-if="cart.length === 0" class="text-center pa-8">
              <v-icon icon="mdi-cart-off" size="48" color="on-surface-variant" class="mb-3" />
              <p class="text-body-2 text-on-surface-variant">
                Carrinho vazio
              </p>
            </div>

            <div v-for="(item, index) in cart" :key="index" class="d-flex align-center pa-3 mb-2 rounded-lg bg-surface-light">
              <div class="flex-grow-1">
                <div class="text-body-2 font-weight-medium text-on-surface">
                  {{ item.name }}
                </div>
                <div class="text-caption text-on-surface-variant">
                  {{ formatCurrency(item.price) }} / un
                </div>
              </div>
              <div class="d-flex align-center ga-1 mx-2">
                <v-btn icon="mdi-minus" size="x-small" variant="tonal" color="secondary" density="compact" @click="decrementQty(item)" />
                <span class="text-body-2 font-weight-bold text-on-surface" style="min-width: 24px; text-align: center;">{{ item.quantity }}</span>
                <v-btn icon="mdi-plus" size="x-small" variant="tonal" color="primary" density="compact" @click="incrementQty(item)" />
              </div>
              <div class="text-body-2 font-weight-bold text-on-surface" style="min-width: 70px; text-align: right;">
                {{ formatCurrency(item.price * item.quantity) }}
              </div>
              <v-btn icon="mdi-close" size="x-small" variant="text" color="error" density="compact" class="ms-1" @click="removeFromCart(item)" />
            </div>
          </v-card-text>

          <!-- Mobile Payment -->
          <div class="pa-4 border-t bg-surface">
            <div class="d-flex justify-space-between align-center" :class="hasDiscount ? 'mb-1' : 'mb-3'">
              <span class="text-body-1 text-on-surface">{{ hasDiscount ? 'Subtotal' : 'Total' }}</span>
              <span :class="hasDiscount ? 'text-body-1 text-decoration-line-through text-on-surface-variant' : 'text-h5 font-weight-bold text-success'">{{ formatCurrency(cartTotal) }}</span>
            </div>

            <!-- Discount section (mobile) -->
            <div class="mb-2">
              <div class="d-flex align-center ga-2 mb-2">
                <v-btn-toggle v-model="discountType" density="compact" mandatory color="warning" variant="outlined" divided>
                  <v-btn value="percent" size="x-small">
                    %
                  </v-btn>
                  <v-btn value="fixed" size="x-small">
                    R$
                  </v-btn>
                </v-btn-toggle>
                <v-text-field
                  v-model.number="discountInput"
                  :label="discountType === 'percent' ? 'Desconto %' : 'Desconto R$'"
                  type="number"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :min="0"
                  :max="discountType === 'percent' ? 100 : cartTotal"
                  clearable
                  style="max-width: 160px;"
                />
              </div>
            </div>

            <div v-if="hasDiscount" class="d-flex justify-space-between align-center mb-1">
              <span class="text-caption text-error">Desconto</span>
              <span class="text-caption text-error font-weight-bold">- {{ formatCurrency(discountValue) }}</span>
            </div>
            <div class="d-flex justify-space-between align-center mb-3">
              <span class="text-h6 text-on-surface">Total</span>
              <span class="text-h5 font-weight-bold text-success">{{ formatCurrency(finalTotal) }}</span>
            </div>

            <div class="text-caption text-uppercase font-weight-bold text-on-surface-variant mb-2" style="letter-spacing: 1px;">
              Pagamento
            </div>
            <v-row dense class="mb-3">
              <v-col v-for="pm in paymentMethods" :key="pm.value" cols="6">
                <v-btn
                  block
                  :variant="paymentMethod === pm.value ? 'flat' : 'outlined'"
                  :color="paymentMethod === pm.value ? pm.color : undefined"
                  class="justify-start text-none"
                  size="small"
                  @click="paymentMethod = pm.value"
                >
                  <v-icon :icon="pm.icon" start size="18" />
                  {{ pm.title }}
                </v-btn>
              </v-col>
            </v-row>

            <v-btn
              block
              color="success"
              size="x-large"
              class="font-weight-bold"
              :disabled="cart.length === 0"
              :loading="processing"
              prepend-icon="mdi-check-circle"
              @click="finishSale"
            >
              Finalizar Venda
            </v-btn>
          </div>
        </v-card>
      </v-bottom-sheet>

      <!-- Mobile floating cart button -->
      <v-btn
        v-if="mobile && cart.length > 0 && !showCartSheet"
        class="pos-floating-cart"
        color="success"
        size="large"
        rounded="pill"
        elevation="8"
        style="position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); z-index: 100;"
        @click="showCartSheet = true"
      >
        <v-icon icon="mdi-cart" start />
        {{ formatCurrency(finalTotal) }}
        <v-badge :content="cartItemCount" color="error" floating />
      </v-btn>
    </v-main>

    <!-- Success Dialog -->
    <v-dialog v-model="successDialog" max-width="360" persistent>
      <v-card rounded="xl" class="text-center pa-8">
        <v-avatar color="success" size="80" class="mb-4">
          <v-icon icon="mdi-check-bold" size="40" color="white" />
        </v-avatar>
        <h2 class="text-h5 font-weight-bold text-on-surface mb-2">
          Venda Finalizada!
        </h2>
        <p class="text-h4 font-weight-bold text-success mb-4">
          {{ formatCurrency(lastSaleTotal) }}
        </p>
        <v-btn color="primary" variant="tonal" block @click="successDialog = false">
          Nova Venda
        </v-btn>
      </v-card>
    </v-dialog>

    <!-- Operator Selection Dialog (blocks terminal until operator is identified) -->
    <v-dialog :model-value="showOperatorDialog" max-width="420" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center pa-5 pb-3">
          <v-icon icon="mdi-account-check" color="primary" class="me-2" />
          Identificação do Operador
        </v-card-title>
        <v-card-subtitle class="px-5 pb-3">
          Selecione ou cadastre quem está operando o caixa
        </v-card-subtitle>
        <v-card-text class="px-5 pb-4">
          <v-combobox
            v-model="operatorComboValue"
            v-model:search="operatorSearch"
            :items="operators"
            item-title="name"
            return-object
            autofocus
            label="Nome do operador"
            placeholder="Selecione ou digite um novo nome..."
            variant="outlined"
            prepend-inner-icon="mdi-account-search"
            clearable
            auto-select-first="exact"
          >
            <template #no-data>
              <v-list-item
                v-if="operatorSearch?.trim()"
                prepend-icon="mdi-account-plus"
                color="primary"
              >
                <template #title>
                  Pressione <strong>Confirmar</strong> para criar <strong>{{ operatorSearch }}</strong>
                </template>
              </v-list-item>
            </template>
          </v-combobox>
        </v-card-text>
        <v-card-actions class="px-5 pb-5">
          <v-btn variant="text" color="secondary" @click="goBack">
            Voltar
          </v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            variant="flat"
            :disabled="!canConfirmOperator"
            :loading="creatingOperator"
            prepend-icon="mdi-check"
            @click="confirmOperator"
          >
            {{ operatorIsNew ? 'Criar e Confirmar' : 'Confirmar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<style scoped>
.pos-product-card {
  cursor: pointer;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
  border-color: rgb(var(--v-theme-surface-variant)) !important;
}

.pos-product-card:hover {
  transform: scale(1.03);
  border-color: rgb(var(--v-theme-primary)) !important;
}

.pos-product-card:active {
  transform: scale(0.98);
}
</style>
