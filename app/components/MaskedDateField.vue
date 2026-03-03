<script setup lang="ts">
import { VMaskInput } from 'vuetify/labs/VMaskInput'

/**
 * Campo de data com máscara DD/MM/AAAA
 * Abre teclado numérico em mobile
 * Props compatíveis com MaskedTextField
 */
const _props = defineProps({
  modelValue: String,
  label: String,
  rules: Array as () => readonly any[],
  mask: {
    type: [String, Object] as any,
    default: '##/##/####',
  },
  prependInnerIcon: String,
  maxlength: {
    type: Number,
    default: 10,
  },
  required: Boolean,
  disabled: Boolean,
  loading: Boolean,
  autocomplete: String,
  color: String,
  placeholder: {
    type: String,
    default: 'DD/MM/AAAA',
  },
  customClass: String,
})

defineEmits(['update:modelValue', 'blur'])
</script>

<template>
  <VMaskInput
    v-bind="$attrs"
    :mask="mask"
    :label="label"
    :rules="rules"
    :model-value="modelValue"
    :prepend-inner-icon="prependInnerIcon"
    type="tel"
    :maxlength="maxlength"
    :required="required"
    :disabled="disabled"
    :loading="loading"
    :autocomplete="autocomplete"
    :color="color"
    :placeholder="placeholder"
    :class="customClass"
    inputmode="numeric"
    @update:model-value="$emit('update:modelValue', $event)"
    @blur="$emit('blur', $event)"
  />
</template>
