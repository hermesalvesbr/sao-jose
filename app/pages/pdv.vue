<script setup lang="ts">
import type { PublicPdvOperatorResponse, PublicPdvSaleResponse } from '@/types/api'
import { useDebounceFn } from '@vueuse/core'

definePageMeta({ layout: false })

usePublicSeo({
  title: 'PDV',
  description: 'PDV rápido da quermesse com vendas por barraca e impressão automática dos tickets.',
  path: '/pdv',
})

useHead({
  meta: [
    { name: 'theme-color', content: '#E6A800' },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
  ],
  link: [
    { rel: 'manifest', href: '/pdv.webmanifest' },
    { rel: 'apple-touch-icon', href: '/icones/apple-touch-icon.png' },
  ],
})

const cartSheet = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref<'success' | 'error' | 'warning' | 'info'>('success')
const printerSheet = ref(false)
const operatorDialog = ref(false)
const operatorDraft = ref('')
const operatorSaving = ref(false)
const operatorError = ref('')
const operatorMatch = ref<PublicPdvOperatorResponse | null>(null)
const operatorLooking = ref(false)
const lastSale = ref<PublicPdvSaleResponse | null>(null)
const printing = ref(false)

const {
  loading,
  submitting,
  fetchError,
  saleError,
  operatorName,
  operatorId,
  activeTab,
  paymentMethod,
  search,
  cart,
  tabs,
  groupedProducts,
  cartCount,
  cartTotal,
  loadCatalog,
  addToCart,
  incrementItem,
  decrementItem,
  removeFromCart,
  getCartItem,
  resolveOperator,
  checkout,
  markPrinted,
} = usePublicPdv()

const {
  isSupported,
  isConnected,
  isConnecting,
  errorMessage,
  baudRate,
  baudRateOptions,
  connect,
  reconnect,
  disconnect,
  printSaleItemTickets,
} = useUsbEscPosPrinter()

const paymentMethods = [
  { value: 'dinheiro', title: 'Dinheiro', icon: 'mdi-cash-fast', color: 'success' },
  { value: 'pix', title: 'PIX', icon: 'mdi-qrcode', color: 'info' },
  { value: 'cartao', title: 'Cartão', icon: 'mdi-credit-card-outline', color: 'warning' },
] as const

const checkoutDisabledReason = computed(() => {
  if (!operatorName.value.trim())
    return 'Informe o atendente antes de finalizar.'
  if (cart.value.length === 0)
    return 'Adicione itens ao carrinho para concluir a venda.'
  if (!isConnected.value)
    return 'Conecte a impressora para finalizar a venda.'
  return ''
})

const WHITESPACE_RE = /\s+/

const operatorDraftValid = computed(() => {
  const parts = operatorDraft.value.trim().split(WHITESPACE_RE)
  return parts.length >= 2 && parts.every(p => p.length >= 2)
})

const lookupOperator = useDebounceFn(async (name: string) => {
  if (!operatorDraftValid.value) {
    operatorMatch.value = null
    return
  }

  operatorLooking.value = true
  try {
    const result = await $fetch<PublicPdvOperatorResponse | null>('/api/pdv/operator', {
      query: { name },
    })
    operatorMatch.value = result ?? null
  }
  catch {
    operatorMatch.value = null
  }
  finally {
    operatorLooking.value = false
  }
}, 400)

watch(operatorDraft, (value) => {
  operatorMatch.value = null
  operatorError.value = ''
  // Mostra "Verificando..." imediatamente (antes do debounce disparar)
  const parts = value.trim().split(WHITESPACE_RE)
  operatorLooking.value = parts.length >= 2 && parts.every(p => p.length >= 2)
  lookupOperator(value)
})

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function productThumb(imageId: string | null): string | null {
  if (!imageId)
    return null
  return getDirectusAssetUrl(imageId, { fit: 'cover', width: 240, height: 240, quality: 80 })
}

function categoryIcon(icon: string): string {
  return icon.startsWith('mdi-') ? icon : `mdi-${icon}`
}

function showFeedback(message: string, color: typeof snackbarColor.value): void {
  snackbarText.value = message
  snackbarColor.value = color
  snackbar.value = true
}

function openOperatorDialog(): void {
  operatorDraft.value = operatorName.value
  operatorError.value = ''
  operatorMatch.value = null
  // Se já há um nome salvo, inicia lookup imediatamente ao abrir
  if (operatorName.value.trim()) {
    const parts = operatorName.value.trim().split(WHITESPACE_RE)
    operatorLooking.value = parts.length >= 2 && parts.every(p => p.length >= 2)
    lookupOperator(operatorName.value)
  }
  operatorDialog.value = true
}

async function saveOperator(): Promise<void> {
  if (!operatorDraftValid.value) {
    operatorError.value = 'Informe nome e sobrenome.'
    return
  }

  operatorSaving.value = true
  operatorError.value = ''

  try {
    await resolveOperator(operatorDraft.value)
    operatorDialog.value = false
  }
  catch (error) {
    operatorError.value = error instanceof Error ? error.message : 'Não foi possível salvar o operador.'
  }
  finally {
    operatorSaving.value = false
  }
}

async function connectPrinter(): Promise<void> {
  try {
    await connect()
    showFeedback('Impressora pronta.', 'success')
  }
  catch {
    showFeedback(errorMessage.value || 'Não foi possível conectar.', 'error')
  }
}

async function finalizeSale(): Promise<void> {
  if (!operatorName.value.trim()) {
    openOperatorDialog()
    return
  }
  if (!isConnected.value) {
    printerSheet.value = true
    showFeedback('Conecte a impressora antes de finalizar.', 'warning')
    return
  }

  try {
    const sale = await checkout()
    cartSheet.value = false
    lastSale.value = sale
    await retryPrint()
  }
  catch {
    showFeedback(saleError.value || 'Não foi possível concluir a venda.', 'error')
  }
}

async function retryPrint(): Promise<void> {
  if (!lastSale.value)
    return
  if (!isConnected.value) {
    showFeedback('Conecte a impressora antes de imprimir.', 'warning')
    return
  }

  printing.value = true
  try {
    await printSaleItemTickets(lastSale.value)
    await markPrinted(lastSale.value.saleId)
    showFeedback('Tickets impressos.', 'success')
  }
  catch {
    showFeedback(errorMessage.value || 'Venda salva, mas impressão falhou.', 'warning')
  }
  finally {
    printing.value = false
  }
}

function closeSaleDialog(): void {
  lastSale.value = null
}

function getItemQty(productId: string): number {
  return getCartItem(productId)?.quantity ?? 0
}

onMounted(async () => {
  await loadCatalog()

  if (import.meta.client) {
    const savedName = window.localStorage.getItem('pdv-public-operator-name')
    const savedId = window.localStorage.getItem('pdv-public-operator-id')
    if (savedName && !operatorName.value)
      operatorName.value = savedName
    if (savedId && !operatorId.value)
      operatorId.value = savedId
  }

  operatorDialog.value = !operatorName.value.trim()

  if (isSupported.value)
    await reconnect()
})

watch(operatorName, (value) => {
  if (!import.meta.client)
    return
  window.localStorage.setItem('pdv-public-operator-name', value)
})

watch(operatorId, (value) => {
  if (!import.meta.client)
    return
  if (value)
    window.localStorage.setItem('pdv-public-operator-id', value)
})
</script>

<template>
  <v-app theme="cidadeTema">
    <v-main class="bg-surface">
      <!-- Compact top toolbar -->
      <div class="pdv-toolbar bg-secondary">
        <v-chip
          variant="elevated"
          color="white"
          class="text-secondary"
          prepend-icon="mdi-account-circle"
          @click="openOperatorDialog"
        >
          {{ operatorName || 'Operador' }}
        </v-chip>

        <v-text-field
          v-model="search"
          placeholder="Buscar..."
          prepend-inner-icon="mdi-magnify"
          clearable
          hide-details
          variant="solo"
          density="compact"
          class="pdv-search"
          bg-color="white"
        />

        <v-btn
          icon
          size="small"
          :color="isConnected ? 'success' : 'warning'"
          variant="elevated"
          @click="printerSheet = true"
        >
          <v-icon :icon="isConnected ? 'mdi-printer-check' : 'mdi-printer-alert'" />
        </v-btn>
      </div>

      <!-- Tabs -->
      <v-tabs
        v-model="activeTab"
        color="primary"
        bg-color="surface"
        density="compact"
        show-arrows
        class="pdv-tabs"
      >
        <v-tab v-for="tab in tabs" :key="tab.id" :value="tab.id" size="small">
          {{ tab.emoji }} {{ tab.label }}
        </v-tab>
      </v-tabs>

      <!-- Products -->
      <div class="pdv-content">
        <template v-if="loading">
          <v-row class="ma-0">
            <v-col v-for="n in 8" :key="n" cols="4" sm="3" class="pa-1">
              <v-skeleton-loader type="card" />
            </v-col>
          </v-row>
        </template>

        <v-alert v-else-if="fetchError" type="error" variant="tonal" border="start" class="ma-2">
          {{ fetchError }}
        </v-alert>

        <template v-else-if="groupedProducts.length">
          <section v-for="group in groupedProducts" :key="group.id" class="mb-2">
            <div class="d-flex align-center ga-1 px-2 py-1">
              <v-icon :icon="categoryIcon(group.icon)" size="18" color="primary" />
              <span class="text-body-2 font-weight-bold text-secondary-darken-1">{{ group.label }}</span>
              <span v-if="group.pointName" class="text-caption text-medium-emphasis ms-1">· {{ group.pointName }}</span>
            </div>

            <v-row class="ma-0">
              <v-col
                v-for="product in group.products"
                :key="product.id"
                cols="4"
                sm="3"
                class="pa-1"
              >
                <v-card
                  class="pdv-product-card h-100 d-flex flex-column"
                  :class="{ 'pdv-product-in-cart': getItemQty(product.id) > 0 }"
                  :disabled="product.stock_quantity <= 0"
                  @click="addToCart(product)"
                >
                  <!-- Image / emoji -->
                  <div class="pdv-product-img">
                    <v-img
                      v-if="productThumb(product.imagem)"
                      :src="productThumb(product.imagem) || undefined"
                      :alt="product.name"
                      height="72"
                      cover
                    />
                    <div
                      v-else
                      class="d-flex align-center justify-center text-h5"
                      style="height: 72px;"
                    >
                      {{ product.emoji || '🛍️' }}
                    </div>

                    <!-- Quantity badge -->
                    <v-badge
                      v-if="getItemQty(product.id) > 0"
                      :content="getItemQty(product.id)"
                      color="primary"
                      class="pdv-qty-badge"
                    />
                  </div>

                  <div class="pa-2 pt-1 d-flex flex-column flex-grow-1">
                    <div class="text-caption font-weight-bold text-secondary-darken-1 pdv-product-name">
                      {{ product.name }}
                    </div>
                    <div class="text-caption font-weight-bold text-primary-darken-1 mt-auto">
                      {{ formatCurrency(product.price) }}
                    </div>
                  </div>

                  <!-- Inline stepper (appears when in cart) -->
                  <div
                    v-if="getItemQty(product.id) > 0"
                    class="pdv-stepper"
                    @click.stop
                  >
                    <v-btn
                      icon
                      size="x-small"
                      variant="flat"
                      color="error"
                      @click="decrementItem(product.id)"
                    >
                      <v-icon :icon="getItemQty(product.id) === 1 ? 'mdi-trash-can-outline' : 'mdi-minus'" size="16" />
                    </v-btn>
                    <span class="text-body-2 font-weight-bold pdv-stepper-qty">{{ getItemQty(product.id) }}</span>
                    <v-btn
                      icon
                      size="x-small"
                      variant="flat"
                      color="primary"
                      :disabled="getItemQty(product.id) >= product.stock_quantity"
                      @click="incrementItem(product.id)"
                    >
                      <v-icon icon="mdi-plus" size="16" />
                    </v-btn>
                  </div>

                  <!-- Out of stock overlay -->
                  <div v-if="product.stock_quantity <= 0" class="pdv-sold-out">
                    Esgotado
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </section>
        </template>

        <v-alert v-else type="info" variant="tonal" border="start" class="ma-2">
          Nenhum item disponível.
        </v-alert>

        <!-- Bottom spacer for cart bar -->
        <div style="height: 72px;" />
      </div>

      <!-- Sticky cart bar -->
      <div v-if="cartCount > 0" class="pdv-cart-bar" @click="cartSheet = true">
        <div class="d-flex align-center ga-2">
          <v-avatar color="white" size="36" class="text-secondary">
            <span class="text-body-1 font-weight-bold">{{ cartCount }}</span>
          </v-avatar>
          <span class="text-body-2 text-white font-weight-medium">
            {{ cartCount === 1 ? '1 item' : `${cartCount} itens` }}
          </span>
        </div>
        <div class="d-flex align-center ga-2">
          <span class="text-subtitle-1 font-weight-bold text-white">{{ formatCurrency(cartTotal) }}</span>
          <v-icon icon="mdi-arrow-right" color="white" />
        </div>
      </div>

      <!-- Cart bottom sheet -->
      <v-bottom-sheet v-model="cartSheet" inset>
        <v-card class="rounded-t-xl">
          <v-card-title class="d-flex align-center justify-space-between py-3">
            <div class="text-h6 font-weight-bold text-secondary-darken-1">
              Carrinho
            </div>
            <v-btn variant="text" icon="mdi-close" size="small" @click="cartSheet = false" />
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-3 d-flex flex-column ga-3" style="max-height: 60vh; overflow-y: auto;">
            <v-alert v-if="checkoutDisabledReason" type="info" variant="tonal" border="start" density="compact">
              {{ checkoutDisabledReason }}
            </v-alert>

            <v-list lines="two" class="pa-0">
              <v-list-item
                v-for="item in cart"
                :key="item.productId"
                :title="item.name"
                :subtitle="formatCurrency(item.price * item.quantity)"
                class="px-0"
              >
                <template #prepend>
                  <v-avatar color="surface-variant" size="36">
                    <span class="text-body-2">{{ item.emoji }}</span>
                  </v-avatar>
                </template>

                <template #append>
                  <div class="d-flex align-center ga-1">
                    <v-btn icon="mdi-minus" size="x-small" variant="tonal" @click="decrementItem(item.productId)" />
                    <span class="text-body-2 font-weight-bold pdv-stepper-qty">{{ item.quantity }}</span>
                    <v-btn icon="mdi-plus" size="x-small" variant="tonal" @click="incrementItem(item.productId)" />
                    <v-btn icon="mdi-trash-can-outline" size="x-small" variant="text" color="error" @click="removeFromCart(item.productId)" />
                  </div>
                </template>
              </v-list-item>
            </v-list>

            <!-- Payment method -->
            <div>
              <div class="text-caption font-weight-bold mb-1 text-secondary-darken-1">
                Pagamento
              </div>
              <v-btn-toggle v-model="paymentMethod" mandatory color="primary" variant="outlined" density="compact" class="w-100">
                <v-btn v-for="method in paymentMethods" :key="method.value" :value="method.value" class="flex-grow-1">
                  <v-icon :icon="method.icon" size="18" class="me-1" />
                  {{ method.title }}
                </v-btn>
              </v-btn-toggle>
            </div>

            <!-- Total -->
            <div class="d-flex align-center justify-space-between pa-3 bg-surface-variant rounded-lg">
              <div>
                <div class="text-caption text-medium-emphasis">
                  Total
                </div>
                <div class="text-h6 font-weight-bold text-secondary-darken-1">
                  {{ formatCurrency(cartTotal) }}
                </div>
              </div>
              <v-chip
                :color="isConnected ? 'success' : 'warning'"
                variant="tonal"
                size="small"
                :prepend-icon="isConnected ? 'mdi-printer-check' : 'mdi-printer-alert'"
              >
                {{ isConnected ? 'Pronta' : 'Impressora' }}
              </v-chip>
            </div>
          </v-card-text>

          <v-card-actions class="pa-3 pt-0 d-flex flex-column ga-2">
            <v-btn
              block
              size="large"
              prepend-icon="mdi-check-circle-outline"
              :loading="submitting"
              :disabled="Boolean(checkoutDisabledReason)"
              @click="finalizeSale"
            >
              Finalizar venda
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-bottom-sheet>

      <!-- Printer sheet -->
      <v-bottom-sheet v-model="printerSheet" inset>
        <v-card class="rounded-t-xl">
          <v-card-title class="d-flex align-center justify-space-between py-3">
            <span class="text-subtitle-1 font-weight-bold text-secondary-darken-1">Impressora</span>
            <v-btn variant="text" icon="mdi-close" size="small" @click="printerSheet = false" />
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-3 d-flex flex-column ga-3">
            <v-alert v-if="!isSupported" type="warning" variant="tonal" border="start" density="compact">
              Navegador sem suporte à impressora USB.
            </v-alert>
            <v-alert v-else-if="errorMessage" type="error" variant="tonal" border="start" density="compact">
              {{ errorMessage }}
            </v-alert>

            <v-select
              v-model="baudRate"
              :items="baudRateOptions"
              label="Velocidade"
              hint="Se não imprimir, tente outra velocidade."
              persistent-hint
              density="compact"
            />

            <div class="d-flex ga-2 flex-wrap">
              <v-btn
                variant="elevated"
                color="primary"
                prepend-icon="mdi-printer-outline"
                :loading="isConnecting"
                :disabled="!isSupported"
                @click="connectPrinter"
              >
                Conectar
              </v-btn>
              <v-btn
                variant="tonal"
                prepend-icon="mdi-refresh"
                :disabled="!isSupported"
                @click="reconnect"
              >
                Reconectar
              </v-btn>
              <v-btn
                variant="text"
                prepend-icon="mdi-link-off"
                :disabled="!isConnected"
                @click="disconnect"
              >
                Desligar
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-bottom-sheet>

      <!-- Sale completed dialog -->
      <v-dialog :model-value="Boolean(lastSale)" max-width="400" @update:model-value="value => !value && closeSaleDialog()">
        <v-card>
          <v-card-title class="d-flex align-center ga-2 py-3">
            <v-icon color="success" icon="mdi-receipt-text-check-outline" />
            Pedido enviado
          </v-card-title>
          <v-card-text class="d-flex flex-column ga-2">
            <div class="text-body-1">
              {{ lastSale?.items.length }} ticket(s) · {{ formatCurrency(lastSale?.totalAmount || 0) }}
            </div>
            <div class="text-body-2 text-medium-emphasis">
              {{ isConnected ? 'Pode reenviar os tickets se precisar.' : 'Conecte a impressora para reenviar.' }}
            </div>
          </v-card-text>
          <v-card-actions class="pa-3 pt-0 d-flex flex-column ga-2">
            <v-btn
              block
              variant="tonal"
              color="info"
              prepend-icon="mdi-printer"
              :disabled="!isConnected"
              :loading="printing"
              @click="retryPrint"
            >
              Reenviar tickets
            </v-btn>
            <v-btn block variant="text" @click="closeSaleDialog">
              Fechar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Operator bottom sheet (2 names, Directus upsert) -->
      <v-bottom-sheet v-model="operatorDialog" :persistent="!operatorName.trim()" inset>
        <v-card class="rounded-t-xl">
          <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
            <div class="text-subtitle-1 font-weight-bold text-secondary-darken-1">
              Quem está atendendo?
            </div>
            <v-btn
              v-if="operatorName.trim()"
              icon="mdi-close"
              variant="text"
              size="small"
              @click="operatorDialog = false"
            />
          </div>

          <div class="px-4 pb-2 d-flex flex-column ga-3">
            <v-text-field
              v-model="operatorDraft"
              label="Nome e sobrenome"
              placeholder="Ex.: Maria Silva"
              prepend-inner-icon="mdi-account-circle-outline"
              :error-messages="operatorError"
              autofocus
              hide-details="auto"
              @keyup.enter="saveOperator"
            />

            <v-slide-y-transition>
              <div v-if="operatorDraftValid">
                <v-chip
                  v-if="operatorLooking"
                  size="small"
                  variant="tonal"
                  color="surface-variant"
                  prepend-icon="mdi-loading"
                  class="opacity-70"
                >
                  Verificando...
                </v-chip>
                <v-chip
                  v-else-if="operatorMatch"
                  size="small"
                  variant="tonal"
                  color="success"
                  prepend-icon="mdi-account-check"
                >
                  Operador já cadastrado
                </v-chip>
                <v-chip
                  v-else
                  size="small"
                  variant="tonal"
                  color="info"
                  prepend-icon="mdi-account-plus-outline"
                >
                  Novo operador
                </v-chip>
              </div>
            </v-slide-y-transition>
          </div>

          <div class="px-4 pb-4 pt-2">
            <v-btn
              block
              size="large"
              :disabled="!operatorDraftValid"
              :loading="operatorSaving"
              @click="saveOperator"
            >
              Confirmar
            </v-btn>
          </div>
        </v-card>
      </v-bottom-sheet>

      <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom center" :timeout="3200">
        {{ snackbarText }}
      </v-snackbar>
    </v-main>
  </v-app>
</template>

<style scoped>
.pdv-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
}

.pdv-search {
  flex: 1;
  min-width: 0;
}

.pdv-search :deep(.v-field) {
  min-height: 34px !important;
  border-radius: 20px;
}

.pdv-search :deep(.v-field__input) {
  padding-top: 4px;
  padding-bottom: 4px;
  min-height: 34px;
  font-size: 0.875rem;
}

.pdv-tabs {
  position: sticky;
  top: 46px;
  z-index: 9;
}

.pdv-content {
  max-width: 760px;
  margin: 0 auto;
  padding: 4px;
}

.pdv-product-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}

.pdv-product-card.pdv-product-in-cart {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

.pdv-product-img {
  position: relative;
  background: rgb(var(--v-theme-surface-variant));
}

.pdv-qty-badge {
  position: absolute;
  top: 4px;
  right: 4px;
}

.pdv-product-name {
  line-height: 1.15;
  min-height: 28px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pdv-stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.pdv-stepper-qty {
  min-width: 22px;
  text-align: center;
}

.pdv-sold-out {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-weight: bold;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pdv-cart-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  background: rgb(var(--v-theme-secondary));
  cursor: pointer;
}
</style>
