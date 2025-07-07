<script setup lang="ts">
/**
 * Layout Admin - Layout para páginas administrativas da aplicação
 *
 * Features:
 * - Header com título da página
 * - Botão voltar opcional (para páginas internas)
 * - Bottom navigation com acesso rápido às principais seções
 *
 * Como usar:
 *
 * 1. Para a página principal (Resumo) - sem botão voltar:
 * definePageMeta({
 *   layout: 'admin',
 * })
 *
 * 2. Para páginas internas - com botão voltar:
 * definePageMeta({
 *   layout: 'admin',
 * })
 */

const route = useRoute()
const router = useRouter()

// Detecta se deve mostrar botão voltar baseado na rota
const showBackButton = computed(() => {
  return route.path !== '/admin/resumo' && route.path !== '/admin'
})

// Pega o título da página
const pageTitle = computed(() => {
  const routeTitles: Record<string, string> = {
    '/admin/resumo': 'Resumo',
    '/admin': 'Resumo',
    '/admin/ofertorio': 'Registro de Ofertório',
    '/admin/dizimos': 'Gerenciar Dízimos',
  }

  return routeTitles[route.path] || 'Painel Administrativo'
})

/**
 * Navega de volta para a página anterior ou para o resumo se não houver histórico
 */
async function goBack() {
  // Se há histórico anterior, volta uma página
  if (window.history.length > 1) {
    router.back()
  }
  else {
    // Caso contrário, vai para a página de resumo
    await navigateTo('/admin/resumo')
  }
}
</script>

<template>
  <v-app>
    <!-- Header com título e botão voltar -->
    <v-app-bar color="primary" :elevation="2">
      <!-- Botão voltar (apenas se showBackButton for true) -->
      <template v-if="showBackButton" #prepend>
        <v-app-bar-nav-icon
          icon="mdi-arrow-left"
          color="secondary"
          @click="goBack"
        />
      </template>
      <!-- Título da página -->
      <v-app-bar-title>{{ pageTitle }}</v-app-bar-title>

      <template #append>
        <v-btn icon="mdi-dots-vertical" color="secondary" />
      </template>
    </v-app-bar>

    <v-main>
      <slot />
    </v-main>

    <v-bottom-navigation grow>
      <v-btn value="resumo" to="/admin/resumo">
        <v-icon>mdi-home</v-icon>
        <span>Resumo</span>
      </v-btn>

      <v-btn value="ofertorio" to="/admin/ofertorio">
        <v-icon>mdi-cash-multiple</v-icon>
        <span>Ofertório</span>
      </v-btn>

      <v-btn value="dizimos" to="/admin/dizimos">
        <v-icon>mdi-account-cash</v-icon>
        <span>Dízimos</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>
