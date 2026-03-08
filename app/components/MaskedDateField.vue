<script setup lang="ts">
import { VMaskInput } from 'vuetify/labs/VMaskInput'
import { brToIsoDate, isoToBrDate } from '~/composables/usePdvReport'

/**
 * Campo de data com máscara DD/MM/AAAA
 * Abre teclado numérico em mobile
 * Props compatíveis com MaskedTextField
 */
const props = defineProps({
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

const emit = defineEmits(['update:modelValue', 'blur'])

const nativeDateInput = ref<HTMLInputElement | null>(null)

const isoValue = computed(() => brToIsoDate(props.modelValue))

function emitMaskedValue(value: string) {
  emit('update:modelValue', value)
}

function syncFromPicker(event: Event) {
  const value = (event.target as HTMLInputElement).value
  emit('update:modelValue', isoToBrDate(value))
}

function openNativePicker() {
  const input = nativeDateInput.value
  if (!input)
    return

  if (typeof input.showPicker === 'function') {
    input.showPicker()
    return
  }

  input.click()
}
</script>

<template>
  <div class="masked-date-field position-relative">
    <VMaskInput
      v-bind="$attrs"
      :mask="mask"
      :label="label"
      :rules="rules"
      :model-value="modelValue"
      :prepend-inner-icon="prependInnerIcon || 'mdi-calendar'"
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
      @click="openNativePicker"
      @update:model-value="emitMaskedValue"
      @blur="$emit('blur', $event)"
    />
    <input
      ref="nativeDateInput"
      class="native-date-proxy"
      type="date"
      tabindex="-1"
      aria-hidden="true"
      :disabled="disabled"
      :value="isoValue"
      @input="syncFromPicker"
    >
  </div>
</template>

<style scoped>
.native-date-proxy {
  position: absolute;
  inset: 0;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
</style>
