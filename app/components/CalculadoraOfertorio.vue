<script setup lang="ts">
import { computed, ref } from 'vue'

interface DenominacaoItem {
  valor: number
  tipo: 'moeda' | 'cedula'
  label: string
  quantidade: number
  corPrimaria?: string
  corSecundaria?: string
}

/**
 * Props para configuração do componente
 */
defineProps({
  titulo: {
    type: String,
    default: 'Calculadora de Dinheiro',
  },
  mostrarBotaoSalvar: {
    type: Boolean,
    default: true,
  },
})

/**
 * Emite o evento com o valor total
 */
const emit = defineEmits<{
  (e: 'update:valor', valor: number): void
  (e: 'reset'): void
}>()

// Denominações brasileiras (moedas e cédulas)
const denominacoes = ref<DenominacaoItem[]>([
  // Moedas
  { valor: 0.05, tipo: 'moeda', label: '5 centavos', quantidade: 0, corPrimaria: 'amber', corSecundaria: 'brown-lighten-1' },
  { valor: 0.10, tipo: 'moeda', label: '10 centavos', quantidade: 0, corPrimaria: 'amber', corSecundaria: 'brown-lighten-1' },
  { valor: 0.25, tipo: 'moeda', label: '25 centavos', quantidade: 0, corPrimaria: 'amber', corSecundaria: 'grey' },
  { valor: 0.50, tipo: 'moeda', label: '50 centavos', quantidade: 0, corPrimaria: 'amber', corSecundaria: 'grey-darken-3' },
  { valor: 1, tipo: 'moeda', label: '1 real', quantidade: 0, corPrimaria: 'amber-lighten-3', corSecundaria: 'grey-darken-3' },

  // Cédulas
  { valor: 2, tipo: 'cedula', label: '2 reais', quantidade: 0, corPrimaria: 'blue' },
  { valor: 5, tipo: 'cedula', label: '5 reais', quantidade: 0, corPrimaria: 'purple' },
  { valor: 10, tipo: 'cedula', label: '10 reais', quantidade: 0, corPrimaria: 'red' },
  { valor: 20, tipo: 'cedula', label: '20 reais', quantidade: 0, corPrimaria: 'yellow' },
  { valor: 50, tipo: 'cedula', label: '50 reais', quantidade: 0, corPrimaria: 'brown' },
  { valor: 100, tipo: 'cedula', label: '100 reais', quantidade: 0, corPrimaria: 'blue-lighten-1' },
  { valor: 200, tipo: 'cedula', label: '200 reais', quantidade: 0, corPrimaria: 'orange' },
])

// Valor total calculado
const valorTotal = computed(() => {
  return denominacoes.value.reduce((total, item) => {
    return total + (item.valor * item.quantidade)
  }, 0)
})

// Contagens
const totalMoedas = computed(() => {
  return denominacoes.value
    .filter(item => item.tipo === 'moeda')
    .reduce((total, item) => total + item.quantidade, 0)
})

const totalCedulas = computed(() => {
  return denominacoes.value
    .filter(item => item.tipo === 'cedula')
    .reduce((total, item) => total + item.quantidade, 0)
})

const valorTotalMoedas = computed(() => {
  return denominacoes.value
    .filter(item => item.tipo === 'moeda')
    .reduce((total, item) => total + (item.valor * item.quantidade), 0)
})

const valorTotalCedulas = computed(() => {
  return denominacoes.value
    .filter(item => item.tipo === 'cedula')
    .reduce((total, item) => total + (item.valor * item.quantidade), 0)
})

/**
 * Formata valores monetários para Real Brasileiro (BRL)
 */
function formatCurrency(valor: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)
}

/**
 * Incrementa a quantidade de uma denominação
 */
function incrementar(item: DenominacaoItem) {
  item.quantidade++
}

/**
 * Decrementa a quantidade de uma denominação
 */
function decrementar(item: DenominacaoItem) {
  if (item.quantidade > 0)
    item.quantidade--
}

/**
 * Zera todas as quantidades
 */
function resetar() {
  denominacoes.value.forEach((item) => {
    item.quantidade = 0
  })
}

function salvarValor() {
  emit('update:valor', valorTotal.value)
}
</script>

<template>
  <v-card elevation="2" rounded="lg" class="calculadora-ofertorio">
    <v-card-title class="d-flex align-center justify-space-between pa-4">
      <h2 class="text-h6">
        {{ titulo }}
      </h2>
      <v-btn
        variant="text"
        color="error"
        density="comfortable"
        prepend-icon="mdi-refresh"
        @click="resetar"
      >
        Limpar
      </v-btn>
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-3 pa-sm-4">
      <!-- Resumo no topo -->
      <v-card variant="outlined" color="primary" class="mb-4">
        <v-card-text>
          <div class="d-flex flex-column gap-2">
            <div class="d-flex justify-space-between">
              <span>Total moedas:</span>
              <span class="font-weight-bold">{{ totalMoedas }} un. ({{ formatCurrency(valorTotalMoedas) }})</span>
            </div>
            <div class="d-flex justify-space-between">
              <span>Total cédulas:</span>
              <span class="font-weight-bold">{{ totalCedulas }} un. ({{ formatCurrency(valorTotalCedulas) }})</span>
            </div>
            <v-divider class="my-1" />
            <div class="d-flex justify-space-between">
              <span class="text-h6">TOTAL:</span>
              <span class="text-h6">{{ formatCurrency(valorTotal) }}</span>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Seção de Moedas -->
      <h3 class="text-subtitle-1 font-weight-medium mb-3">
        Moedas
      </h3>
      <v-row>
        <v-col
          v-for="moeda in denominacoes.filter(d => d.tipo === 'moeda')"
          :key="`moeda-${moeda.valor}`"
          cols="12"
          sm="6"
          md="4"
        >
          <v-card variant="outlined" class="pa-2">
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center gap-2">
                <v-avatar
                  :color="moeda.corPrimaria || 'grey'"
                  size="32"
                  class="border"
                >
                  <span class="text-caption font-weight-bold">{{ moeda.valor < 1 ? (moeda.valor * 100) : moeda.valor }}</span>
                </v-avatar>
                <span>{{ moeda.label }}</span>
              </div>
              <div class="d-flex align-center">
                <v-btn
                  icon="mdi-minus"
                  size="small"
                  variant="text"
                  density="comfortable"
                  :disabled="moeda.quantidade <= 0"
                  @click="decrementar(moeda)"
                />
                <span class="mx-2 font-weight-bold">{{ moeda.quantidade }}</span>
                <v-btn
                  icon="mdi-plus"
                  size="small"
                  color="primary"
                  variant="text"
                  density="comfortable"
                  @click="incrementar(moeda)"
                />
              </div>
            </div>
            <div class="text-right text-caption mt-1">
              Total: {{ formatCurrency(moeda.valor * moeda.quantidade) }}
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Seção de Cédulas -->
      <h3 class="text-subtitle-1 font-weight-medium mb-3 mt-4">
        Cédulas
      </h3>
      <v-row>
        <v-col
          v-for="cedula in denominacoes.filter(d => d.tipo === 'cedula')"
          :key="`cedula-${cedula.valor}`"
          cols="12"
          sm="6"
          md="4"
        >
          <v-card variant="outlined" class="pa-2">
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center gap-2">
                <v-chip
                  :color="cedula.corPrimaria || 'grey'"
                  size="small"
                  class="font-weight-bold"
                >
                  {{ formatCurrency(cedula.valor) }}
                </v-chip>
                <span>{{ cedula.label }}</span>
              </div>
              <div class="d-flex align-center">
                <v-btn
                  icon="mdi-minus"
                  size="small"
                  variant="text"
                  density="comfortable"
                  :disabled="cedula.quantidade <= 0"
                  @click="decrementar(cedula)"
                />
                <span class="mx-2 font-weight-bold">{{ cedula.quantidade }}</span>
                <v-btn
                  icon="mdi-plus"
                  size="small"
                  color="primary"
                  variant="text"
                  density="comfortable"
                  @click="incrementar(cedula)"
                />
              </div>
            </div>
            <div class="text-right text-caption mt-1">
              Total: {{ formatCurrency(cedula.valor * cedula.quantidade) }}
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>

    <v-divider />

    <v-card-actions v-if="mostrarBotaoSalvar" class="pa-4 justify-end">
      <v-btn
        color="primary"
        variant="elevated"
        prepend-icon="mdi-content-save"
        :disabled="valorTotal <= 0"
        @click="salvarValor"
      >
        Salvar valor ({{ formatCurrency(valorTotal) }})
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.calculadora-ofertorio .border {
  border: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
