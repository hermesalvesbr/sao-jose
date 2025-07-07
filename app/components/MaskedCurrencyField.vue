<script setup lang="ts">
/**
 * Campo de moeda brasileira com máscara R$ 9.999,99
 * Formata automaticamente para Real brasileiro
 * Props compatíveis com MaskedTextField
 */

interface Props {
  modelValue?: string | number
  label?: string
  rules?: readonly any[]
  prependInnerIcon?: string
  required?: boolean
  disabled?: boolean
  loading?: boolean
  autocomplete?: string
  color?: string
  placeholder?: string
  customClass?: string
  maxValue?: number
  minValue?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'R$ 0,00',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'blur': [event: FocusEvent]
}>()

// Função para formatar o valor como moeda brasileira
function formatCurrency(value: string | number): string {
  if (value === '' || value === null || value === undefined)
    return ''

  // Se é um número, converte para string
  const stringValue = typeof value === 'number' ? (value * 100).toString() : value.toString()

  // Remove todos os caracteres não numéricos
  const numbersOnly = stringValue.replace(/\D/g, '')

  if (!numbersOnly || numbersOnly === '0')
    return 'R$ 0,00'

  // Converte para número e divide por 100 para ter os centavos
  const number = Number.parseInt(numbersOnly) / 100

  // Formata como moeda brasileira
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(number)
}

// Função para converter valor formatado para número
function parseValue(formattedValue: string): number {
  const numbersOnly = formattedValue.replace(/\D/g, '')
  return numbersOnly ? Number.parseInt(numbersOnly) / 100 : 0
}

// Valor interno formatado
const internalValue = ref(formatCurrency(props.modelValue || ''))

// Observa mudanças no modelValue externo
watch(() => props.modelValue, (newValue) => {
  if (newValue !== undefined && newValue !== null) {
    const formatted = formatCurrency(newValue)
    if (formatted !== internalValue.value) {
      internalValue.value = formatted
    }
  }
})

// Validação de valor máximo e mínimo
const currencyRules = computed(() => {
  const rules = [...(props.rules || [])]

  if (props.maxValue !== undefined) {
    rules.push((value: string) => {
      const numValue = parseValue(value)
      return numValue <= props.maxValue! || `Valor não pode ser maior que ${formatCurrency(props.maxValue!)}`
    })
  }

  if (props.minValue !== undefined) {
    rules.push((value: string) => {
      const numValue = parseValue(value)
      return numValue >= props.minValue! || `Valor não pode ser menor que ${formatCurrency(props.minValue!)}`
    })
  }

  return rules
})

// Manipula a entrada do usuário
function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value

  // Formata o valor enquanto digita
  const formatted = formatCurrency(value)
  internalValue.value = formatted

  // Emite o valor numérico para o v-model
  const numericValue = parseValue(formatted)
  emit('update:modelValue', numericValue.toString())

  // Atualiza o campo visualmente
  nextTick(() => {
    target.value = formatted
  })
}

function handleBlur(event: FocusEvent) {
  emit('blur', event)
}
</script>

<template>
  <v-text-field
    v-bind="$attrs"
    :label="label"
    :rules="currencyRules"
    :model-value="internalValue"
    :prepend-inner-icon="prependInnerIcon"
    type="tel"
    :required="required"
    :disabled="disabled"
    :loading="loading"
    :autocomplete="autocomplete"
    :color="color"
    :placeholder="placeholder"
    :class="customClass"
    inputmode="numeric"
    @input="handleInput"
    @blur="handleBlur"
  />
</template>
