<script setup lang="ts">
import type { AdsNovenario } from '~/types/schema'

definePageMeta({ layout: false })
useHead({ title: 'Telão — Anúncios Novenário' })

const config = useRuntimeConfig()
const directusUrl = computed(() => (config.public.directus.url as string).replace(/\/$/, ''))

// ─── localStorage helpers (safe – opera sem internet em modo kiosk) ───────────
const ADS_CACHE_KEY = 'telao:ads'
const LOG_QUEUE_KEY = 'telao:log-queue'

function lsGet<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') as T
  }
  catch {
    return null
  }
}

function lsSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  }
  catch { /* quota esgotada – ignora */ }
}

// ─── Ads data com fallback offline ───────────────────────────────────────────
const anuncios = ref<AdsNovenario[]>([])

async function carregarAnuncios(): Promise<void> {
  try {
    const data = await $fetch<AdsNovenario[]>('/api/ads-novenario')
    anuncios.value = data
    lsSet(ADS_CACHE_KEY, data) // atualiza cache local sempre que carregar com sucesso
  }
  catch {
    // Sem internet: usa cache local para manter o telão funcionando
    const cached = lsGet<AdsNovenario[]>(ADS_CACHE_KEY)
    if (cached?.length)
      anuncios.value = cached
  }
}

// ─── Media helpers ────────────────────────────────────────────────────────────
function getMediaUrl(ad: AdsNovenario): string {
  const fileId = typeof ad.midia === 'object' && ad.midia
    ? (ad.midia as { id: string }).id
    : ad.midia as string
  return `${directusUrl.value}/assets/${fileId}`
}

// Pré-carrega imagens no browser cache para que fiquem disponíveis offline
function preloadImages(): void {
  anuncios.value.forEach((ad) => {
    if (ad.tipo_midia !== 'video') {
      const img = new Image()
      img.src = getMediaUrl(ad)
    }
  })
}

// ─── Display state ────────────────────────────────────────────────────────────
const currentIndex = ref(0)
const transitioning = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null
let refreshInterval: ReturnType<typeof setInterval> | null = null
let logFlushInterval: ReturnType<typeof setInterval> | null = null
let adStartTime: number = Date.now()

const currentAd = computed(() => anuncios.value[currentIndex.value] ?? null)

// ─── Log de exibição com fila offline e retry ─────────────────────────────────
interface LogPayload {
  ads: string
  exibido_em: string
  duracao_exibida: number
  anunciante: string
  tipo_midia: string
}

async function sendLog(payload: LogPayload): Promise<void> {
  await $fetch('/api/ads-log', { method: 'POST', body: payload })
}

function enqueueLog(payload: LogPayload): void {
  const queue = lsGet<LogPayload[]>(LOG_QUEUE_KEY) ?? []
  queue.push(payload)
  lsSet(LOG_QUEUE_KEY, queue.slice(-200)) // limite de 200 entradas
}

// Chamado periodicamente para enviar logs que falharam por falta de conexão
async function flushLogQueue(): Promise<void> {
  const queue = lsGet<LogPayload[]>(LOG_QUEUE_KEY)
  if (!queue?.length)
    return
  const remaining: LogPayload[] = []
  for (const entry of queue) {
    try {
      await sendLog(entry)
    }
    catch {
      remaining.push(entry)
    }
  }
  lsSet(LOG_QUEUE_KEY, remaining)
}

async function registrarExibicao(ad: AdsNovenario, duracaoExibida: number): Promise<void> {
  const payload: LogPayload = {
    ads: ad.id,
    exibido_em: new Date(adStartTime).toISOString(),
    duracao_exibida: duracaoExibida,
    anunciante: ad.anunciante,
    tipo_midia: ad.tipo_midia,
  }
  try {
    await sendLog(payload)
  }
  catch {
    // Sem internet: persiste localmente; flushLogQueue() reenviará depois
    enqueueLog(payload)
  }
}

// ─── Rotação de anúncios ──────────────────────────────────────────────────────
function avancarAd(duracaoReal?: number): void {
  const ad = anuncios.value[currentIndex.value]
  if (ad) {
    const elapsed = duracaoReal ?? Math.round((Date.now() - adStartTime) / 1000)
    registrarExibicao(ad, elapsed)
  }
  transitioning.value = true
  setTimeout(() => {
    currentIndex.value = (currentIndex.value + 1) % Math.max(anuncios.value.length, 1)
    adStartTime = Date.now()
    transitioning.value = false
    scheduleNext()
  }, 600)
}

function scheduleNext(): void {
  if (timer)
    clearTimeout(timer)
  if (!anuncios.value.length)
    return
  const ad = anuncios.value[currentIndex.value]
  const duracao = (ad?.duracao || 10) * 1000
  timer = setTimeout(() => avancarAd(ad?.duracao), duracao)
}

function onVideoEnded(): void {
  if (timer)
    clearTimeout(timer)
  const elapsed = Math.round((Date.now() - adStartTime) / 1000)
  avancarAd(elapsed)
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  await carregarAnuncios()
  preloadImages()
  adStartTime = Date.now()
  scheduleNext()

  // Atualiza lista de anúncios a cada 10 min (sem recarregar a página)
  refreshInterval = setInterval(async () => {
    await carregarAnuncios()
    preloadImages()
  }, 10 * 60 * 1000)

  // Tenta reenviar logs pendentes a cada 5 min
  logFlushInterval = setInterval(flushLogQueue, 5 * 60 * 1000)
})

onUnmounted(() => {
  if (timer)
    clearTimeout(timer)
  if (refreshInterval)
    clearInterval(refreshInterval)
  if (logFlushInterval)
    clearInterval(logFlushInterval)
})

watch(currentIndex, () => {
  if (currentAd.value?.tipo_midia !== 'video')
    scheduleNext()
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
