<script setup lang="ts">
interface CardapioProduct {
  id: string
  name: string
  price: string
  sort_order: number
  imagem: string | null
  category_id: string
}

interface CardapioCategory {
  id: string
  name: string
  icon: string
  sort_order: number
  points_id: { id: string, name: string }
}

interface CardapioResponse {
  products: CardapioProduct[]
  categories: CardapioCategory[]
}

usePublicSeo({
  title: 'Quermesse de São José',
  description: 'Confira todos os itens da Quermesse de São José: comidas, bebidas, camisetas, artesanato e lembrancinhas com preços.',
  path: '/quermesse',
})

const { data, status, error } = useFetch<CardapioResponse>('/api/quermesse')
const loading = computed(() => status.value === 'pending')

/** Monta URL de thumb do Directus para imagem do produto */
function thumbUrl(imageId: string | null): string | null {
  if (!imageId)
    return null
  return getDirectusAssetUrl(imageId, { fit: 'cover', width: 280, height: 200, quality: 80 })
}

/** Agrupa categorias por ponto de produção e produtos por categoria */
interface SectionData {
  point: { id: string, name: string }
  categories: Array<{
    category: CardapioCategory
    products: CardapioProduct[]
  }>
}

const sections = computed<SectionData[]>(() => {
  if (!data.value)
    return []
  const { products, categories } = data.value

  // Agrupa categorias por ponto de produção
  const pointMap = new Map<string, SectionData>()

  for (const cat of categories) {
    const pointId = cat.points_id.id
    if (!pointMap.has(pointId)) {
      pointMap.set(pointId, {
        point: cat.points_id,
        categories: [],
      })
    }
    const catProducts = products
      .filter(p => p.category_id === cat.id)
      .sort((a, b) => a.sort_order - b.sort_order)
    pointMap.get(pointId)!.categories.push({ category: cat, products: catProducts })
  }

  // Ordena seções: "Lojinha" por último
  return [...pointMap.values()].sort((a, b) => {
    const aIsLojinha = a.point.name.toLowerCase().includes('lojinha') ? 1 : 0
    const bIsLojinha = b.point.name.toLowerCase().includes('lojinha') ? 1 : 0
    return aIsLojinha - bIsLojinha
  })
})

/** Seção ativa (tab) — por padrão a primeira (Comidas/Bebidas) */
const activeTab = ref(0)

/** Formata preço como moeda BRL */
function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? Number.parseFloat(price) : price
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Ícone do ponto de produção */
function sectionIcon(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('lojinha'))
    return 'mdi-store'
  if (lower.includes('bar') || lower.includes('bebida'))
    return 'mdi-glass-mug-variant'
  if (lower.includes('cozinha'))
    return 'mdi-silverware-fork-knife'
  if (lower.includes('confeitaria'))
    return 'mdi-cupcake'
  return 'mdi-food'
}

/** Imprimir página da quermesse */
function printMenu(): void {
  window.print()
}

/** Seções de comida (para impressão — tudo exceto Lojinha) */
const printFoodSections = computed(() =>
  sections.value.filter(s => !s.point.name.toLowerCase().includes('lojinha')),
)

/** Seção da Lojinha (para impressão) */
const printShopSection = computed(() =>
  sections.value.find(s => s.point.name.toLowerCase().includes('lojinha')),
)
</script>

<template>
  <v-container class="quermesse-page pa-4 pa-md-6" fluid>
    <!-- Cabeçalho (somente tela) -->
    <v-row justify="center" class="mb-2 d-print-none">
      <v-col cols="12" md="10" lg="8" class="text-center">
        <div class="d-flex align-center justify-center ga-3 mb-2 flex-wrap">
          <v-icon size="40" color="primary">
            mdi-silverware-fork-knife
          </v-icon>
          <h1 class="text-h4 text-md-h3 font-weight-bold text-secondary">
            Quermesse de São José
          </h1>
          <v-icon size="40" color="primary">
            mdi-store
          </v-icon>
        </div>
        <p class="text-body-1 text-medium-emphasis mb-4">
          Confira todos os preços antes de chegar na festa!
        </p>

        <!-- Botão imprimir (não aparece na impressão) -->
        <v-btn
          color="secondary"
          variant="tonal"
          prepend-icon="mdi-printer"
          class="d-print-none mb-2"
          size="large"
          rounded="pill"
          @click="printMenu"
        >
          Imprimir / PDF
        </v-btn>
      </v-col>
    </v-row>

    <!-- Loading -->
    <template v-if="loading">
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <v-skeleton-loader type="heading" class="mb-4" />
          <v-row>
            <v-col v-for="n in 6" :key="n" cols="6" sm="4" md="3">
              <v-skeleton-loader type="card" />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </template>

    <!-- Erro -->
    <template v-else-if="error">
      <v-row justify="center">
        <v-col cols="12" md="8">
          <v-alert type="error" border="start" class="mt-6">
            Não foi possível carregar o cardápio. Tente novamente mais tarde.
          </v-alert>
        </v-col>
      </v-row>
    </template>

    <!-- Conteúdo -->
    <template v-else-if="sections.length">
      <!-- Tabs dos pontos de produção -->
      <v-row justify="center" class="d-print-none">
        <v-col cols="12" md="10" lg="8">
          <v-tabs
            v-model="activeTab"
            color="primary"
            align-tabs="center"
            grow
            class="mb-6"
          >
            <v-tab
              v-for="(section, idx) in sections"
              :key="section.point.id"
              :value="idx"
            >
              <v-icon start>
                {{ sectionIcon(section.point.name) }}
              </v-icon>
              {{ section.point.name }}
            </v-tab>
          </v-tabs>
        </v-col>
      </v-row>

      <!-- Conteúdo das tabs (tela) -->
      <v-row justify="center" class="d-print-none">
        <v-col cols="12" md="10" lg="8">
          <v-tabs-window v-model="activeTab">
            <v-tabs-window-item
              v-for="(section, idx) in sections"
              :key="section.point.id"
              :value="idx"
            >
              <div
                v-for="group in section.categories"
                :key="group.category.id"
                class="mb-8"
              >
                <!-- Título da categoria -->
                <div class="d-flex align-center ga-2 mb-4">
                  <v-icon color="primary" size="28">
                    mdi-{{ group.category.icon }}
                  </v-icon>
                  <h2 class="text-h5 font-weight-bold text-secondary">
                    {{ group.category.name }}
                  </h2>
                  <v-divider class="ml-3" />
                </div>

                <!-- Grid de produtos -->
                <v-row dense>
                  <v-col
                    v-for="product in group.products"
                    :key="product.id"
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-card
                      class="product-card"
                      elevation="1"
                      rounded="lg"
                      hover
                    >
                      <v-card-text class="d-flex align-center ga-3 pa-3">
                        <!-- Ícone da categoria (ou imagem se disponível) -->
                        <v-avatar
                          v-if="!thumbUrl(product.imagem)"
                          color="primary"
                          variant="tonal"
                          size="44"
                          rounded="lg"
                        >
                          <v-icon size="22" color="primary">
                            mdi-{{ group.category.icon }}
                          </v-icon>
                        </v-avatar>
                        <v-avatar
                          v-else
                          size="44"
                          rounded="lg"
                        >
                          <v-img
                            :src="thumbUrl(product.imagem)!"
                            :alt="product.name"
                            cover
                          />
                        </v-avatar>

                        <!-- Nome -->
                        <span class="text-body-2 font-weight-medium text-secondary flex-grow-1">
                          {{ product.name }}
                        </span>

                        <!-- Preço -->
                        <v-chip
                          color="primary"
                          variant="elevated"
                          size="small"
                          class="font-weight-bold flex-shrink-0"
                        >
                          {{ formatPrice(product.price) }}
                        </v-chip>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-col>
      </v-row>

      <!-- Versão de impressão (todas as seções visíveis) -->
      <div class="d-none d-print-block print-root">
        <!-- Cabeçalho da impressão -->
        <div class="print-header">
          <div class="print-header-title">
            ⛪ Quermesse de São José
          </div>
          <div class="print-header-sub">
            Preços dos itens disponíveis na festa
          </div>
        </div>

        <!-- Comidas & Bebidas — grid 2 colunas -->
        <div class="print-grid">
          <div
            v-for="section in printFoodSections"
            :key="`print-food-${section.point.id}`"
            class="print-section"
          >
            <div class="print-point-title">
              {{ section.point.name }}
            </div>

            <div
              v-for="group in section.categories"
              :key="`print-food-${group.category.id}`"
              class="print-category"
            >
              <div class="print-category-title">
                {{ group.category.name }}
              </div>
              <table class="print-table">
                <tbody>
                  <tr
                    v-for="(product, i) in group.products"
                    :key="`print-food-${product.id}`"
                    :class="i % 2 === 0 ? 'print-row-even' : 'print-row-odd'"
                  >
                    <td class="print-td-name">
                      {{ product.name }}
                    </td>
                    <td class="print-td-price">
                      {{ formatPrice(product.price) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Lojinha — seção própria com grid 2 colunas -->
        <template v-if="printShopSection">
          <div class="print-shop-divider" />
          <div class="print-point-title print-shop-title">
            {{ printShopSection.point.name }}
          </div>
          <div class="print-grid">
            <div
              v-for="group in printShopSection.categories"
              :key="`print-shop-${group.category.id}`"
              class="print-category"
            >
              <div class="print-category-title">
                {{ group.category.name }}
              </div>
              <table class="print-table">
                <tbody>
                  <tr
                    v-for="(product, i) in group.products"
                    :key="`print-shop-${product.id}`"
                    :class="i % 2 === 0 ? 'print-row-even' : 'print-row-odd'"
                  >
                    <td class="print-td-name">
                      {{ product.name }}
                    </td>
                    <td class="print-td-price">
                      {{ formatPrice(product.price) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- Rodapé da impressão -->
        <div class="print-footer">
          "São José, rogais por nós." &mdash; Capela São José
        </div>
      </div>
    </template>

    <!-- Sem dados -->
    <template v-else>
      <v-row justify="center">
        <v-col cols="12" md="8" class="text-center">
          <v-alert type="info" border="start">
            O cardápio ainda está sendo preparado. Volte em breve!
          </v-alert>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<style scoped>
.quermesse-page {
  /* página principal da quermesse */
}

.product-card {
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.product-card:hover {
  transform: translateY(-2px);
}

/* ── Estilos de impressão ── */
@media print {
  .quermesse-page {
    padding: 0 !important;
  }

  .print-root {
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #1a1a1a;
    padding: 5mm 10mm 3mm;
  }

  .print-header {
    text-align: center;
    padding-bottom: 5px;
    margin-bottom: 10px;
    border-bottom: 2px solid #5d4037;
  }

  .print-header-title {
    font-size: 18pt;
    font-weight: 700;
    color: #5d4037;
    letter-spacing: 0.3px;
  }

  .print-header-sub {
    font-size: 9pt;
    color: #999;
    margin-top: 2px;
  }

  /* Grid de seções — 2 colunas */
  .print-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4mm 8mm;
    align-items: start;
  }

  .print-section {
    break-inside: avoid;
  }

  .print-point-title {
    font-size: 12pt;
    font-weight: 700;
    color: #fff;
    background-color: #5d4037;
    padding: 4px 8px;
    border-radius: 3px;
    margin-bottom: 5px;
  }

  /* Divisor Lojinha */
  .print-shop-divider {
    border-top: 2px dashed #c8a882;
    margin: 8mm 0 4mm;
  }

  .print-shop-title {
    margin-bottom: 6px;
  }

  .print-category {
    margin-bottom: 5px;
    break-inside: avoid;
  }

  .print-category-title {
    font-size: 9pt;
    font-weight: 600;
    color: #5d4037;
    border-bottom: 1px solid #c8a882;
    padding-bottom: 2px;
    margin-bottom: 3px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .print-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
  }

  .print-td-name {
    padding: 2px 4px;
    color: #1a1a1a;
  }

  .print-td-price {
    padding: 2px 4px;
    text-align: right;
    font-weight: 700;
    color: #5d4037;
    white-space: nowrap;
  }

  .print-row-even {
    background-color: #fdf6ec;
  }

  .print-row-odd {
    background-color: #fff;
  }

  .print-footer {
    text-align: center;
    font-size: 8pt;
    color: #bbb;
    border-top: 1px solid #eee;
    margin-top: 8px;
    padding-top: 4px;
    font-style: italic;
  }
}
</style>

<!-- CSS global de impressão: esconde elementos do layout (app-bar, footer, nav) -->
<style>
@media print {
  /* App bar do Nuxt layout */
  header.v-app-bar,
  .v-app-bar,
  nav.v-navigation-drawer,
  footer.v-footer,
  .v-footer {
    display: none !important;
  }

  /* Remove padding/margin do v-main que o layout injeta */
  .v-main {
    padding: 0 !important;
  }
}
</style>
