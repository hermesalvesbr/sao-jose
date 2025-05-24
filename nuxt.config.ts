import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: false },
  build: {
    transpile: ['vuetify'],
  },
  modules: [
    '@nuxt/image',
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        // @ts-expect-error Vite plugin
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
  ],
  image: {
  },
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },
  css: [
    '~/assets/fonts.css',
    // ...outros estilos
  ],
  app: {
    head: {
      title: 'Capela São José',
      htmlAttrs: {
        lang: 'pt-BR',
      },
      meta: [
        { name: 'description', content: 'Sistema de Gestão da Capela São José: acompanhe fiéis, aniversariantes e ações da comunidade.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { charset: 'utf-8' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/icones/favicon.png' },
      ],
    },
  },
  runtimeConfig: {
    directus: {
      token: import.meta.env.DIRECTUS_TOKEN,
    },
    public: {
      directus: {
        url: import.meta.env.NUXT_PUBLIC_DIRECTUS_URL,
      },
    },
  },
})
