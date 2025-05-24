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
  { title: 'Cadastrar Católico', icon: 'mdi-account-plus', to: '/cadastrar', tooltip: 'Cadastrar novo membro' },
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
  <v-app class="main-app">
    <v-app-bar
      app
      color="#FFC107"
      class="app-bar"
      flat
      height="64"
      :elevation="2"
      role="banner"
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
      <span class="app-title" aria-label="Capela São José">Capela São José</span>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      app
      color="#5D4037"
      class="drawer"
      width="260"
      temporary
      :elevation="8"
      role="navigation"
      aria-label="Menu principal"
      :scrim="true"
      :disable-resize-watcher="true"
      :close-on-content-click="true"
      :mobile-breakpoint="9999"
    >
      <v-list density="comfortable" nav>
        <v-list-item
          v-for="item in drawerItems"
          :key="item.title"
          :to="item.to"
          :disabled="item.disabled"
          class="drawer-item"
          :tabindex="item.disabled ? -1 : 0"
          :aria-disabled="item.disabled ? 'true' : 'false'"
          ripple
          @click="navigate(item)"
          @keyup.enter="navigate(item)"
        >
          <template #prepend>
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
            <v-icon
              v-else
              size="32"
              color="#FFC107"
              class="opacity-50"
            >
              {{ item.icon }}
            </v-icon>
          </template>
          <v-list-item-title class="drawer-title">
            {{ item.title }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main class="main-content">
      <NuxtPage />
    </v-main>

    <v-footer app color="#5D4037" class="footer" height="56" role="contentinfo">
      <span class="footer-text">"Tudo por Jesus, nada sem Maria."</span>
    </v-footer>
  </v-app>
</template>

<style scoped>
.main-app {
  font-family: 'Poppins', 'Roboto', 'Helvetica', 'Arial', sans-serif;
  background: #f5f5f5;
}
.app-bar {
  color: #5d4037;
  font-family: 'Poppins', sans-serif;
  display: flex;
  align-items: center;
  min-height: 64px;
}
.app-logo {
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 8px rgba(93, 64, 55, 0.08);
}
.app-title {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #5d4037;
  font-family: 'Poppins', sans-serif;
  user-select: none;
}
.drawer {
  background: #5d4037 !important;
  border: none;
  padding-top: 16px;
}
.drawer-item {
  margin-bottom: 8px;
  border-radius: 12px;
  transition: background 0.2s;
  outline: none;
}
.drawer-item:focus-visible {
  box-shadow: 0 0 0 2px #ffc107;
  background: #6d4c41;
}
.drawer-title {
  font-size: 1.1rem;
  color: #fff;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  margin-left: 12px;
}
.v-list-item--disabled .drawer-title {
  opacity: 0.5;
}
.v-list-item--disabled .v-icon {
  opacity: 0.5;
}
.v-list-item:not(.v-list-item--disabled):hover,
.drawer-item:not(.v-list-item--disabled):hover {
  background: #6d4c41;
  cursor: pointer;
}
.main-content {
  padding: 16px 8px 64px 8px;
  min-height: calc(100vh - 112px);
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}
.footer {
  color: #ffc107;
  font-family: 'Poppins', sans-serif;
  justify-content: center;
  align-items: center;
  text-align: center;
  min-height: 56px;
  border-top: 1px solid #ffc10722;
}
.footer-text {
  font-size: 1rem;
  font-weight: 500;
  color: #ffc107;
  letter-spacing: 0.2px;
}
@media (max-width: 600px) {
  .app-title {
    font-size: 1.1rem;
  }
  .drawer-title {
    font-size: 1rem;
  }
  .main-content {
    padding: 8px 2px 64px 2px;
  }
}
</style>
