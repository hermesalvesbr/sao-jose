<script setup lang="ts">
import type { OfertaFinanceira } from '#build/types/schema'

definePageMeta({
  layout: 'admin',
})

const directus = await useDirectusClient()
const { data: eventos } = useAsyncData('agenda', () => {
  return directus.items('agenda').readByQuery({
    fields: ['id', 'titulo'],
    limit: -1,
  })
})

const oferta = ref<Partial<OfertaFinanceira>>({
  data_entrada: new Date().toISOString().split('T')[0],
  meio: 'Dinheiro',
})

const meiosDePagamento = ['Dinheiro', 'Pix', 'Cartão de Crédito', 'Cartão de Débito']

async function registrarOferta() {
  if (!oferta.value.valor || !oferta.value.data_entrada) {
    // eslint-disable-next-line no-alert
    alert('Por favor, preencha o valor e a data da entrada.')
    return
  }

  try {
    await directus.items('oferta_financeira').createOne({
      ...oferta.value,
    })
    // eslint-disable-next-line no-alert
    alert('Ofertório registrado com sucesso!')
    // Reset form
    oferta.value = {
      data_entrada: new Date().toISOString().split('T')[0],
      meio: 'Dinheiro',
      valor: undefined,
      evento: undefined,
      observacao: undefined,
    }
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
          <v-card-title class="text-h5">
            Registro de Ofertório
          </v-card-title>
          <v-card-text>
            <v-form @submit.prevent="registrarOferta">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model.number="oferta.valor"
                    label="Valor"
                    type="number"
                    prefix="R$"
                    required
                    autofocus
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="oferta.data_entrada"
                    label="Data da Entrada"
                    type="date"
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
                  <v-select
                    v-model="oferta.evento"
                    :items="eventos?.data ?? []"
                    item-title="titulo"
                    item-value="id"
                    label="Evento (Opcional)"
                    clearable
                  />
                </v-col>
                <v-col cols="12">
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
