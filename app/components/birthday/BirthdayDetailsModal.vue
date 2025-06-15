<script setup lang="ts">
import type { Catolico } from '~/types/schema'
import { DateTime } from 'luxon'

interface Props {
  modelValue: boolean
  catolico: Catolico | null
}

defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function close() {
  emit('update:modelValue', false)
}

function formatDate(date: string | undefined) {
  if (!date)
    return 'Data não informada'
  const meses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]
  const dt = DateTime.fromISO(date)
  return `${dt.day} de ${meses[dt.month - 1]}`
}

function getSexoIcon(sexo: string | undefined) {
  if (sexo === 'M')
    return 'mdi-gender-male'
  if (sexo === 'F')
    return 'mdi-gender-female'
  return 'mdi-account'
}

function getDiasParaAniversario(nascimento: string | undefined) {
  if (!nascimento)
    return 'Data não informada'

  const hoje = DateTime.now()
  const dataNascimento = DateTime.fromISO(nascimento)
  const proximoAniversario = DateTime.fromObject({
    year: hoje.year,
    month: dataNascimento.month,
    day: dataNascimento.day,
  })

  const diasRestantes = Math.floor(proximoAniversario.diff(hoje, 'days').days)

  // Se o aniversário já passou este ano, calcula para o próximo ano
  if (diasRestantes < 0) {
    return 'O aniversário já passou este ano.'
  }

  if (diasRestantes === 0)
    return 'É hoje! 🎉'
  if (diasRestantes === 1)
    return 'Falta 1 dia para o aniversário'
  return `Faltam ${diasRestantes} dias para o aniversário`
}

function maskPhoneNumber(phone: string | undefined) {
  if (!phone)
    return 'Não informado'
  if (phone.length <= 2)
    return phone
  return `${phone.slice(0, -2)}**`
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="600"
    transition="dialog-bottom-transition"
    @update:model-value="emit('update:modelValue', $event)"
    @click:outside="close"
  >
    <v-card v-if="catolico" class="rounded-xl elevation-8" style="border: 2px solid #bfa046; background: linear-gradient(135deg, #fffbe6 0%, #f7f3e3 100%);">
      <v-card-title class="text-h5 font-weight-bold pa-4 d-flex align-center" style="background: linear-gradient(90deg, #bfa046 0%, #e6d8a7 100%); color: #3e5c3a; border-top-left-radius: 18px; border-top-right-radius: 18px;">
        <v-icon icon="mdi-cross" class="mr-2" color="#3e5c3a" size="32" />
        <div>
          <div>{{ catolico.nome || 'Nome não informado' }}</div>
          <div class="text-caption font-italic" style="color: #3e5c3a;">
            Capela de São José
          </div>
        </div>
      </v-card-title>

      <v-card-text class="pa-6">
        <v-row>
          <v-col cols="12" md="6">
            <v-list-item class="px-0">
              <template #prepend>
                <v-icon icon="mdi-cake-variant" color="#bfa046" class="mr-2" />
              </template>
              <v-list-item-title class="text-subtitle-2 text-medium-emphasis">
                Data de nascimento
              </v-list-item-title>
              <v-list-item-subtitle class="text-body-1">
                {{ formatDate(catolico.nascimento) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>

          <v-col cols="12" md="6">
            <v-list-item class="px-0">
              <template #prepend>
                <v-icon icon="mdi-phone" color="#bfa046" class="mr-2" />
              </template>
              <v-list-item-title class="text-subtitle-2 text-medium-emphasis">
                Telefone
              </v-list-item-title>
              <v-list-item-subtitle class="text-body-1">
                {{ maskPhoneNumber(catolico.telefone) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>

          <v-col cols="12" md="6">
            <v-list-item class="px-0">
              <template #prepend>
                <v-icon :icon="getSexoIcon(catolico.sexo)" color="#bfa046" class="mr-2" />
              </template>
              <v-list-item-title class="text-subtitle-2 text-medium-emphasis">
                Sexo
              </v-list-item-title>
              <v-list-item-subtitle class="text-body-1">
                {{ catolico.sexo === 'M' ? 'Masculino' : catolico.sexo === 'F' ? 'Feminino' : 'Não informado' }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>

          <v-col cols="12" md="6">
            <v-list-item class="px-0">
              <template #prepend>
                <v-icon icon="mdi-calendar-clock" color="#bfa046" class="mr-2" />
              </template>
              <v-list-item-title class="text-subtitle-2 text-medium-emphasis">
                Próximo aniversário
              </v-list-item-title>
              <v-list-item-subtitle class="text-body-1">
                {{ getDiasParaAniversario(catolico.nascimento) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          style="border: 1.5px solid #bfa046; color: #bfa046; background: #fffbe6; font-weight: 600; letter-spacing: 1px; border-radius: 12px;"
          variant="text"
          @click="close"
        >
          Fechar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
