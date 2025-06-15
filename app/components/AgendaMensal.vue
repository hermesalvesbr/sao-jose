<script setup lang="ts">
import type { Agenda } from '@/types/schema'
import { DateTime } from 'luxon'

const props = defineProps<{
  events: Agenda[]
}>()

// Estado para controlar o mês atual
const currentMonth = ref(DateTime.now())

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

// Gera o calendário do mês
const calendar = computed(() => {
  const firstDay = currentMonth.value.startOf('month')
  const lastDay = currentMonth.value.endOf('month')
  const daysInMonth = lastDay.daysInMonth
  const firstWeekday = firstDay.weekday % 7 // 0 = domingo

  // Array para armazenar os dias do mês
  const days: Array<{
    date: DateTime
    events: Agenda[]
    isToday: boolean
    isCurrentMonth: boolean
  }> = []

  // Adiciona dias do mês anterior para completar a primeira semana
  const prevMonth = currentMonth.value.minus({ months: 1 })
  const daysInPrevMonth = prevMonth.daysInMonth
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const date = DateTime.fromObject({
      year: prevMonth.year,
      month: prevMonth.month,
      day: daysInPrevMonth - i,
    })
    days.push({
      date,
      events: [],
      isToday: date.hasSame(DateTime.now(), 'day'),
      isCurrentMonth: false,
    })
  }

  // Adiciona os dias do mês atual
  for (let day = 1; day <= daysInMonth; day++) {
    const date = DateTime.fromObject({
      year: currentMonth.value.year,
      month: currentMonth.value.month,
      day,
    })
    days.push({
      date,
      events: [],
      isToday: date.hasSame(DateTime.now(), 'day'),
      isCurrentMonth: true,
    })
  }

  // Adiciona dias do próximo mês para completar a última semana
  const nextMonth = currentMonth.value.plus({ months: 1 })
  const remainingDays = 42 - days.length // 6 semanas * 7 dias
  for (let day = 1; day <= remainingDays; day++) {
    const date = DateTime.fromObject({
      year: nextMonth.year,
      month: nextMonth.month,
      day,
    })
    days.push({
      date,
      events: [],
      isToday: date.hasSame(DateTime.now(), 'day'),
      isCurrentMonth: false,
    })
  }

  // Adiciona os eventos aos dias correspondentes
  days.forEach((day) => {
    day.events = props.events.filter((ev) => {
      // Verifica se o evento já passou da data final (se tiver)
      if (ev.data_limite && DateTime.fromISO(ev.data_limite) < day.date) {
        return false
      }

      // Evento único
      if (!ev.recorrente && ev.data_evento) {
        return DateTime.fromISO(ev.data_evento).hasSame(day.date, 'day')
      }

      // Evento semanal comum
      if (ev.recorrente && ev.dia === day.date.weekday) {
        return true
      }

      // Evento especial: primeiro domingo
      if (ev.tipo_especial === 'primeiro_domingo' && day.date.weekday === 7) {
        const firstSunday = day.date.startOf('month').plus({ days: (7 - day.date.startOf('month').weekday) % 7 })
        return day.date.hasSame(firstSunday, 'day')
      }

      return false
    })
  })

  return days
})

// Funções para navegar entre os meses
function previousMonth() {
  currentMonth.value = currentMonth.value.minus({ months: 1 })
}

function nextMonth() {
  currentMonth.value = currentMonth.value.plus({ months: 1 })
}

function goToToday() {
  currentMonth.value = DateTime.now()
}

// Formata o horário do evento
function formatTime(time: string) {
  return DateTime.fromISO(time).toFormat('HH:mm')
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
        {{ monthNames[currentMonth.month - 1] }} {{ currentMonth.year }}
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
          {{ day.date.day }}
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
</style>
