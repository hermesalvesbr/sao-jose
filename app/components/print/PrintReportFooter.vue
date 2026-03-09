<script setup lang="ts">
interface Props {
  leftSignatureName?: string
  leftSignatureRole?: string
  rightSignatureName?: string
  rightSignatureRole?: string
  generatedAtLabel?: string
  footerNote?: string
}

withDefaults(defineProps<Props>(), {
  leftSignatureName: '',
  leftSignatureRole: 'Responsável pelo relatório',
  rightSignatureName: '',
  rightSignatureRole: 'Coordenação financeira',
  generatedAtLabel: '',
  footerNote: '',
})
</script>

<template>
  <footer class="print-report-footer">
    <div v-if="generatedAtLabel || footerNote" class="print-report-footer__meta">
      <p v-if="generatedAtLabel" class="print-report-footer__generated text-caption text-medium-emphasis mb-1">
        {{ generatedAtLabel }}
      </p>
      <p v-if="footerNote" class="print-report-footer__note text-caption text-medium-emphasis mb-0">
        {{ footerNote }}
      </p>
    </div>

    <div class="print-report-footer__signatures">
      <div class="print-signature-block">
        <div class="print-signature-block__line" />
        <p v-if="leftSignatureName" class="print-signature-block__name mb-1">
          {{ leftSignatureName }}
        </p>
        <p class="print-signature-block__role text-caption mb-0">
          {{ leftSignatureRole }}
        </p>
      </div>

      <div class="print-signature-block">
        <div class="print-signature-block__line" />
        <p v-if="rightSignatureName" class="print-signature-block__name mb-1">
          {{ rightSignatureName }}
        </p>
        <p class="print-signature-block__role text-caption mb-0">
          {{ rightSignatureRole }}
        </p>
      </div>
    </div>
  </footer>
</template>
