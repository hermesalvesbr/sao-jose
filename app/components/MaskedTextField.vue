<script setup lang="ts">
import { VMaskInput } from 'vuetify/labs/VMaskInput'

const _props = defineProps({
  modelValue: String,
  label: String,
  rules: Array as () => readonly any[],
  mask: {
    type: [String, Object] as any,
    required: true,
  },
  prependInnerIcon: String,
  type: {
    type: String,
    default: 'text',
  },
  maxlength: Number,
  required: Boolean,
  disabled: Boolean,
  loading: Boolean,
  autocomplete: String,
  color: String,
  placeholder: String,
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
    :type="type"
    :maxlength="maxlength"
    :required="required"
    :disabled="disabled"
    :loading="loading"
    :autocomplete="autocomplete"
    :color="color"
    :placeholder="placeholder"
    :class="customClass"
    @update:model-value="$emit('update:modelValue', $event)"
    @blur="$emit('blur', $event)"
  />
</template>
