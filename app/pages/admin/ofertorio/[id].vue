<script setup lang="ts">
import type { ValorDetalhado } from '~/types/ofertorio'
import type { Agenda, OfertaFinanceira } from '~/types/schema'
import { readItem, readItems, updateItem } from '@directus/sdk'
import { brToIsoDate, isoToBrDate, toLocalISO } from '~/composables/usePdvReport'

definePageMeta({
  layout: 'admin',
})

const route = useRoute()
const id = route.params.id as string

const { fetchOfertas } = useOfertas()

const eventos = ref<Pick<Agenda, 'id' | 'titulo'>[]>([])
const salvando = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref<'success' | 'error' | 'warning'>('success')

const calculadoraRef = ref<{ limparDadosArmazenados: () => void, carregarDados: (d: Array<{ valor: number, tipo: string, quantidade: number }>) => void } | null>(null)
const detalhesOferta = ref<ValorDetalhado[] | null>(null)

const oferta = ref<Partial<OfertaFinanceira>>({ meio: 'Dinheiro' })
const dataEntradaString = ref(isoToBrDate(toLocalISO(new Date())))
const mostrarObservacao = ref(false)

const meiosDePagamento = ['Dinheiro', 'Pix', 'Cartão de Crédito', 'Cartão de Débito']

onMounted(async () => {
  const directus = await useDirectusClient()
  try {
    const [eventosList, item] = await Promise.all([
      directus.request(readItems('agenda', {
        fields: ['id', 'titulo'],
        limit: -1,
      })) as Promise<Pick<Agenda, 'id' | 'titulo'>[]>,
      directus.request(readItem('oferta_financeira', id, {
        fields: ['id', 'valor', 'data_entrada', 'meio', 'observacao', 'valores_detalhados', { evento: ['id'] }] as any,
      })) as unknown as Promise<OfertaFinanceira>,
    ])
    eventos.value = eventosList

    const eventoId = typeof item.evento === 'object' && item.evento !== null
      ? (item.evento as Agenda).id
      : item.evento as string | null

    oferta.value = {
      meio: item.meio,
      valor: item.valor,
      observacao: item.observacao,
      evento: eventoId as any,
    }
    dataEntradaString.value = item.data_entrada
      ? isoToBrDate(String(item.data_entrada).substring(0, 10))
      : isoToBrDate(toLocalISO(new Date()))

    mostrarObservacao.value = !!item.observacao

    if (item.valores_detalhados && Array.isArray(item.valores_detalhados)) {
      detalhesOferta.value = item.valores_detalhados
      await nextTick()
      calculadoraRef.value?.carregarDados(item.valores_detalhados)
    }
  }
  catch (err) {
    console.error('Erro ao carregar oferta:', err)
    snackbarMsg.value = 'Erro ao carregar oferta.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
})

function atualizarValorOferta(valor: number): void {
  oferta.value.valor = valor
}

async function salvarOferta(): Promise<void> {
  if (!dataEntradaString.value) {
    snackbarMsg.value = 'Preencha a data da entrada.'
    snackbarColor.value = 'warning'
    snackbar.value = true
    return
  }

  salvando.value = true
  try {
    const directus = await useDirectusClient()
    await directus.request(updateItem('oferta_financeira', id, {
      valor: Number(oferta.value.valor),
      meio: oferta.value.meio,
      observacao: oferta.value.observacao,
      evento: oferta.value.evento as any,
      data_entrada: new Date(`${brToIsoDate(dataEntradaString.value)}T12:00:00`).toISOString(),
      valores_detalhados: detalhesOferta.value,
    }))
    await fetchOfertas()
    await navigateTo('/admin/ofertorio')
  }
  catch (err) {
    console.error('Erro ao salvar oferta:', err)
    snackbarMsg.value = 'Ocorreu um erro ao salvar o ofertório.'
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
            Editar Oferta
          </h1>
        </div>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0 ms-11">
          Edite os dados e a contagem de cédulas e moedas
        </p>
      </div>
    </div>

    <v-row>
      <!-- Coluna Esquerda: Dados da Oferta -->
      <v-col cols="12" md="5" lg="4">
        <v-card elevation="2" rounded="lg">
          <v-card-title class="d-flex align-center pa-4">
            <v-icon color="primary" class="me-2">
              mdi-cash-edit
            </v-icon>
            <span class="text-h6">Dados da Oferta</span>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-4">
            <v-form @submit.prevent="salvarOferta">
              <v-row>
                <v-col cols="12">
                  <MaskedCurrencyField
                    v-model="oferta.valor"
                    label="Valor Total"
                    required
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
                Salvar Alterações
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
