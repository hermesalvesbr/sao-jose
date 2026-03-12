<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

definePageMeta({ layout: 'admin' })

const { mobile } = useDisplay()

const { fetchSales, createSale, createSaleItem, fetchProducts, updateProduct, updateSale, fetchSaleItems, fetchOperators } = usePdv()

const items = ref<any[]>([])
const products = ref<any[]>([])
const loading = ref(false)
const dialog = ref(false)
const search = useState<string>('pdv-vendas-search', () => '')
const statusFilter = useState<string | null>('pdv-vendas-status', () => null)
const productSearch = ref('')

// ─── Detail modal state ─────────────────────────────────────────────────────────
const detailDialog = ref(false)
const detailSale = ref<any>(null)
const detailItems = ref<any[]>([])
const detailLoading = ref(false)

// ─── Adjust transfers state ──────────────────────────────────────────────────
const adjustDialog = ref(false)
const adjustLoading = ref(false)
const adjustOperatorId = ref<string | null>(null)
const adjustSales = ref<any[]>([])
const adjustSelectedRows = ref<string[]>([])
const adjustTargetPaymentMethod = ref('pix')

const adjustSelectedSalesTotal = computed(() => {
  return adjustSales.value
    .filter(s => adjustSelectedRows.value.includes(s.id))
    .reduce((sum, s) => sum + Number(s.total_amount || 0), 0)
})

// ─── Operator transfer state ──────────────────────────────────────────────────
const operators = ref<any[]>([])
const transferOperatorId = ref<string | null>(null)
const transferring = ref(false)
const detailPaymentMethod = ref<string>('')
const savingPayment = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

const cart = ref<any[]>([])
const selectedProduct = ref(null)
const saleQuantity = ref(1)
const paymentMethod = ref('dinheiro')
const saleObservation = ref('')

const headers = [
  { title: 'Operador', key: 'operator_id' },
  { title: 'Data/Hora', key: 'created_at' },
  { title: 'Status', key: 'sale_status', align: 'center' as const },
  { title: 'Pagamento', key: 'payment_method' },
  { title: 'Total', key: 'total_amount', align: 'end' as const },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

const paymentMethods = [
  { title: 'Dinheiro', value: 'dinheiro', icon: 'mdi-cash', color: 'success' },
  { title: 'PIX', value: 'pix', icon: 'mdi-qrcode', color: 'info' },
  { title: 'Crédito', value: 'cartao_credito', icon: 'mdi-credit-card-outline', color: 'primary' },
  { title: 'Débito', value: 'cartao_debito', icon: 'mdi-credit-card-fast-outline', color: 'warning' },
]

const filteredSales = computed(() => {
  let result = items.value
  if (statusFilter.value) {
    result = result.filter(s => s.sale_status === statusFilter.value)
  }
  return result
})

const filteredProducts = computed(() => {
  if (!productSearch.value)
    return products.value
  const term = productSearch.value.toLowerCase()
  return products.value.filter(p => p.name.toLowerCase().includes(term))
})

async function loadData() {
  loading.value = true
  try {
    const [salesRes, prodRes, opsRes] = await Promise.all([
      fetchSales({ limit: -1, sort: ['-date_created'], fields: ['*', 'operator_id.id', 'operator_id.name'] }),
      fetchProducts({ limit: -1, filter: { active: { _eq: true } } }),
      fetchOperators({ limit: -1, filter: { active: { _eq: true } }, sort: ['name'] }),
    ])
    items.value = salesRes || []
    products.value = prodRes || []
    operators.value = (opsRes || []) as any[]
  }
  catch (error) {
    console.error(error)
  }
  finally {
    loading.value = false
  }
}

// ─── Adjust methods ──────────────────────────────────────────────────────────

async function fetchAdjustSales() {
  if (!adjustOperatorId.value)
    return
  adjustLoading.value = true
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Filtra vendas de hoje, do operador selecionado, que sejam concluídas (dinheiro removido do filtro para ser geral)
    const res = await fetchSales({
      fields: ['id', 'total_amount', 'created_at', 'date_created', 'payment_method'],
      filter: {
        operator_id: { _eq: adjustOperatorId.value },
        sale_status: { _eq: 'completed' },
        date_created: { _gte: today.toISOString() },
      },
      limit: -1,
      sort: ['-date_created'],
    })
    adjustSales.value = res || []
    adjustSelectedRows.value = []
  }
  catch (err) {
    console.error(err)
  }
  finally {
    adjustLoading.value = false
  }
}

function openAdjustDialog() {
  adjustOperatorId.value = null
  adjustSales.value = []
  adjustSelectedRows.value = []
  adjustDialog.value = true
}

async function confirmAdjustBatch() {
  if (adjustSelectedRows.value.length === 0)
    return
  adjustLoading.value = true
  try {
    for (const saleId of adjustSelectedRows.value) {
      await updateSale(saleId, { payment_method: adjustTargetPaymentMethod.value })
    }
    const methodLabel = getPaymentLabel(adjustTargetPaymentMethod.value)
    snackbarMsg.value = `${adjustSelectedRows.value.length} venda(s) alterada(s) para ${methodLabel}!`
    snackbarColor.value = 'success'
    snackbar.value = true
    await loadData()
    // Refresh modal list
    if (adjustOperatorId.value) {
      await fetchAdjustSales()
    }
    adjustSelectedRows.value = []
  }
  catch (err) {
    console.error(err)
    snackbarMsg.value = 'Erro ao atualizar vendas'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
  finally {
    adjustLoading.value = false
  }
}

watch(adjustOperatorId, () => {
  if (adjustOperatorId.value)
    fetchAdjustSales()
})

onMounted(() => {
  loadData()
})

const cartTotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const cartItemCount = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.quantity, 0)
})

function addProductToCart(product: any) {
  const existing = cart.value.find(i => i.product_id === product.id)
  if (existing) {
    if (existing.quantity < product.stock_quantity) {
      existing.quantity += 1
    }
  }
  else if (product.stock_quantity > 0) {
    cart.value.push({
      product_id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      max_stock: product.stock_quantity,
    })
  }
}

function addToCart() {
  if (!selectedProduct.value)
    return
  const product = products.value.find(p => p.id === selectedProduct.value)
  if (!product)
    return

  const existing = cart.value.find(i => i.product_id === product.id)
  if (existing) {
    existing.quantity += saleQuantity.value
  }
  else {
    cart.value.push({
      product_id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: saleQuantity.value,
      max_stock: product.stock_quantity,
    })
  }
  selectedProduct.value = null
  saleQuantity.value = 1
}

function removeFromCart(index: number) {
  cart.value.splice(index, 1)
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
}

function openNewSale() {
  cart.value = []
  paymentMethod.value = 'dinheiro'
  saleObservation.value = ''
  productSearch.value = ''
  dialog.value = true
}

async function finishSale() {
  if (cart.value.length === 0)
    return

  loading.value = true
  try {
    const saleData = {
      sale_status: 'completed',
      total_amount: cartTotal.value,
      payment_method: paymentMethod.value,
    }
    const currentSale = await createSale(saleData)

    for (const item of cart.value) {
      const subtotal = item.price * item.quantity
      await createSaleItem({
        sale_id: currentSale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: subtotal,
        status: 'published',
      })

      const prodFull = products.value.find(p => p.id === item.product_id)
      if (prodFull) {
        const newStock = Math.max(0, Number(prodFull.stock_quantity) - item.quantity)
        await updateProduct(prodFull.id, { stock_quantity: newStock })
      }
    }

    dialog.value = false
    loadData()
  }
  catch (err) {
    console.error(err)
  }
  finally {
    loading.value = false
  }
}

async function updateSaleStatus(item: any, newStatus: string) {
  loading.value = true
  try {
    await updateSale(item.id, { sale_status: newStatus })
    loadData()
  }
  catch (err) {
    console.error(err)
  }
  finally {
    loading.value = false
  }
}

async function confirmTransfer() {
  if (!detailSale.value || !transferOperatorId.value)
    return
  transferring.value = true
  try {
    await updateSale(detailSale.value.id, { operator_id: transferOperatorId.value })
    snackbarMsg.value = 'Operador transferido com sucesso!'
    snackbarColor.value = 'success'
    snackbar.value = true
    await loadData()
    detailSale.value = items.value.find(s => s.id === detailSale.value?.id) ?? detailSale.value
  }
  catch (err) {
    console.error(err)
    snackbarMsg.value = 'Erro ao transferir operador'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
  finally {
    transferring.value = false
  }
}

async function confirmPaymentChange() {
  if (!detailSale.value || !detailPaymentMethod.value)
    return
  savingPayment.value = true
  try {
    await updateSale(detailSale.value.id, { payment_method: detailPaymentMethod.value })
    snackbarMsg.value = 'Forma de pagamento atualizada!'
    snackbarColor.value = 'success'
    snackbar.value = true
    await loadData()
    detailSale.value = items.value.find(s => s.id === detailSale.value?.id) ?? detailSale.value
  }
  catch (err) {
    console.error(err)
    snackbarMsg.value = 'Erro ao atualizar pagamento'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
  finally {
    savingPayment.value = false
  }
}

function formatDate(dateStr: string) {
  if (!dateStr)
    return '-'
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

function getStatusColor(status: string) {
  if (status === 'completed')
    return 'success'
  if (status === 'cancelled')
    return 'error'
  return 'warning'
}

function getStatusLabel(status: string) {
  if (status === 'completed')
    return 'Concluída'
  if (status === 'cancelled')
    return 'Cancelada'
  return 'Pendente'
}

function getPaymentLabel(method: string) {
  const labels: Record<string, string> = {
    dinheiro: 'Dinheiro',
    pix: 'PIX',
    cartao_credito: 'Crédito',
    cartao_debito: 'Débito',
  }
  return labels[method] || method
}

function getPaymentIcon(method: string) {
  const pm = paymentMethods.find(p => p.value === method)
  return pm?.icon || 'mdi-cash'
}

async function openSaleDetail(sale: any) {
  detailSale.value = sale
  detailItems.value = []
  detailDialog.value = true
  detailLoading.value = true
  transferOperatorId.value = typeof sale.operator_id === 'object' ? (sale.operator_id?.id ?? null) : (sale.operator_id ?? null)
  detailPaymentMethod.value = sale.payment_method ?? ''
  try {
    const res = await fetchSaleItems({
      fields: [
        'id',
        'quantity',
        'unit_price',
        'total_price',
        'product_id.id',
        'product_id.name',
        'product_id.category_id.name',
      ],
      filter: { sale_id: { _eq: sale.id } },
      limit: -1,
    })
    detailItems.value = (res as any[]) || []
  }
  catch (e) {
    console.error('Error fetching sale items:', e)
  }
  finally {
    detailLoading.value = false
  }
}
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <!-- Page Header -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-5 ga-3">
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
          Vendas
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Registre e acompanhe todas as vendas do PDV
        </p>
      </div>
      <div class="d-flex ga-3 flex-wrap">
        <v-btn
          color="secondary"
          variant="tonal"
          prepend-icon="mdi-swap-horizontal"
          size="large"
          @click="openAdjustDialog"
        >
          Ajuste Dinheiro → PIX
        </v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-cart-plus"
          size="large"
          @click="openNewSale"
        >
          Nova Venda
        </v-btn>
      </div>
    </div>

    <!-- Filters -->
    <v-card rounded="xl" :elevation="0" class="border mb-5">
      <v-card-text class="py-3">
        <v-row align="center" no-gutters>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Buscar venda..."
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" sm="8" class="ps-sm-4 pt-3 pt-sm-0">
            <v-chip-group v-model="statusFilter" selected-class="text-primary" column>
              <v-chip :value="null" variant="tonal" filter size="small">
                Todas
              </v-chip>
              <v-chip value="completed" variant="tonal" filter size="small" color="success">
                Concluídas
              </v-chip>
              <v-chip value="pending_print" variant="tonal" filter size="small" color="warning">
                Pendentes
              </v-chip>
              <v-chip value="cancelled" variant="tonal" filter size="small" color="error">
                Canceladas
              </v-chip>
            </v-chip-group>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Sales Table -->
    <v-card rounded="xl" :elevation="0" class="border">
      <v-data-table
        :headers="headers"
        :items="filteredSales"
        :loading="loading"
        :search="search"
        hover
        items-per-page="10"
      >
        <template #[`item.operator_id`]="{ item }">
          <div class="text-body-2 font-weight-medium">
            {{ typeof item.operator_id === 'object' ? (item.operator_id?.name ?? '–') : (item.operator_id ?? '–') }}
          </div>
          <div class="text-caption text-medium-emphasis">
            #{{ item.id?.substring(0, 8) }}
          </div>
        </template>

        <template #[`item.created_at`]="{ item }">
          <div class="text-body-2">
            {{ formatDate(item.created_at || item.date_created) }}
          </div>
        </template>

        <template #[`item.sale_status`]="{ item }">
          <v-chip
            :color="getStatusColor(item.sale_status)"
            size="small"
            variant="tonal"
            label
          >
            <v-icon start size="14" :icon="item.sale_status === 'completed' ? 'mdi-check' : item.sale_status === 'cancelled' ? 'mdi-close' : 'mdi-clock-outline'" />
            {{ getStatusLabel(item.sale_status) }}
          </v-chip>
        </template>

        <template #[`item.payment_method`]="{ item }">
          <div class="d-flex align-center">
            <v-icon :icon="getPaymentIcon(item.payment_method)" size="18" class="me-2" color="secondary" />
            <span class="text-body-2">{{ getPaymentLabel(item.payment_method) }}</span>
          </div>
        </template>

        <template #[`item.total_amount`]="{ item }">
          <div>
            <span class="font-weight-bold text-body-2">{{ formatCurrency(item.total_amount) }}</span>
            <div v-if="Number(item.discount_amount) > 0" class="text-caption text-error">
              <v-icon icon="mdi-tag-minus-outline" size="12" class="me-1" />
              {{ formatCurrency(item.discount_amount) }}
            </div>
          </div>
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="d-flex align-center justify-end">
            <v-btn
              variant="text"
              size="small"
              color="primary"
              @click="openSaleDetail(item)"
            >
              <v-icon icon="mdi-eye-outline" size="18" />
              <v-tooltip activator="parent" location="top">
                Ver detalhes
              </v-tooltip>
            </v-btn>
            <v-btn
              v-if="item.sale_status !== 'cancelled'"
              variant="text"
              size="small"
              color="error"
              @click="updateSaleStatus(item, 'cancelled')"
            >
              <v-icon icon="mdi-cancel" size="18" />
              <v-tooltip activator="parent" location="top">
                Cancelar venda
              </v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- New Sale Dialog (POS Interface) -->
    <v-dialog v-model="dialog" max-width="1000px" fullscreen-mobile>
      <v-card rounded="xl" class="d-flex flex-column" style="height: 85vh;">
        <!-- Header -->
        <v-card-title class="d-flex align-center justify-space-between pa-4" style="background: linear-gradient(135deg, #2E7D32, #66BB6A); color: white;">
          <div class="d-flex align-center">
            <v-icon icon="mdi-point-of-sale" class="me-3" size="28" />
            <div>
              <div class="text-h6">
                Nova Venda
              </div>
              <div class="text-caption" style="opacity: 0.8;">
                {{ cartItemCount }} item(ns) no carrinho
              </div>
            </div>
          </div>
          <v-btn
            icon="mdi-close"
            variant="text"
            color="white"
            density="comfortable"
            class="position-absolute"
            style="top: 12px; right: 12px; z-index: 10;"
            @click="dialog = false"
          />
        </v-card-title>

        <!-- Body -->
        <v-card-text class="flex-grow-1 overflow-y-auto pa-0">
          <v-row no-gutters class="h-100">
            <!-- Left: Products -->
            <v-col cols="12" md="7" class="pa-4 border-e-md">
              <!-- Product Search -->
              <v-text-field
                v-model="productSearch"
                prepend-inner-icon="mdi-magnify"
                label="Buscar produto..."
                variant="outlined"
                density="compact"
                hide-details
                clearable
                class="mb-4"
              />

              <!-- Manual product add -->
              <v-row class="mb-4" align="center">
                <v-col cols="7">
                  <v-autocomplete
                    v-model="selectedProduct"
                    :items="products"
                    item-title="name"
                    item-value="id"
                    label="Selecionar produto"
                    variant="outlined"
                    density="compact"
                    hide-details
                    clearable
                  />
                </v-col>
                <v-col cols="3">
                  <v-text-field
                    v-model.number="saleQuantity"
                    label="Qtd"
                    type="number"
                    min="1"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </v-col>
                <v-col cols="2">
                  <v-btn
                    color="primary"
                    block
                    :disabled="!selectedProduct || saleQuantity < 1"
                    @click="addToCart"
                  >
                    <v-icon icon="mdi-plus" />
                  </v-btn>
                </v-col>
              </v-row>

              <!-- Product Grid -->
              <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2" style="letter-spacing: 1px;">
                Toque para adicionar
              </div>
              <v-row dense>
                <v-col
                  v-for="product in filteredProducts"
                  :key="product.id"
                  cols="6"
                  sm="4"
                >
                  <v-card
                    class="product-card pa-3 text-center cursor-pointer"
                    rounded="lg"
                    :elevation="0"
                    variant="outlined"
                    :disabled="product.stock_quantity <= 0"
                    @click="addProductToCart(product)"
                  >
                    <v-icon icon="mdi-package-variant" color="secondary" size="28" class="mb-1" />
                    <div class="text-body-2 font-weight-medium text-truncate">
                      {{ product.name }}
                    </div>
                    <div class="text-caption text-primary font-weight-bold">
                      {{ formatCurrency(product.price) }}
                    </div>
                    <v-chip
                      size="x-small"
                      :color="product.stock_quantity <= 0 ? 'error' : product.stock_quantity <= 3 ? 'warning' : 'success'"
                      variant="tonal"
                      class="mt-1"
                    >
                      {{ product.stock_quantity }} un
                    </v-chip>
                  </v-card>
                </v-col>
              </v-row>
            </v-col>

            <!-- Right: Cart + Payment -->
            <v-col cols="12" md="5" class="d-flex flex-column bg-grey-lighten-4">
              <div class="pa-4 flex-grow-1 overflow-y-auto">
                <!-- Cart Items -->
                <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-3" style="letter-spacing: 1px;">
                  Carrinho
                </div>

                <div v-if="cart.length === 0" class="text-center pa-8">
                  <v-icon icon="mdi-cart-off" size="40" color="grey-lighten-1" />
                  <p class="text-body-2 text-medium-emphasis mt-2 mb-0">
                    Carrinho vazio
                  </p>
                </div>

                <v-card
                  v-for="(item, index) in cart"
                  :key="index"
                  :elevation="0"
                  rounded="lg"
                  class="mb-2 border"
                >
                  <div class="d-flex align-center pa-3">
                    <div class="flex-grow-1">
                      <div class="text-body-2 font-weight-medium">
                        {{ item.name }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ formatCurrency(item.price) }} /un
                      </div>
                    </div>

                    <!-- Quantity Controls -->
                    <div class="d-flex align-center mx-2">
                      <v-btn
                        icon="mdi-minus"
                        size="x-small"
                        variant="tonal"
                        density="compact"
                        @click="decrementQty(item)"
                      />
                      <span class="mx-2 font-weight-bold text-body-2" style="min-width: 24px; text-align: center;">
                        {{ item.quantity }}
                      </span>
                      <v-btn
                        icon="mdi-plus"
                        size="x-small"
                        variant="tonal"
                        color="primary"
                        density="compact"
                        @click="incrementQty(item)"
                      />
                    </div>

                    <!-- Subtotal + Delete -->
                    <div class="text-right ms-2">
                      <div class="text-body-2 font-weight-bold">
                        {{ formatCurrency(item.price * item.quantity) }}
                      </div>
                      <v-btn
                        icon="mdi-delete-outline"
                        size="x-small"
                        variant="text"
                        color="error"
                        density="compact"
                        @click="removeFromCart(index)"
                      />
                    </div>
                  </div>
                </v-card>
              </div>

              <!-- Payment Section (sticky bottom) -->
              <div class="pa-4 border-t bg-white">
                <!-- Total -->
                <div class="d-flex justify-space-between align-center mb-4">
                  <span class="text-subtitle-1 font-weight-medium">Total</span>
                  <span class="text-h5 font-weight-bold text-success">{{ formatCurrency(cartTotal) }}</span>
                </div>

                <!-- Payment Method Buttons -->
                <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2" style="letter-spacing: 1px;">
                  Forma de Pagamento
                </div>
                <v-row dense class="mb-4">
                  <v-col v-for="pm in paymentMethods" :key="pm.value" cols="6">
                    <v-btn
                      variant="outlined"
                      block
                      :color="paymentMethod === pm.value ? pm.color : 'grey'"
                      :class="{ 'border-2': paymentMethod === pm.value }"
                      class="py-3 justify-start"
                      @click="paymentMethod = pm.value"
                    >
                      <v-icon :icon="pm.icon" start size="20" />
                      {{ pm.title }}
                    </v-btn>
                  </v-col>
                </v-row>

                <!-- Finish Button -->
                <v-btn
                  color="success"
                  size="x-large"
                  block
                  class="font-weight-bold"
                  :disabled="cart.length === 0"
                  :loading="loading"
                  prepend-icon="mdi-check-circle"
                  @click="finishSale"
                >
                  Finalizar Venda
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Sale Detail Dialog -->
    <v-dialog v-model="detailDialog" max-width="600px" :fullscreen="mobile" transition="dialog-bottom-transition" scrollable>
      <v-card :rounded="mobile ? '0' : 'xl'" class="d-flex flex-column overflow-hidden" :style="{ maxHeight: mobile ? '100dvh' : '90vh', minHeight: mobile ? '100dvh' : '500px' }">
        <!-- Premium Header Section -->
        <div class="pa-4 pb-10 position-relative text-white overflow-hidden shadow-sm" style="background: linear-gradient(135deg, #1e293b, #334155);">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="d-flex align-center">
              <v-avatar color="white" variant="tonal" class="me-3" size="40">
                <v-icon icon="mdi-receipt-text-outline" color="white" />
              </v-avatar>
              <div>
                <div class="text-h6 font-weight-bold leading-tight">
                  Venda #{{ detailSale?.id?.substring(0, 8) }}
                </div>
                <div class="text-caption" style="opacity: 0.8;">
                  Detalhes e edição da transação
                </div>
              </div>
            </div>
            <v-btn
              icon="mdi-close"
              variant="text"
              color="white"
              density="comfortable"
              class="position-absolute"
              style="top: 12px; right: 12px; z-index: 10;"
              @click="detailDialog = false"
            />
          </div>

          <v-chip
            v-if="detailSale"
            :color="getStatusColor(detailSale.sale_status)"
            size="small"
            class="mt-1 font-weight-bold"
            variant="flat"
          >
            {{ getStatusLabel(detailSale.sale_status) }}
          </v-chip>

          <!-- Decorative element -->
          <v-icon icon="mdi-receipt-text-outline" class="position-absolute" style="right: -20px; bottom: -30px; font-size: 150px; opacity: 0.05; transform: rotate(-15deg);" />
        </div>

        <!-- Float Info Cards (overlapping header) -->
        <div class="px-4" style="margin-top: -30px; position: relative; z-index: 1;">
          <v-card rounded="lg" elevation="4" class="pa-4 bg-white border">
            <v-row dense align="center">
              <v-col cols="6" class="border-e">
                <div class="text-caption text-medium-emphasis text-uppercase font-weight-bold" style="letter-spacing: 0.5px;">
                  Data/Hora
                </div>
                <div class="text-body-1 font-weight-medium">
                  {{ formatDate(detailSale?.created_at || detailSale?.date_created) }}
                </div>
              </v-col>
              <v-col cols="6" class="ps-4">
                <div class="text-caption text-medium-emphasis text-uppercase font-weight-bold" style="letter-spacing: 0.5px;">
                  Valor Total
                </div>
                <div class="text-h6 font-weight-black text-success">
                  {{ formatCurrency(detailSale?.total_amount) }}
                </div>
              </v-col>
            </v-row>
          </v-card>
        </div>

        <!-- Scrollable body -->
        <v-card-text class="overflow-y-auto pa-4 pt-6">
          <!-- Secondary Info Grid -->
          <v-row class="mb-4">
            <v-col cols="6">
              <v-card variant="tonal" color="secondary" rounded="lg" class="pa-3 h-100">
                <div class="text-caption font-weight-bold mb-1">
                  PAGAMENTO ATUAL
                </div>
                <div class="d-flex align-center">
                  <v-icon :icon="getPaymentIcon(detailSale?.payment_method)" size="20" class="me-2" />
                  <span class="text-body-2 font-weight-bold">{{ getPaymentLabel(detailSale?.payment_method) }}</span>
                </div>
              </v-card>
            </v-col>
            <v-col cols="6">
              <v-card variant="tonal" color="primary" rounded="lg" class="pa-3 h-100">
                <div class="text-caption font-weight-bold mb-1">
                  OPERADOR RESPONSÁVEL
                </div>
                <div class="d-flex align-center">
                  <v-icon icon="mdi-account-outline" size="20" class="me-2" />
                  <span class="text-body-2 font-weight-bold">{{ typeof detailSale?.operator_id === 'object' ? (detailSale?.operator_id?.name ?? '–') : (detailSale?.operator_id ? '...' : 'Desconhecido') }}</span>
                </div>
              </v-card>
            </v-col>
          </v-row>

          <!-- Items Table Section -->
          <div class="d-flex align-center mb-2">
            <v-icon icon="mdi-basket-outline" color="secondary" size="18" class="me-2" />
            <div class="text-subtitle-2 font-weight-bold">
              ITENS DA VENDA
            </div>
            <v-spacer />
            <v-chip v-if="!detailLoading" size="x-small" variant="outlined" color="secondary">
              {{ detailItems.length }} itens
            </v-chip>
          </div>

          <v-card rounded="lg" variant="outlined" class="mb-6 overflow-hidden">
            <v-progress-linear v-if="detailLoading" indeterminate color="primary" height="2" />
            <div v-if="!detailLoading && detailItems.length > 0">
              <table class="detail-table premium">
                <thead>
                  <tr>
                    <th class="text-start">
                      Produto
                    </th>
                    <th class="text-end">
                      Qtd
                    </th>
                    <th class="text-end">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="si in detailItems" :key="si.id">
                    <td>
                      <div class="text-body-2 font-weight-medium">
                        {{ typeof si.product_id === 'object' ? si.product_id?.name : 'Produto' }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ formatCurrency(si.unit_price) }} /un
                      </div>
                    </td>
                    <td class="text-end text-body-2">
                      {{ si.quantity }}
                    </td>
                    <td class="text-end font-weight-bold text-body-2">
                      {{ formatCurrency(si.total_price) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else-if="!detailLoading" class="text-center pa-8">
              <v-icon icon="mdi-basket-off-outline" size="32" color="grey-lighten-1" />
              <p class="text-body-2 text-medium-emphasis mt-2">
                Nenhum item nesta venda
              </p>
            </div>
          </v-card>

          <!-- Action Section -->
          <div class="bg-grey-lighten-5 pa-4 rounded-xl border-dashed border">
            <div class="text-subtitle-2 font-weight-black mb-4 d-flex align-center">
              <v-icon icon="mdi-square-edit-outline" size="18" color="primary" class="me-2" />
              AJUSTAR INFORMAÇÕES
            </div>

            <!-- Payment method change -->
            <div class="text-caption font-weight-bold text-medium-emphasis mb-2 ms-1">
              MUDAR FORMA DE PAGAMENTO
            </div>
            <v-row dense class="mb-4">
              <v-col v-for="pm in paymentMethods" :key="pm.value" cols="6" sm="3">
                <v-card
                  variant="flat"
                  :color="detailPaymentMethod === pm.value ? pm.color : 'white'"
                  :class="{ 'border-primary border-2': detailPaymentMethod === pm.value, 'border': detailPaymentMethod !== pm.value }"
                  class="pa-2 text-center cursor-pointer h-100 d-flex flex-column align-center justify-center transition-all"
                  rounded="lg"
                  @click="detailPaymentMethod = pm.value"
                >
                  <v-icon :icon="pm.icon" size="20" class="mb-1" :color="detailPaymentMethod === pm.value ? 'white' : 'grey-darken-1'" />
                  <div class="text-caption font-weight-bold" :class="detailPaymentMethod === pm.value ? 'text-white' : 'text-grey-darken-1'">
                    {{ pm.title }}
                  </div>
                </v-card>
              </v-col>
            </v-row>

            <v-btn
              block
              elevation="0"
              color="primary"
              size="large"
              rounded="lg"
              :loading="savingPayment"
              :disabled="!detailPaymentMethod || detailPaymentMethod === detailSale?.payment_method"
              class="mb-6 text-none"
              prepend-icon="mdi-check-circle-outline"
              @click="confirmPaymentChange"
            >
              Confirmar Novo Pagamento
            </v-btn>

            <v-divider class="mb-6 border-dashed" />

            <!-- Operator transfer -->
            <div class="text-caption font-weight-bold text-medium-emphasis mb-2 ms-1">
              TRANSFERIR PARA OUTRO OPERADOR
            </div>
            <div class="d-flex align-center ga-2 mb-2">
              <v-autocomplete
                v-model="transferOperatorId"
                :items="operators"
                item-title="name"
                item-value="id"
                label="Selecione o Operador"
                variant="outlined"
                density="comfortable"
                hide-details
                bg-color="white"
                rounded="lg"
                class="flex-grow-1"
              />
              <v-btn
                color="secondary"
                variant="flat"
                size="large"
                rounded="lg"
                :loading="transferring"
                :disabled="!transferOperatorId || transferOperatorId === (typeof detailSale?.operator_id === 'object' ? detailSale?.operator_id?.id : detailSale?.operator_id)"
                icon="mdi-account-switch"
                @click="confirmTransfer"
              />
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Adjust Dinheiro -> PIX Dialog -->
    <v-dialog v-model="adjustDialog" max-width="600px" :fullscreen="mobile" scrollable>
      <v-card :rounded="mobile ? '0' : 'xl'" class="d-flex flex-column" :style="{ maxHeight: mobile ? '100dvh' : '90vh', minHeight: mobile ? '100dvh' : '400px' }">
        <!-- Premium Header Section -->
        <div class="pa-4 pb-10 position-relative text-white overflow-hidden shadow-sm" style="background: linear-gradient(135deg, #475569, #1e293b);">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="d-flex align-center">
              <v-avatar color="white" variant="tonal" class="me-3" size="40">
                <v-icon icon="mdi-swap-horizontal" color="white" />
              </v-avatar>
              <div>
                <div class="text-h6 font-weight-bold leading-tight">
                  Ajuste de Pagamentos
                </div>
                <div class="text-caption" style="opacity: 0.8;">
                  Correção em lote das vendas de hoje
                </div>
              </div>
            </div>
            <v-btn
              icon="mdi-close"
              variant="text"
              color="white"
              density="comfortable"
              class="position-absolute"
              style="top: 12px; right: 12px; z-index: 10;"
              @click="adjustDialog = false"
            />
          </div>

          <!-- Decorative element -->
          <v-icon icon="mdi-swap-horizontal" class="position-absolute" style="right: -20px; bottom: -30px; font-size: 150px; opacity: 0.05; transform: rotate(-15deg);" />
        </div>

        <!-- Overlapping Operator Selection -->
        <div class="px-4" style="margin-top: -30px; position: relative; z-index: 1;">
          <v-card rounded="lg" elevation="4" class="pa-4 bg-white border">
            <v-autocomplete
              v-model="adjustOperatorId"
              :items="operators"
              item-title="name"
              item-value="id"
              label="Operador Responsável"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              rounded="lg"
              placeholder="Selecione o operador das vendas"
            />
          </v-card>
        </div>

        <v-card-text class="overflow-y-auto pa-4 pt-6">
          <div class="d-flex align-center mb-4 pa-3 bg-secondary-lighten-5 rounded-lg border border-secondary-lighten-4">
            <v-icon icon="mdi-information-outline" color="secondary" class="me-3" />
            <div class="text-caption text-secondary-darken-1">
              Liste as transações do operador e selecione as que deseja ajustar.
            </div>
          </div>

          <v-divider class="mb-4" />

          <div v-if="adjustOperatorId && !adjustLoading && adjustSales.length > 0">
            <div class="text-overline text-medium-emphasis mb-2 d-flex justify-space-between align-center">
              Vendas Registradas (Hoje)
              <v-btn
                variant="text"
                size="small"
                color="primary"
                class="text-none"
                @click="adjustSelectedRows = adjustSelectedRows.length === adjustSales.length ? [] : adjustSales.map(s => s.id)"
              >
                {{ adjustSelectedRows.length === adjustSales.length ? 'Desmarcar todos' : 'Marcar todos' }}
              </v-btn>
            </div>

            <v-list density="comfortable" class="border rounded-xl bg-grey-lighten-4 pa-0 overflow-hidden">
              <v-list-item
                v-for="(sale, index) in adjustSales"
                :key="sale.id"
                :class="{ 'border-b': index < adjustSales.length - 1 }"
                class="px-2"
              >
                <template #prepend>
                  <v-checkbox-btn
                    v-model="adjustSelectedRows"
                    :value="sale.id"
                    color="primary"
                  />
                </template>
                <div class="d-flex align-center py-2 w-100">
                  <div class="flex-grow-1">
                    <div class="text-body-2 font-weight-bold">
                      Venda #{{ sale.id.substring(0, 8) }}
                    </div>
                    <div class="text-caption text-medium-emphasis d-flex align-center ga-2">
                      <span>
                        <v-icon icon="mdi-clock-outline" size="12" class="me-1" />
                        {{ formatDate(sale.created_at || sale.date_created).split(',')[1] }}
                      </span>
                      <v-divider vertical length="10" />
                      <span class="d-flex align-center">
                        <v-icon :icon="getPaymentIcon(sale.payment_method)" size="12" class="me-1" />
                        {{ getPaymentLabel(sale.payment_method) }}
                      </span>
                    </div>
                  </div>
                  <div class="text-end ms-3">
                    <div class="text-body-1 font-weight-black text-secondary">
                      {{ formatCurrency(sale.total_amount) }}
                    </div>
                  </div>
                </div>
              </v-list-item>
            </v-list>
          </div>
          <div v-else-if="adjustLoading" class="text-center pa-10 w-100">
            <v-progress-circular indeterminate color="primary" size="48" width="5" class="mb-4" />
            <div class="text-body-2 text-medium-emphasis font-weight-medium">
              Buscando transações...
            </div>
          </div>

          <div v-else-if="adjustOperatorId" class="text-center pa-12 border rounded-xl bg-grey-lighten-4 stripe-bg w-100">
            <v-icon icon="mdi-check-circle-outline" size="48" color="success" class="mb-4" />
            <div class="text-h6 font-weight-bold mb-1">
              Tudo certo!
            </div>
            <div class="text-body-2 text-medium-emphasis">
              Nenhuma venda encontrada hoje para este operador.
            </div>
          </div>

          <div v-else class="text-center pa-12 border rounded-xl border-dashed w-100">
            <v-icon icon="mdi-account-search-outline" size="48" color="grey-lighten-1" class="mb-4" />
            <div class="text-body-2 text-medium-emphasis">
              Selecione um operador para iniciar o ajuste.
            </div>
          </div>
        </v-card-text>

        <!-- Improved Batch Control -->
        <v-card-actions class="pa-4 border-t d-block bg-white shadow-top">
          <div v-if="adjustSelectedRows.length > 0" class="mb-4">
            <div class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-2 ms-1" style="letter-spacing: 0.5px;">
              Alterar lote para:
            </div>
            <v-row dense>
              <v-col v-for="pm in paymentMethods" :key="pm.value" cols="3">
                <v-card
                  variant="tonal"
                  :color="adjustTargetPaymentMethod === pm.value ? pm.color : 'grey-lighten-1'"
                  class="pa-2 text-center cursor-pointer transition-swing"
                  :class="{ 'border-primary border-2': adjustTargetPaymentMethod === pm.value }"
                  @click="adjustTargetPaymentMethod = pm.value"
                >
                  <v-icon :icon="pm.icon" size="20" class="mb-1" />
                  <div class="text-caption font-weight-bold" style="font-size: 0.65rem !important;">
                    {{ pm.title }}
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <div class="d-flex align-center justify-space-between pt-2">
            <div v-if="adjustSelectedRows.length > 0">
              <div class="text-caption text-medium-emphasis leading-none">
                TOTAL SELECIONADO ({{ adjustSelectedRows.length }})
              </div>
              <div class="text-h6 font-weight-black text-primary leading-tight">
                {{ formatCurrency(adjustSelectedSalesTotal) }}
              </div>
            </div>
            <div v-else class="text-caption text-medium-emphasis">
              Selecione itens para ajustar
            </div>

            <div class="d-flex ga-2">
              <v-btn
                variant="text"
                color="grey-darken-1"
                class="text-none font-weight-medium"
                @click="adjustDialog = false"
              >
                Cancelar
              </v-btn>
              <v-btn
                color="primary"
                variant="flat"
                class="text-none font-weight-bold px-6"
                size="large"
                rounded="lg"
                :loading="adjustLoading"
                :disabled="adjustSelectedRows.length === 0"
                @click="confirmAdjustBatch"
              >
                Confirmar Ajuste
              </v-btn>
            </div>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="bottom end">
      {{ snackbarMsg }}
    </v-snackbar>
  </v-container>
</template>

<style scoped>
.product-card {
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
  cursor: pointer;
}

.product-card:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1) !important;
  border-color: rgb(var(--v-theme-primary)) !important;
}

.cursor-pointer {
  cursor: pointer;
}

.border-2 {
  border-width: 2px !important;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
}
.detail-table th,
.detail-table td {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.detail-table thead th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(0, 0, 0, 0.6);
  border-bottom: 2px solid rgba(0, 0, 0, 0.12);
}
.detail-table tfoot td {
  border-top: 2px solid rgba(0, 0, 0, 0.12);
  border-bottom: none;
}
.detail-table.premium th {
  background-color: #f8fafc;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.7rem;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
}

.detail-table.premium td {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.transition-all {
  transition: all 0.2s ease-in-out;
}

.transition-all:hover {
  transform: translateY(-2px);
  filter: brightness(0.95);
}

.border-primary {
  border-color: rgb(var(--v-theme-primary)) !important;
}

.stripe-bg {
  background-image: linear-gradient(
    45deg,
    #f8fafc 25%,
    transparent 25%,
    transparent 50%,
    #f8fafc 50%,
    #f8fafc 75%,
    transparent 75%,
    transparent
  );
  background-size: 20px 20px;
}
</style>
