<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import '@fontsource/poppins'

const drawer = ref(false)
const route = useRoute()
const router = useRouter()

interface DrawerItem {
  title: string
  icon: string
  to: string
  disabled?: boolean
  tooltip?: string
}

const drawerItems: DrawerItem[] = [
  { title: 'Início', icon: 'mdi-home', to: '/', tooltip: 'Página inicial' },
  { title: 'Fazer parte', icon: 'mdi-account-plus', to: '/cadastrar', tooltip: 'Cadastrar novo católico' },
  { title: 'Aniversariantes', icon: 'mdi-cake-variant', to: '/aniversariantes', tooltip: 'Ver aniversariantes' },
  { title: 'Missas', icon: 'mdi-church', to: '/missas', disabled: true, tooltip: 'Em breve: Missas' },
  { title: 'Dízimos', icon: 'mdi-cash-multiple', to: '/dizimos', disabled: true, tooltip: 'Em breve: Dízimos' },
]

function navigate(item: DrawerItem) {
  if (!item.disabled) {
    router.push(item.to)
    drawer.value = false // Fecha o drawer ao navegar
  }
}

// Fecha o drawer ao mudar de rota
watch(() => route.fullPath, () => {
  drawer.value = false
})
</script>

<template>
  <v-app>
    <v-app-bar
      app
      color="#FFC107"
      flat
      height="64"
      :elevation="2"
      role="banner"
      class="d-flex align-center"
    >
      <v-btn
        icon
        variant="text"
        class="mr-2"
        aria-label="Abrir menu"
        tabindex="0"
        @click="drawer = !drawer"
      >
        <v-icon size="32" color="#5D4037">
          mdi-menu
        </v-icon>
      </v-btn>
      <span
        class="pl-2 text-h6 font-weight-medium text-brown-darken-3"
        aria-label="Capela São José"
        style="letter-spacing: 0.5px; user-select: none;"
      >
        Capela São José
      </span>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      app
      color="#5D4037"
      width="260"
      temporary
      :elevation="8"
      role="navigation"
      aria-label="Menu principal"
      :scrim="true"
      :disable-resize-watcher="true"
      :close-on-content-click="true"
      :mobile-breakpoint="9999"
      class="pt-4"
    >
      <div class="d-flex flex-column h-100">
        <v-list density="comfortable" nav class="flex-grow-1">
          <v-list-item
            v-for="item in drawerItems"
            :key="item.title"
            :to="item.to"
            :disabled="item.disabled"
            class="mb-2 mx-2 rounded-lg"
            :tabindex="item.disabled ? -1 : 0"
            :aria-disabled="item.disabled ? 'true' : 'false'"
            ripple
            @click="navigate(item)"
            @keyup.enter="navigate(item)"
          >
            <template #prepend>
              <ClientOnly>
                <v-tooltip
                  v-if="!item.disabled"
                  :text="item.tooltip"
                  location="right"
                  open-delay="300"
                >
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="32" color="#FFC107">
                      {{ item.icon }}
                    </v-icon>
                  </template>
                </v-tooltip>
              </ClientOnly>
              <v-icon
                v-if="item.disabled"
                size="32"
                color="#FFC107"
                class="opacity-50"
              >
                {{ item.icon }}
              </v-icon>
            </template>
            <v-list-item-title class="text-white text-subtitle-1 font-weight-medium ml-3">
              {{ item.title }}
            </v-list-item-title>
          </v-list-item>
        </v-list>

        <!-- Botão de Admin no rodapé absoluto -->
        <div class="pa-4 mt-auto">
          <v-divider class="mb-4" color="#FFC107" opacity="0.3" />
          <v-btn
            color="#FFC107"
            variant="outlined"
            size="large"
            block
            prepend-icon="mdi-shield-account"
            to="/admin"
            @click="drawer = false"
          >
            Administração
          </v-btn>
        </div>
      </div>
    </v-navigation-drawer>

    <v-main>
      <NuxtPage />
    </v-main>

    <v-footer
      app
      color="#5D4037"
      height="56"
      role="contentinfo"
      class="d-flex justify-center align-center text-center"
      style="border-top: 1px solid #ffc10722;"
    >
      <span class="text-amber text-body-1 font-weight-medium" style="letter-spacing: 0.2px;">
        "São José rogais por nós."
      </span>
    </v-footer>
  </v-app>
</template>

<style>
/* Apenas estilos específicos que não podem ser expressos por classes utilitárias */
.v-list-item:not(.v-list-item--disabled):hover {
  background-color: rgba(109, 76, 65, 0.8) !important;
}

.v-list-item:focus-visible {
  box-shadow: 0 0 0 2px #ffc107 !important;
  background-color: rgba(109, 76, 65, 0.8) !important;
}

.v-list-item--disabled .v-list-item-title,
.v-list-item--disabled .v-icon {
  opacity: 0.5 !important;
}
</style>
