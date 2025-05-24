<script setup lang="ts">
import type { Catolico } from '~/types/schema'
import { useSeoMeta } from '#imports'
import { readItems } from '@directus/sdk'
import { DateTime } from 'luxon'
import { computed, onMounted, ref } from 'vue'
import { useDirectusClient } from '~/composables/useDirectusClient'

const meses = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const currentMonth = ref(new Date().getMonth())
const loading = ref(false)
const aniversariantes = ref<Catolico[]>([])

/**
 * Busca todos os católicos com data de nascimento válida
 */
async function fetchAniversariantes() {
  loading.value = true
  try {
    const d = await useDirectusClient()
    const result = await d.request(
      readItems('catolico', {
        fields: ['id', 'nome', 'sexo', 'nascimento'],
        filter: { nascimento: { _nnull: true } },
        limit: -1,
        sort: ['nascimento'],
      }),
    )
    aniversariantes.value = Array.isArray(result) ? result as Catolico[] : []
  }
  finally {
    loading.value = false
  }
}

onMounted(fetchAniversariantes)

/**
 * Retorna aniversariantes do mês selecionado
 */
const aniversariantesDoMes = computed(() => {
  return aniversariantes.value.filter((a) => {
    if (!a.nascimento)
      return false
    const d = DateTime.fromISO(a.nascimento as string)
    return d.month - 1 === currentMonth.value
  }).sort((a, b) => {
    const da = DateTime.fromISO(a.nascimento as string).day
    const db = DateTime.fromISO(b.nascimento as string).day
    return da - db
  })
})

function getPrimeiroNome(nome: string) {
  return nome.split(' ')[0]
}

function getDiaNascimento(nascimento: string) {
  return DateTime.fromISO(nascimento).toFormat('dd')
}

function getMesNascimento(nascimento: string) {
  return DateTime.fromISO(nascimento).month - 1
}

function getSexoIcon(sexo: string) {
  if (sexo === 'M')
    return 'mdi-gender-male'
  if (sexo === 'F')
    return 'mdi-gender-female'
  return 'mdi-account'
}

function nextMonth() {
  currentMonth.value = (currentMonth.value + 1) % 12
}
function prevMonth() {
  currentMonth.value = (currentMonth.value + 11) % 12
}

useSeoMeta({
  title: 'Aniversariantes',
  description: 'Veja os aniversariantes do mês na comunidade.',
  ogTitle: 'Aniversariantes',
  ogDescription: 'Veja os aniversariantes do mês na comunidade.',
  ogType: 'website',
})
</script>

<template>
  <v-container class="pa-6" fluid>
    <v-row justify="center" class="mb-4">
      <v-col cols="12" md="8" class="text-center">
        <h1 class="text-h4 font-weight-bold mb-2 text-success">
          Aniversariantes
        </h1>
        <div class="subtitle-1 mb-4">
          Celebre a vida de quem faz parte da nossa comunidade!
        </div>
        <v-btn icon variant="text" aria-label="Mês anterior" @click="prevMonth">
          <v-icon size="32">
            mdi-chevron-left
          </v-icon>
        </v-btn>
        <span class="month-title mx-3 text-success text-h5 font-weight-bold">{{ meses[currentMonth] }}</span>
        <v-btn icon variant="text" aria-label="Próximo mês" @click="nextMonth">
          <v-icon size="32">
            mdi-chevron-right
          </v-icon>
        </v-btn>
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-skeleton-loader v-if="loading" type="list-item-avatar, list-item-avatar, list-item-avatar" />
        <v-alert v-else-if="!aniversariantesDoMes.length" type="info" class="mt-6" border="start" color="primary">
          Nenhum aniversariante neste mês.
        </v-alert>
        <v-slide-group v-else show-arrows>
          <v-slide-group-item v-for="a in aniversariantesDoMes" :key="a.id">
            <v-card class="mx-2 my-4" elevation="8" color="yellow-lighten-5">
              <v-card-text class="d-flex flex-column align-center justify-center py-6">
                <v-avatar size="64" class="mb-2" color="yellow-accent-3">
                  <v-icon size="40" :icon="getSexoIcon(a.sexo)" color="black" />
                </v-avatar>
                <div class="text-h6 font-weight-bold text-success mb-1">
                  {{ getPrimeiroNome(a.nome) }}
                </div>
                <div class="text-subtitle-2 text-grey-darken-1 mb-1 d-flex align-center justify-center">
                  <v-icon size="18" class="mr-1">
                    mdi-cake-variant
                  </v-icon>
                  {{ getDiaNascimento(a.nascimento as string) }} de {{ meses[getMesNascimento(a.nascimento as string)] }}
                </div>
              </v-card-text>
            </v-card>
          </v-slide-group-item>
        </v-slide-group>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
/* Removido todo CSS customizado, apenas utilitários Vuetify */
</style>
