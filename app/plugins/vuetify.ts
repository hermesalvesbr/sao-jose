import type { ThemeDefinition } from 'vuetify'
import { createVuetify } from 'vuetify'
import { VMaskInput } from 'vuetify/labs/VMaskInput'

// import this after install `@mdi/font` package
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

/**
 * Tema "cidadeTema" — Vuetify 4 compliant
 *
 * Corrigido para alto contraste com on-* colors explícitos.
 * Primary amarelo exige on-primary escuro para legibilidade.
 */
const cidadeTema: ThemeDefinition = {
  dark: false,
  colors: {
    // Core
    'primary': '#E6A800', // Amarelo ouro mais escuro para melhor contraste
    'primary-darken-1': '#CC8F00',
    'primary-lighten-1': '#FFD54F',
    'on-primary': '#3E2723', // Texto escuro sobre amarelo (alto contraste)

    'secondary': '#5D4037', // Marrom
    'secondary-darken-1': '#3E2723',
    'secondary-lighten-1': '#8D6E63',
    'on-secondary': '#FFFFFF', // Texto branco sobre marrom

    'accent': '#FF7043', // Laranja vibrante para destaques

    // Surfaces — Vuetify 4
    'background': '#F5F5F5',
    'surface': '#FFFFFF',
    'surface-bright': '#FFFFFF',
    'surface-light': '#F5F5F5',
    'surface-variant': '#E8E0DB',
    'on-surface': '#1C1B1F',
    'on-surface-variant': '#49454F',
    'on-background': '#1C1B1F',

    // Semantic
    'error': '#B3261E',
    'on-error': '#FFFFFF',
    'info': '#1565C0',
    'on-info': '#FFFFFF',
    'success': '#2E7D32',
    'on-success': '#FFFFFF',
    'warning': '#E65100',
    'on-warning': '#FFFFFF',
  },
  variables: {
    'font-family': '\'Poppins\', \'Roboto\', \'Helvetica\', \'Arial\', sans-serif',
    'border-color': '#000000',
    'border-opacity': 0.12,
    'high-emphasis-opacity': 0.87,
    'medium-emphasis-opacity': 0.60,
    'disabled-opacity': 0.38,
    'idle-opacity': 0.04,
    'hover-opacity': 0.04,
    'focus-opacity': 0.12,
    'selected-opacity': 0.08,
    'activated-opacity': 0.12,
    'pressed-opacity': 0.12,
    'dragged-opacity': 0.08,
    'theme-kbd': '#212529',
    'theme-on-kbd': '#FFFFFF',
    'theme-code': '#F5F5F5',
    'theme-on-code': '#000000',
  },
}

/**
 * Tema escuro para sidebar e painéis escuros
 */
const sidebarTheme: ThemeDefinition = {
  dark: true,
  colors: {
    'primary': '#FFD54F',
    'on-primary': '#3E2723',
    'secondary': '#8D6E63',
    'surface': '#3E2723',
    'background': '#3E2723',
    'on-surface': '#EFEBE9',
    'on-background': '#EFEBE9',
  },
}

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    components: {
      VMaskInput,
    },
    theme: {
      defaultTheme: 'cidadeTema',
      themes: {
        cidadeTema,
        sidebarTheme,
      },
    },
    defaults: {
      VBtn: {
        rounded: 'lg',
        elevation: '0',
        color: 'primary',
      },
      VCard: {
        elevation: '0',
        rounded: 'lg',
      },
      VAppBar: {
        elevation: '0',
      },
      VTextField: {
        variant: 'outlined',
        density: 'comfortable',
      },
      VSelect: {
        variant: 'outlined',
        density: 'comfortable',
      },
      VAutocomplete: {
        variant: 'outlined',
        density: 'comfortable',
      },
    },
  })

  app.vueApp.use(vuetify)
})
