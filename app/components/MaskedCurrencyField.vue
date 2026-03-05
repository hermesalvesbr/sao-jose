<script setup lang="ts">
/**
 * Campo de moeda brasileira — formata como R$ XX,XX ao sair do campo.
 * Enquanto focado, aceita digitação natural (ex: "20" ou "20,50").
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
  placeholder: 'R$ 0,00',
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'blur': [event: FocusEvent]
}>()

function formatBRL(num: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

// Strips currency formatting and parses as a decimal number.
// "R$ 1.500,50" → 1500.50 | "20" → 20 | "20,50" → 20.50
function parseBRL(raw: string): number {
  const cleaned = raw.replace(/[^\d,]/g, '').replace(',', '.')
  return Number.parseFloat(cleaned) || 0
}

function toNumeric(val: string | number | undefined): number {
  if (val === undefined || val === null || val === '')
    return 0
  return typeof val === 'number' ? val : parseBRL(String(val))
}

const isFocused = ref(false)
const displayValue = ref(formatBRL(toNumeric(props.modelValue)))

watch(() => props.modelValue, (val) => {
  if (!isFocused.value) {
    displayValue.value = formatBRL(toNumeric(val))
  }
})

function handleFocus() {
  isFocused.value = true
  const num = toNumeric(props.modelValue)
  // Show plain decimal so the user can edit naturally
  displayValue.value = num > 0 ? String(num).replace('.', ',') : ''
}

function handleInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value
  displayValue.value = raw
  emit('update:modelValue', parseBRL(raw))
}

function handleBlur(event: FocusEvent) {
  isFocused.value = false
  const num = toNumeric(props.modelValue)
  displayValue.value = formatBRL(num)
  emit('blur', event)
}

const currencyRules = computed(() => {
  const rules = [...(props.rules || [])]

  if (props.maxValue !== undefined) {
    rules.push((value: string) => {
      const numValue = parseBRL(value)
      return numValue <= props.maxValue! || `Valor não pode ser maior que ${formatBRL(props.maxValue!)}`
    })
  }

  if (props.minValue !== undefined) {
    rules.push((value: string) => {
      const numValue = parseBRL(value)
      return numValue >= props.minValue! || `Valor não pode ser menor que ${formatBRL(props.minValue!)}`
    })
  }

  return rules
})
</script>

<template>
  <v-text-field
    v-bind="$attrs"
    :label="label"
    :rules="currencyRules"
    :model-value="displayValue"
    :prepend-inner-icon="prependInnerIcon"
    type="text"
    :required="required"
    :disabled="disabled"
    :loading="loading"
    :autocomplete="autocomplete"
    :color="color"
    :placeholder="placeholder"
    :class="customClass"
    inputmode="decimal"
    @focus="handleFocus"
    @input="handleInput"
    @blur="handleBlur"
  />
</template>
