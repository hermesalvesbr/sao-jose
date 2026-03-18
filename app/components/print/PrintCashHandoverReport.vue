<script setup lang="ts">
interface OperatorRow {
  id: string
  name: string
  dinheiro: number
  pix: number
  cartao: number
  total: number
  desconto_dinheiro: number
  desconto_pix: number
  desconto_cartao: number
  desconto: number
}

interface Props {
  operator: OperatorRow
  periodLabel: string
  coordinatorName: string
  generatedAtLabel?: string
}

withDefaults(defineProps<Props>(), {
  generatedAtLabel: '',
})
</script>

<template>
  <div class="handover-report">
    <!-- Header -->
    <header class="handover-report__header">
      <p class="handover-report__org">
        Paróquia Imaculada Conceição – Araripina
      </p>
      <h2 class="handover-report__title">
        Comprovante de Entrega de Caixa
      </h2>
      <p class="handover-report__subtitle">
        PDV – Quermesse
      </p>
      <p class="handover-report__period">
        Período: {{ periodLabel }}
      </p>
    </header>

    <!-- Operator info -->
    <div class="handover-report__operator-info">
      <span class="handover-report__label">Operador:</span>
      <span class="handover-report__operator-name">{{ operator.name }}</span>
    </div>

    <!-- Sales breakdown table -->
    <table class="handover-report__table">
      <thead>
        <tr>
          <th class="text-start col-desc">
            FORMA DE PAGAMENTO
          </th>
          <th class="text-end col-val">
            TOTAL VENDIDO R$
          </th>
          <th class="text-end col-val">
            DESCONTOS R$
          </th>
          <th class="text-end col-val">
            LÍQUIDO R$
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="col-desc">
            Dinheiro
          </td>
          <td class="text-end col-val">
            {{ formatCurrency(operator.dinheiro) }}
          </td>
          <td class="text-end col-val text-error-print">
            {{ operator.desconto_dinheiro > 0 ? formatCurrency(operator.desconto_dinheiro) : '—' }}
          </td>
          <td class="text-end col-val font-weight-bold">
            {{ formatCurrency(operator.dinheiro - operator.desconto_dinheiro) }}
          </td>
        </tr>
        <tr>
          <td class="col-desc">
            PIX
          </td>
          <td class="text-end col-val">
            {{ formatCurrency(operator.pix) }}
          </td>
          <td class="text-end col-val text-error-print">
            {{ operator.desconto_pix > 0 ? formatCurrency(operator.desconto_pix) : '—' }}
          </td>
          <td class="text-end col-val font-weight-bold">
            {{ formatCurrency(operator.pix - operator.desconto_pix) }}
          </td>
        </tr>
        <tr>
          <td class="col-desc">
            Cartão
          </td>
          <td class="text-end col-val">
            {{ formatCurrency(operator.cartao) }}
          </td>
          <td class="text-end col-val text-error-print">
            {{ operator.desconto_cartao > 0 ? formatCurrency(operator.desconto_cartao) : '—' }}
          </td>
          <td class="text-end col-val font-weight-bold">
            {{ formatCurrency(operator.cartao - operator.desconto_cartao) }}
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td class="col-desc font-weight-black text-uppercase">
            Total Geral
          </td>
          <td class="text-end col-val font-weight-bold">
            {{ formatCurrency(operator.total) }}
          </td>
          <td class="text-end col-val font-weight-bold text-error-print">
            {{ operator.desconto > 0 ? formatCurrency(operator.desconto) : '—' }}
          </td>
          <td class="text-end col-val font-weight-black text-success-print">
            {{ formatCurrency(operator.total - operator.desconto) }}
          </td>
        </tr>
      </tfoot>
    </table>

    <!-- Cash handover highlight -->
    <div class="handover-report__cash-box">
      <span class="handover-report__cash-label">VALOR EM DINHEIRO A ENTREGAR:</span>
      <span class="handover-report__cash-value">
        {{ formatCurrency(operator.dinheiro - operator.desconto_dinheiro) }}
      </span>
    </div>

    <p class="handover-report__obs">
      (*) OBS.: O valor em dinheiro já deve estar com o troco retirado. PIX e Cartão são registrados apenas para controle — o dinheiro físico é o único valor entregue neste comprovante.
    </p>

    <!-- Signatures -->
    <div class="handover-report__signatures">
      <div class="signature-block">
        <div class="signature-block__line" />
        <p class="signature-block__name">
          {{ coordinatorName }}
        </p>
        <p class="signature-block__role">
          Coordenação Financeira
        </p>
      </div>

      <div class="signature-block">
        <div class="signature-block__line" />
        <p class="signature-block__name">
          {{ operator.name }}
        </p>
        <p class="signature-block__role">
          Operador(a) de Caixa
        </p>
      </div>
    </div>

    <p v-if="generatedAtLabel" class="handover-report__generated">
      {{ generatedAtLabel }}
    </p>
  </div>
</template>

<style scoped>
.handover-report {
  font-family: Arial, sans-serif;
  padding: 2rem;
  max-width: 700px;
  margin: 0 auto;
}

.handover-report__header {
  text-align: center;
  padding-bottom: 1rem;
  border-bottom: 2px solid #555;
  margin-bottom: 1.25rem;
}

.handover-report__org {
  margin: 0 0 0.2rem;
  font-size: 0.85rem;
  font-weight: 700;
}

.handover-report__title {
  margin: 0 0 0.2rem;
  font-size: 1.1rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.handover-report__subtitle {
  margin: 0 0 0.2rem;
  font-size: 0.8rem;
}

.handover-report__period {
  margin: 0;
  font-size: 0.8rem;
}

.handover-report__operator-info {
  margin-bottom: 1rem;
  font-size: 0.95rem;
  border-bottom: 1px solid #ccc;
  padding-bottom: 0.6rem;
}

.handover-report__label {
  font-weight: 700;
  margin-right: 0.5rem;
}

.handover-report__operator-name {
  font-size: 1rem;
  font-weight: 600;
}

.handover-report__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

.handover-report__table th,
.handover-report__table td {
  padding: 6px 10px;
  border: 1px solid #ccc;
}

.handover-report__table thead th {
  background-color: #f0f0f0;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.handover-report__table .total-row td {
  background-color: #e8e8e8;
  border-top: 2px solid #888;
}

.col-desc {
  width: 40%;
}

.col-val {
  width: 20%;
}

.text-error-print {
  color: #c62828;
}

.text-success-print {
  color: #2e7d32;
}

.text-end {
  text-align: right;
}

.text-start {
  text-align: left;
}

.font-weight-bold {
  font-weight: 700;
}

.font-weight-black {
  font-weight: 900;
}

.text-uppercase {
  text-transform: uppercase;
}

.handover-report__cash-box {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  border: 2px solid #333;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
  background-color: #f8f8f8;
}

.handover-report__cash-label {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.handover-report__cash-value {
  font-size: 1.4rem;
  font-weight: 900;
}

.handover-report__obs {
  font-size: 0.7rem;
  color: #666;
  margin-bottom: 2.5rem;
  line-height: 1.4;
}

.handover-report__signatures {
  display: flex;
  justify-content: space-between;
  gap: 3rem;
  margin-bottom: 1.5rem;
}

.signature-block {
  flex: 1;
}

.signature-block__line {
  border-top: 1px solid #333;
  margin-bottom: 0.4rem;
}

.signature-block__name {
  margin: 0 0 0.1rem;
  font-size: 0.8rem;
  font-weight: 700;
}

.signature-block__role {
  margin: 0;
  font-size: 0.7rem;
  color: #555;
}

.handover-report__generated {
  font-size: 0.7rem;
  color: #888;
  text-align: right;
  margin: 0;
}
</style>
