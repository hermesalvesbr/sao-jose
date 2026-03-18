import type {
  PublicPdvCatalogResponse,
  PublicPdvOperatorResponse,
  PublicPdvProduct,
  PublicPdvSaleRequest,
  PublicPdvSaleResponse,
} from '@/types/api'

interface PublicPdvCartItem {
  productId: string
  name: string
  price: number
  quantity: number
  maxStock: number
  imageId: string | null
  emoji: string
  categoryId: string
  pointId: string | null
}

interface PublicPdvTab {
  id: string
  label: string
  emoji: string
}

interface PublicPdvGroup {
  id: string
  label: string
  icon: string
  pointName: string | null
  products: PublicPdvProduct[]
}

type PaymentMethod = PublicPdvSaleRequest['paymentMethod']

const ALL_TAB_ID = '__all__'

export function usePublicPdv() {
  const catalog = useState<PublicPdvCatalogResponse | null>('public-pdv-catalog', () => null)
  const loading = useState<boolean>('public-pdv-loading', () => false)
  const submitting = useState<boolean>('public-pdv-submitting', () => false)
  const fetchError = useState<string | null>('public-pdv-fetch-error', () => null)
  const saleError = useState<string | null>('public-pdv-sale-error', () => null)
  const operatorName = useState<string>('public-pdv-operator-name', () => '')
  const operatorId = useState<string | null>('public-pdv-operator-id', () => null)
  const activeTab = useState<string>('public-pdv-active-tab', () => ALL_TAB_ID)
  const paymentMethod = useState<PaymentMethod>('public-pdv-payment-method', () => 'dinheiro')
  const search = useState<string>('public-pdv-search', () => '')
  const cart = useState<PublicPdvCartItem[]>('public-pdv-cart', () => [])

  const points = computed(() => catalog.value?.points ?? [])
  const pointMap = computed(() => new Map(points.value.map(point => [point.id, point])))
  const categoryMap = computed(() => new Map((catalog.value?.categories ?? []).map(category => [category.id, category])))

  const tabs = computed<PublicPdvTab[]>(() => [
    { id: ALL_TAB_ID, label: 'Todos', emoji: '🍽️' },
    ...points.value.map(point => ({
      id: point.id,
      label: point.name,
      emoji: point.emoji || '🍽️',
    })),
  ])

  const products = computed(() => {
    const source = catalog.value?.products ?? []
    const searchTerm = search.value.trim().toLocaleLowerCase('pt-BR')

    return source
      .filter((product) => {
        if (activeTab.value !== ALL_TAB_ID) {
          const category = categoryMap.value.get(product.category_id)
          const categoryPointId = category?.point?.id ?? null
          const belongsToPoint = product.production_point_id === activeTab.value || categoryPointId === activeTab.value
          if (!belongsToPoint)
            return false
        }

        if (searchTerm && !product.name.toLocaleLowerCase('pt-BR').includes(searchTerm))
          return false

        return true
      })
      .toSorted((left, right) => {
        const leftCategory = categoryMap.value.get(left.category_id)
        const rightCategory = categoryMap.value.get(right.category_id)
        const leftPointId = left.production_point_id || leftCategory?.point?.id || null
        const rightPointId = right.production_point_id || rightCategory?.point?.id || null
        const leftPointSort = leftPointId ? pointMap.value.get(leftPointId)?.sort ?? 999 : 999
        const rightPointSort = rightPointId ? pointMap.value.get(rightPointId)?.sort ?? 999 : 999

        return leftPointSort - rightPointSort
          || (leftCategory?.sort_order ?? 999) - (rightCategory?.sort_order ?? 999)
          || left.sort_order - right.sort_order
          || left.name.localeCompare(right.name, 'pt-BR')
      })
  })

  const groupedProducts = computed<PublicPdvGroup[]>(() => {
    const groups = new Map<string, PublicPdvGroup>()

    for (const product of products.value) {
      const category = categoryMap.value.get(product.category_id)
      if (!category)
        continue

      if (!groups.has(category.id)) {
        groups.set(category.id, {
          id: category.id,
          label: category.name,
          icon: category.icon,
          pointName: category.point?.name ?? null,
          products: [],
        })
      }

      groups.get(category.id)?.products.push(product)
    }

    return [...groups.values()]
  })

  const cartCount = computed(() =>
    cart.value.reduce((total, item) => total + item.quantity, 0),
  )

  const cartTotal = computed(() =>
    cart.value.reduce((total, item) => total + item.price * item.quantity, 0),
  )

  const canCheckout = computed(() =>
    cart.value.length > 0 && operatorName.value.trim().length >= 2 && !submitting.value,
  )

  async function loadCatalog(): Promise<void> {
    loading.value = true
    fetchError.value = null

    try {
      const response = await $fetch<PublicPdvCatalogResponse>('/api/pdv/catalog')
      catalog.value = response
    }
    catch (error) {
      fetchError.value = error instanceof Error ? error.message : 'Não foi possível carregar o catálogo do PDV.'
    }
    finally {
      loading.value = false
    }
  }

  function addToCart(product: PublicPdvProduct): void {
    const existingItem = cart.value.find(item => item.productId === product.id)
    const availableStock = Number(product.stock_quantity || 0)

    if (availableStock <= 0)
      return

    if (existingItem) {
      if (existingItem.quantity < existingItem.maxStock)
        existingItem.quantity += 1
      return
    }

    cart.value.push({
      productId: product.id,
      name: product.name,
      price: Number(product.price || 0),
      quantity: 1,
      maxStock: availableStock,
      imageId: product.imagem,
      emoji: product.emoji || '🛍️',
      categoryId: product.category_id,
      pointId: product.production_point_id,
    })
  }

  function setItemQuantity(productId: string, quantity: number): void {
    const item = cart.value.find(entry => entry.productId === productId)
    if (!item)
      return

    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    item.quantity = Math.min(quantity, item.maxStock)
  }

  function incrementItem(productId: string): void {
    const item = cart.value.find(entry => entry.productId === productId)
    if (!item)
      return

    setItemQuantity(productId, item.quantity + 1)
  }

  function decrementItem(productId: string): void {
    const item = cart.value.find(entry => entry.productId === productId)
    if (!item)
      return

    setItemQuantity(productId, item.quantity - 1)
  }

  function removeFromCart(productId: string): void {
    cart.value = cart.value.filter(item => item.productId !== productId)
  }

  function clearCart(): void {
    cart.value = []
  }

  function getCartItem(productId: string): PublicPdvCartItem | undefined {
    return cart.value.find(item => item.productId === productId)
  }

  async function resolveOperator(name: string): Promise<PublicPdvOperatorResponse> {
    const response = await $fetch<PublicPdvOperatorResponse>('/api/pdv/operator', {
      method: 'POST',
      body: { name },
    })
    operatorId.value = response.id
    operatorName.value = response.name
    return response
  }

  async function checkout(): Promise<PublicPdvSaleResponse> {
    if (!canCheckout.value)
      throw new Error('Preencha o atendente e adicione itens antes de finalizar.')

    submitting.value = true
    saleError.value = null

    try {
      const response = await $fetch<PublicPdvSaleResponse>('/api/pdv/sale', {
        method: 'POST',
        body: {
          operatorName: operatorName.value,
          paymentMethod: paymentMethod.value,
          pointId: activeTab.value === ALL_TAB_ID ? null : activeTab.value,
          items: cart.value.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        } satisfies PublicPdvSaleRequest,
      })

      clearCart()
      await loadCatalog()
      return response
    }
    catch (error) {
      saleError.value = error instanceof Error ? error.message : 'Não foi possível registrar a venda.'
      throw error
    }
    finally {
      submitting.value = false
    }
  }

  async function markPrinted(saleId: string): Promise<void> {
    await $fetch('/api/pdv/printed', {
      method: 'POST',
      body: { saleId },
    })
  }

  return {
    catalog,
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
    points,
    tabs,
    products,
    groupedProducts,
    cartCount,
    cartTotal,
    canCheckout,
    loadCatalog,
    addToCart,
    setItemQuantity,
    incrementItem,
    decrementItem,
    removeFromCart,
    clearCart,
    getCartItem,
    resolveOperator,
    checkout,
    markPrinted,
  }
}
