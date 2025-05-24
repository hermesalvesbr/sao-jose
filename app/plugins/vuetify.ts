import type { ThemeDefinition } from 'vuetify'
import { createVuetify } from 'vuetify'

// import this after install `@mdi/font` package
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

const cidadeTema: ThemeDefinition = {
  dark: false,
  colors: {
    'primary': '#FFC107', // Amarelo ouro principal
    'primary-darken-1': '#FFA000',
    'primary-lighten-1': '#FFD54F',
    'secondary': '#5D4037', // Marrom para elementos secundários
    'secondary-darken-1': '#3E2723',
    'secondary-lighten-1': '#8D6E63',
    'accent': '#FF7043', // Laranja vibrante para destaques
    'background': '#FFFFFF',
    'surface': '#FFFFFF',
    'error': '#B00020',
    'info': '#1976D2',
    'success': '#388E3C',
    'warning': '#FFA000',
  },
  variables: {
    'font-family': '\'Poppins\', \'Roboto\', \'Helvetica\', \'Arial\', sans-serif',
    'border-color': '#E0E0E0',
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

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    theme: {
      defaultTheme: 'cidadeTema',
      themes: {
        cidadeTema,
      },
    },
    defaults: {
      VBtn: {
        rounded: 'lg',
        elevation: '2',
        color: 'primary',
      },
      VCard: {
        elevation: '2',
        rounded: 'lg',
      },
      VAppBar: {
        elevation: '2',
      },
    },
  })

  app.vueApp.use(vuetify)
})
