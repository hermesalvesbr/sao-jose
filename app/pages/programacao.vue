<script setup lang="ts">
import { useDisplay } from 'vuetify'

usePublicSeo({
  title: 'Programação do Novenário',
  description: 'Confira a programação completa do novenário de São José, com todas as atividades e horários.',
  path: '/programacao',
})

const { mobile } = useDisplay()

const totalPages = 12
const currentPage = ref(0)

const pages = Array.from({ length: totalPages }, (_, i) => {
  const num = String(i + 1).padStart(2, '0')
  return {
    src: `/programacao/pagina-${num}.png`,
    alt: `Programação do Novenário — Página ${i + 1}`,
  }
})

/** Tamanho dos thumbnails responsivo */
const thumbWidth = computed(() => mobile.value ? 52 : 72)
const thumbHeight = computed(() => mobile.value ? 74 : 102)
</script>

<template>
  <v-container fluid class="pa-0 pa-sm-4" style="max-width: 960px;">
    <!-- Cabeçalho -->
    <div class="text-center pt-3 pt-sm-4 pb-1 pb-sm-2 px-2">
      <h1 class="text-h6 text-sm-h5 text-md-h4 font-weight-bold text-brown-darken-3">
        <v-icon color="primary" :size="mobile ? 24 : 32" class="mr-1 mr-sm-2">
          mdi-book-open-page-variant
        </v-icon>
        Programação do Novenário
      </h1>
      <p class="text-caption text-sm-body-2 text-medium-emphasis mt-1">
        {{ mobile ? 'Deslize para navegar entre as páginas' : 'Use as setas para navegar entre as páginas' }}
      </p>
    </div>

    <!-- Carousel -->
    <v-carousel
      v-model="currentPage"
      :show-arrows="!mobile"
      hide-delimiter-background
      hide-delimiters
      height="auto"
      :class="mobile ? 'elevation-2' : 'rounded-lg elevation-4'"
      touch
    >
      <v-carousel-item
        v-for="(page, index) in pages"
        :key="index"
      >
        <v-img
          :src="page.src"
          :alt="page.alt"
          :aspect-ratio="0.707"
          cover
          class="bg-grey-lighten-3"
        >
          <template #placeholder>
            <div class="d-flex align-center justify-center fill-height">
              <v-progress-circular indeterminate color="primary" :size="mobile ? 32 : 48" />
            </div>
          </template>
        </v-img>
      </v-carousel-item>
    </v-carousel>

    <!-- Indicador de página e navegação rápida -->
    <div class="d-flex align-center justify-center mt-2 mt-sm-4 mb-1 mb-sm-2 ga-1 ga-sm-2 flex-wrap px-2">
      <v-btn
        icon
        :size="mobile ? 'x-small' : 'small'"
        variant="tonal"
        color="secondary"
        :disabled="currentPage === 0"
        aria-label="Primeira página"
        @click="currentPage = 0"
      >
        <v-icon>mdi-page-first</v-icon>
      </v-btn>

      <v-btn
        icon
        :size="mobile ? 'x-small' : 'small'"
        variant="tonal"
        color="secondary"
        :disabled="currentPage === 0"
        aria-label="Página anterior"
        @click="currentPage--"
      >
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>

      <v-chip color="primary" variant="elevated" :size="mobile ? 'small' : 'default'" class="font-weight-bold">
        {{ currentPage + 1 }} / {{ totalPages }}
      </v-chip>

      <v-btn
        icon
        :size="mobile ? 'x-small' : 'small'"
        variant="tonal"
        color="secondary"
        :disabled="currentPage === totalPages - 1"
        aria-label="Próxima página"
        @click="currentPage++"
      >
        <v-icon>mdi-chevron-right</v-icon>
      </v-btn>

      <v-btn
        icon
        :size="mobile ? 'x-small' : 'small'"
        variant="tonal"
        color="secondary"
        :disabled="currentPage === totalPages - 1"
        aria-label="Última página"
        @click="currentPage = totalPages - 1"
      >
        <v-icon>mdi-page-last</v-icon>
      </v-btn>
    </div>

    <!-- Thumbnails para navegação direta -->
    <v-slide-group
      v-model="currentPage"
      mandatory
      :show-arrows="!mobile"
      center-active
      class="mb-4 mb-sm-6"
    >
      <v-slide-group-item
        v-for="(page, index) in pages"
        :key="index"
        v-slot="{ isSelected, toggle }"
      >
        <v-card
          class="ma-1 cursor-pointer"
          :class="[isSelected ? 'border-primary' : 'border-transparent']"
          :elevation="isSelected ? 6 : 1"
          :style="{ borderWidth: isSelected ? '3px' : '2px', borderStyle: 'solid', opacity: isSelected ? 1 : 0.6 }"
          :width="thumbWidth"
          :height="thumbHeight"
          rounded="lg"
          @click="toggle"
        >
          <v-img
            :src="page.src"
            :alt="`Miniatura — Página ${index + 1}`"
            height="100%"
            cover
          />
          <div
            class="text-center font-weight-bold thumb-label"
          >
            {{ index + 1 }}
          </div>
        </v-card>
      </v-slide-group-item>
    </v-slide-group>
  </v-container>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.border-primary {
  border-color: rgb(var(--v-theme-primary)) !important;
}

.border-transparent {
  border-color: transparent !important;
}

.thumb-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.55);
  color: white;
  font-size: 10px;
  line-height: 16px;
  pointer-events: none;
}
</style>
