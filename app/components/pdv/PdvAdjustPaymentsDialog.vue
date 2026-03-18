<script setup lang="ts">
import type { PdvOperator, PdvSale } from '~/types/schema'
import { useDisplay } from 'vuetify'

interface PaymentMethodOption {
  title: string
  value: string
  icon: string
  color: string
}

type AdjustPaymentSale = Pick<PdvSale, 'id' | 'total_amount' | 'payment_method' | 'created_at' | 'date_created'>

const props = defineProps<{
  modelValue: boolean
  operators: PdvOperator[]
  paymentMethods: PaymentMethodOption[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'adjusted': [payload: { count: number, methodLabel: string }]
}>()

const { mobile } = useDisplay()
const { fetchSales, updateSale } = usePdv()

const adjustLoading = ref(false)
const adjustOperatorId = ref<string | null>(null)
const adjustSourcePaymentMethod = ref<string | null>(null)
const adjustSales = ref<AdjustPaymentSale[]>([])
const adjustSelectedRows = ref<string[]>([])
const adjustTargetPaymentMethod = ref('pix')

const sourcePaymentMethodItems = computed(() => {
  return [{ title: 'Todos os pagamentos', value: null }, ...props.paymentMethods]
})

const adjustSelectedSalesTotal = computed(() => {
  return adjustSales.value
    .filter(sale => adjustSelectedRows.value.includes(sale.id))
    .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)
})

function getPaymentLabel(method: string | null | undefined): string {
  if (!method)
    return 'Todos os pagamentos'

  return props.paymentMethods.find(payment => payment.value === method)?.title || method
}

function getPaymentIcon(method: string | null | undefined): string {
  if (!method)
    return 'mdi-filter-variant'

  return props.paymentMethods.find(payment => payment.value === method)?.icon || 'mdi-cash'
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr)
    return '-'

  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function closeDialog(): void {
  emit('update:modelValue', false)
}

function resetState(): void {
  adjustLoading.value = false
  adjustOperatorId.value = null
  adjustSourcePaymentMethod.value = null
  adjustSales.value = []
  adjustSelectedRows.value = []
  adjustTargetPaymentMethod.value = 'pix'
}

async function fetchAdjustSales(): Promise<void> {
  if (!adjustOperatorId.value)
    return

  adjustLoading.value = true
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const filter: Record<string, unknown> = {
      operator_id: { _eq: adjustOperatorId.value },
      sale_status: { _eq: 'completed' },
      date_created: { _gte: today.toISOString() },
    }

    if (adjustSourcePaymentMethod.value) {
      filter.payment_method = { _eq: adjustSourcePaymentMethod.value }
    }

    const response = await fetchSales({
      fields: ['id', 'total_amount', 'created_at', 'date_created', 'payment_method'],
      filter,
      limit: -1,
      sort: ['-date_created'],
    })

    adjustSales.value = (response ?? []) as AdjustPaymentSale[]
    adjustSelectedRows.value = []
  }
  catch (error) {
    console.error(error)
  }
  finally {
    adjustLoading.value = false
  }
}

async function confirmAdjustBatch(): Promise<void> {
  if (adjustSelectedRows.value.length === 0)
    return

  adjustLoading.value = true
  try {
    for (const saleId of adjustSelectedRows.value) {
      await updateSale(saleId, { payment_method: adjustTargetPaymentMethod.value })
    }

    const adjustedCount = adjustSelectedRows.value.length
    const methodLabel = getPaymentLabel(adjustTargetPaymentMethod.value)

    adjustSelectedRows.value = []
    emit('adjusted', { count: adjustedCount, methodLabel })

    if (adjustOperatorId.value) {
      await fetchAdjustSales()
    }
  }
  catch (error) {
    console.error(error)
    throw error
  }
  finally {
    adjustLoading.value = false
  }
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetState()
  }
})

watch([adjustOperatorId, adjustSourcePaymentMethod, () => props.modelValue], ([operatorId, _, isOpen]) => {
  if (!isOpen)
    return

  if (operatorId) {
    fetchAdjustSales()
    return
  }

  adjustSales.value = []
  adjustSelectedRows.value = []
})
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="600px"
    :fullscreen="mobile"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card :rounded="mobile ? '0' : 'xl'" class="d-flex flex-column" :style="{ maxHeight: mobile ? '100dvh' : '90vh', minHeight: mobile ? '100dvh' : '400px' }">
      <div class="pa-4 pb-10 position-relative text-white overflow-hidden shadow-sm" style="background: linear-gradient(135deg, #475569, #1e293b);">
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="d-flex align-center">
            <v-avatar color="white" variant="tonal" class="me-3" size="40">
              <v-icon icon="mdi-swap-horizontal" color="white" />
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold leading-tight">
                Ajuste de Pagamentos
              </div>
              <div class="text-caption header-caption">
                Correcao em lote das vendas de hoje
              </div>
            </div>
          </div>
          <v-btn
            icon="mdi-close"
            variant="text"
            color="white"
            density="comfortable"
            class="position-absolute"
            style="top: 12px; right: 12px; z-index: 10;"
            @click="closeDialog"
          />
        </div>

        <v-icon icon="mdi-swap-horizontal" class="position-absolute dialog-decorative-icon" />
      </div>

      <div class="px-4 dialog-overlap-card">
        <v-card rounded="lg" elevation="4" class="pa-4 bg-white border">
          <v-row align="center" class="ga-0">
            <v-col cols="12" md="7">
              <v-autocomplete
                v-model="adjustOperatorId"
                :items="operators"
                item-title="name"
                item-value="id"
                label="Operador Responsavel"
                hide-details
                clearable
                rounded="lg"
                placeholder="Selecione o operador das vendas"
              />
            </v-col>
            <v-col cols="12" md="5" class="pt-3 pt-md-0 ps-md-3">
              <v-select
                v-model="adjustSourcePaymentMethod"
                :items="sourcePaymentMethodItems"
                item-title="title"
                item-value="value"
                label="Filtrar pagamento"
                hide-details
                clearable
                :disabled="!adjustOperatorId"
                rounded="lg"
              >
                <template #selection="{ item }">
                  <div class="d-flex align-center">
                    <v-icon :icon="getPaymentIcon(item.value)" size="16" class="me-2" />
                    <span>{{ item.title }}</span>
                  </div>
                </template>
                <template #item="{ props: itemProps, item }">
                  <v-list-item v-bind="itemProps" :prepend-icon="getPaymentIcon(item.value)" :title="item.title" />
                </template>
              </v-select>
            </v-col>
          </v-row>
        </v-card>
      </div>

      <v-card-text class="overflow-y-auto pa-4 pt-6">
        <div class="d-flex align-center mb-4 pa-3 bg-secondary-lighten-5 rounded-lg border border-secondary-lighten-4">
          <v-icon icon="mdi-information-outline" color="secondary" class="me-3" />
          <div class="text-caption text-secondary-darken-1">
            Liste as transacoes do operador e, se quiser, refine pela forma de pagamento antes do ajuste.
          </div>
        </div>

        <v-divider class="mb-4" />

        <div v-if="adjustOperatorId && !adjustLoading && adjustSales.length > 0">
          <div class="text-overline text-medium-emphasis mb-2 d-flex justify-space-between align-center">
            Vendas Registradas (Hoje)
            <v-btn
              variant="text"
              size="small"
              color="primary"
              class="text-none"
              @click="adjustSelectedRows = adjustSelectedRows.length === adjustSales.length ? [] : adjustSales.map(sale => sale.id)"
            >
              {{ adjustSelectedRows.length === adjustSales.length ? 'Desmarcar todos' : 'Marcar todos' }}
            </v-btn>
          </div>

          <v-list density="comfortable" class="border rounded-xl bg-grey-lighten-4 pa-0 overflow-hidden">
            <v-list-item
              v-for="(sale, index) in adjustSales"
              :key="sale.id"
              :class="{ 'border-b': index < adjustSales.length - 1 }"
              class="px-2"
            >
              <template #prepend>
                <v-checkbox-btn
                  v-model="adjustSelectedRows"
                  :value="sale.id"
                  color="primary"
                />
              </template>
              <div class="d-flex align-center py-2 w-100">
                <div class="flex-grow-1">
                  <div class="text-body-2 font-weight-bold">
                    Venda #{{ sale.id.substring(0, 8) }}
                  </div>
                  <div class="text-caption text-medium-emphasis d-flex align-center ga-2">
                    <span>
                      <v-icon icon="mdi-clock-outline" size="12" class="me-1" />
                      {{ formatDate(sale.created_at || sale.date_created).split(',')[1] }}
                    </span>
                    <v-divider vertical length="10" />
                    <span class="d-flex align-center">
                      <v-icon :icon="getPaymentIcon(sale.payment_method)" size="12" class="me-1" />
                      {{ getPaymentLabel(sale.payment_method) }}
                    </span>
                  </div>
                </div>
                <div class="text-end ms-3">
                  <div class="text-body-1 font-weight-black text-secondary">
                    {{ formatCurrency(Number(sale.total_amount)) }}
                  </div>
                </div>
              </div>
            </v-list-item>
          </v-list>
        </div>

        <div v-else-if="adjustLoading" class="text-center pa-10 w-100">
          <v-progress-circular indeterminate color="primary" size="48" width="5" class="mb-4" />
          <div class="text-body-2 text-medium-emphasis font-weight-medium">
            Buscando transacoes...
          </div>
        </div>

        <div v-else-if="adjustOperatorId" class="text-center pa-12 border rounded-xl bg-grey-lighten-4 stripe-bg w-100">
          <v-icon icon="mdi-check-circle-outline" size="48" color="success" class="mb-4" />
          <div class="text-h6 font-weight-bold mb-1">
            Tudo certo!
          </div>
          <div class="text-body-2 text-medium-emphasis">
            Nenhuma venda encontrada hoje com o filtro atual.
          </div>
        </div>

        <div v-else class="text-center pa-12 border rounded-xl border-dashed w-100">
          <v-icon icon="mdi-account-search-outline" size="48" color="grey-lighten-1" class="mb-4" />
          <div class="text-body-2 text-medium-emphasis">
            Selecione um operador para iniciar o ajuste.
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4 border-t d-block bg-white shadow-top">
        <div v-if="adjustSelectedRows.length > 0" class="mb-4">
          <div class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-2 ms-1 dialog-action-label">
            Alterar lote para:
          </div>
          <v-row class="ga-0">
            <v-col v-for="payment in paymentMethods" :key="payment.value" cols="3">
              <v-card
                variant="tonal"
                :color="adjustTargetPaymentMethod === payment.value ? payment.color : 'grey-lighten-1'"
                class="pa-2 text-center cursor-pointer transition-all"
                :class="{ 'border-primary border-2': adjustTargetPaymentMethod === payment.value }"
                @click="adjustTargetPaymentMethod = payment.value"
              >
                <v-icon :icon="payment.icon" size="20" class="mb-1" />
                <div class="text-caption font-weight-bold dialog-payment-card-label">
                  {{ payment.title }}
                </div>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <div class="d-flex align-center justify-space-between pt-2">
          <div v-if="adjustSelectedRows.length > 0">
            <div class="text-caption text-medium-emphasis leading-none">
              TOTAL SELECIONADO ({{ adjustSelectedRows.length }})
            </div>
            <div class="text-h6 font-weight-black text-primary leading-tight">
              {{ formatCurrency(adjustSelectedSalesTotal) }}
            </div>
          </div>
          <div v-else class="text-caption text-medium-emphasis">
            Selecione itens para ajustar
          </div>

          <div class="d-flex ga-2">
            <v-btn
              variant="text"
              color="grey-darken-1"
              class="text-none font-weight-medium"
              @click="closeDialog"
            >
              Cancelar
            </v-btn>
            <v-btn
              color="primary"
              variant="flat"
              class="text-none font-weight-bold px-6"
              size="large"
              rounded="lg"
              :loading="adjustLoading"
              :disabled="adjustSelectedRows.length === 0"
              @click="confirmAdjustBatch"
            >
              Confirmar Ajuste
            </v-btn>
          </div>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.header-caption {
  opacity: 0.8;
}

.dialog-decorative-icon {
  right: -20px;
  bottom: -30px;
  font-size: 150px;
  opacity: 0.05;
  transform: rotate(-15deg);
}

.dialog-overlap-card {
  margin-top: -30px;
  position: relative;
  z-index: 1;
}

.dialog-action-label {
  letter-spacing: 0.5px;
}

.dialog-payment-card-label {
  font-size: 0.65rem !important;
}

.transition-all {
  transition: all 0.2s ease-in-out;
}

.transition-all:hover {
  transform: translateY(-2px);
  filter: brightness(0.95);
}

.border-primary {
  border-color: rgb(var(--v-theme-primary)) !important;
}

.border-2 {
  border-width: 2px !important;
}

.stripe-bg {
  background-image: linear-gradient(
    45deg,
    #f8fafc 25%,
    transparent 25%,
    transparent 50%,
    #f8fafc 50%,
    #f8fafc 75%,
    transparent 75%,
    transparent
  );
  background-size: 20px 20px;
}
</style>
