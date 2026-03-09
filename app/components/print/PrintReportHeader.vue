<script setup lang="ts">
interface Props {
  title: string
  periodLabel?: string
  subtitle?: string
  organization?: string
}

const props = withDefaults(defineProps<Props>(), {
  periodLabel: '',
  subtitle: '',
  organization: 'Paróquia Imaculada Conceição – Araripina',
})

const metaLines = computed(() => {
  const lines: string[] = []

  if (props.periodLabel)
    lines.push(`Período: ${props.periodLabel}`)

  return lines
})
</script>

<template>
  <header class="print-report-header print-only">
    <p class="print-report-header__organization">
      {{ organization }}
    </p>
    <h2 class="print-report-header__title">
      {{ title }}
    </h2>
    <p v-if="subtitle" class="print-report-header__subtitle">
      {{ subtitle }}
    </p>
    <p
      v-for="line in metaLines"
      :key="line"
      class="print-report-header__meta"
    >
      {{ line }}
    </p>
  </header>
</template>
