<script setup lang="ts">
import type { Catolico } from '~/types/schema'

interface Props {
  /** Lista de aniversariantes a exibir */
  aniversariantes: Catolico[]
  /** Título da seção */
  title?: string
  /** Ícone do título */
  icon?: string
  /** Variante visual: 'compact' (chips) ou 'card' (cards maiores) */
  variant?: 'compact' | 'card'
}

withDefaults(defineProps<Props>(), {
  title: 'Aniversariantes',
  icon: 'mdi-cake-variant',
  variant: 'compact',
})

const { getPrimeiroNome, getDia, getMesIndex, getSexoIcon, getNomeMes } = useAniversariantes()

const selectedCatolico = ref<Catolico | null>(null)
const showDetailsModal = ref(false)

function openDetails(catolico: Catolico) {
  selectedCatolico.value = catolico
  showDetailsModal.value = true
}

/** Formata a data do aniversário para exibição curta */
function formatAniversario(nascimento: string): string {
  const dia = getDia(nascimento)
  const mes = getNomeMes(getMesIndex(nascimento))
  return `${Number.parseInt(dia, 10)} de ${mes}`
}
</script>

<template>
  <section v-if="aniversariantes.length > 0" class="birthday-carousel">
    <!-- Cabeçalho da seção -->
    <div class="d-flex align-center mb-2">
      <v-icon :icon="icon" color="accent" size="20" class="me-2" />
      <span class="text-subtitle-1 font-weight-bold text-secondary">{{ title }}</span>
      <v-chip size="x-small" color="accent" variant="tonal" class="ms-2">
        {{ aniversariantes.length }}
      </v-chip>
    </div>

    <!-- Variante compacta: chips horizontais -->
    <v-slide-group v-if="variant === 'compact'" show-arrows>
      <v-slide-group-item v-for="a in aniversariantes" :key="a.id">
        <v-chip
          class="mx-1 my-1"
          color="primary-lighten-1"
          variant="elevated"
          size="default"
          style="cursor: pointer;"
          @click="openDetails(a)"
        >
          <template #prepend>
            <v-avatar start size="28" color="primary">
              <v-icon :icon="getSexoIcon(a.sexo)" size="16" color="on-primary" />
            </v-avatar>
          </template>
          <span class="font-weight-medium">{{ getPrimeiroNome(a.nome) }}</span>
          <template #append>
            <span class="text-caption ms-1 text-medium-emphasis">
              {{ getDia(a.nascimento as string) }}
            </span>
          </template>
        </v-chip>
      </v-slide-group-item>
    </v-slide-group>

    <!-- Variante card: cards maiores com mais info -->
    <v-slide-group v-else show-arrows>
      <v-slide-group-item v-for="a in aniversariantes" :key="a.id">
        <v-card
          class="mx-2 my-2 birthday-card"
          elevation="2"
          color="primary-lighten-1"
          min-width="130"
          max-width="150"
          style="cursor: pointer;"
          @click="openDetails(a)"
        >
          <v-card-text class="d-flex flex-column align-center justify-center py-4 px-3">
            <v-avatar size="48" class="mb-2" color="primary">
              <v-icon size="28" :icon="getSexoIcon(a.sexo)" color="on-primary" />
            </v-avatar>
            <div class="text-subtitle-2 font-weight-bold text-secondary text-center text-truncate" style="max-width: 120px;">
              {{ getPrimeiroNome(a.nome) }}
            </div>
            <div class="text-caption text-medium-emphasis d-flex align-center mt-1">
              <v-icon size="14" class="me-1" color="accent">
                mdi-cake-variant
              </v-icon>
              {{ formatAniversario(a.nascimento as string) }}
            </div>
          </v-card-text>
        </v-card>
      </v-slide-group-item>
    </v-slide-group>

    <!-- Modal de detalhes (reutiliza componente existente) -->
    <BirthdayDetailsModal
      v-model="showDetailsModal"
      :catolico="selectedCatolico"
    />
  </section>
</template>

<style scoped>
.birthday-carousel {
  margin-top: 8px;
}

.birthday-card {
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.birthday-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}
</style>
