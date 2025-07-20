<script setup lang="ts">
import type { OfertaFinanceira } from '~/types/schema'
import { createItem, readItems } from '@directus/sdk'
import { DateTime } from 'luxon'

definePageMeta({
  layout: 'admin',
})

const { user } = useAuth()
const { fetchOfertas } = useOfertas()
const directus = await useDirectusClient()
const { data: eventos } = useAsyncData('agenda', () => {
  return directus.request(readItems('agenda', {
    fields: ['id', 'titulo', 'recorrente', 'dia', 'data_evento', 'tipo_especial', 'data_limite'],
    limit: -1,
  }))
})

// Controlar exibição do modal da calculadora
const modalCalculadora = ref(false)
// Referência ao componente calculadora
const calculadoraRef = ref<{ limparDadosArmazenados: () => void } | null>(null)

// Computed para encontrar evento de hoje (usando a mesma lógica da página principal)
const eventoHoje = computed(() => {
  if (!eventos.value || eventos.value.length === 0)
    return null

  const today = DateTime.now()
  // Luxon: 1=segunda, 7=domingo (igual ao banco)
  const weekday = today.weekday

  // Procura evento que acontece hoje
  const evento = eventos.value.find((ev: any) => {
    // Verifica se o evento já passou da data final (se tiver)
    if (ev.data_limite && DateTime.fromISO(ev.data_limite) < today) {
      return false
    }

    // Evento único
    if (!ev.recorrente && ev.data_evento) {
      return DateTime.fromISO(ev.data_evento).hasSame(today, 'day')
    }

    // Evento semanal comum
    if (ev.recorrente && ev.dia === weekday) {
      return true
    }

    // Evento especial: primeiro domingo
    if (ev.tipo_especial === 'primeiro_domingo' && weekday === 7) {
      const firstSunday = today.startOf('month').plus({ days: (7 - today.startOf('month').weekday) % 7 })
      return today.hasSame(firstSunday, 'day')
    }

    return false
  })

  return evento ? evento.id : null
})

const oferta = ref<Partial<OfertaFinanceira>>({
  meio: 'Dinheiro',
})

// Controla se o campo de observação deve ser exibido
const mostrarObservacao = ref(false)

// Atualiza o evento quando os dados são carregados
watch(eventoHoje, (novoEventoId) => {
  if (novoEventoId && !oferta.value.evento) {
    oferta.value.evento = novoEventoId
  }
}, { immediate: true })

// separate ref for date input as string to avoid type mismatch
const dataEntradaString = ref(new Date().toISOString().split('T')[0])

const meiosDePagamento = ['Dinheiro', 'Pix', 'Cartão de Crédito', 'Cartão de Débito']

// Função para abrir a calculadora
function abrirCalculadora() {
  modalCalculadora.value = true
}

// Função para atualizar o valor da oferta quando a calculadora emitir o valor
function atualizarValorOferta(valor: number) {
  oferta.value.valor = valor
  modalCalculadora.value = false
}

async function registrarOferta() {
  if (!oferta.value.valor || !dataEntradaString.value) {
    // eslint-disable-next-line no-alert
    alert('Por favor, preencha o valor e a data da entrada.')
    return
  }

  try {
    const ofertaData = {
      ...oferta.value,
      data_entrada: new Date(dataEntradaString.value).toISOString(),
      valor: Number(oferta.value.valor), // Converte para número
      user_created: user.value?.id,
    }
    // bypass generated type mismatch
    await directus.request(createItem('oferta_financeira', ofertaData as any))

    // Limpa os dados armazenados no localStorage após o salvamento bem-sucedido
    if (calculadoraRef.value) {
      calculadoraRef.value.limparDadosArmazenados()
    }

    // Atualiza a lista de ofertas antes de navegar
    await fetchOfertas()

    // Redireciona para a página de listagem após sucesso
    await navigateTo('/admin/ofertorio')
  }
  catch (error) {
    console.error('Erro ao registrar ofertório:', error)
    // eslint-disable-next-line no-alert
    alert('Ocorreu um erro ao registrar o ofertório.')
  }
}
</script>

<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" sm="10" md="8">
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
                <v-col cols="12" md="6">
                  <v-select
                    v-model="oferta.meio"
                    :items="meiosDePagamento"
                    label="Meio de Pagamento"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <div class="d-flex">
                    <MaskedCurrencyField
                      v-model="oferta.valor"
                      label="Valor"
                      required
                      autofocus
                      class="flex-grow-1 me-2"
                    />
                    <v-btn
                      icon="mdi-calculator"
                      color="primary"
                      variant="outlined"
                      title="Abrir conta cédulas e moedas"
                      @click="abrirCalculadora"
                    />
                  </div>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="dataEntradaString"
                    label="Data da Entrada"
                    type="date"
                    required
                  />
                </v-col>
                <v-col cols="12">
                  <v-select
                    v-model="oferta.evento"
                    :items="eventos ?? []"
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
                    class="mt-n7"
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
              >
                Registrar Oferta
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Modal da Calculadora de Ofertório -->
    <v-dialog
      v-model="modalCalculadora"
      max-width="800px"
      scrollable
      content-class="overflow-visible"
      :scrim="true"
      fullscreen-mobile
      class="overflow-visible"
      origin="center center"
    >
      <CalculadoraOfertorio
        ref="calculadoraRef"
        titulo="Conta Dinheiro"
        :model-value="modalCalculadora"
        @update:valor="atualizarValorOferta"
        @reset="modalCalculadora = false"
        @close="modalCalculadora = false"
        @update:model-value="modalCalculadora = $event"
      />
    </v-dialog>
  </v-container>
</template>
