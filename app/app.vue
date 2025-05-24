<script setup lang="ts">
import { useHead, useSeoMeta } from '#imports'

useHead({
  titleTemplate: title => title ? `${title} - Capela São José` : 'Capela São José',
})

useSeoMeta({
  title: 'Capela São José',
  description: 'Sistema de Gestão da Capela São José: acompanhe fiéis, aniversariantes e ações da comunidade.',
  ogTitle: 'Capela São José',
  ogDescription: 'Sistema de Gestão da Capela São José: acompanhe fiéis, aniversariantes e ações da comunidade.',
  ogImage: '/images/og-image.png',
  ogLocale: 'pt_BR',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
