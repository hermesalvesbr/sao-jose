<script setup lang="ts">
useHead({
  titleTemplate: title => title ? `${title} - Capela São José` : 'Capela São José',
})

useSeoMeta({
  title: 'Capela São José',
  description: 'Sistema de Gestão da Capela São José: acompanhe fiéis, aniversariantes e ações da comunidade.',
  applicationName: 'Capela São José',
  robots: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',

  ogTitle: 'Capela São José',
  ogDescription: 'Sistema de Gestão da Capela São José: acompanhe fiéis, aniversariantes e ações da comunidade.',
  ogImage: '/images/og-image.png',
  ogSiteName: 'Capela São José',
  ogLocale: 'pt_BR',
  ogType: 'website',

  twitterCard: 'summary_large_image',
  twitterTitle: 'Capela São José',
  twitterDescription: 'Sistema de Gestão da Capela São José: acompanhe fiéis, aniversariantes e ações da comunidade.',
  twitterImage: '/images/og-image.png',
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
@media print {
  .no-print,
  .d-print-none {
    display: none !important;
  }

  .print-only,
  .d-print-block,
  .d-none.d-print-block {
    display: block !important;
  }

  .v-navigation-drawer,
  .v-app-bar,
  .v-footer {
    display: none !important;
  }

  .v-main {
    padding: 0 !important;
    margin: 0 !important;
  }
}
</style>
