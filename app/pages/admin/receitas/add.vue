<script setup lang="ts">
import { readItems } from '@directus/sdk'
/**
 * Nova Receita — Formulário de criação
 *
 * Cobre: doações, campanhas, rifas, taxas, subsídios, reembolsos.
 * Após salvar, redireciona para a edição onde o usuário pode anexar comprovantes.
 */
import { brToIsoDate, isoToBrDate, toLocalISO } from '~/composables/usePdvReport'
import { MEIO_PAGAMENTO_LABELS, TIPO_RECEITA_LABELS } from '~/composables/useReceitas'

definePageMeta({ layout: 'admin' })

const { salvarReceita, loading } = useReceitas()

// ─── Opções de select ─────────────────────────────────────────────────────────
const tipoOpcoes = Object.entries(TIPO_RECEITA_LABELS).map(([value, title]) => ({ value, title }))
const meioOpcoes = Object.entries(MEIO_PAGAMENTO_LABELS).map(([value, title]) => ({ value, title }))

// ─── Católicos para autocomplete ──────────────────────────────────────────────
const catolicos = ref<{ id: string, nome: string }[]>([])
const loadingCatolicos = ref(false)

async function loadCatolicos() {
  loadingCatolicos.value = true
  try {
    const client = await useAuth().getAuthClient()
    const result = await client.request(readItems('catolico', {
      filter: { status: { _eq: 'published' } },
      sort: ['nome'],
      fields: ['id', 'nome'],
      limit: -1,
    }))
    catolicos.value = (result as { id: string, nome: string }[]) ?? []
  }
  catch (e) {
    console.error('Erro ao carregar católicos:', e)
  }
  finally {
    loadingCatolicos.value = false
  }
}

onMounted(loadCatolicos)

// ─── Form ─────────────────────────────────────────────────────────────────────
const formRef = ref()
const formValid = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

const form = ref({
  tipo: null as string | null,
  descricao: '',
  valor: undefined as number | undefined,
  data: isoToBrDate(toLocalISO(new Date())),
  meio_pagamento: null as string | null,
  responsavel_id: null as string | null,
  observacao: '',
})

const rules = {
  required: (v: unknown) => !!v || 'Campo obrigatório',
  positive: (v: unknown) => {
    const n = Number(v)
    return (!Number.isNaN(n) && n > 0) || 'Informe um valor positivo'
  },
}

// ─── Submit ───────────────────────────────────────────────────────────────────
async function submit() {
  const { valid } = await formRef.value?.validate()
  if (!valid)
    return

  try {
    const payload: Record<string, unknown> = {
      tipo: form.value.tipo,
      descricao: form.value.descricao,
      valor: Number(form.value.valor),
      data: brToIsoDate(form.value.data),
      meio_pagamento: form.value.meio_pagamento,
      observacao: form.value.observacao || null,
    }
    if (form.value.responsavel_id)
      payload.responsavel_id = form.value.responsavel_id

    await salvarReceita(payload as any)
    await navigateTo('/admin/receitas')
  }
  catch {
    snackbarMsg.value = 'Erro ao salvar receita. Tente novamente.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}
</script>

<template>
  <v-container fluid class="pa-2 pa-md-6" style="max-width: 700px;">
    <!-- Header -->
    <div class="d-flex align-center mb-5">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        color="secondary"
        class="me-2"
        to="/admin/receitas"
        :exact="true"
      />
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold text-secondary-darken-1 mb-0">
          Nova Receita
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Registre doações, campanhas, rifas ou outras entradas financeiras
        </p>
      </div>
    </div>

    <!-- Form card -->
    <v-card :elevation="0" class="border" rounded="xl">
      <v-card-text class="pa-5 pa-md-6">
        <v-form ref="formRef" v-model="formValid" validate-on="input lazy">
          <v-row>
            <!-- Tipo -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.tipo"
                :items="tipoOpcoes"
                item-title="title"
                item-value="value"
                label="Tipo *"
                variant="outlined"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-tag-outline"
              />
            </v-col>

            <!-- Data -->
            <v-col cols="12" sm="6">
              <MaskedDateField
                v-model="form.data"
                label="Data *"
                :rules="[rules.required]"
              />
            </v-col>

            <!-- Descrição -->
            <v-col cols="12">
              <v-text-field
                v-model="form.descricao"
                label="Descrição *"
                variant="outlined"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-text-short"
                placeholder="Ex: Rifa da festa, Doação Sr. João..."
                autofocus
              />
            </v-col>

            <!-- Valor -->
            <v-col cols="12" sm="6">
              <MaskedCurrencyField
                v-model="form.valor"
                label="Valor R$ *"
                :rules="[rules.required]"
                :min-value="0.01"
              />
            </v-col>

            <!-- Meio de pagamento -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.meio_pagamento"
                :items="meioOpcoes"
                item-title="title"
                item-value="value"
                label="Meio de recebimento *"
                variant="outlined"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-cash"
              />
            </v-col>

            <!-- Responsável (autocomplete de católicos) -->
            <v-col cols="12">
              <v-autocomplete
                v-model="form.responsavel_id"
                :items="catolicos"
                item-title="nome"
                item-value="id"
                label="Responsável pelo recebimento (opcional)"
                variant="outlined"
                :loading="loadingCatolicos"
                prepend-inner-icon="mdi-account-outline"
                clearable
                no-data-text="Nenhum paroquiano encontrado"
              />
            </v-col>

            <!-- Observação -->
            <v-col cols="12">
              <v-textarea
                v-model="form.observacao"
                label="Observação (opcional)"
                variant="outlined"
                rows="3"
                auto-grow
                prepend-inner-icon="mdi-note-outline"
                placeholder="Nome do doador, número da rifa, etc."
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <!-- Actions -->
      <v-divider />
      <v-card-actions class="pa-5">
        <v-btn variant="text" color="secondary" to="/admin/receitas" :exact="true">
          Cancelar
        </v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          variant="elevated"
          :loading="loading"
          prepend-icon="mdi-content-save"
          @click="submit"
        >
          Salvar Receita
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="2500" location="bottom end">
      {{ snackbarMsg }}
    </v-snackbar>
  </v-container>
</template>
