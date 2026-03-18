<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="print-report-section-title print-only">
    {{ title }}
  </div>
</template>
