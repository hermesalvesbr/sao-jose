<script setup lang="ts">
/**
 * Campo de moeda brasileira — formata como R$ XX,XX ao sair do campo.
 * Enquanto focado, aceita digitação natural (ex: "20" ou "20,50").
 */
import { formatCurrency, parseCurrencyInput } from '~/composables/usePdvReport'

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

function toNumeric(val: string | number | undefined): number {
  if (val === undefined || val === null || val === '')
    return 0
  return parseCurrencyInput(val)
}

const isFocused = ref(false)
const displayValue = ref(formatCurrency(toNumeric(props.modelValue)))

watch(() => props.modelValue, (newVal) => {
  if (!isFocused.value) {
    displayValue.value = formatCurrency(toNumeric(newVal))
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
  emit('update:modelValue', parseCurrencyInput(raw))
}

function handleBlur(event: FocusEvent) {
  isFocused.value = false
  const num = toNumeric(props.modelValue)
  displayValue.value = formatCurrency(num)
  emit('blur', event)
}

const currencyRules = computed(() => {
  const rules = (props.rules || []).map(rule => typeof rule === 'function'
    ? (value: string | number) => rule(toNumeric(value as string | number | undefined))
    : rule)

  if (props.maxValue !== undefined) {
    rules.push((value: string | number) => {
      const numValue = toNumeric(value as string | number | undefined)
      return numValue <= props.maxValue! || `Valor não pode ser maior que ${formatCurrency(props.maxValue!)}`
    })
  }

  if (props.minValue !== undefined) {
    rules.push((value: string | number) => {
      const numValue = toNumeric(value as string | number | undefined)
      return numValue >= props.minValue! || `Valor não pode ser menor que ${formatCurrency(props.minValue!)}`
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
