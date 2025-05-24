<script setup lang="ts">
const _props = defineProps({
  modelValue: String,
  label: String,
  rules: Array as () => readonly any[],
  mask: {
    type: [String, Array],
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
  <v-text-field
    v-maska="mask"
    v-bind="$attrs"
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
