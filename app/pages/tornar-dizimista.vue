<script setup lang="ts">
import type { DirectusClient, RestClient } from '@directus/sdk'
import type { Catolico, Dizimista } from '~/types/schema'
import { createItem, readItems } from '@directus/sdk'

// State
const phone = ref('')
const checkingPhone = ref(false)
const catolicoFound = ref<Catolico | null>(null)
const alreadyDizimista = ref<boolean | null>(null)
const valorMensal = ref<number | null>(null)
const submitting = ref(false)
const formRef = ref()
const router = useRouter()
const snackbar = ref(false)
const snackbarText = ref('')
const successDialog = ref(false)
const successName = ref('')

interface Schema {
  catolico: Catolico[]
  dizimista: Dizimista[]
}

// Rules
const phoneRules = [
  (v: string) => !!v || 'Telefone obrigatório',
  (v: string) => v.replace(/\D/g, '').length >= 10 || 'Telefone inválido',
]
const valorRules = [
  (v: number) => v > 0 || 'O valor deve ser maior que zero',
]

/**
 * Checks if a catholic with the given phone number exists.
 * @param cleanPhone The clean phone number (digits only).
 * @returns The catholic person object or null if not found.
 */
async function findCatolicoByPhone(cleanPhone: string): Promise<Catolico | null> {
  try {
    const d = await useDirectusClient() as DirectusClient<Schema> & RestClient<Schema>
    const result = await d.request(readItems('catolico', {
      filter: { telefone: { _eq: cleanPhone } },
      limit: 1,
    }))
    // The Directus SDK returns date fields as strings, while schema.ts expects 'datetime'.
    // We cast the result to Catolico to satisfy the type checker,
    // as changing the generated schema.ts is not desirable.
    return (result?.[0] as Catolico) || null
  }
  catch (err) {
    console.error('Erro ao buscar católico pelo telefone:', err)
    snackbarText.value = 'Erro ao verificar o telefone. Tente novamente.'
    snackbar.value = true
    return null
  }
}

/**
 * Checks if a catholic is already a tither.
 * @param catolicoId The ID of the catholic person.
 * @returns True if the person is a tither, false otherwise.
 */
async function checkIfDizimista(catolicoId: string): Promise<boolean> {
  try {
    const d = await useDirectusClient() as DirectusClient<Schema> & RestClient<Schema>
    const result = await d.request(readItems('dizimista', {
      filter: { catolico: { _eq: catolicoId } },
      limit: 1,
    }))
    return result.length > 0
  }
  catch (err) {
    console.error('Erro ao verificar se é dizimista:', err)
    snackbarText.value = 'Erro ao verificar se já é dizimista.'
    snackbar.value = true
    return false
  }
}

/**
 * Handles the phone number check.
 */
async function checkPhone() {
  if (!phone.value || phone.value.replace(/\D/g, '').length < 10)
    return

  checkingPhone.value = true
  catolicoFound.value = null
  alreadyDizimista.value = null
  valorMensal.value = null

  const cleanPhone = phone.value.replace(/\D/g, '')
  const found = await findCatolicoByPhone(cleanPhone)

  if (found) {
    catolicoFound.value = found
    const isDizimista = await checkIfDizimista(found.id)
    if (isDizimista) {
      alreadyDizimista.value = true
      snackbarText.value = `${found.nome} já é um dizimista. Obrigado por sua contribuição! 🙏`
      snackbar.value = true
    }
    else {
      alreadyDizimista.value = false
    }
  }
  else {
    snackbarText.value = 'Nenhum católico encontrado com este telefone. Por favor, realize o cadastro primeiro.'
    snackbar.value = true
    setTimeout(() => router.push('/cadastrar'), 3000)
  }
  checkingPhone.value = false
}

/**
 * Submits the form to make the catholic a tither.
 */
async function onFormSubmit() {
  if (!formRef.value)
    return
  const { valid } = await formRef.value.validate()
  if (!valid || !catolicoFound.value || !valorMensal.value)
    return

  submitting.value = true
  try {
    const d = await useDirectusClient() as DirectusClient<Schema> & RestClient<Schema>
    const payload: Partial<Dizimista> = {
      catolico: catolicoFound.value.id,
      valor_mensal: valorMensal.value,
      // Assuming institution is inherited from the catholic person
      instituicao: typeof catolicoFound.value.instituicao === 'number' ? catolicoFound.value.instituicao : undefined,
    }
    await d.request(createItem('dizimista', payload))
    successName.value = catolicoFound.value.nome
    successDialog.value = true
  }
  catch (err: any) {
    snackbarText.value = `Erro ao registrar dízimo: ${err?.message || 'Erro desconhecido'}`
    snackbar.value = true
  }
  finally {
    submitting.value = false
  }
}

function resetForm() {
  phone.value = ''
  catolicoFound.value = null
  alreadyDizimista.value = null
  valorMensal.value = null
  if (formRef.value?.resetValidation)
    formRef.value.resetValidation()
  successDialog.value = false
}

const isFormValid = computed(() => {
  return catolicoFound.value && !alreadyDizimista.value && valorMensal.value && valorMensal.value > 0 && !submitting.value
})

useSeoMeta({
  title: 'Tornar-se Dizimista',
  description: 'Contribua com a sua comunidade tornando-se um dizimista. Um gesto de fé e partilha.',
  ogTitle: 'Tornar-se Dizimista',
  ogDescription: 'Contribua com a sua comunidade tornando-se um dizimista. Um gesto de fé e partilha.',
  ogType: 'website',
})
</script>

<template>
  <v-container class="fill-height d-flex flex-column justify-center align-center" fluid>
    <v-card class="pa-4" max-width="420" width="100%">
      <v-card-title class="text-h6 text-center mb-2">
        Tornar-se Dizimista
      </v-card-title>
      <v-card-subtitle class="text-center mb-4">
        Informe seu telefone para começar.
      </v-card-subtitle>
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
              @keydown.enter.prevent="!catolicoFound && checkPhone"
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

        <template v-if="catolicoFound && alreadyDizimista === false">
          <div class="text-center my-4">
            <p class="text-h6">
              Olá, <span class="text-primary font-weight-bold">{{ catolicoFound.nome }}</span>!
            </p>
            <p>Que bom ver você por aqui. Vamos registrar sua contribuição?</p>
          </div>

          <v-text-field
            v-model.number="valorMensal"
            label="Valor da Contribuição Mensal"
            :rules="valorRules"
            prepend-inner-icon="mdi-cash-multiple"
            type="number"
            prefix="R$"
            required
            placeholder="50.00"
          />

          <v-btn
            class="mt-4"
            color="primary"
            type="submit"
            block
            :loading="submitting"
            :disabled="!isFormValid"
          >
            Registrar Contribuição
          </v-btn>
        </template>
      </v-form>
    </v-card>

    <v-snackbar
      v-model="snackbar"
      :timeout="7000"
      color="info"
      location="top"
    >
      {{ snackbarText }}
    </v-snackbar>

    <v-dialog v-model="successDialog" max-width="400">
      <v-card class="pa-5 text-center" prepend-icon="mdi-heart">
        <template #title>
          <span class="font-weight-black"> Contribuição registrada!</span>
        </template>
        <div class="mb-4">
          Obrigado, <span class="text-primary">{{ successName }}</span>!<br>
          Sua generosidade fortalece nossa comunidade. Deus lhe pague! 🙏
        </div>
        <v-btn color="primary" class="mb-2" block @click="resetForm">
          Registrar outra pessoa
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
