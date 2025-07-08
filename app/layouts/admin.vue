<script setup lang="ts">
/**
 * Layout Admin - Layout para páginas administrativas da aplicação
 *
 * Features:
 * - Header com título da página
 * - Botão voltar opcional (para páginas internas)
 * - Bottom navigation com acesso rápido às principais seções
 * - Avatar do usuário no header (com imagem do Directus quando disponível)
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
const { getUserAvatarUrl, fetchCurrentUser, user, logout } = useAuth()
const avatarUrl = computed(() => getUserAvatarUrl() ?? '')

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
    '/admin/ofertorio/add': 'Nova Oferta Financeira',
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

onMounted(() => {
  fetchCurrentUser()
})
</script>

<template>
  <v-layout>
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
        <v-menu offset-y>
          <template #activator="{ props }">
            <v-avatar size="36" v-bind="props">
              <v-img :src="avatarUrl" alt="Foto do usuário" />
            </v-avatar>
          </template>
          <v-card min-width="220" class="pa-2">
            <v-row align="center" no-gutters>
              <v-col cols="auto">
                <v-avatar size="48">
                  <v-img :src="avatarUrl" alt="Foto do usuário" />
                </v-avatar>
              </v-col>
              <v-col>
                <div class="font-weight-medium text-body-1">
                  {{ user?.first_name || 'Usuário' }}
                </div>
                <div class="text-caption text-grey">
                  {{ user?.email || '' }}
                </div>
              </v-col>
            </v-row>
            <v-divider class="my-2" />
            <v-list density="compact">
              <v-list-item class="text-error" @click="logout">
                <template #prepend>
                  <v-icon color="error">
                    mdi-logout
                  </v-icon>
                </template>
                <v-list-item-title>Sair</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>
      </template>
    </v-app-bar>

    <v-main>
      <slot />
    </v-main>

    <v-bottom-navigation grow location="bottom" mode="shift">
      <v-btn value="resumo" to="/admin/resumo">
        <v-icon>mdi-home</v-icon>
        <span>Resumo</span>
      </v-btn>

      <v-btn value="ofertorio" to="/admin/ofertorio/">
        <v-icon>mdi-cash-multiple</v-icon>
        <span>Ofertório</span>
      </v-btn>

      <v-btn value="dizimos" to="/admin/dizimos">
        <v-icon>mdi-account-cash</v-icon>
        <span>Dízimos</span>
      </v-btn>
    </v-bottom-navigation>
  </v-layout>
</template>
