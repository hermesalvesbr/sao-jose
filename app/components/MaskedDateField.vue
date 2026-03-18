<script setup lang="ts">
import { VMaskInput } from 'vuetify/labs/VMaskInput'
import { brToIsoDate } from '~/composables/usePdvReport'

/**
 * Campo de data com máscara DD/MM/AAAA
 * Abre teclado numérico em mobile
 * Usa VDatePicker do Vuetify dentro de um VMenu
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
  autocomplete: {
    type: String,
    default: 'off',
  },
  color: String,
  placeholder: {
    type: String,
    default: 'DD/MM/AAAA',
  },
  customClass: String,
  /** Ano/mês inicial do picker quando não há valor (ISO: YYYY-MM-DD) */
  defaultPickerDate: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'blur'])

const menuOpen = ref(false)

const isoValue = computed(() => brToIsoDate(props.modelValue))

/** Date object para model do VDatePicker */
const pickerModel = computed({
  get() {
    const iso = isoValue.value
    if (iso) {
      const d = new Date(`${iso}T12:00:00`)
      return Number.isNaN(d.getTime()) ? undefined : d
    }
    return undefined
  },
  set(val: Date | undefined) {
    if (!val)
      return
    // Formata como DD/MM/AAAA e emite
    const y = val.getFullYear()
    const m = String(val.getMonth() + 1).padStart(2, '0')
    const d = String(val.getDate()).padStart(2, '0')
    emit('update:modelValue', `${d}/${m}/${y}`)
    menuOpen.value = false
  },
})

/** Mês inicial: usa o valor corrente ou o defaultPickerDate */
const pickerMonth = computed(() => {
  if (pickerModel.value)
    return pickerModel.value.getMonth()
  if (props.defaultPickerDate) {
    const d = new Date(`${props.defaultPickerDate}T12:00:00`)
    if (!Number.isNaN(d.getTime()))
      return d.getMonth()
  }
  return new Date().getMonth()
})

/** Ano inicial: usa o valor corrente ou o defaultPickerDate */
const pickerYear = computed(() => {
  if (pickerModel.value)
    return pickerModel.value.getFullYear()
  if (props.defaultPickerDate) {
    const d = new Date(`${props.defaultPickerDate}T12:00:00`)
    if (!Number.isNaN(d.getTime()))
      return d.getFullYear()
  }
  return new Date().getFullYear()
})

function emitMaskedValue(value: string) {
  emit('update:modelValue', value)
}

function openPicker() {
  if (!props.disabled) {
    menuOpen.value = true
  }
}
</script>

<template>
  <div class="masked-date-field position-relative">
    <VMenu
      v-model="menuOpen"
      :close-on-content-click="false"
      location="bottom start"
      origin="top start"
    >
      <template #activator="{ props: menuProps }">
        <VMaskInput
          v-bind="{ ...$attrs, ...menuProps }"
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
          @click:prepend-inner="openPicker"
          @update:model-value="emitMaskedValue"
          @blur="$emit('blur', $event)"
        />
      </template>

      <v-date-picker
        v-model="pickerModel"
        :month="pickerMonth"
        :year="pickerYear"
        hide-header
        show-adjacent-months
        color="primary"
        @update:model-value="menuOpen = false"
      />
    </VMenu>
  </div>
</template>
