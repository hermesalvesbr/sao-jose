<script setup lang="ts">
import type { Agenda } from '@/types/schema'
import type { Catolico } from '~/types/schema'
import { computed, ref } from 'vue'

const props = defineProps<{
  events: Agenda[]
  /** Função que retorna aniversariantes de uma data específica */
  aniversariantesPorDia?: (date: Date) => Catolico[]
}>()

// Estado para controlar o mês atual (usa o dia 1 do mês atual)
const now = new Date()
const currentMonth = ref(new Date(now.getFullYear(), now.getMonth(), 1))

// Nomes dos meses em português
const monthNames = [
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

// Nomes dos dias da semana
const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Funções auxiliares para datas
function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear()
    && d1.getMonth() === d2.getMonth()
    && d1.getDate() === d2.getDate()
}

function parseISOPath(isoStr: string) {
  if (!isoStr)
    return new Date()
  if (isoStr.length === 10) {
    const [y, m, d] = isoStr.split('-')
    return new Date(Number.parseInt(y as string, 10), Number.parseInt(m as string, 10) - 1, Number.parseInt(d as string, 10))
  }
  return new Date(isoStr)
}

// Gera o calendário do mês
const calendar = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const firstWeekday = firstDay.getDay() // 0 = domingo

  const today = new Date()

  // Array para armazenar os dias do mês
  const days: Array<{
    date: Date
    events: Agenda[]
    birthdays: Catolico[]
    isToday: boolean
    isCurrentMonth: boolean
  }> = []

  // Adiciona dias do mês anterior para completar a primeira semana
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i)
    days.push({
      date,
      events: [],
      birthdays: [],
      isToday: isSameDay(date, today),
      isCurrentMonth: false,
    })
  }

  // Adiciona os dias do mês atual
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    days.push({
      date,
      events: [],
      birthdays: [],
      isToday: isSameDay(date, today),
      isCurrentMonth: true,
    })
  }

  // Adiciona dias do próximo mês para completar a última semana
  const remainingDays = 42 - days.length // 6 semanas * 7 dias
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day)
    days.push({
      date,
      events: [],
      birthdays: [],
      isToday: isSameDay(date, today),
      isCurrentMonth: false,
    })
  }

  // Adiciona os eventos aos dias correspondentes
  days.forEach((day) => {
    // Aniversariantes
    if (props.aniversariantesPorDia) {
      day.birthdays = props.aniversariantesPorDia(day.date)
    }

    day.events = props.events.filter((ev) => {
      // Verifica se o evento já passou da data final (se tiver)
      if (ev.data_limite) {
        const limite = parseISOPath(ev.data_limite as string)
        if (limite < day.date && !isSameDay(limite, day.date)) {
          return false
        }
      }

      // Evento único
      if (!ev.recorrente && ev.data_evento) {
        return isSameDay(parseISOPath(ev.data_evento as string), day.date)
      }

      // Evento semanal comum (weekday: 0=domingo, 1=segunda, ... no JS date; na API do Luxon era 1=seg, 7=dom)
      // Ajuste: se a API retornava 1 para segunda e 7 para domingo, o JS Date tem 0 para domingo e 1 para segunda
      const evDia = Number(ev.dia)
      const jsEvDia = evDia === 7 ? 0 : evDia
      if (ev.recorrente && jsEvDia === day.date.getDay()) {
        return true
      }

      // Evento especial: primeiro domingo
      if (ev.tipo_especial === 'primeiro_domingo' && day.date.getDay() === 0) {
        // Encontra o primeiro domingo do mês deste dia
        const firstOfMonth = new Date(day.date.getFullYear(), day.date.getMonth(), 1)
        const offset = (7 - firstOfMonth.getDay()) % 7
        const firstSunday = new Date(day.date.getFullYear(), day.date.getMonth(), 1 + offset)
        return isSameDay(day.date, firstSunday)
      }

      return false
    })
  })

  return days
})

// Funções para navegar entre os meses
function previousMonth() {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1)
}

function goToToday() {
  const d = new Date()
  currentMonth.value = new Date(d.getFullYear(), d.getMonth(), 1)
}

// Formata o horário do evento
function formatTime(time: string) {
  if (!time)
    return ''
  // Assume time is something like "14:30:00" or ISO format
  if (time.includes('T')) {
    const d = new Date(time)
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  return time.substring(0, 5)
}
</script>

<template>
  <div class="agenda-mensal">
    <!-- Cabeçalho do calendário -->
    <div class="d-flex align-center justify-space-between mb-4">
      <v-btn icon @click="previousMonth">
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>
      <div class="text-h6 font-weight-bold">
        {{ monthNames[currentMonth.getMonth()] }} {{ currentMonth.getFullYear() }}
      </div>
      <v-btn icon @click="nextMonth">
        <v-icon>mdi-chevron-right</v-icon>
      </v-btn>
    </div>

    <!-- Botão "Hoje" -->
    <v-btn
      color="yellow-darken-2"
      variant="text"
      class="mb-4"
      @click="goToToday"
    >
      Hoje
    </v-btn>

    <!-- Grade do calendário -->
    <div class="calendar-grid">
      <!-- Cabeçalho dos dias da semana -->
      <div
        v-for="day in weekDays"
        :key="day"
        class="calendar-header text-center font-weight-bold"
      >
        {{ day }}
      </div>

      <!-- Dias do mês -->
      <div
        v-for="(day, index) in calendar"
        :key="index"
        class="calendar-day"
        :class="{
          'other-month': !day.isCurrentMonth,
          'today': day.isToday,
        }"
      >
        <!-- Número do dia -->
        <div class="day-number" :class="{ today: day.isToday }">
          {{ day.date.getDate() }}
          <v-icon
            v-if="day.birthdays.length > 0"
            icon="mdi-cake-variant"
            size="12"
            color="accent"
            class="ms-1 birthday-dot"
          />
        </div>

        <!-- Aniversariantes do dia -->
        <div v-if="day.birthdays.length > 0" class="birthday-list">
          <v-tooltip v-for="b in day.birthdays" :key="b.id" location="top">
            <template #activator="{ props: tooltipProps }">
              <div v-bind="tooltipProps" class="birthday-item">
                🎂 {{ b.nome.split(' ')[0] }}
              </div>
            </template>
            <span>{{ b.nome }}</span>
          </v-tooltip>
        </div>

        <!-- Lista de eventos -->
        <div class="events-list">
          <div
            v-for="event in day.events"
            :key="event.id"
            class="event-item"
          >
            <div class="event-time">
              {{ formatTime(event.horario) }}
            </div>
            <div class="event-title">
              {{ event.titulo }}
            </div>
            <div class="event-description">
              {{ event.descricao }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.agenda-mensal {
  background: #fff8e1;
  border-radius: 8px;
  padding: 16px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.calendar-header {
  padding: 8px;
  color: #ffd600;
  border-bottom: 2px solid #a1887f;
}

.calendar-day {
  min-height: 120px;
  padding: 8px;
  background: #efebe9;
  border-radius: 4px;
  border: 1px solid #a1887f;
}

.other-month {
  opacity: 0.5;
}

.today {
  background: #fff8e1;
  border: 2px solid #ffd600;
  box-shadow: 0 0 8px rgba(255, 214, 0, 0.3);
  position: relative;
}

.today::before {
  content: 'Hoje';
  position: absolute;
  top: 4px;
  right: 4px;
  background: #ffd600;
  color: #5d4037;
  font-size: 0.7em;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}

.day-number {
  font-weight: bold;
  margin-bottom: 4px;
  color: #a1887f;
}

.day-number.today {
  color: #ffd600;
  font-size: 1.2em;
  font-weight: 800;
}

.events-list {
  font-size: 0.9em;
}

.event-item {
  margin-bottom: 4px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  border-left: 3px solid #ffd600;
}

.event-time {
  font-size: 0.8em;
  color: #a1887f;
}

.event-title {
  font-weight: 500;
  color: #5d4037;
}

.event-description {
  font-size: 0.8em;
  color: #8d6e63;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.birthday-dot {
  vertical-align: middle;
}

.birthday-list {
  font-size: 0.8em;
  margin-bottom: 4px;
}

.birthday-item {
  padding: 2px 4px;
  background: rgba(255, 112, 67, 0.12);
  border-radius: 4px;
  border-left: 3px solid #ff7043;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #5d4037;
  font-size: 0.9em;
  cursor: default;
}
</style>
