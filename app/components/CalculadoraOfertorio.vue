<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'

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
    default: 'Conta Dinheiro',
  },
  mostrarBotaoSalvar: {
    type: Boolean,
    default: true,
  },
  modelValue: {
    type: Boolean,
    default: undefined,
  },
})

/**
 * Emite o evento com o valor total
 */
const emit = defineEmits<{
  (e: 'update:valor', valor: number): void
  (e: 'reset'): void
  (e: 'close'): void
  (e: 'update:modelValue', value: boolean): void
}>()

// Valores iniciais para denominações brasileiras
const denominacoesIniciais: DenominacaoItem[] = [
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
]

// Utilizando localStorage para persistir os dados
const denominacoes = useLocalStorage<DenominacaoItem[]>(
  'calculadora-ofertorio-valores',
  denominacoesIniciais,
  { deep: true }, // Garantir que mudanças em objetos aninhados sejam detectadas
)

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
 * Zera todas as quantidades
 */
function resetar() {
  denominacoes.value.forEach((item) => {
    item.quantidade = 0
  })
}

/**
 * Limpa os dados do localStorage para a calculadora
 * Esta função pode ser chamada externamente após salvamento bem-sucedido
 */
function limparDadosArmazenados() {
  resetar() // Zera todas as quantidades
  // O localStorage ainda mantém a estrutura, mas com quantidades zeradas
}

// Expõe a função para ser usada externamente
defineExpose({
  limparDadosArmazenados,
})

function salvarValor() {
  emit('update:valor', valorTotal.value)
}

/**
 * Fecha o modal emitindo os eventos necessários
 */
function fecharModal() {
  // Emitimos todos os eventos possíveis para garantir compatibilidade com diferentes abordagens
  emit('close')
  emit('reset')

  // Este evento é o padrão para controlar v-model no Vuetify 3
  emit('update:modelValue', false)
}
</script>

<template>
  <v-card elevation="2" rounded="lg" class="calculadora-ofertorio position-relative">
    <!-- Botão X para fechar (posicionado fora do card) -->
    <v-btn
      icon
      variant="elevated"
      color="error"
      size="x-small"
      class="close-button"
      @click="fecharModal"
    >
      <v-icon>mdi-close</v-icon>
    </v-btn>

    <v-card-title class="d-flex align-center justify-space-between pa-4 pr-12">
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

      <!-- Painéis de Expansão para Moedas e Cédulas -->
      <v-expansion-panels class="my-4" variant="popout">
        <!-- Painel de Moedas -->
        <v-expansion-panel>
          <v-expansion-panel-title>
            <div class="d-flex align-center justify-space-between w-100">
              <span class="text-subtitle-1 font-weight-medium">Moedas</span>
              <span class="text-caption">{{ totalMoedas }} unidades ({{ formatCurrency(valorTotalMoedas) }})</span>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
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
                    <div>
                      <v-number-input
                        v-model="moeda.quantidade"
                        control-variant="split"
                        :min="0"
                        density="compact"
                      />
                    </div>
                  </div>
                  <div class="text-right text-caption mt-1">
                    Total: {{ formatCurrency(moeda.valor * moeda.quantidade) }}
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Painel de Cédulas -->
        <v-expansion-panel>
          <v-expansion-panel-title>
            <div class="d-flex align-center justify-space-between w-100">
              <span class="text-subtitle-1 font-weight-medium">Cédulas</span>
              <span class="text-caption">{{ totalCedulas }} unidades ({{ formatCurrency(valorTotalCedulas) }})</span>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
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
                    <div class="d-flex align-center" style="width: 140px">
                      <v-number-input
                        v-model="cedula.quantidade"
                        control-variant="split"
                        :min="0"
                        density="compact"
                      />
                    </div>
                  </div>
                  <div class="text-right text-caption mt-1">
                    Total: {{ formatCurrency(cedula.valor * cedula.quantidade) }}
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
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
/* Estilo para o botão de fechar */
.calculadora-ofertorio {
  position: relative;
  overflow: visible !important;
  max-height: 90vh;
}

.close-button {
  position: absolute;
  top: -20px;
  right: -20px;
  z-index: 999; /* Valor alto para garantir que esteja acima de qualquer outro elemento */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.12); /* Adiciona uma borda sutil */
}
</style>
