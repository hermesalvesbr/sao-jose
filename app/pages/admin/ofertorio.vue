<script setup lang="ts">
import type { OfertaFinanceira } from '~/types/schema'
import { createItem, readItems } from '@directus/sdk'
import { computed, ref, watch } from 'vue'

definePageMeta({
  layout: 'admin',
})

const directus = await useDirectusClient()
const { data: eventos } = useAsyncData('agenda', () => {
  return directus.request(readItems('agenda', {
    fields: ['id', 'titulo', 'recorrente', 'dia', 'data_evento'],
    limit: -1,
  }))
})

// Computed para encontrar evento de hoje
const eventoHoje = computed(() => {
  if (!eventos.value || eventos.value.length === 0)
    return null

  const hoje = new Date()
  const diaSemana = hoje.getDay() // 0=domingo, 1=segunda, ..., 6=sábado

  // Procura evento recorrente do dia
  const evento = eventos.value.find(
    (ev: any) => ev.recorrente && ev.dia === diaSemana,
  )

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
    }
    // bypass generated type mismatch
    await directus.request(createItem('oferta_financeira', ofertaData as any))
    // eslint-disable-next-line no-alert
    alert('Ofertório registrado com sucesso!')
    // Reset form
    oferta.value = {
      meio: 'Dinheiro',
      valor: undefined,
      evento: eventoHoje.value || undefined,
      observacao: undefined,
    }
    mostrarObservacao.value = false
    dataEntradaString.value = new Date().toISOString().split('T')[0]
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
        <v-card>
          <v-card-text>
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
                  <MaskedCurrencyField
                    v-model="oferta.valor"
                    label="Valor"
                    prepend-inner-icon="mdi-currency-brl"
                    required
                    autofocus
                  />
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
                block
                class="mt-4"
              >
                Registrar
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
