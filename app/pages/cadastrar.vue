<script setup lang="ts">
import type { DirectusClient, RestClient } from '@directus/sdk'
import type { Catolico } from '~/types/schema'
import { createItem, readItems } from '@directus/sdk'
import { VMaskInput } from 'vuetify/labs/VMaskInput'
import { titleCase } from '~/utils/normalize-text'

const phone = ref('')
const phoneExists = ref<null | boolean>(null)
const checkingPhone = ref(false)
const fullName = ref('')
const gender = ref('')
const birthDate = ref('')
const submitting = ref(false)
const formRef = ref()
const snackbar = ref(false)
const snackbarText = ref('')

// Sucesso do cadastro
const successDialog = ref(false)
const successName = ref('')

const genderOptions = [
  { title: 'Masculino', value: 'M' },
  { title: 'Feminino', value: 'F' },
]

const phoneRules = [
  (v: string) => !!v || 'Telefone obrigatório',
  (v: string) => v.replace(/\D/g, '').length >= 10 || 'Telefone inválido',
]
const nameRules = [
  (v: string) => !!v || 'Nome obrigatório',
  (v: string) => v.length > 4 || 'Nome muito curto',
]
const genderRules = [
  (v: string) => !!v || 'Selecione o sexo',
]
const birthRules = [
  (v: string) => !!v || 'Data obrigatória',
]

/**
 * Consulta no Directus se o telefone já existe na collection catolico
 * @returns objeto { nome, instituicaoNome } se encontrado, senão null
 */
async function checkPhoneDirectus(cleanPhone: string): Promise<{ nome: string, instituicaoNome: string | null } | null> {
  try {
    const d = await useDirectusClient() as DirectusClient<Schema> & RestClient<Schema>
    const result = await d.request(readItems('catolico', {
      filter: { telefone: { _eq: cleanPhone } },
      fields: ['nome', { instituicao: ['nome'] }] as any,
      limit: 1,
    }))
    if (Array.isArray(result) && result.length > 0) {
      const item = result[0]
      let instituicaoNome: string | null = null
      if (item?.instituicao && typeof item.instituicao === 'object' && 'nome' in item.instituicao) {
        instituicaoNome = (item.instituicao as { nome?: string }).nome ?? null
      }
      return {
        nome: item?.nome ?? '',
        instituicaoNome,
      }
    }
    return null
  }
  catch (err) {
    console.error('Erro ao consultar telefone no Directus:', err)
    return null
  }
}

/**
 * Simula busca de telefone já cadastrado
 */
async function checkPhone() {
  if (!phone.value || phone.value.replace(/\D/g, '').length < 10)
    return
  checkingPhone.value = true
  await new Promise(r => setTimeout(r, 600))
  const cleanPhone = phone.value.replace(/\D/g, '')
  // Consulta real no Directus
  const found = await checkPhoneDirectus(cleanPhone)
  if (found) {
    phoneExists.value = true
    snackbarText.value = `Telefone já cadastrado para ${found.nome}${found.instituicaoNome ? ` da instituição ${found.instituicaoNome}` : ''}`
    snackbar.value = true
  }
  else {
    phoneExists.value = false
  }
  checkingPhone.value = false
}

/**
 * Normaliza o nome do fiel – reutiliza titleCase de normalize-text.ts
 */
function normalizeNomeFiel(nome: string): string {
  return titleCase(nome.replace(/[^a-zA-Z\u00C0-\u00FF\s-]/g, '').trim())
}

const confirmDialog = ref(false)

// Guarda snapshot dos dados para confirmação
const confirmData = ref({
  nome: '',
  telefone: '',
  sexo: '',
  nascimento: '',
})

function openConfirmDialog() {
  // Normaliza o nome antes de mostrar
  confirmData.value = {
    nome: normalizeNomeFiel(fullName.value),
    telefone: phone.value.replace(/\D/g, ''),
    sexo: genderOptions.find(g => g.value === gender.value)?.title || '',
    nascimento: formatBirthDateBR(birthDate.value),
  }
  confirmDialog.value = true
}

function formatBirthDateBR(dateStr: string): string {
  if (!dateStr)
    return ''

  const digits = dateStr.replace(/\D/g, '')
  if (digits.length === 8) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`
  }

  return dateStr
}

function parseDateBRtoISO(dateStr: string): string | undefined {
  const normalized = formatBirthDateBR(dateStr)
  if (!normalized)
    return undefined
  const pattern = /^(\d{2})\/(\d{2})\/(\d{4})$/
  const match = normalized.match(pattern)
  if (!match)
    return undefined
  return `${match[3]}-${match[2]}-${match[1]}`
}

async function onConfirmSubmit() {
  submitting.value = true
  try {
    // Cria o client tipado
    const d = await useDirectusClient() as DirectusClient<Schema> & RestClient<Schema>
    // Monta o payload conforme o schema
    const payload: Partial<Catolico> = {
      nome: confirmData.value.nome,
      telefone: confirmData.value.telefone,
      sexo: gender.value,
      nascimento: confirmData.value.nascimento
        ? parseDateBRtoISO(confirmData.value.nascimento) as any
        : undefined,
    }
    await d.request(createItem('catolico', payload))
    successName.value = confirmData.value.nome
    successDialog.value = true
    confirmDialog.value = false
  }
  catch (err: any) {
    snackbarText.value = `Erro ao cadastrar: ${err?.message || 'Erro desconhecido'}`
    snackbar.value = true
  }
  finally {
    submitting.value = false
  }
}

// Substituir o submit do form para abrir o modal de confirmação
async function onFormSubmit() {
  if (!formRef.value)
    return
  const { valid } = await formRef.value.validate()
  if (!valid)
    return
  // Normaliza o nome antes de mostrar
  fullName.value = normalizeNomeFiel(fullName.value)
  openConfirmDialog()
}

function resetForm() {
  phone.value = ''
  phoneExists.value = null
  fullName.value = ''
  gender.value = ''
  birthDate.value = ''
  if (formRef.value?.resetValidation)
    formRef.value.resetValidation()
  successDialog.value = false
}

const isFormValid = computed(() => {
  return (
    phoneExists.value === false
    && !!fullName.value
    && !!gender.value
    && /^\d{2}\/\d{2}\/\d{4}$/.test(formatBirthDateBR(birthDate.value))
    && !submitting.value
  )
})

interface Schema {
  catolico: Catolico[]
}

usePublicSeo({
  title: 'Cadastro de Católico',
  description: 'Cadastre-se para participar da comunidade católica e receber novidades pelo WhatsApp.',
  path: '/cadastrar',
})

function formatPhoneBR(phone: string): string {
  if (!phone)
    return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  else if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return phone
}
</script>

<template>
  <v-container class="fill-height d-flex align-center justify-center" fluid>
    <v-card max-width="440" width="100%" class="mx-3" rounded="xl" elevation="1">
      <v-card-text class="pa-5 pa-sm-7">
        <!-- Header -->
        <div class="text-center mb-5">
          <v-icon size="44" color="primary" class="mb-2">
            mdi-cross
          </v-icon>
          <h1 class="text-h5 font-weight-bold">
            Cadastro de Católico
          </h1>
          <p class="text-body-2 text-medium-emphasis mt-1">
            Preencha para fazer parte da comunidade
          </p>
        </div>

        <v-form ref="formRef" validate-on="input" @submit.prevent="onFormSubmit">
          <!-- Phone — botão embutido no campo -->
          <VMaskInput
            v-model="phone"
            label="WhatsApp"
            :rules="phoneRules"
            mask="(##) #####-####"
            prepend-inner-icon="mdi-whatsapp"
            type="tel"
            :maxlength="15"
            :disabled="checkingPhone"
            :loading="checkingPhone"
            autocomplete="tel"
            variant="outlined"
            rounded="lg"
            @keydown.enter.prevent="checkPhone"
          >
            <template #append-inner>
              <v-btn
                icon
                size="small"
                color="primary"
                variant="text"
                :loading="checkingPhone"
                :disabled="checkingPhone || !phone || phone.replace(/\D/g, '').length < 10"
                @click.stop="checkPhone"
              >
                <v-icon>mdi-arrow-right-circle</v-icon>
              </v-btn>
            </template>
          </VMaskInput>

          <!-- Campos extras — reveal animado -->
          <v-expand-transition>
            <div v-if="phoneExists === false">
              <v-text-field
                v-model="fullName"
                label="Nome completo"
                :rules="nameRules"
                variant="outlined"
                rounded="lg"
                autocomplete="name"
                @blur="fullName = normalizeNomeFiel(fullName)"
              />

              <v-row dense>
                <v-col cols="6">
                  <v-select
                    v-model="gender"
                    :items="genderOptions"
                    label="Sexo"
                    :rules="genderRules"
                    variant="outlined"
                    rounded="lg"
                  />
                </v-col>
                <v-col cols="6">
                  <MaskedDateField
                    v-model="birthDate"
                    label="Nascimento"
                    :rules="birthRules"
                    variant="outlined"
                    rounded="lg"
                  />
                </v-col>
              </v-row>

              <v-btn
                class="mt-2"
                color="primary"
                size="large"
                type="submit"
                block
                rounded="lg"
                :loading="submitting"
                :disabled="!isFormValid"
              >
                Cadastrar
              </v-btn>
            </div>
          </v-expand-transition>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Confirmação -->
    <v-dialog v-model="confirmDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="text-h6 pt-5 px-5">
          Conferir dados
        </v-card-title>
        <v-card-text class="px-5 pb-2">
          <v-table density="compact">
            <tbody>
              <tr>
                <td class="text-medium-emphasis">
                  Nome
                </td>
                <td class="font-weight-medium">
                  {{ confirmData.nome }}
                </td>
              </tr>
              <tr>
                <td class="text-medium-emphasis">
                  Telefone
                </td>
                <td class="font-weight-medium">
                  {{ formatPhoneBR(confirmData.telefone) }}
                </td>
              </tr>
              <tr>
                <td class="text-medium-emphasis">
                  Sexo
                </td>
                <td class="font-weight-medium">
                  {{ confirmData.sexo }}
                </td>
              </tr>
              <tr>
                <td class="text-medium-emphasis">
                  Nascimento
                </td>
                <td class="font-weight-medium">
                  {{ confirmData.nascimento }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-actions class="px-5 pb-4">
          <v-btn variant="text" :disabled="submitting" @click="confirmDialog = false">
            Editar
          </v-btn>
          <v-spacer />
          <v-btn color="primary" :loading="submitting" @click="onConfirmSubmit">
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Sucesso -->
    <v-dialog v-model="successDialog" max-width="400">
      <v-card rounded="xl" class="text-center pa-6">
        <v-icon size="56" color="success" class="mb-3">
          mdi-check-circle-outline
        </v-icon>
        <h2 class="text-h6 font-weight-bold mb-2">
          Cadastro realizado!
        </h2>
        <p class="text-body-2 text-medium-emphasis mb-5">
          <strong>{{ successName }}</strong> agora faz parte da comunidade.
        </p>
        <v-btn color="primary" block rounded="lg" class="mb-2" @click="resetForm">
          Novo cadastro
        </v-btn>
        <v-btn variant="text" block @click="navigateTo('/')">
          Voltar ao início
        </v-btn>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :timeout="7000" color="error">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>
