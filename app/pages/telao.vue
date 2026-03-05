<script setup lang="ts">
import type { AdsNovenario } from '~/types/schema'

definePageMeta({ layout: false })
useHead({ title: 'Telão — Anúncios Novenário' })

const config = useRuntimeConfig()
const directusUrl = computed(() => (config.public.directus.url as string).replace(/\/$/, ''))

const { data: anuncios } = await useAsyncData<AdsNovenario[]>(
  'ads-public',
  () => $fetch<AdsNovenario[]>('/api/ads-novenario'),
  {
    getCachedData: (key, nuxtApp) =>
      nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
  },
)

const currentIndex = ref(0)
const transitioning = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

const currentAd = computed(() => anuncios.value?.[currentIndex.value] ?? null)

function getMediaUrl(ad: AdsNovenario): string {
  const fileId = typeof ad.midia === 'object' && ad.midia ? (ad.midia as { id: string }).id : ad.midia as string
  return `${directusUrl.value}/assets/${fileId}`
}

function scheduleNext(): void {
  if (timer)
    clearTimeout(timer)
  if (!anuncios.value || anuncios.value.length === 0)
    return

  const ad = anuncios.value[currentIndex.value]
  const duracao = (ad?.duracao || 10) * 1000

  timer = setTimeout(() => {
    transitioning.value = true
    setTimeout(() => {
      currentIndex.value = (currentIndex.value + 1) % anuncios.value!.length
      transitioning.value = false
      scheduleNext()
    }, 600)
  }, duracao)
}

function onVideoEnded(): void {
  if (timer)
    clearTimeout(timer)
  transitioning.value = true
  setTimeout(() => {
    currentIndex.value = (currentIndex.value + 1) % anuncios.value!.length
    transitioning.value = false
    scheduleNext()
  }, 600)
}

onMounted(() => {
  scheduleNext()
})

onUnmounted(() => {
  if (timer)
    clearTimeout(timer)
})

watch(currentIndex, () => {
  if (currentAd.value?.tipo_midia !== 'video') {
    scheduleNext()
  }
})
</script>

<template>
  <div class="telao-container">
    <template v-if="anuncios && anuncios.length > 0 && currentAd">
      <Transition name="fade" mode="out-in">
        <video
          v-if="currentAd.tipo_midia === 'video'"
          :key="`video-${currentIndex}`"
          :src="getMediaUrl(currentAd)"
          autoplay
          muted
          playsinline
          class="telao-media"
          @ended="onVideoEnded"
        />
        <img
          v-else
          :key="`img-${currentIndex}`"
          :src="getMediaUrl(currentAd)"
          :alt="currentAd.anunciante"
          class="telao-media"
        >
      </Transition>
    </template>

    <div v-else class="telao-empty">
      <div class="telao-logo">
        <v-icon icon="mdi-church" size="72" color="#E6A800" class="mb-6" />
      </div>
      <div class="text-h3 font-weight-bold telao-title">
        Capela São José
      </div>
      <div class="text-h6 telao-subtitle mt-3">
        Novenário
      </div>
    </div>
  </div>
</template>

<style scoped>
.telao-container {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: #000;
  overflow: hidden;
  cursor: none;
}

.telao-media {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.telao-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(160deg, #3e2723 0%, #5d4037 50%, #4e342e 100%);
}

.telao-title {
  color: #e6a800;
  letter-spacing: 2px;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
}

.telao-subtitle {
  color: #ffecb3;
  opacity: 0.85;
  letter-spacing: 4px;
  text-transform: uppercase;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
