<script setup lang="ts">
interface Props {
  title: string
  periodLabel?: string
  subtitle?: string
  organization?: string
  generatedAtLabel?: string
  leftSignatureName?: string
  leftSignatureRole?: string
  rightSignatureName?: string
  rightSignatureRole?: string
  footerNote?: string
}

withDefaults(defineProps<Props>(), {
  periodLabel: '',
  subtitle: '',
  organization: 'Paróquia Imaculada Conceição – Araripina',
  generatedAtLabel: '',
  leftSignatureName: '',
  leftSignatureRole: 'Responsável pelo relatório',
  rightSignatureName: '',
  rightSignatureRole: 'Coordenação financeira',
  footerNote: '',
})
</script>

<template>
  <div class="print-report-layout">
    <PrintReportHeader
      :title="title"
      :period-label="periodLabel"
      :subtitle="subtitle"
      :organization="organization"
    />

    <div class="print-report-layout__body">
      <slot />
    </div>

    <PrintReportFooter
      :left-signature-name="leftSignatureName"
      :left-signature-role="leftSignatureRole"
      :right-signature-name="rightSignatureName"
      :right-signature-role="rightSignatureRole"
      :generated-at-label="generatedAtLabel"
      :footer-note="footerNote"
    />
  </div>
</template>

<style scoped>
.print-report-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.print-report-layout :deep(.print-only) {
  display: none;
}

.print-report-layout :deep(.print-report-header) {
  text-align: center;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid rgba(var(--v-theme-secondary), 0.2);
}

.print-report-layout :deep(.print-report-header__organization) {
  margin: 0 0 0.25rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: rgb(var(--v-theme-secondary));
}

.print-report-layout :deep(.print-report-header__title) {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.print-report-layout :deep(.print-report-header__subtitle),
.print-report-layout :deep(.print-report-header__meta) {
  margin: 0.2rem 0 0;
  font-size: 0.75rem;
}

.print-report-layout :deep(.print-report-section-title) {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  background-color: rgba(var(--v-theme-secondary), 0.08);
  padding: 0.5rem 0.75rem;
  color: rgb(var(--v-theme-secondary));
}

.print-report-layout :deep(.print-report-footer) {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.print-report-layout :deep(.print-report-footer__signatures) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
}

.print-report-layout :deep(.print-signature-block) {
  text-align: center;
}

.print-report-layout :deep(.print-signature-block__line) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.4);
  height: 2rem;
  margin-bottom: 0.35rem;
}

.print-report-layout :deep(.print-signature-block__name) {
  font-weight: 600;
}

.print-report-layout :deep(.report-table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.print-report-layout :deep(.report-table thead tr) {
  background-color: rgb(var(--v-theme-surface-variant));
}

.print-report-layout :deep(.report-table th) {
  padding: 10px 12px;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.print-report-layout :deep(.report-table td) {
  padding: 9px 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.print-report-layout :deep(.report-table .data-row:hover) {
  background: rgba(0, 0, 0, 0.02);
}

.print-report-layout :deep(.report-table tfoot .total-row),
.print-report-layout :deep(.report-table .total-row) {
  background-color: rgba(var(--v-theme-secondary), 0.08);
  border-top: 2px solid rgba(0, 0, 0, 0.18);
}

.print-report-layout :deep(.report-table tfoot .total-row td) {
  padding: 12px;
  border-color: rgba(0, 0, 0, 0.12);
}

.print-report-layout :deep(.text-success-print) {
  color: rgb(var(--v-theme-success));
}

.print-report-layout :deep(.text-error-print) {
  color: rgb(var(--v-theme-error));
}

@media (max-width: 600px) {
  .print-report-layout :deep(.print-report-footer__signatures) {
    grid-template-columns: 1fr;
  }
}

@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  .print-report-layout {
    gap: 0.75rem;
  }

  .print-report-layout :deep(.print-only) {
    display: block !important;
  }

  .print-report-layout :deep(.no-print) {
    display: none !important;
  }

  .print-report-layout :deep(.report-card) {
    box-shadow: none !important;
    border-radius: 0 !important;
    border: 1px solid #ccc !important;
    break-inside: avoid;
    margin-bottom: 8px !important;
  }

  .print-report-layout :deep(.report-table) {
    font-size: 10px;
  }

  .print-report-layout :deep(.report-table th),
  .print-report-layout :deep(.report-table td) {
    padding: 5px 7px;
    border: 1px solid #999;
  }

  .print-report-layout :deep(.report-table thead tr) {
    background-color: #d0c9c0 !important;
  }

  .print-report-layout :deep(.report-table tfoot .total-row),
  .print-report-layout :deep(.report-table .total-row) {
    background-color: #ecdbc8 !important;
  }

  .print-report-layout :deep(.print-report-header) {
    display: block !important;
    padding-bottom: 0.5rem;
    margin-bottom: 0.25rem;
    border-bottom-color: #b9ac9d;
  }

  .print-report-layout :deep(.print-report-header__organization) {
    font-size: 12px;
    color: #5d4037 !important;
  }

  .print-report-layout :deep(.print-report-header__title) {
    font-size: 13px;
    letter-spacing: 0.04em;
  }

  .print-report-layout :deep(.print-report-header__subtitle),
  .print-report-layout :deep(.print-report-header__meta) {
    font-size: 10px;
  }

  .print-report-layout :deep(.print-report-section-title) {
    display: block !important;
    font-size: 0.65rem;
    background-color: #ecdbc8 !important;
    color: #3e2723 !important;
  }

  .print-report-layout :deep(.print-report-footer) {
    margin-top: 1rem;
    gap: 0.75rem;
    page-break-inside: avoid;
  }

  .print-report-layout :deep(.print-report-footer__generated),
  .print-report-layout :deep(.print-report-footer__note) {
    color: #5f5f5f !important;
    text-align: left;
  }

  .print-report-layout :deep(.print-signature-block__line) {
    border-bottom-color: #333;
    height: 1.75rem;
  }

  .print-report-layout :deep(.print-signature-block__role) {
    font-size: 9px !important;
  }

  .print-report-layout :deep(.text-success-print) {
    color: #1b5e20 !important;
  }

  .print-report-layout :deep(.text-error-print) {
    color: #b71c1c !important;
  }

  @page {
    size: A4 portrait;
    margin: 16mm 12mm 16mm 12mm;
  }
}
</style>
