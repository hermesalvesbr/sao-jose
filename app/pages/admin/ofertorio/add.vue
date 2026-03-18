<script setup lang="ts">
import type { ValorDetalhado } from '~/types/ofertorio'
import type { Agenda, OfertaFinanceira } from '~/types/schema'
import { createItem, readItems } from '@directus/sdk'
import { brToIsoDate, isoToBrDate, toLocalISO } from '~/composables/usePdvReport'

definePageMeta({
  layout: 'admin',
})

const { user } = useAuth()
const { fetchOfertas } = useOfertas()

const eventos = ref<Pick<Agenda, 'id' | 'titulo' | 'recorrente' | 'dia' | 'data_evento' | 'tipo_especial' | 'data_limite'>[]>([])
const salvando = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')

onMounted(async () => {
  const directus = await useDirectusClient()
  try {
    eventos.value = await directus.request(readItems('agenda', {
      fields: ['id', 'titulo', 'recorrente', 'dia', 'data_evento', 'tipo_especial', 'data_limite'],
      limit: -1,
    })) as typeof eventos.value
  }
  catch (err) {
    console.error('Erro ao carregar agenda:', err)
  }
})

// Referência ao componente calculadora
const calculadoraRef = ref<{ limparDadosArmazenados: () => void } | null>(null)

// Detalhes da calculadora (cédulas/moedas)
const detalhesOferta = ref<ValorDetalhado[] | null>(null)

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear()
    && d1.getMonth() === d2.getMonth()
    && d1.getDate() === d2.getDate()
}

function parseISOLocal(isoStr: string): Date {
  if (!isoStr)
    return new Date()
  if (isoStr.length >= 10) {
    const [y, m, d] = isoStr.substring(0, 10).split('-')
    return new Date(Number.parseInt(y!, 10), Number.parseInt(m!, 10) - 1, Number.parseInt(d!, 10))
  }
  return new Date(isoStr)
}

// Encontra o evento padrão: "Novena 2026" se existir, senão evento de hoje
const eventoDefault = computed<string | null>(() => {
  if (!eventos.value || eventos.value.length === 0)
    return null

  // Prioridade 1: Busca "Novena 2026"
  const novena = eventos.value.find(ev =>
    typeof ev.titulo === 'string' && ev.titulo.toLowerCase().includes('novena 2026'),
  )
  if (novena)
    return novena.id

  // Prioridade 2: Evento de hoje
  const today = new Date()
  const jsWeekday = today.getDay()

  const eventoHoje = eventos.value.find((ev) => {
    if (ev.data_limite) {
      const limite = parseISOLocal(ev.data_limite as string)
      if (limite < today && !isSameDay(limite, today))
        return false
    }
    if (!ev.recorrente && ev.data_evento)
      return isSameDay(parseISOLocal(ev.data_evento as string), today)

    const evDia = Number(ev.dia)
    const jsEvDia = evDia === 7 ? 0 : evDia
    if (ev.recorrente && jsEvDia === jsWeekday)
      return true

    if (ev.tipo_especial === 'primeiro_domingo' && jsWeekday === 0) {
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const offset = (7 - firstOfMonth.getDay()) % 7
      const firstSunday = new Date(today.getFullYear(), today.getMonth(), 1 + offset)
      return isSameDay(today, firstSunday)
    }
    return false
  })

  return eventoHoje ? eventoHoje.id : null
})

const oferta = ref<Partial<OfertaFinanceira>>({
  meio: 'Dinheiro',
})

const mostrarObservacao = ref(false)
const dataEntradaString = ref(isoToBrDate(toLocalISO(new Date())))

// Seta evento padrão quando carregado
watch(eventoDefault, (id) => {
  if (id && !oferta.value.evento)
    oferta.value.evento = id as any
}, { immediate: true })

const meiosDePagamento = ['Dinheiro', 'Pix', 'Cartão de Crédito', 'Cartão de Débito']

// Quando calculadora emite valor, atualiza a oferta
function atualizarValorOferta(valor: number): void {
  oferta.value.valor = valor
}

async function registrarOferta(): Promise<void> {
  if (!oferta.value.valor || !dataEntradaString.value) {
    snackbarMsg.value = 'Preencha o valor e a data da entrada.'
    snackbarColor.value = 'warning'
    snackbar.value = true
    return
  }

  salvando.value = true
  try {
    const directus = await useDirectusClient()
    const ofertaData = {
      ...oferta.value,
      data_entrada: new Date(`${brToIsoDate(dataEntradaString.value)}T12:00:00`).toISOString(),
      valor: Number(oferta.value.valor),
      valores_detalhados: detalhesOferta.value,
      user_created: user.value?.id,
    }
    await directus.request(createItem('oferta_financeira', ofertaData as any))

    if (calculadoraRef.value)
      calculadoraRef.value.limparDadosArmazenados()

    await fetchOfertas()
    await navigateTo('/admin/ofertorio')
  }
  catch (error) {
    console.error('Erro ao registrar ofertório:', error)
    snackbarMsg.value = 'Ocorreu um erro ao registrar o ofertório.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
  finally {
    salvando.value = false
  }
}
</script>

<template>
  <v-container fluid class="pa-2 pa-md-6">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between mb-4 mb-sm-6">
      <div>
        <div class="d-flex align-center mb-2">
          <v-btn
            variant="text"
            icon="mdi-arrow-left"
            class="me-2"
            to="/admin/ofertorio"
          />
          <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1">
            Nova Oferta
          </h1>
        </div>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0 ms-11">
          Registre o ofertório com detalhamento de cédulas e moedas
        </p>
      </div>
    </div>

    <v-row>
      <!-- Coluna Esquerda: Dados da Oferta -->
      <v-col cols="12" md="5" lg="4">
        <v-card elevation="2" rounded="lg">
          <v-card-title class="d-flex align-center pa-4">
            <v-icon color="primary" class="me-2">
              mdi-cash-plus
            </v-icon>
            <span class="text-h6">Dados da Oferta</span>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-4">
            <v-form @submit.prevent="registrarOferta">
              <v-row>
                <v-col cols="12">
                  <MaskedCurrencyField
                    v-model="oferta.valor"
                    label="Valor Total"
                    required
                    autofocus
                  />
                </v-col>
                <v-col cols="12">
                  <v-select
                    v-model="oferta.meio"
                    :items="meiosDePagamento"
                    label="Meio de Pagamento"
                    required
                  />
                </v-col>
                <v-col cols="12">
                  <MaskedDateField
                    v-model="dataEntradaString"
                    label="Data da Entrada"
                    required
                  />
                </v-col>
                <v-col cols="12">
                  <v-select
                    v-model="oferta.evento"
                    :items="eventos"
                    item-title="titulo"
                    item-value="id"
                    label="Encontro / Missa"
                    clearable
                  />
                </v-col>
                <v-col cols="12">
                  <v-checkbox
                    v-model="mostrarObservacao"
                    label="Escrever observação"
                    hide-details
                    density="compact"
                  />
                </v-col>
                <v-col v-if="mostrarObservacao" cols="12">
                  <v-textarea
                    v-model="oferta.observacao"
                    label="Observação (Opcional)"
                    rows="3"
                  />
                </v-col>
              </v-row>
              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                class="mt-4"
                prepend-icon="mdi-content-save"
                :loading="salvando"
                :disabled="salvando"
              >
                Registrar Oferta
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Coluna Direita: Calculadora inline -->
      <v-col cols="12" md="7" lg="8">
        <CalculadoraOfertorio
          ref="calculadoraRef"
          titulo="Conta Dinheiro"
          :mostrar-botao-salvar="true"
          @update:valor="atualizarValorOferta"
          @update:detalhes="detalhesOferta = $event"
        />
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="4000" location="top">
      {{ snackbarMsg }}
    </v-snackbar>
  </v-container>
</template>
