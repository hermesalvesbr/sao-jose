<script setup lang="ts">
/**
 * Escala de Voluntários — PDV Quermesse
 *
 * Grid visual dia × barraca (ponto de produção).
 * Cada célula mostra os voluntários escalados.
 * Clicar abre dialog para editar o campo voluntarios (texto livre).
 * Imprimível via window.print() em A4 landscape.
 *
 * DRY: formatação via usePdvReport; dados via usePdv.
 */
import { formatDate, toLocalISO } from '~/composables/usePdvReport'

definePageMeta({ layout: 'admin' })

const { fetchSchedules, createSchedule, updateSchedule, deleteSchedule, fetchProductionPoints } = usePdv()
const VOLUNTARIOS_SPLIT_RE = /[\n,]/

// ─── Date range ───────────────────────────────────────────────────────────────
const today = toLocalISO(new Date())
const rangeStart = ref(today)
const numDays = ref(9)

/** Gera array de strings YYYY-MM-DD para o período da escala. */
const days = computed<string[]>(() => {
  const result: string[] = []
  const start = new Date(rangeStart.value)
  for (let i = 0; i < numDays.value; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    result.push(toLocalISO(d))
  }
  return result
})

// ─── State ────────────────────────────────────────────────────────────────────
const points = ref<any[]>([])
const schedules = ref<any[]>([])
const loading = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

// Dialog
const dialog = ref(false)
const editingSchedule = ref<any>(null)
const editForm = ref({
  data: '',
  production_point_id: '',
  voluntarios: '',
  observacao: '',
})

// ─── Computed ─────────────────────────────────────────────────────────────────
/** Mapa de data+pointId → registro de escala para lookup O(1). */
const scheduleMap = computed(() => {
  const map = new Map<string, any>()
  for (const s of schedules.value) {
    const pointId = typeof s.production_point_id === 'object'
      ? s.production_point_id?.id
      : s.production_point_id
    map.set(`${s.data}|${pointId}`, s)
  }
  return map
})

function getCell(date: string, pointId: string): any | null {
  return scheduleMap.value.get(`${date}|${pointId}`) ?? null
}

function voluntariosPreview(cell: any | null): string {
  if (!cell?.voluntarios)
    return ''
  const lines = cell.voluntarios.split(VOLUNTARIOS_SPLIT_RE).map((s: string) => s.trim()).filter(Boolean)
  if (lines.length <= 2)
    return lines.join(', ')
  return `${lines[0]}, ${lines[1]}... +${lines.length - 2}`
}

// ─── Load data ────────────────────────────────────────────────────────────────
async function loadData() {
  loading.value = true
  try {
    const [pointsRes, schedulesRes] = await Promise.all([
      fetchProductionPoints({
        filter: { active: { _eq: true } },
        sort: ['name'],
        limit: -1,
      }),
      fetchSchedules({
        fields: [
          'id',
          'data',
          'voluntarios',
          'observacao',
          'production_point_id.id',
          'production_point_id.name',
        ],
        filter: {
          _and: [
            { data: { _gte: rangeStart.value } },
            { data: { _lte: days.value.at(-1) ?? rangeStart.value } },
          ],
        },
        sort: ['data'],
        limit: -1,
      }),
    ])
    points.value = (pointsRes as any[]) || []
    schedules.value = (schedulesRes as any[]) || []
  }
  catch {
    showSnack('Erro ao carregar escala', 'error')
  }
  finally {
    loading.value = false
  }
}

onMounted(loadData)

watch([rangeStart, numDays], loadData)

// ─── Dialog ───────────────────────────────────────────────────────────────────
function openCell(date: string, point: any) {
  const existing = getCell(date, point.id)
  editingSchedule.value = existing
  editForm.value = {
    data: date,
    production_point_id: point.id,
    voluntarios: existing?.voluntarios ?? '',
    observacao: existing?.observacao ?? '',
  }
  dialog.value = true
}

async function saveCell() {
  loading.value = true
  try {
    const payload = {
      data: editForm.value.data,
      production_point_id: editForm.value.production_point_id,
      voluntarios: editForm.value.voluntarios,
      observacao: editForm.value.observacao,
      status: 'published',
    }

    if (editingSchedule.value) {
      await updateSchedule(editingSchedule.value.id, payload as any)
    }
    else {
      await createSchedule(payload as any)
    }
    dialog.value = false
    showSnack('Escala salva com sucesso')
    await loadData()
  }
  catch {
    showSnack('Erro ao salvar escala', 'error')
  }
  finally {
    loading.value = false
  }
}

async function clearCell() {
  if (!editingSchedule.value)
    return
  loading.value = true
  try {
    await deleteSchedule(editingSchedule.value.id)
    dialog.value = false
    showSnack('Escala removida')
    await loadData()
  }
  catch {
    showSnack('Erro ao remover escala', 'error')
  }
  finally {
    loading.value = false
  }
}

function showSnack(text: string, color = 'success') {
  snackbar.value = { show: true, text, color }
}

/** Dia da semana abreviado em pt-BR. */
function weekdayAbbr(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
}

function printPage() {
  window.print()
}
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <!-- ─── Screen header ─────────────────────────────────────────────── -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-5 ga-3 no-print">
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
          Escala de Voluntários
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Voluntários por dia e barraca da novena
        </p>
      </div>
      <v-btn
        variant="tonal"
        color="info"
        prepend-icon="mdi-printer"
        size="large"
        @click="printPage"
      >
        Imprimir / PDF
      </v-btn>
    </div>

    <!-- ─── Controls (screen only) ────────────────────────────────────── -->
    <v-card rounded="xl" :elevation="0" class="border mb-5 no-print">
      <v-card-text>
        <v-row align="center" dense>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="rangeStart"
              label="Data de Início da Novena"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
              prepend-inner-icon="mdi-calendar-start"
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              v-model.number="numDays"
              :items="[7, 9, 10, 14]"
              label="Quantidade de Dias"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="2">
            <p class="text-caption text-medium-emphasis mb-0">
              {{ formatDate(rangeStart) }} a {{ formatDate(days[days.length - 1] ?? rangeStart) }}
            </p>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4 no-print" />

    <!-- ─── Print header ──────────────────────────────────────────────── -->
    <div class="print-header">
      <strong>Paróquia — Novenário de São José</strong>
      <h2 class="print-title">
        ESCALA DE VOLUNTÁRIOS — QUERMESSE
      </h2>
      <p class="print-date">
        PERÍODO: {{ formatDate(rangeStart) }} a {{ formatDate(days[days.length - 1] ?? rangeStart) }}
      </p>
    </div>

    <!-- ─── Grid ──────────────────────────────────────────────────────── -->
    <div class="schedule-wrapper">
      <div class="schedule-scroll">
        <table class="schedule-table">
          <thead>
            <tr>
              <th class="th-point">
                DIA / BARRACA
              </th>
              <th v-for="point in points" :key="point.id" class="th-col">
                {{ point.name }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="points.length === 0">
              <td colspan="99" class="text-center pa-6 text-medium-emphasis">
                Nenhuma barraca ativa cadastrada. Cadastre em
                <router-link to="/admin/pdv/pontos">
                  Pontos de Produção
                </router-link>.
              </td>
            </tr>
            <tr v-for="date in days" :key="date">
              <td class="td-date">
                <div class="date-day">
                  {{ formatDate(date) }}
                </div>
                <div class="date-weekday">
                  {{ weekdayAbbr(date) }}
                </div>
              </td>
              <td
                v-for="point in points"
                :key="point.id"
                class="td-cell"
                :class="{ 'cell-filled': !!getCell(date, point.id) }"
                @click="openCell(date, point)"
              >
                <div v-if="getCell(date, point.id)" class="cell-content">
                  <span class="cell-names">{{ voluntariosPreview(getCell(date, point.id)) }}</span>
                  <v-icon size="12" icon="mdi-pencil" class="cell-edit-icon no-print" />
                </div>
                <div v-else class="cell-empty no-print">
                  <v-icon size="16" icon="mdi-plus" opacity="0.3" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ─── Edit Dialog ───────────────────────────────────────────────── -->
    <v-dialog v-model="dialog" max-width="480" persistent class="no-print">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3 text-h6 font-weight-bold">
          Escala — {{ formatDate(editForm.data) }}
        </v-card-title>
        <v-card-subtitle class="px-5 pb-1">
          {{ points.find(p => p.id === editForm.production_point_id)?.name ?? '' }}
        </v-card-subtitle>
        <v-divider />
        <v-card-text class="pa-5">
          <v-textarea
            v-model="editForm.voluntarios"
            label="Voluntários"
            placeholder="Um nome por linha ou separados por vírgula&#10;Ex: João Silva, Maria Souza"
            variant="outlined"
            density="comfortable"
            rows="5"
            auto-grow
            hint="Liste os voluntários escalados para este dia e barraca"
            persistent-hint
          />
          <v-textarea
            v-model="editForm.observacao"
            label="Observações"
            variant="outlined"
            density="comfortable"
            rows="2"
            class="mt-3"
          />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4 ga-2">
          <v-btn
            v-if="editingSchedule"
            variant="text"
            color="error"
            @click="clearCell"
          >
            Remover
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="loading"
            @click="saveCell"
          >
            Salvar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<style scoped>
.schedule-wrapper {
  background: rgb(var(--v-theme-surface));
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.schedule-scroll {
  overflow-x: auto;
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.schedule-table thead tr {
  background-color: rgba(var(--v-theme-secondary), 0.1);
}

.schedule-table th {
  padding: 12px 8px;
  font-weight: 700;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid rgba(0, 0, 0, 0.1);
  white-space: nowrap;
}

.th-point {
  min-width: 100px;
  text-align: left;
}

.th-col {
  min-width: 140px;
  text-align: center;
}

.td-date {
  padding: 8px 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background-color: rgba(var(--v-theme-surface-variant), 0.5);
  vertical-align: middle;
}

.date-day {
  font-weight: 700;
  font-size: 0.8rem;
}

.date-weekday {
  font-size: 0.65rem;
  text-transform: capitalize;
  color: rgba(0, 0, 0, 0.5);
}

.td-cell {
  padding: 6px 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  min-height: 44px;
  cursor: pointer;
  transition: background-color 0.15s;
  vertical-align: top;
}

.td-cell:hover {
  background-color: rgba(var(--v-theme-primary), 0.06);
}

.cell-filled {
  background-color: rgba(var(--v-theme-success), 0.06);
}

.cell-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 4px;
}

.cell-names {
  font-size: 0.75rem;
  line-height: 1.4;
  word-break: break-word;
}

.cell-edit-icon {
  opacity: 0.4;
  flex-shrink: 0;
  margin-top: 2px;
}

.cell-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
}

.print-header {
  display: none;
}

@media print {
  .no-print {
    display: none !important;
  }

  .print-header {
    display: block !important;
    text-align: center;
    margin-bottom: 12px;
  }

  .print-title {
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    margin: 0 0 4px;
  }

  .print-date {
    font-size: 11px;
    margin: 0 0 12px;
  }

  @page {
    size: A4 landscape;
    margin: 12mm 10mm;
  }

  body {
    font-size: 10px;
  }

  .schedule-wrapper {
    border-radius: 0 !important;
    border: 1px solid #999 !important;
    overflow: visible !important;
  }

  .schedule-scroll {
    overflow: visible !important;
  }

  .schedule-table {
    font-size: 9px;
  }

  .schedule-table th {
    padding: 5px 4px;
    border: 1px solid #999;
    background-color: #d0c9c0 !important;
    font-size: 8px;
  }

  .td-date {
    padding: 4px 6px;
    border: 1px solid #999;
    background-color: #f0ece6 !important;
  }

  .td-cell {
    padding: 4px 5px;
    border: 1px solid #ccc;
    min-height: 28px;
    cursor: default;
  }

  .cell-filled {
    background-color: #f6fff0 !important;
  }

  .cell-names {
    font-size: 8px;
  }

  .cell-empty {
    min-height: 20px;
  }
}
</style>
