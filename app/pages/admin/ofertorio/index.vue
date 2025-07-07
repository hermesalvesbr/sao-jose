<script setup lang="ts">
import type { DirectusClient, RestClient } from '@directus/sdk'
import type { ApiCollections, OfertaFinanceira } from '~/types/schema'
import { readItems } from '@directus/sdk'
import { onMounted, ref } from 'vue'

// Define o layout admin para esta página
definePageMeta({
  layout: 'admin',
})

const headers = [
  {
    title: 'Evento',
    key: 'evento',
    sortable: true,
    align: 'start' as const,
    width: '45%',
  },
  {
    title: 'Valor',
    key: 'valor',
    sortable: true,
    align: 'end' as const,
    width: '25%',
  },
  {
    title: 'Data',
    key: 'data_entrada',
    sortable: true,
    align: 'center' as const,
    width: '30%',
  },
]

const ofertas = ref<OfertaFinanceira[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const d = await useDirectusClient() as DirectusClient<ApiCollections> & RestClient<ApiCollections>
    const result = await d.request(readItems('oferta_financeira', {
      fields: ['id', 'valor', 'data_entrada', { evento: ['titulo'] }] as any,
      sort: ['-data_entrada'],
      limit: 100,
    }))
    ofertas.value = Array.isArray(result) ? result as unknown as OfertaFinanceira[] : []
  }
  catch (err) {
    console.error('Erro ao carregar ofertas:', err)
  }
  finally {
    loading.value = false
  }
})

function getEventoNome(evento: any) {
  if (!evento)
    return 'Sem evento especificado'
  if (typeof evento === 'string')
    return evento
  return evento.titulo || evento.id || 'Evento sem título'
}

/**
 * Formata valores monetários para Real Brasileiro (BRL)
 * Exemplos de saída:
 * - 0 → "R$ 0,00"
 * - 10.5 → "R$ 10,50"
 * - 1000 → "R$ 1.000,00"
 * - 1234.56 → "R$ 1.234,56"
 * - null/undefined → "R$ 0,00"
 */
function formatCurrency(valor: number) {
  // Trata valores nulos, undefined ou NaN
  if (!valor && valor !== 0) {
    return 'R$ 0,00'
  }

  // Converte para número se for string
  const numericValue = typeof valor === 'string' ? Number.parseFloat(valor) : valor

  if (Number.isNaN(numericValue)) {
    return 'R$ 0,00'
  }

  // Formatação brasileira com Real (BRL)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)
}

/**
 * Formata datas para o padrão brasileiro DD/MM/AAAA
 * Corrige problemas de timezone com datas ISO no formato YYYY-MM-DD
 *
 * Problema anterior: "2025-07-07" estava sendo exibido como "06/07/2025"
 * Solução: Adiciona 'T12:00:00' para evitar mudança de fuso horário
 *
 * Exemplos:
 * - "2025-07-07" → "07/07/2025" ✅
 * - "2025-07-07T10:30:00Z" → "07/07/2025" ✅
 */
function formatDate(date: any) {
  if (!date)
    return 'Data não informada'

  let d: Date

  if (typeof date === 'string') {
    // Se é uma string no formato YYYY-MM-DD (sem horário), cria data local
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // Anexa 'T12:00:00' para evitar problemas de timezone
      d = new Date(`${date}T12:00:00`)
    }
    else {
      d = new Date(date)
    }
  }
  else {
    d = new Date(date)
  }

  if (Number.isNaN(d.getTime()))
    return 'Data inválida'

  // Formatação brasileira
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Retorna a cor do chip baseada no valor da oferta
 * Faixas ajustadas para valores em Real brasileiro:
 * - R$ 0,00: Cinza (sem valor)
 * - R$ 0,01 - R$ 49,99: Azul (valores baixos)
 * - R$ 50,00 - R$ 199,99: Verde (valores médios)
 * - R$ 200,00 - R$ 499,99: Laranja (valores altos)
 * - R$ 500,00+: Roxo (valores muito altos)
 */
function getValorColor(valor: number): string {
  if (!valor || valor <= 0)
    return 'grey'
  if (valor < 100)
    return 'blue'
  if (valor < 300)
    return 'green'
  if (valor < 500)
    return 'orange'
  return 'purple'
}
</script>

<template>
  <v-container fluid class="pa-2 pa-md-6">
    <v-row>
      <v-col cols="12">
        <!-- Card principal com a tabela -->
        <v-card elevation="2" rounded="lg">
          <v-card-title class="d-flex flex-column flex-md-row align-start align-md-center justify-space-between pa-3 pa-md-4">
            <div class="d-flex flex-column flex-md-row align-center gap-2">
              <v-btn
                to="/admin/ofertorio/add"
                color="primary"
                variant="elevated"
                size="small"
                prepend-icon="mdi-plus"
              >
                Nova Oferta
              </v-btn>
            </div>
          </v-card-title>

          <v-divider />

          <v-data-table
            :headers="headers"
            :items="ofertas"
            :items-per-page="15"
            :loading="loading"
            loading-text="Carregando ofertas financeiras..."
            no-data-text="Nenhuma oferta encontrada"
            items-per-page-text="Itens por página:"
            page-text="{0}-{1} de {2}"
            density="compact"
            :hover="true"
            :sticky="true"
            :mobile-breakpoint="600"
            :show-current-page="true"
            :show-first-last-page="true"
            :items-per-page-options="[
              { value: 10, title: '10' },
              { value: 15, title: '15' },
              { value: 25, title: '25' },
              { value: 50, title: '50' },
              { value: -1, title: 'Todos' },
            ]"
          >
            <!-- Slot para o evento -->
            <template #[`item.evento`]="{ item }">
              <span class="font-weight-medium">{{ getEventoNome(item.evento) }}</span>
            </template>

            <!-- Slot para o valor -->
            <template #[`item.valor`]="{ item }">
              <v-chip
                :color="getValorColor(item.valor)"
                variant="tonal"
                size="small"
                class="font-weight-bold"
              >
                {{ formatCurrency(item.valor) }}
              </v-chip>
            </template>

            <!-- Slot para a data -->
            <template #[`item.data_entrada`]="{ item }">
              <span class="text-body-2">{{ formatDate(item.data_entrada) }}</span>
            </template>

            <!-- Loading customizado -->
            <template #loading>
              <div class="d-flex justify-center align-center pa-8">
                <v-progress-circular
                  indeterminate
                  color="primary"
                  size="40"
                  width="4"
                />
                <span class="ml-4 text-body-1">Carregando ofertas...</span>
              </div>
            </template>

            <!-- Estado vazio customizado -->
            <template #no-data>
              <div class="text-center pa-8">
                <v-icon color="grey-lighten-1" size="64" class="mb-4">
                  mdi-database-off
                </v-icon>
                <h3 class="text-h6 text-medium-emphasis mb-2">
                  Nenhuma oferta encontrada
                </h3>
                <p class="text-body-2 text-medium-emphasis mb-4">
                  Não há registros de ofertas financeiras no momento.
                </p>
                <v-btn
                  to="/admin/ofertorio/add"
                  color="primary"
                  variant="elevated"
                  prepend-icon="mdi-plus"
                >
                  Registrar primeira oferta
                </v-btn>
              </div>
            </template>

            <!-- Rodapé customizado -->
            <template #bottom>
              <div class="d-flex justify-center pa-4">
                <div class="text-body-2 text-medium-emphasis">
                  Total de {{ ofertas.length }} {{ ofertas.length === 1 ? 'oferta' : 'ofertas' }} encontradas
                </div>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
