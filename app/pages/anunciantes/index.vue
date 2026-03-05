<script setup lang="ts">
import type { AnuncianteResumo } from '~/types/schema'

useHead({ title: 'Anunciantes — Novenário São José' })
usePublicSeo({
  title: 'Anunciantes do Novenário',
  description: 'Transparência na exibição dos anúncios do novenário. Consulte as estatísticas de cada anunciante.',
})

const { formatarTempo, formatarMoeda, custoSegundo, formatarDataHora } = useAnunciantesPublico()

const { data: anunciantes, pending } = await useAsyncData<AnuncianteResumo[]>(
  'anunciantes-lista',
  () => $fetch<AnuncianteResumo[]>('/api/anunciantes'),
)

const total = computed(() => anunciantes.value?.length ?? 0)
const totalExibicoes = computed(() =>
  anunciantes.value?.reduce((a, x) => a + x.total_exibicoes, 0) ?? 0,
)
const totalTempo = computed(() =>
  anunciantes.value?.reduce((a, x) => a + x.total_duracao_exibida, 0) ?? 0,
)

function chipColor(tipo: string): string {
  return tipo === 'video' ? 'deep-purple-lighten-2' : 'teal-lighten-2'
}

function chipIcon(tipo: string): string {
  return tipo === 'video' ? 'mdi-video' : 'mdi-image'
}
</script>

<template>
  <v-container class="py-8" max-width="1100">
    <!-- Cabeçalho -->
    <div class="d-flex align-center mb-2">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        size="small"
        class="mr-2"
        to="/"
        aria-label="Voltar"
      />
      <div>
        <h1 class="text-h5 font-weight-bold text-brown-darken-3">
          Anunciantes do Novenário
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          Transparência total sobre a exibição dos anúncios no telão de LED.
        </p>
      </div>
    </div>

    <!-- KPIs globais -->
    <v-row class="mb-6" dense>
      <v-col cols="12" sm="4">
        <v-card rounded="lg" color="#FFF8E1" flat border>
          <v-card-text class="pa-4">
            <div class="text-overline text-brown-darken-2">
              Anunciantes
            </div>
            <div class="text-h4 font-weight-bold text-brown-darken-3">
              {{ total }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card rounded="lg" color="#FFF8E1" flat border>
          <v-card-text class="pa-4">
            <div class="text-overline text-brown-darken-2">
              Total de Exibições
            </div>
            <div class="text-h4 font-weight-bold text-brown-darken-3">
              {{ totalExibicoes.toLocaleString('pt-BR') }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card rounded="lg" color="#FFF8E1" flat border>
          <v-card-text class="pa-4">
            <div class="text-overline text-brown-darken-2">
              Tempo Total no Ar
            </div>
            <div class="text-h4 font-weight-bold text-brown-darken-3">
              {{ formatarTempo(totalTempo) }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading -->
    <div v-if="pending" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="#E6A800" />
    </div>

    <!-- Lista de anunciantes -->
    <v-row v-else-if="anunciantes && anunciantes.length > 0">
      <v-col
        v-for="item in anunciantes"
        :key="item.id"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card
          rounded="xl"
          color="white"
          :to="`/anunciantes/${item.id}`"
          hover
          elevation="2"
          class="anunc-card"
        >
          <!-- Barra superior colorida -->
          <div class="anunc-header" />

          <v-card-text class="pa-5">
            <!-- Nome + tipo -->
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="text-h6 font-weight-bold text-brown-darken-3 anunc-nome">
                {{ item.anunciante }}
              </div>
              <v-chip
                :color="chipColor(item.tipo_midia)"
                size="small"
                :prepend-icon="chipIcon(item.tipo_midia)"
                label
              >
                {{ item.tipo_midia }}
              </v-chip>
            </div>

            <!-- KPIs do card -->
            <v-divider class="mb-3" />

            <div class="d-flex flex-column ga-2">
              <div class="d-flex justify-space-between text-body-2">
                <span class="text-medium-emphasis">
                  <v-icon size="14" class="mr-1">
                    mdi-play-circle-outline
                  </v-icon>Exibições
                </span>
                <strong>{{ item.total_exibicoes.toLocaleString('pt-BR') }}×</strong>
              </div>
              <div class="d-flex justify-space-between text-body-2">
                <span class="text-medium-emphasis">
                  <v-icon size="14" class="mr-1">
                    mdi-clock-outline
                  </v-icon>Tempo exibido
                </span>
                <strong>{{ formatarTempo(item.total_duracao_exibida) }}</strong>
              </div>
              <div class="d-flex justify-space-between text-body-2">
                <span class="text-medium-emphasis">
                  <v-icon size="14" class="mr-1">
                    mdi-cash
                  </v-icon>Valor pago
                </span>
                <strong>{{ formatarMoeda(item.valor_pago) }}</strong>
              </div>
              <div class="d-flex justify-space-between text-body-2">
                <span class="text-medium-emphasis">
                  <v-icon size="14" class="mr-1">
                    mdi-speedometer
                  </v-icon>Custo/segundo
                </span>
                <strong>{{ custoSegundo(item.valor_pago, item.total_duracao_exibida) }}</strong>
              </div>
              <div class="d-flex justify-space-between text-body-2">
                <span class="text-medium-emphasis">
                  <v-icon size="14" class="mr-1">
                    mdi-calendar-clock
                  </v-icon>Última exibição
                </span>
                <span>{{ formatarDataHora(item.ultima_exibicao) }}</span>
              </div>
            </div>

            <v-btn
              class="mt-4"
              color="#E6A800"
              variant="tonal"
              block
              rounded="lg"
              size="small"
              append-icon="mdi-chevron-right"
            >
              Ver histórico completo
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty state -->
    <v-empty-state
      v-else
      icon="mdi-handshake-outline"
      title="Nenhum anunciante cadastrado"
      text="Os anúncios do novenário aparecerão aqui quando configurados."
      class="mt-8"
    />
  </v-container>
</template>

<style scoped>
.anunc-header {
  height: 6px;
  background: linear-gradient(90deg, #5d4037, #e6a800);
  border-radius: 12px 12px 0 0;
}

.anunc-card {
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.anunc-card:hover {
  transform: translateY(-3px);
}

.anunc-nome {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
}
</style>
