<script setup lang="ts">
/**
 * Layout Admin — Sidebar navigation profissional
 * Usa v-theme-provider do Vuetify 4 para sidebar escura com contraste adequado.
 */
import { useDisplay } from 'vuetify'

const TRAILING_SLASH_RE = /\/+$/
const ADMIN_ANUNCIO_ID_RE = /^\/admin\/anuncio\/[^/]+$/
const ADMIN_OFERTORIO_ID_RE = /^\/admin\/ofertorio\/[^/]+$/
const ADMIN_RECEITAS_ID_RE = /^\/admin\/receitas\/[^/]+$/
const ADMIN_PDV_DESPESAS_ID_RE = /^\/admin\/pdv\/despesas\/[^/]+$/

const route = useRoute()
const { getUserAvatarUrl, fetchCurrentUser, user, logout } = useAuth()
const avatarUrl = computed(() => getUserAvatarUrl() ?? '')

const drawer = ref(true)
const rail = ref(false)
const { mobile } = useDisplay()

const painelItems = [
  { title: 'Resumo', icon: 'mdi-view-dashboard-outline', to: '/admin/resumo' },
  { title: 'Consolidado', icon: 'mdi-finance', to: '/admin/relatorio-consolidado' },
  { title: 'Festa de Padroeiro', icon: 'mdi-party-popper', to: '/admin/festa-padroeiro' },
]

const financeiroItems = [
  { title: 'Ofertório', icon: 'mdi-cash-multiple', to: '/admin/ofertorio/' },
  { title: 'Receitas', icon: 'mdi-cash-plus', to: '/admin/receitas' },
  { title: 'Despesas', icon: 'mdi-cash-minus', to: '/admin/pdv/despesas' },
  { title: 'Sangria de Caixa', icon: 'mdi-cash-register', to: '/admin/pdv/sangria' },
  { title: 'Dízimos', icon: 'mdi-account-cash-outline', to: '/admin/dizimos' },
  { title: 'Relatório Diário', icon: 'mdi-file-chart-outline', to: '/admin/pdv/relatorio' },
  { title: 'Vendas por Item', icon: 'mdi-chart-bar', to: '/admin/pdv/relatorio-itens' },
]

const conteudoItems = [
  { title: 'Anúncios', icon: 'mdi-bullhorn-outline', to: '/admin/anuncio' },
]

const cadastrosItems = [
  { title: 'Católicos', icon: 'mdi-account-group-outline', to: '/admin/catolicos' },
]

const pdvItems = [
  { title: 'Dashboard', icon: 'mdi-monitor-dashboard', to: '/admin/pdv' },
  { title: 'Terminal PDV', icon: 'mdi-point-of-sale', to: '/admin/pdv/terminal' },
  { title: 'Vendas', icon: 'mdi-receipt-text-outline', to: '/admin/pdv/vendas' },
  { title: 'Escala', icon: 'mdi-calendar-account-outline', to: '/admin/pdv/escala' },
  { title: 'Produtos', icon: 'mdi-package-variant-closed', to: '/admin/pdv/produtos' },
  { title: 'Categorias', icon: 'mdi-tag-multiple-outline', to: '/admin/pdv/categorias' },
  { title: 'Pontos', icon: 'mdi-store-outline', to: '/admin/pdv/pontos' },
]

const normalizedAdminPath = computed(() => {
  const normalized = route.path.replace(TRAILING_SLASH_RE, '')
  return normalized || '/'
})

const staticAdminTitles: Record<string, string> = {
  '/admin': 'Painel Administrativo',
  '/admin/resumo': 'Resumo Administrativo',
  '/admin/relatorio-consolidado': 'Relatorio Consolidado',
  '/admin/festa-padroeiro': 'Festa do Padroeiro',

  '/admin/anuncio': 'Anuncios',
  '/admin/catolicos': 'Catolicos',

  '/admin/ofertorio': 'Ofertorio',
  '/admin/ofertorio/add': 'Nova Entrada de Ofertorio',

  '/admin/receitas': 'Receitas',
  '/admin/receitas/add': 'Nova Receita',

  '/admin/dizimos': 'Dizimos',
  '/admin/dizimos/lista': 'Lista de Dizimistas',
  '/admin/dizimos/novo-dizimista': 'Novo Dizimista',
  '/admin/dizimos/pagamentos': 'Pagamentos de Dizimos',
  '/admin/dizimos/registrar-pagamento': 'Registrar Pagamento de Dizimo',
  '/admin/dizimos/relatorios': 'Relatorios de Dizimos',

  '/admin/pdv': 'Dashboard do PDV',
  '/admin/pdv/categorias': 'Categorias do PDV',
  '/admin/pdv/produtos': 'Produtos do PDV',
  '/admin/pdv/pontos': 'Pontos de Venda',
  '/admin/pdv/vendas': 'Vendas do PDV',
  '/admin/pdv/escala': 'Escala de Operadores',
  '/admin/pdv/relatorio': 'Relatorio Diario do PDV',
  '/admin/pdv/relatorio-itens': 'Relatorio de Vendas por Item',
  '/admin/pdv/sangria': 'Sangria de Caixa',
  '/admin/pdv/despesas': 'Despesas do PDV',
  '/admin/pdv/despesas/nova': 'Nova Despesa do PDV',
}

const pageTitle = computed(() => {
  const path = normalizedAdminPath.value
  if (staticAdminTitles[path]) {
    return staticAdminTitles[path]
  }

  if (ADMIN_ANUNCIO_ID_RE.test(path)) {
    return 'Editar Anuncio'
  }

  if (ADMIN_OFERTORIO_ID_RE.test(path)) {
    return 'Editar Entrada de Ofertorio'
  }

  if (ADMIN_RECEITAS_ID_RE.test(path)) {
    return 'Editar Receita'
  }

  if (ADMIN_PDV_DESPESAS_ID_RE.test(path)) {
    return 'Editar Despesa do PDV'
  }

  return 'Painel Administrativo'
})

useHead({
  titleTemplate: '%s | Administracao | Capela Sao Jose',
})

useSeoMeta({
  title: () => pageTitle.value,
  description: () => `Painel administrativo da Capela Sao Jose: ${pageTitle.value}.`,
  ogTitle: () => `${pageTitle.value} | Administracao | Capela Sao Jose`,
  ogDescription: () => `Painel administrativo da Capela Sao Jose: ${pageTitle.value}.`,
  robots: 'noindex,nofollow',
})

// Breadcrumb — páginas podem sobrescrever o título do último segmento
const breadcrumbOverride = useState<string | null>('breadcrumb-override', () => null)
const breadcrumbs = computed(() => {
  const segments = route.path.split('/').filter(Boolean)
  const crumbs: { title: string, to?: string, disabled?: boolean }[] = []
  let path = ''
  const labels: Record<string, string> = {
    'admin': 'Admin',
    'resumo': 'Resumo',
    'ofertorio': 'Ofertório',
    'add': 'Novo',
    'dizimos': 'Dízimos',
    'anuncios': 'Anúncios',
    'anuncio': 'Anúncio',
    'relatorio-consolidado': 'Consolidado',
    'festa-padroeiro': 'Festa de Padroeiro',
    'pdv': 'PDV',
    'categorias': 'Categorias',
    'produtos': 'Produtos',
    'vendas': 'Vendas',
    'escala': 'Escala',
    'relatorio': 'Relatório',
    'relatorio-itens': 'Vendas por Item',
    'despesas': 'Despesas',
    'sangria': 'Sangria',
    'receitas': 'Receitas',
    'catolicos': 'Católicos',
    'novo': 'Novo',
    'lista': 'Lista',
    'pagamentos': 'Pagamentos',
    'relatorios': 'Relatórios',
  }
  segments.forEach((seg, i) => {
    path += `/${seg}`
    const isLast = i === segments.length - 1
    const title = isLast && breadcrumbOverride.value
      ? breadcrumbOverride.value
      : (labels[seg] || seg)
    crumbs.push({
      title,
      to: !isLast ? path : undefined,
      disabled: isLast,
    })
  })
  return crumbs
})

function isActive(to: string) {
  return route.path === to || (to !== '/admin/pdv' && route.path.startsWith(to))
}

onMounted(() => {
  fetchCurrentUser()
  if (mobile.value) {
    drawer.value = false
  }
})
</script>

<template>
  <v-layout>
    <!-- Sidebar Navigation — uses dedicated dark theme for proper contrast -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail && !mobile"
      :temporary="mobile"
      theme="sidebarTheme"
      class="pdv-sidebar"
      width="260"
    >
      <!-- Logo / Brand -->
      <div class="d-flex align-center pa-4" style="min-height: 64px;">
        <v-avatar size="36" color="primary" class="me-3">
          <v-icon icon="mdi-store" size="20" />
        </v-avatar>
        <div v-if="!rail">
          <div class="text-subtitle-1 font-weight-bold">
            São José
          </div>
          <div class="text-caption" style="opacity: 0.6;">
            Painel Admin
          </div>
        </div>
      </div>

      <v-divider class="mx-3 mb-2" />

      <!-- Painel Section -->
      <div v-if="!rail" class="px-4 pt-3 pb-1">
        <div class="text-overline font-weight-bold" style="opacity: 0.5; letter-spacing: 1.5px; font-size: 0.65rem;">
          Painel
        </div>
      </div>
      <v-list density="compact" nav class="px-2">
        <v-list-item
          v-for="item in painelItems"
          :key="item.to"
          :to="item.to"
          :active="isActive(item.to)"
          color="primary"
          rounded="lg"
          class="mb-1"
        >
          <template #prepend>
            <v-icon :icon="item.icon" />
          </template>
          <v-list-item-title class="text-body-2">
            {{ item.title }}
          </v-list-item-title>
        </v-list-item>
      </v-list>

      <v-divider class="mx-3 my-2" />

      <!-- Financeiro Section -->
      <div v-if="!rail" class="px-4 pt-2 pb-1">
        <div class="text-overline font-weight-bold" style="opacity: 0.5; letter-spacing: 1.5px; font-size: 0.65rem;">
          Financeiro
        </div>
      </div>
      <v-list density="compact" nav class="px-2">
        <v-list-item
          v-for="item in financeiroItems"
          :key="item.to"
          :to="item.to"
          :active="isActive(item.to)"
          color="primary"
          rounded="lg"
          class="mb-1"
        >
          <template #prepend>
            <v-icon :icon="item.icon" />
          </template>
          <v-list-item-title class="text-body-2">
            {{ item.title }}
          </v-list-item-title>
        </v-list-item>
      </v-list>

      <v-divider class="mx-3 my-2" />

      <!-- PDV Section -->
      <div v-if="!rail" class="px-4 pt-2 pb-1">
        <div class="text-overline font-weight-bold" style="opacity: 0.5; letter-spacing: 1.5px; font-size: 0.65rem;">
          Operação PDV
        </div>
      </div>
      <v-list density="compact" nav class="px-2">
        <v-list-item
          v-for="item in pdvItems"
          :key="item.to"
          :to="item.to"
          :active="isActive(item.to)"
          color="primary"
          rounded="lg"
          class="mb-1"
        >
          <template #prepend>
            <v-icon :icon="item.icon" />
          </template>
          <v-list-item-title class="text-body-2">
            {{ item.title }}
          </v-list-item-title>
        </v-list-item>
      </v-list>

      <v-divider class="mx-3 my-2" />

      <!-- Conteúdo Section -->
      <div v-if="!rail" class="px-4 pt-2 pb-1">
        <div class="text-overline font-weight-bold" style="opacity: 0.5; letter-spacing: 1.5px; font-size: 0.65rem;">
          Conteúdo
        </div>
      </div>
      <v-list density="compact" nav class="px-2">
        <v-list-item
          v-for="item in conteudoItems"
          :key="item.to"
          :to="item.to"
          :active="isActive(item.to)"
          color="primary"
          rounded="lg"
          class="mb-1"
        >
          <template #prepend>
            <v-icon :icon="item.icon" />
          </template>
          <v-list-item-title class="text-body-2">
            {{ item.title }}
          </v-list-item-title>
        </v-list-item>
      </v-list>

      <v-divider class="mx-3 my-2" />

      <!-- Cadastros Section -->
      <div v-if="!rail" class="px-4 pt-2 pb-1">
        <div class="text-overline font-weight-bold" style="opacity: 0.5; letter-spacing: 1.5px; font-size: 0.65rem;">
          Cadastros
        </div>
      </div>
      <v-list density="compact" nav class="px-2">
        <v-list-item
          v-for="item in cadastrosItems"
          :key="item.to"
          :to="item.to"
          :active="isActive(item.to)"
          color="primary"
          rounded="lg"
          class="mb-1"
        >
          <template #prepend>
            <v-icon :icon="item.icon" />
          </template>
          <v-list-item-title class="text-body-2">
            {{ item.title }}
          </v-list-item-title>
        </v-list-item>
      </v-list>

      <template #append>
        <v-divider class="mx-3" />
        <v-list density="compact" nav class="px-2 py-2">
          <v-list-item
            rounded="lg"
            color="error"
            @click="logout"
          >
            <template #prepend>
              <v-icon icon="mdi-logout" />
            </template>
            <v-list-item-title class="text-body-2">
              Sair
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar flat color="surface" class="border-b">
      <v-app-bar-nav-icon
        variant="text"
        color="on-surface"
        @click.stop="mobile ? (drawer = !drawer) : (rail = !rail)"
      />

      <div class="d-flex flex-column justify-center">
        <v-breadcrumbs :items="breadcrumbs" density="compact" class="pa-0 text-caption" />
      </div>

      <v-spacer />

      <span class="text-body-2 text-medium-emphasis me-3 d-none d-sm-block">
        {{ user?.first_name || 'Usuário' }}
      </span>

      <v-menu>
        <template #activator="{ props }">
          <v-avatar size="36" v-bind="props" class="cursor-pointer" style="border: 2px solid rgba(0,0,0,0.08);">
            <v-img :src="avatarUrl" alt="Avatar" />
          </v-avatar>
        </template>
        <v-card min-width="220" class="pa-2" rounded="lg">
          <div class="d-flex align-center pa-2">
            <v-avatar size="44" class="me-3">
              <v-img :src="avatarUrl" alt="Avatar" />
            </v-avatar>
            <div>
              <div class="font-weight-medium text-body-2">
                {{ user?.first_name || 'Usuário' }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ user?.email || '' }}
              </div>
            </div>
          </div>
          <v-divider class="my-1" />
          <v-list density="compact">
            <v-list-item color="error" @click="logout">
              <template #prepend>
                <v-icon icon="mdi-logout" />
              </template>
              <v-list-item-title>Sair</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-app-bar>

    <!-- Main Content -->
    <v-main style="min-height: 100vh;">
      <slot />
    </v-main>
  </v-layout>
</template>

<style scoped>
.pdv-sidebar :deep(.v-list-item--active) {
  font-weight: 600 !important;
}

.cursor-pointer {
  cursor: pointer;
}
</style>

<style>
@media print {
  .v-navigation-drawer,
  .v-app-bar {
    display: none !important;
  }

  .v-main {
    padding: 0 !important;
    margin: 0 !important;
  }
}
</style>
