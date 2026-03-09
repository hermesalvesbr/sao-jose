<script setup lang="ts">
import { readItems } from '@directus/sdk'
/**
 * Editar Receita — Formulário de edição
 *
 * Carrega a receita pelo ID e permite editar todos os campos.
 */
import { brToIsoDate, isoToBrDate } from '~/composables/usePdvReport'
import { MEIO_PAGAMENTO_LABELS, TIPO_RECEITA_LABELS } from '~/composables/useReceitas'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const id = computed(() => route.params.id as string)

const {
  fetchReceitaById,
  atualizarReceita,
  loading,
} = useReceitas()

// ─── Opções de select ─────────────────────────────────────────────────────────
const tipoOpcoes = Object.entries(TIPO_RECEITA_LABELS).map(([value, title]) => ({ value, title }))
const meioOpcoes = Object.entries(MEIO_PAGAMENTO_LABELS).map(([value, title]) => ({ value, title }))

// ─── Católicos para autocomplete ──────────────────────────────────────────────
const catolicos = ref<{ id: string, nome: string }[]>([])

async function loadCatolicos() {
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
}

// ─── Form state ───────────────────────────────────────────────────────────────
const formRef = ref()
const formValid = ref(false)
const notFound = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

const form = ref({
  tipo: null as string | null,
  descricao: '',
  valor: undefined as number | undefined,
  data: '',
  meio_pagamento: null as string | null,
  responsavel_id: null as string | null,
  observacao: '',
})

async function loadForm() {
  const receita = await fetchReceitaById(id.value)
  if (!receita) {
    notFound.value = true
    return
  }
  const resp = receita.responsavel_id
  form.value = {
    tipo: receita.tipo ?? null,
    descricao: receita.descricao ?? '',
    valor: receita.valor ?? undefined,
    data: isoToBrDate(receita.data as string),
    meio_pagamento: receita.meio_pagamento ?? null,
    responsavel_id: (typeof resp === 'object' && resp) ? (resp as any).id : resp ?? null,
    observacao: receita.observacao ?? '',
  }
}

// ─── Regras de validação ──────────────────────────────────────────────────────
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
    else
      payload.responsavel_id = null

    await atualizarReceita(id.value, payload as any)
    await navigateTo('/admin/receitas')
  }
  catch {
    snackbarMsg.value = 'Erro ao salvar receita. Tente novamente.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([loadForm(), loadCatolicos()])
})
</script>

<template>
  <v-container fluid class="pa-2 pa-md-6" style="max-width: 700px;">
    <!-- Not found -->
    <v-alert v-if="notFound" type="error" variant="tonal" class="mb-4">
      Receita não encontrada.
      <template #append>
        <v-btn variant="text" to="/admin/receitas" :exact="true">
          Voltar
        </v-btn>
      </template>
    </v-alert>

    <template v-if="!notFound">
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
            Editar Receita
          </h1>
          <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
            Atualize os dados e gerencie os comprovantes
          </p>
        </div>
      </div>

      <!-- Form card -->
      <v-card :elevation="0" class="border mb-4" rounded="xl">
        <v-card-text class="pa-5 pa-md-6">
          <v-form ref="formRef" v-model="formValid" validate-on="input lazy">
            <v-row>
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

              <v-col cols="12" sm="6">
                <MaskedDateField
                  v-model="form.data"
                  label="Data *"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="form.descricao"
                  label="Descrição *"
                  variant="outlined"
                  :rules="[rules.required]"
                  prepend-inner-icon="mdi-text-short"
                />
              </v-col>

              <v-col cols="12" sm="6">
                <MaskedCurrencyField
                  v-model="form.valor"
                  label="Valor R$ *"
                  :rules="[rules.required]"
                  :min-value="0.01"
                />
              </v-col>

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

              <v-col cols="12">
                <v-autocomplete
                  v-model="form.responsavel_id"
                  :items="catolicos"
                  item-title="nome"
                  item-value="id"
                  label="Responsável pelo recebimento (opcional)"
                  variant="outlined"
                  prepend-inner-icon="mdi-account-outline"
                  clearable
                  no-data-text="Nenhum paroquiano encontrado"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="form.observacao"
                  label="Observação (opcional)"
                  variant="outlined"
                  rows="3"
                  auto-grow
                  prepend-inner-icon="mdi-note-outline"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

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
            Salvar Alterações
          </v-btn>
        </v-card-actions>
      </v-card>

    </template>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="bottom end">
      {{ snackbarMsg }}
    </v-snackbar>
  </v-container>
</template>
