<script setup lang="ts">
import type { Agenda } from '@/types/schema'
import { readItems } from '@directus/sdk'
import { DateTime } from 'luxon'

const period = ref<'hoje' | 'semana' | 'mes'>('hoje')
const events = ref<Agenda[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Novo: controla painel aberto na semana
const openedWeekPanel = ref<number[]>([])

const weekDays = [
  'domingo',
  'segunda',
  'terça',
  'quarta',
  'quinta',
  'sexta',
  'sábado',
]

/** Busca eventos da agenda no Directus */
async function fetchAgenda() {
  loading.value = true
  error.value = null
  try {
    const client = await useDirectusClient()
    const result = await client.request(readItems('agenda', {
      limit: -1,
      sort: ['-data_evento'],
    }))
    events.value = Array.isArray(result) ? result as Agenda[] : []
  }
  catch {
    error.value = 'Erro ao buscar agenda.'
  }
  finally {
    loading.value = false
  }
}

onMounted(fetchAgenda)

// Watcher para abrir painel do dia atual ao mudar para 'semana'
watch(period, (val) => {
  if (val === 'semana') {
    // Luxon: domingo=7, nosso array começa em 0 (domingo)
    const today = DateTime.now().weekday % 7 // domingo=0, segunda=1, ..., sábado=6
    openedWeekPanel.value = [today]
  }
})

/** Filtra eventos conforme o período selecionado */
const filteredEvents = computed(() => {
  const now = DateTime.now()
  if (period.value === 'hoje') {
    return events.value.filter((ev) => {
      if (ev.recorrente) {
        // Luxon: 1=segunda, ..., 7=domingo (igual ao banco)
        return ev.dia === now.weekday
      }
      else if (ev.data_evento) {
        const eventDate = DateTime.fromISO(ev.data_evento as string)
        return eventDate.hasSame(now, 'day')
      }
      return false
    })
  }
  // Para semana e mês, retorna todos (serão agrupados depois)
  return events.value
})

/** Agrupa eventos da semana por dia (domingo a sábado) */
const weekEvents = computed(() => {
  // Array de 7 arrays, um para cada dia da semana
  const grouped: Agenda[][] = Array.from({ length: 7 }, () => [])
  const startOfWeek = DateTime.now().startOf('week') // domingo
  for (let i = 0; i < 7; i++) {
    const dayDate = startOfWeek.plus({ days: i })
    grouped[i] = events.value.filter((ev) => {
      if (ev.recorrente) {
        // Corrige: domingo (i=0) corresponde a ev.dia=7, demais ev.dia=i
        const weekdayForEvent = i === 0 ? 7 : i
        return ev.dia === weekdayForEvent
      }
      else if (ev.data_evento) {
        const eventDate = DateTime.fromISO(ev.data_evento as string)
        return eventDate.hasSame(dayDate, 'day')
      }
      return false
    })
  }
  return grouped
})

/** Retorna subtítulo do evento */
function getSubtitle(ev: Agenda) {
  if (ev.recorrente) {
    // Pluralização e naturalidade em português
    const diasSemana = [
      '', // 0 não usado
      'segunda-feira',
      'terça-feira',
      'quarta-feira',
      'quinta-feira',
      'sexta-feira',
      'sábado',
      'domingo',
    ]
    const dia = Number(ev.dia)
    if (dia >= 1 && dia <= 7) {
      if (dia === 7 || dia === 6) {
        // sábado/domingo: plural
        return `Todos os ${diasSemana[dia]}s às ${formatTime(ev.horario)}`
      }
      else {
        // segunda a sexta: singular
        return `Toda ${diasSemana[dia]} às ${formatTime(ev.horario)}`
      }
    }
    // Se não houver dia válido, apenas 'Todos os dias'
    return `Todos os dias às ${formatTime(ev.horario)}`
  }
  else if (ev.data_evento) {
    return `${formatDate(ev.data_evento)} às ${formatTime(ev.horario)}`
  }
  return ''
}

function formatDate(date: any) {
  if (!date)
    return ''
  return DateTime.fromISO(typeof date === 'string' ? date : String(date)).toFormat('dd/MM/yyyy')
}

function formatTime(time: any) {
  if (!time)
    return ''
  return DateTime.fromISO(typeof time === 'string' ? time : String(time)).toFormat('HH:mm')
}
</script>

<template>
  <div class="pa-4">
    <!-- Convite para cadastro -->
    <v-alert type="success" class="mb-4 text-center" border="start" color="yellow-lighten-4" elevation="1">
      <span class="font-weight-bold">Seja da família São José 💛</span>
      <NuxtLink to="/cadastrar" class="ms-2 text-primary text-decoration-underline font-weight-bold">
        Cadastre-se!
      </NuxtLink>
    </v-alert>
    <v-card id="agenda-card" class="mb-6 pa-4" color="#FFF8E1" elevation="2">
      <div class="d-flex align-center justify-space-between">
        <div class="text-h5 font-weight-bold" style="color: #FFD600">
          Agenda
        </div>
        <v-btn icon variant="text" color="yellow-darken-2">
          <v-icon size="32">
            mdi-calendar-month
          </v-icon>
        </v-btn>
      </div>
      <v-divider class="my-2" color="#A1887F" />
      <v-btn-toggle v-model="period" class="mt-2 pa-2 my-2" color="yellow-darken-2" mandatory>
        <v-btn value="hoje">
          Hoje
        </v-btn>
        <v-btn value="semana">
          Semana
        </v-btn>
        <v-btn value="mes">
          Mês
        </v-btn>
      </v-btn-toggle>
    </v-card>

    <v-progress-linear v-if="loading" indeterminate color="yellow-darken-2" class="mb-4" />
    <v-alert v-if="error" type="error" class="mb-4">
      {{ error }}
    </v-alert>

    <!-- Visualização HOJE -->
    <template v-if="period === 'hoje'">
      <v-row>
        <v-col v-for="ev in filteredEvents" :key="ev.id" cols="12">
          <v-card class="mb-3" color="#EFEBE9" elevation="1" style="border-bottom: 4px solid #A1887F">
            <v-card-title class="d-flex align-center">
              <v-icon size="36" color="yellow-darken-2" class="me-3">
                mdi-cross
              </v-icon>
              <span class="text-h6 font-weight-bold">{{ ev.titulo }}</span>
            </v-card-title>
            <v-card-subtitle class="text-body-2 mb-1">
              {{ getSubtitle(ev) }}
            </v-card-subtitle>
            <v-card-text v-if="ev.descricao" class="text-body-1">
              {{ ev.descricao }}
            </v-card-text>
          </v-card>
        </v-col>
        <v-col v-if="!loading && filteredEvents.length === 0" cols="12">
          <v-alert type="info">
            Nenhum evento encontrado para o período selecionado.
          </v-alert>
        </v-col>
      </v-row>
    </template>

    <!-- Visualização SEMANA -->
    <template v-else-if="period === 'semana'">
      <v-expansion-panels v-model="openedWeekPanel" multiple>
        <v-expansion-panel v-for="(dayEvents, i) in weekEvents" :key="i">
          <v-expansion-panel-title>
            <span class="text-subtitle-1 font-weight-bold" style="color: #FFD600">
              {{ (weekDays[i] ? weekDays[i].charAt(0).toUpperCase() + weekDays[i].slice(1) : '') }}
            </span>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-row>
              <v-col v-for="ev in dayEvents" :key="ev.id" cols="12">
                <v-card class="mb-3" color="#EFEBE9" elevation="1" style="border-bottom: 4px solid #A1887F">
                  <v-card-title class="d-flex align-center">
                    <v-icon size="36" color="yellow-darken-2" class="me-3">
                      mdi-cross
                    </v-icon>
                    <span class="text-h6 font-weight-bold">{{ ev.titulo }}</span>
                  </v-card-title>
                  <v-card-subtitle class="text-body-2 mb-1">
                    {{ getSubtitle(ev) }}
                  </v-card-subtitle>
                  <v-card-text v-if="ev.descricao" class="text-body-1">
                    {{ ev.descricao }}
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col v-if="!loading && dayEvents.length === 0" cols="12">
                <v-alert type="info">
                  Nenhum evento para este dia.
                </v-alert>
              </v-col>
            </v-row>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </template>

    <!-- Visualização MÊS (placeholder) -->
    <template v-else>
      <v-alert type="info">
        Em breve: visão mensal.
      </v-alert>
    </template>
  </div>
</template>

<style scoped>
.v-card-title {
  color: #ffd600;
}
</style>
