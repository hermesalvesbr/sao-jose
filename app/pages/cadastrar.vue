<script setup lang="ts">
import type { DirectusClient, RestClient } from '@directus/sdk'
import type { Catolico } from '~/types/schema'
import { useSeoMeta } from '#imports'
import { createItem, readItems } from '@directus/sdk'
import { DateTime } from 'luxon'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import MaskedDateField from '~/components/MaskedDateField.vue'
import MaskedTextField from '~/components/MaskedTextField.vue'

const phone = ref('')
const phoneExists = ref<null | boolean>(null)
const checkingPhone = ref(false)
const fullName = ref('')
const gender = ref('')
const birthDate = ref('')
const submitting = ref(false)
const formRef = ref()
const router = useRouter()
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
 * Normaliza o nome do fiel para padronização de dados
 */
function normalizeNomeFiel(nome: string): string {
  const palavrasMinusculas = [
    'da',
    'de',
    'do',
    'das',
    'dos',
    'e',
    'em',
    'na',
    'no',
    'nas',
    'nos',
    'por',
    'para',
    'com',
    'sem',
    'sob',
    'sobre',
    'entre',
    'até',
    'após',
    'ante',
    'após',
    'até',
    'com',
    'contra',
    'desde',
    'em',
    'entre',
    'para',
    'perante',
    'por',
    'sem',
    'sob',
    'sobre',
    'trás',
  ]
  let normalized = nome.replace(/[^a-zA-Z\u00C0-\u00FF\s-]/g, '')
  normalized = normalized.toLowerCase()
  normalized = normalized.replace(/\s+/g, ' ').trim()
  normalized = normalized.split(' ').map((word, index) => {
    if (index === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    }
    if (palavrasMinusculas.includes(word.toLowerCase())) {
      return word.toLowerCase()
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }).join(' ')
  return normalized
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
    nascimento: birthDate.value,
  }
  confirmDialog.value = true
}

/**
 * Converte data BR (DD/MM/AAAA) para ISO (YYYY-MM-DD) de forma robusta
 * Usa Luxon para parsing seguro
 * @param dateStr string no formato DD/MM/AAAA
 * @returns string no formato YYYY-MM-DD ou undefined se inválido
 */
function parseDateBRtoISO(dateStr: string): string | undefined {
  if (!dateStr)
    return undefined
  const dt = DateTime.fromFormat(dateStr, 'dd/MM/yyyy')
  if (!dt.isValid)
    return undefined
  return dt.toISODate() // YYYY-MM-DD
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
    && !!birthDate.value
    && !submitting.value
  )
})

interface Schema {
  catolico: Catolico[]
}

useSeoMeta({
  title: 'Cadastro de Católico',
  description: 'Cadastre-se para participar da comunidade católica e receber novidades pelo WhatsApp.',
  ogTitle: 'Cadastro de Católico',
  ogDescription: 'Cadastre-se para participar da comunidade católica e receber novidades pelo WhatsApp.',
  ogType: 'website',
})

function formatDateBR(dateStr: string): string {
  if (!dateStr)
    return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime()))
    return dateStr
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = String(d.getFullYear()).slice(-2)
  return `${day}/${month}/${year}`
}

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
  <v-container class="fill-height d-flex flex-column justify-center align-center" fluid>
    <v-card class="pa-4" max-width="420" width="100%">
      <v-card-title class="text-h6 text-center mb-2">
        Cadastro de Católico
      </v-card-title>
      <v-form ref="formRef" validate-on="input" @submit.prevent="onFormSubmit">
        <v-row no-gutters align="center">
          <v-col cols="9">
            <MaskedTextField
              v-model="phone"
              label="Telefone (WhatsApp)"
              :rules="phoneRules"
              prepend-inner-icon="mdi-whatsapp"
              type="tel"
              :maxlength="15"
              required
              :disabled="checkingPhone"
              :loading="checkingPhone"
              autocomplete="tel"
              mask="(##) #####-####"
              placeholder="(87) 99200-5656"
              color="success"
              custom-class="arrojado-phone"
              @blur="checkPhone"
              @keydown.enter.prevent="phoneExists !== false && checkPhone"
            />
          </v-col>
          <v-col cols="3" class="d-flex align-center justify-center mb-5">
            <v-btn
              icon
              :loading="checkingPhone"
              :disabled="checkingPhone || !phone || phone.replace(/\D/g, '').length < 10"
              aria-label="Verificar telefone"
              @click="checkPhone"
            >
              <v-icon>mdi-arrow-right</v-icon>
            </v-btn>
          </v-col>
        </v-row>
        <template v-if="phoneExists === false">
          <v-text-field
            v-model="fullName"
            label="Nome completo"
            :rules="nameRules"
            prepend-inner-icon="mdi-account"
            required
            autocomplete="name"
            @input="fullName = normalizeNomeFiel(fullName)"
          />
          <v-select
            v-model="gender"
            :items="genderOptions"
            label="Sexo"
            :rules="genderRules"
            prepend-inner-icon="mdi-gender-male-female"
            required
          />
          <MaskedDateField
            v-model="birthDate"
            label="Data de nascimento"
            :rules="birthRules"
            prepend-inner-icon="mdi-cake-variant"
            required
          />
          <v-btn
            class="mt-4"
            color="primary"
            type="submit"
            block
            :loading="submitting"
            :disabled="!isFormValid"
          >
            Cadastrar
          </v-btn>
        </template>
      </v-form>
    </v-card>
    <!-- Modal de confirmação -->
    <v-dialog v-model="confirmDialog" max-width="420">
      <v-card class="pa-5 text-center confirm-modal">
        <template #title>
          <v-icon color="primary" size="40">
            mdi-account-check
          </v-icon>
          <span class="font-weight-bold text-h6 d-block mt-2">Conferir dados do cadastro</span>
        </template>
        <v-divider class="my-3" />
        <div class="mb-2 text-left">
          <div class="mb-1">
            <v-icon color="success" size="20">
              mdi-account
            </v-icon> <b>Nome:</b> {{ confirmData.nome }}
          </div>
          <div class="mb-1">
            <v-icon color="success" size="20">
              mdi-whatsapp
            </v-icon> <b>Telefone:</b> {{ formatPhoneBR(confirmData.telefone) }}
          </div>
          <div class="mb-1">
            <v-icon color="success" size="20">
              mdi-gender-male-female
            </v-icon> <b>Sexo:</b> {{ confirmData.sexo }}
          </div>
          <div class="mb-1">
            <v-icon color="success" size="20">
              mdi-cake-variant
            </v-icon> <b>Nascimento:</b> {{ formatDateBR(confirmData.nascimento) }}
          </div>
        </div>
        <v-divider class="my-3" />
        <div class="d-flex flex-column gap-2">
          <v-btn color="primary" class="mb-2" block :loading="submitting" @click="onConfirmSubmit">
            Confirmar e cadastrar
          </v-btn>
          <v-btn variant="outlined" color="secondary" block :disabled="submitting" @click="confirmDialog = false">
            Editar dados
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
    <v-snackbar
      v-model="snackbar"
      :timeout="7000"
      color="error"
      location="top"
    >
      {{ snackbarText }}
    </v-snackbar>
    <v-dialog v-model="successDialog" max-width="400">
      <v-card class="pa-5 text-center" prepend-icon="mdi-party-popper">
        <template #title>
          <span class="font-weight-black"> Cadastro realizado com sucesso!</span>
        </template>
        <div class="mb-4">
          Parabéns, <span class="text-primary">{{ successName }}</span> foi cadastrado(a) com sucesso!<br>
          Que alegria tê-lo(a) em nossa comunidade. 🙏
        </div>
        <v-btn color="primary" class="mb-2" block @click="resetForm">
          Cadastrar novo fiel
        </v-btn>
        <v-btn variant="outlined" color="secondary" block @click="router.push('/')">
          Voltar para início
        </v-btn>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.v-card {
  box-shadow: 0 2px 12px #5d40371a;
  border-radius: 18px;
}
.arrojado-phone input {
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: 1px;
  color: #388e3c;
  background: #f9fbe7;
  border-radius: 8px;
}
@media (max-width: 600px) {
  .v-card {
    max-width: 100vw;
    min-width: 0;
    padding: 8px !important;
  }
  .arrojado-phone input {
    font-size: 1rem;
  }
}
.confirm-modal {
  border-radius: 20px;
  background: linear-gradient(135deg, #f9fbe7 80%, #e8f5e9 100%);
  box-shadow: 0 4px 24px #388e3c22;
}
.confirm-modal .v-icon {
  vertical-align: middle;
}
.confirm-modal .text-h6 {
  color: #388e3c;
}
.confirm-modal b {
  color: #5d4037;
}
</style>
