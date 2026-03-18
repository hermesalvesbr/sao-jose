<script setup lang="ts">
/**
 * Dashboard PDV — Visão geral do ponto de venda
 *
 * KPI cards com espaçamento adequado, separação por ponto de produção,
 * vendas recentes, alertas de estoque e acesso rápido ao Terminal.
 */
definePageMeta({ layout: 'admin' })

const { fetchProducts, fetchSales } = usePdv()

const totalProducts = ref(0)
const lowStockProducts = ref(0)
const totalSales = ref(0)
const salesRevenue = ref(0)
const recentSales = ref<any[]>([])
const lowStockItems = ref<any[]>([])
const loadingData = ref(true)

async function loadData() {
  loadingData.value = true
  try {
    // Total products
    const productsRes = await fetchProducts({ aggregate: { count: '*' } })
    if (productsRes && productsRes.length > 0) {
      totalProducts.value = Number((productsRes[0] as any)?.count) || 0
    }

    // Low stock
    const lowStockRes = await fetchProducts({
      filter: { stock_quantity: { _lte: 5 } },
      aggregate: { count: '*' },
    })
    if (lowStockRes && lowStockRes.length > 0) {
      lowStockProducts.value = Number((lowStockRes[0] as any)?.count) || 0
    }

    // Low stock items list
    const lowItems = await fetchProducts({
      filter: { stock_quantity: { _lte: 5 } },
      fields: ['id', 'name', 'stock_quantity', 'price'],
      sort: 'stock_quantity',
      limit: 8,
    })
    lowStockItems.value = lowItems || []

    // Monthly sales
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const salesRes = await fetchSales({
      filter: { date_created: { _gte: startOfMonth.toISOString() }, sale_status: { _eq: 'completed' } },
      aggregate: { count: '*', sum: 'total_amount' },
    })
    if (salesRes && salesRes.length > 0) {
      totalSales.value = Number((salesRes[0] as any)?.count) || 0
      salesRevenue.value = Number((salesRes[0] as any)?.sum?.total_amount) || 0
    }

    // Recent sales
    const recent = await fetchSales({
      sort: ['-date_created'],
      limit: 5,
      fields: ['id', 'sale_status', 'total_amount', 'payment_method', 'date_created', 'created_at'],
    })
    recentSales.value = recent || []
  }
  catch (error) {
    console.error('Error loading dashboard data', error)
  }
  finally {
    loadingData.value = false
  }
}

onMounted(() => {
  loadData()
})

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

function formatDate(dateStr: string) {
  if (!dateStr)
    return '-'
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
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

function getPaymentIcon(method: string) {
  const icons: Record<string, string> = {
    dinheiro: 'mdi-cash',
    pix: 'mdi-qrcode',
    cartao_credito: 'mdi-credit-card-outline',
    cartao_debito: 'mdi-credit-card-fast-outline',
  }
  return icons[method] || 'mdi-cash'
}

function getStockColor(qty: number) {
  if (qty <= 0)
    return 'error'
  if (qty <= 2)
    return 'warning'
  return 'info'
}
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <!-- Page Header -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-6 ga-3">
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold text-on-surface">
          Dashboard PDV
        </h1>
        <p class="text-body-2 text-on-surface-variant mt-1 mb-0">
          Visão geral do ponto de venda — Novenário de São José
        </p>
      </div>
      <v-btn
        color="success"
        size="large"
        prepend-icon="mdi-point-of-sale"
        class="d-none d-sm-flex text-none font-weight-bold"
        to="/admin/pdv/terminal"
        rounded="lg"
      >
        Abrir Terminal PDV
      </v-btn>
    </div>

    <!-- KPI Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" lg="3">
        <v-card
          class="kpi-card fill-height"
          rounded="xl"
          :elevation="0"
          style="background: linear-gradient(135deg, #1565C0 0%, #42A5F5 100%);"
        >
          <v-card-text class="pa-5">
            <div class="d-flex justify-space-between align-start">
              <div>
                <div class="text-caption text-uppercase font-weight-bold" style="color: rgba(255,255,255,0.75); letter-spacing: 1.5px;">
                  Total Produtos
                </div>
                <div class="text-h4 font-weight-bold text-white mt-2">
                  {{ totalProducts }}
                </div>
              </div>
              <v-avatar size="48" style="background: rgba(255,255,255,0.2);">
                <v-icon icon="mdi-package-variant-closed" color="white" size="24" />
              </v-avatar>
            </div>
            <v-btn
              variant="text"
              size="small"
              to="/admin/pdv/produtos"
              style="color: rgba(255,255,255,0.9);"
              class="px-0 font-weight-medium mt-4"
            >
              Ver todos
              <v-icon icon="mdi-arrow-right" size="16" end />
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" lg="3">
        <v-card
          class="kpi-card fill-height"
          rounded="xl"
          :elevation="0"
          style="background: linear-gradient(135deg, #C62828 0%, #EF5350 100%);"
        >
          <v-card-text class="pa-5">
            <div class="d-flex justify-space-between align-start">
              <div>
                <div class="text-caption text-uppercase font-weight-bold" style="color: rgba(255,255,255,0.75); letter-spacing: 1.5px;">
                  Estoque Baixo
                </div>
                <div class="text-h4 font-weight-bold text-white mt-2">
                  {{ lowStockProducts }}
                </div>
              </div>
              <v-avatar size="48" style="background: rgba(255,255,255,0.2);">
                <v-icon icon="mdi-alert-circle-outline" color="white" size="24" />
              </v-avatar>
            </div>
            <v-btn
              variant="text"
              size="small"
              to="/admin/pdv/produtos"
              style="color: rgba(255,255,255,0.9);"
              class="px-0 font-weight-medium mt-4"
            >
              Ver alertas
              <v-icon icon="mdi-arrow-right" size="16" end />
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" lg="3">
        <v-card
          class="kpi-card fill-height"
          rounded="xl"
          :elevation="0"
          style="background: linear-gradient(135deg, #2E7D32 0%, #66BB6A 100%);"
        >
          <v-card-text class="pa-5">
            <div class="d-flex justify-space-between align-start">
              <div>
                <div class="text-caption text-uppercase font-weight-bold" style="color: rgba(255,255,255,0.75); letter-spacing: 1.5px;">
                  Vendas do Mês
                </div>
                <div class="text-h4 font-weight-bold text-white mt-2">
                  {{ totalSales }}
                </div>
              </div>
              <v-avatar size="48" style="background: rgba(255,255,255,0.2);">
                <v-icon icon="mdi-cart-check" color="white" size="24" />
              </v-avatar>
            </div>
            <v-btn
              variant="text"
              size="small"
              to="/admin/pdv/vendas"
              style="color: rgba(255,255,255,0.9);"
              class="px-0 font-weight-medium mt-4"
            >
              Ver vendas
              <v-icon icon="mdi-arrow-right" size="16" end />
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" lg="3">
        <v-card
          class="kpi-card fill-height"
          rounded="xl"
          :elevation="0"
          style="background: linear-gradient(135deg, #E65100 0%, #FFA726 100%);"
        >
          <v-card-text class="pa-5">
            <div class="d-flex justify-space-between align-start">
              <div>
                <div class="text-caption text-uppercase font-weight-bold" style="color: rgba(255,255,255,0.75); letter-spacing: 1.5px;">
                  Receita do Mês
                </div>
                <div class="text-h5 font-weight-bold text-white mt-2">
                  {{ formatCurrency(salesRevenue) }}
                </div>
              </div>
              <v-avatar size="48" style="background: rgba(255,255,255,0.2);">
                <v-icon icon="mdi-currency-brl" color="white" size="24" />
              </v-avatar>
            </div>
            <v-btn
              variant="text"
              size="small"
              to="/admin/pdv/vendas"
              style="color: rgba(255,255,255,0.9);"
              class="px-0 font-weight-medium mt-4"
            >
              Relatórios
              <v-icon icon="mdi-arrow-right" size="16" end />
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-card rounded="xl" :elevation="0" class="border mb-6">
      <v-card-text class="pa-4">
        <div class="d-flex flex-wrap ga-3 justify-center justify-md-start">
          <v-btn
            color="success"
            variant="tonal"
            prepend-icon="mdi-point-of-sale"
            to="/admin/pdv/terminal"
            class="text-none"
          >
            Terminal PDV
          </v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-package-variant-plus"
            to="/admin/pdv/produtos"
            class="text-none"
          >
            Gerenciar Produtos
          </v-btn>
          <v-btn
            color="secondary"
            variant="tonal"
            prepend-icon="mdi-store"
            to="/admin/pdv/pontos"
            class="text-none"
          >
            Pontos de Produção
          </v-btn>
          <v-btn
            color="info"
            variant="tonal"
            prepend-icon="mdi-tag-multiple-outline"
            to="/admin/pdv/categorias"
            class="text-none"
          >
            Categorias
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Content: Recent Sales + Stock Alerts -->
    <v-row>
      <!-- Recent Sales -->
      <v-col cols="12" md="7">
        <v-card rounded="xl" :elevation="0" class="border">
          <v-card-title class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center">
              <v-icon icon="mdi-receipt-text-outline" color="secondary" class="me-2" />
              <span class="text-subtitle-1 font-weight-bold text-on-surface">Vendas Recentes</span>
            </div>
            <v-btn variant="text" color="primary" size="small" to="/admin/pdv/vendas" class="text-none">
              Ver todas
            </v-btn>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-0">
            <v-list v-if="recentSales.length > 0" lines="two" class="py-0">
              <template v-for="(sale, i) in recentSales" :key="sale.id">
                <v-list-item class="px-4 py-3">
                  <template #prepend>
                    <v-avatar :color="getStatusColor(sale.sale_status)" size="40" variant="tonal">
                      <v-icon :icon="getPaymentIcon(sale.payment_method)" size="20" />
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-medium text-body-2 text-on-surface">
                    {{ formatCurrency(sale.total_amount) }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption text-on-surface-variant">
                    {{ formatDate(sale.created_at || sale.date_created) }}
                  </v-list-item-subtitle>
                  <template #append>
                    <v-chip :color="getStatusColor(sale.sale_status)" size="small" variant="tonal" label>
                      {{ getStatusLabel(sale.sale_status) }}
                    </v-chip>
                  </template>
                </v-list-item>
                <v-divider v-if="i < recentSales.length - 1" class="mx-4" />
              </template>
            </v-list>
            <div v-else class="text-center pa-8">
              <v-icon icon="mdi-receipt-text-remove-outline" size="48" color="on-surface-variant" />
              <p class="text-body-2 text-on-surface-variant mt-3 mb-0">
                Nenhuma venda registrada ainda
              </p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Stock Alerts -->
      <v-col cols="12" md="5">
        <v-card rounded="xl" :elevation="0" class="border">
          <v-card-title class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center">
              <v-icon icon="mdi-alert-outline" color="warning" class="me-2" />
              <span class="text-subtitle-1 font-weight-bold text-on-surface">Alertas de Estoque</span>
            </div>
            <v-chip v-if="lowStockProducts > 0" color="error" size="small" variant="tonal">
              {{ lowStockProducts }} item(ns)
            </v-chip>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-0">
            <v-list v-if="lowStockItems.length > 0" lines="two" class="py-0">
              <template v-for="(item, i) in lowStockItems" :key="item.id">
                <v-list-item class="px-4 py-3">
                  <v-list-item-title class="font-weight-medium text-body-2 text-on-surface">
                    {{ item.name }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="mt-1">
                    <v-progress-linear
                      :model-value="Math.min(item.stock_quantity * 10, 100)"
                      :color="getStockColor(item.stock_quantity)"
                      height="6"
                      rounded
                      class="mt-1"
                    />
                  </v-list-item-subtitle>
                  <template #append>
                    <v-chip :color="getStockColor(item.stock_quantity)" size="small" variant="tonal" label class="ms-2">
                      {{ item.stock_quantity }} un
                    </v-chip>
                  </template>
                </v-list-item>
                <v-divider v-if="i < lowStockItems.length - 1" class="mx-4" />
              </template>
            </v-list>
            <div v-else class="text-center pa-8">
              <v-icon icon="mdi-check-circle-outline" size="48" color="success" />
              <p class="text-body-2 text-on-surface-variant mt-3 mb-0">
                Todos com estoque adequado
              </p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- FAB for mobile -->
    <v-fab
      icon="mdi-point-of-sale"
      color="success"
      location="bottom end"
      size="large"
      class="d-sm-none"
      app
      appear
      to="/admin/pdv/terminal"
    />
  </v-container>
</template>

<style scoped>
.kpi-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  border: none !important;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}
</style>
