<script setup lang="ts">
import type { AnuncianteDetalhe } from '~/composables/useAnunciantesPublico'
import type { AdsLogEntry, AdsNovenario } from '~/types/schema'

const route = useRoute()
const id = route.params.id as string

const config = useRuntimeConfig()
const directusUrl = computed(() => (config.public.directus.url as string).replace(/\/$/, ''))
const directusToken = computed(() => config.public.directus.token as string)

function getMediaUrl(midia: string): string {
  const token = directusToken.value
  return `${directusUrl.value}/assets/${midia}${token ? `?access_token=${token}` : ''}`
}

const {
  formatarTempo,
  formatarData,
  formatarHora,
} = useAnunciantesPublico()

const { data, pending, error } = await useAsyncData<AnuncianteDetalhe>(
  `anunciante-${id}`,
  () => $fetch<AnuncianteDetalhe>(`/api/anunciantes/${id}`),
)

const ad = computed<AdsNovenario | null>(() => data.value?.ad ?? null)
const logs = computed<AdsLogEntry[]>(() => data.value?.logs ?? [])

useHead({
  title: computed(() =>
    ad.value ? `${ad.value.anunciante} — Anunciantes` : 'Anunciante — Novenário',
  ),
})

// KPIs derivados
const totalExibicoes = computed(() => logs.value.length)
const totalDuracao = computed(() =>
  logs.value.reduce((a, l) => a + (l.duracao_exibida || 0), 0),
)

// Exibições por dia (para o gráfico de barras simples)
const exibicoesPorDia = computed(() => {
  const map = new Map<string, number>()
  for (const l of logs.value) {
    const dia = formatarData(l.exibido_em)
    map.set(dia, (map.get(dia) ?? 0) + 1)
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dia, qtd]) => ({ dia, qtd }))
})

const maxExibicoesDia = computed(() =>
  exibicoesPorDia.value.reduce((m, d) => Math.max(m, d.qtd), 1),
)

// Tabela de logs
const headers = [
  { title: 'Data', key: 'data', sortable: false },
  { title: 'Horário', key: 'hora', sortable: false },
  { title: 'Duração exibida', key: 'duracao_exibida', sortable: false },
  { title: 'Tipo', key: 'tipo_midia', sortable: false },
]

function chipColor(tipo: string): string {
  return tipo === 'video' ? 'deep-purple-lighten-2' : 'teal-lighten-2'
}
</script>

<template>
  <v-container class="py-8" max-width="900">
    <!-- Navegação -->
    <div class="d-flex align-center mb-6">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        size="small"
        class="mr-2"
        to="/anunciantes"
        aria-label="Voltar para anunciantes"
      />
      <v-breadcrumbs
        :items="[
          { title: 'Anunciantes', to: '/anunciantes', disabled: false },
          { title: ad?.anunciante ?? '...', disabled: true },
        ]"
        class="pa-0"
      />
    </div>

    <!-- Loading -->
    <div v-if="pending" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="#E6A800" size="48" />
    </div>

    <!-- Erro -->
    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      Não foi possível carregar os dados deste anunciante.
    </v-alert>

    <template v-else-if="ad">
      <!-- Cabeçalho do anunciante -->
      <v-card rounded="xl" flat class="mb-6 anunc-detail-header">
        <v-card-text class="pa-6">
          <div class="d-flex align-center ga-3 flex-wrap">
            <v-icon size="40" color="#E6A800">
              mdi-bullhorn-outline
            </v-icon>
            <div>
              <h1 class="text-h5 font-weight-bold text-white">
                {{ ad.anunciante }}
              </h1>
              <v-chip
                :color="chipColor(ad.tipo_midia)"
                size="small"
                class="mt-1"
                :prepend-icon="ad.tipo_midia === 'video' ? 'mdi-video' : 'mdi-image'"
                label
              >
                {{ ad.tipo_midia }}
              </v-chip>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Preview da mídia no telão -->
      <v-card rounded="xl" flat border class="mb-6 pa-5">
        <div class="text-subtitle-1 font-weight-bold text-brown-darken-3 mb-4">
          <v-icon start size="18">
            mdi-television-play
          </v-icon>
          Pré-visualização — como aparece no telão
        </div>
        <div class="preview-wrapper">
          <video
            v-if="ad.tipo_midia === 'video'"
            :src="getMediaUrl(ad.midia)"
            controls
            muted
            playsinline
            class="preview-media"
          />
          <img
            v-else
            :src="getMediaUrl(ad.midia)"
            :alt="ad.anunciante"
            class="preview-media"
          >
        </div>
        <div class="text-caption text-medium-emphasis mt-2 text-center">
          Duração programada: <strong>{{ ad.duracao }}s</strong>
        </div>
      </v-card>

      <!-- KPI cards -->
      <v-row class="mb-6" dense>
        <v-col cols="6" md="6">
          <v-card rounded="lg" color="#FFF8E1" flat border>
            <v-card-text class="pa-4 text-center">
              <v-icon color="#5D4037" class="mb-1">
                mdi-play-circle-outline
              </v-icon>
              <div class="text-h5 font-weight-bold text-brown-darken-3">
                {{ totalExibicoes.toLocaleString('pt-BR') }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Exibições
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" md="6">
          <v-card rounded="lg" color="#FFF8E1" flat border>
            <v-card-text class="pa-4 text-center">
              <v-icon color="#5D4037" class="mb-1">
                mdi-clock-outline
              </v-icon>
              <div class="text-h5 font-weight-bold text-brown-darken-3">
                {{ formatarTempo(totalDuracao) }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Tempo Total no Ar
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Gráfico simples: exibições por dia -->
      <v-card v-if="exibicoesPorDia.length > 0" rounded="xl" flat border class="mb-6 pa-5">
        <div class="text-subtitle-1 font-weight-bold text-brown-darken-3 mb-4">
          <v-icon start size="18">
            mdi-chart-bar
          </v-icon>
          Exibições por dia
        </div>
        <div class="bar-chart">
          <div
            v-for="d in exibicoesPorDia"
            :key="d.dia"
            class="bar-col"
          >
            <div class="bar-label-top">
              {{ d.qtd }}
            </div>
            <div
              class="bar"
              :style="{ height: `${Math.round((d.qtd / maxExibicoesDia) * 100)}%` }"
            />
            <div class="bar-label-bottom">
              {{ d.dia }}
            </div>
          </div>
        </div>
      </v-card>

      <!-- Histórico de exibições -->
      <v-card rounded="xl" flat border>
        <v-card-title class="pa-5 pb-2 text-brown-darken-3">
          <v-icon start>
            mdi-history
          </v-icon>
          Histórico de exibições
          <v-chip size="x-small" class="ml-2" color="#E6A800" label>
            {{ totalExibicoes }}
          </v-chip>
        </v-card-title>

        <v-data-table
          v-if="logs.length > 0"
          :headers="headers"
          :items="logs"
          :items-per-page="20"
          density="compact"
          hover
        >
          <template #item.data="{ item }">
            {{ formatarData(item.exibido_em) }}
          </template>
          <template #item.hora="{ item }">
            <span class="font-mono">{{ formatarHora(item.exibido_em) }}</span>
          </template>
          <template #item.duracao_exibida="{ item }">
            {{ formatarTempo(item.duracao_exibida) }}
          </template>
          <template #item.tipo_midia="{ item }">
            <v-chip
              size="x-small"
              :color="chipColor(item.tipo_midia)"
              :prepend-icon="item.tipo_midia === 'video' ? 'mdi-video' : 'mdi-image'"
              label
            >
              {{ item.tipo_midia }}
            </v-chip>
          </template>
        </v-data-table>

        <v-empty-state
          v-else
          icon="mdi-calendar-remove-outline"
          title="Nenhuma exibição registrada"
          text="O histórico aparecerá aqui após o primeiro ciclo no telão."
          class="my-4"
        />
      </v-card>
    </template>
  </v-container>
</template>

<style scoped>
.anunc-detail-header {
  background: linear-gradient(135deg, #5d4037, #8d6e63);
}

.preview-wrapper {
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 420px;
  aspect-ratio: 16 / 9;
  margin: 0 auto;
}

.preview-media {
  max-width: 100%;
  max-height: 420px;
  object-fit: contain;
  display: block;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 120px;
  padding-bottom: 24px;
  position: relative;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  position: relative;
  justify-content: flex-end;
}

.bar {
  width: 100%;
  background: linear-gradient(180deg, #e6a800, #5d4037);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.3s ease;
}

.bar-label-top {
  font-size: 11px;
  font-weight: 700;
  color: #5d4037;
  position: absolute;
  top: 0;
}

.bar-label-bottom {
  font-size: 9px;
  color: #9e9e9e;
  position: absolute;
  bottom: -20px;
  white-space: nowrap;
}

.font-mono {
  font-family: monospace;
  font-size: 0.82rem;
}
</style>
