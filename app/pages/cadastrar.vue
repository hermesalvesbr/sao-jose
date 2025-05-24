<script setup lang="ts">
import type { createDirectus, DirectusClient, RestClient } from '@directus/sdk'
import type { Catolico } from '~/types/schema'
import { useSeoMeta } from '#imports'
import { readItems, rest, staticToken } from '@directus/sdk'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
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

// Fakedata: telefone e nome já cadastrados
const FAKE_PHONE = '87992005656'
const FAKE_NAME = 'Hermes Alves'

/**
 * Simula busca de telefone já cadastrado
 */
async function checkPhone() {
  if (!phone.value || phone.value.replace(/\D/g, '').length < 10)
    return
  checkingPhone.value = true
  await new Promise(r => setTimeout(r, 600))
  const cleanPhone = phone.value.replace(/\D/g, '')
  if (cleanPhone === FAKE_PHONE) {
    phoneExists.value = true
    snackbarText.value = `Telefone já cadastrado para ${FAKE_NAME}`
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

async function onSubmit() {
  if (!formRef.value)
    return
  const { valid } = await formRef.value.validate()
  if (!valid)
    return
  submitting.value = true
  // Normaliza o nome antes de salvar
  fullName.value = normalizeNomeFiel(fullName.value)
  // Simulação de cadastro
  await new Promise(r => setTimeout(r, 1000))
  submitting.value = false
  successName.value = fullName.value
  successDialog.value = true
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

/**
 * Exemplo de interface para a collection 'catolico'.
 * Idealmente, mova para types/Catolico.ts e importe aqui.
 */
// interface Catolico {
//   id: string
//   // Adicione outros campos conforme o schema do Directus
// }

interface Schema {
  catolico: Catolico[]
}

/**
 * Testa integração com Directus usando o client tipado e await correto.
 * Segue a documentação oficial do SDK.
 * https://directus.io/docs/guides/connect/sdk
 */
async function testeDirectus() {
  // Aguarde o client e faça o cast correto para incluir RestClient
  const d = await useDirectusClient() as DirectusClient<Schema> & RestClient<Schema>
  try {
    // readItems precisa ser tipado para a collection
    const allCatolicos = await d.request(readItems('catolico'))
    console.warn('Católicos do Directus:', allCatolicos)
  }
  catch (err) {
    console.error('Erro ao buscar catolicos:', err)
  }
}
testeDirectus()

useSeoMeta({
  title: 'Cadastro de Católico',
  description: 'Cadastre-se para participar da comunidade católica e receber novidades pelo WhatsApp.',
  ogTitle: 'Cadastro de Católico',
  ogDescription: 'Cadastre-se para participar da comunidade católica e receber novidades pelo WhatsApp.',
  ogType: 'website',
})
</script>

<template>
  <v-container class="fill-height d-flex flex-column justify-center align-center" fluid>
    <v-card class="pa-4" max-width="420" width="100%">
      <v-card-title class="text-h6 text-center mb-2">
        Cadastro de Católico
      </v-card-title>
      <v-form ref="formRef" validate-on="input" @submit.prevent="onSubmit">
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
          <v-text-field
            v-model="birthDate"
            label="Data de nascimento"
            :rules="birthRules"
            prepend-inner-icon="mdi-cake-variant"
            type="date"
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
</style>
