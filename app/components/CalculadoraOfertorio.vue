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
  (e: 'update:detalhes', detalhes: any[]): void
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
  resetar()
}

function carregarDados(detalhes: Array<{ valor: number, tipo: string, quantidade: number }>) {
  denominacoes.value.forEach((item) => {
    item.quantidade = 0
  })
  detalhes.forEach((detalhe) => {
    const item = denominacoes.value.find(d => d.valor === detalhe.valor && d.tipo === detalhe.tipo)
    if (item)
      item.quantidade = detalhe.quantidade
  })
}

defineExpose({
  limparDadosArmazenados,
  carregarDados,
})

function salvarValor() {
  emit('update:valor', valorTotal.value)
  const detalhesLimpos = denominacoes.value
    .filter(d => d.quantidade > 0)
    .map(d => ({
      valor: d.valor,
      tipo: d.tipo,
      label: d.label,
      quantidade: d.quantidade,
    }))
  emit('update:detalhes', detalhesLimpos)
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
  <v-card elevation="2" rounded="lg" class="calculadora-ofertorio">
    <!-- Botão X para fechar (só quando em modal) -->
    <v-btn
      v-if="modelValue !== undefined"
      icon
      variant="elevated"
      color="error"
      size="x-small"
      class="close-button"
      @click="fecharModal"
    >
      <v-icon>mdi-close</v-icon>
    </v-btn>

    <v-card-title class="d-flex align-center justify-space-between pa-4" :class="{ 'pr-12': modelValue !== undefined }">
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
            <v-list lines="one" density="compact">
              <template v-for="(moeda, idx) in denominacoes.filter(d => d.tipo === 'moeda')" :key="moeda.valor">
                <v-divider v-if="idx > 0" />
                <v-list-item>
                  <template #prepend>
                    <v-avatar :color="moeda.corPrimaria || 'grey'" size="28" class="me-3" />
                  </template>
                  <v-list-item-title class="text-body-2">
                    {{ moeda.label }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    {{ formatCurrency(moeda.valor * moeda.quantidade) }}
                  </v-list-item-subtitle>
                  <template #append>
                    <div class="d-flex align-center ga-1">
                      <v-btn
                        icon="mdi-minus"
                        size="x-small"
                        variant="tonal"
                        :disabled="moeda.quantidade <= 0"
                        @click="moeda.quantidade = Math.max(0, moeda.quantidade - 1)"
                      />
                      <span class="text-body-1 font-weight-bold text-center px-2">{{ moeda.quantidade }}</span>
                      <v-btn
                        icon="mdi-plus"
                        size="x-small"
                        variant="tonal"
                        color="primary"
                        @click="moeda.quantidade++"
                      />
                    </div>
                  </template>
                </v-list-item>
              </template>
            </v-list>
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
            <v-list lines="one" density="compact">
              <template v-for="(cedula, idx) in denominacoes.filter(d => d.tipo === 'cedula')" :key="cedula.valor">
                <v-divider v-if="idx > 0" />
                <v-list-item>
                  <template #prepend>
                    <v-chip
                      :color="cedula.corPrimaria || 'grey'"
                      size="small"
                      label
                      class="font-weight-bold me-3"
                    >
                      R${{ cedula.valor }}
                    </v-chip>
                  </template>
                  <v-list-item-title class="text-body-2">
                    {{ cedula.valor === 1 ? 'real' : 'reais' }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    {{ formatCurrency(cedula.valor * cedula.quantidade) }}
                  </v-list-item-subtitle>
                  <template #append>
                    <div class="d-flex align-center ga-1">
                      <v-btn
                        icon="mdi-minus"
                        size="x-small"
                        variant="tonal"
                        :disabled="cedula.quantidade <= 0"
                        @click="cedula.quantidade = Math.max(0, cedula.quantidade - 1)"
                      />
                      <span class="text-body-1 font-weight-bold text-center px-2">{{ cedula.quantidade }}</span>
                      <v-btn
                        icon="mdi-plus"
                        size="x-small"
                        variant="tonal"
                        color="primary"
                        @click="cedula.quantidade++"
                      />
                    </div>
                  </template>
                </v-list-item>
              </template>
            </v-list>
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
.calculadora-ofertorio {
  position: relative;
  overflow: visible !important;
  max-height: 90vh;
}

.close-button {
  position: absolute;
  top: -20px;
  right: -20px;
  z-index: 999;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
