<script setup lang="ts">
import { ref } from 'vue'
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
 * Simula busca de telefone já cadastrado
 */
async function checkPhone() {
  if (!phone.value || phone.value.replace(/\D/g, '').length < 10)
    return
  checkingPhone.value = true
  // Simulação: telefone "999999999" já existe
  await new Promise(r => setTimeout(r, 600))
  phoneExists.value = phone.value.replace(/\D/g, '') === '999999999'
  checkingPhone.value = false
}

async function onSubmit() {
  if (!formRef.value?.isValid)
    return
  submitting.value = true
  // Simulação de cadastro
  await new Promise(r => setTimeout(r, 1000))
  submitting.value = false
  router.push('/')
}
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
            />
          </v-col>
          <v-col cols="3" class="d-flex align-center justify-center">
            <v-btn
              icon
              color="success"
              :loading="checkingPhone"
              :disabled="checkingPhone || !phone || phone.replace(/\D/g, '').length < 10"
              aria-label="Verificar telefone"
              style="height: 56px; min-width: 56px; padding: 0; align-self: center;"
              @click="checkPhone"
            >
              <v-icon>mdi-arrow-right</v-icon>
            </v-btn>
          </v-col>
        </v-row>
        <v-alert
          v-if="phoneExists === true"
          type="warning"
          class="mb-2"
          density="compact"
        >
          Este telefone já está cadastrado.
        </v-alert>
        <template v-if="phoneExists === false">
          <v-text-field
            v-model="fullName"
            label="Nome completo"
            :rules="nameRules"
            prepend-inner-icon="mdi-account"
            required
            autocomplete="name"
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
          >
            Cadastrar
          </v-btn>
        </template>
      </v-form>
    </v-card>
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
