<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const { entrar, loading } = useAuth()
const router = useRouter()

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

async function handleLogin() {
  try {
    await entrar({ email: email.value, password: password.value })
    snackbarText.value = 'Login realizado com sucesso!'
    snackbarColor.value = 'success'
    snackbar.value = true
    setTimeout(() => {
      router.push('/admin/resumo')
    }, 2000)
  }
  catch (e: any) {
    // Tenta extrair mensagem amigável do erro do Directus
    let msg = 'Login falhou. Verifique suas credenciais.'
    if (e && e.errors && Array.isArray(e.errors) && e.errors[0]?.message) {
      msg = e.errors[0].message
    }
    else if (e?.message) {
      msg = e.message
    }
    snackbarText.value = msg
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Administração</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="email"
                label="Email"
                name="email"
                prepend-icon="mdi-account"
                type="email"
                required
                :disabled="loading"
              />
              <v-text-field
                v-model="password"
                label="Password"
                name="password"
                prepend-icon="mdi-lock"
                :type="showPassword ? 'text' : 'password'"
                required
                :disabled="loading"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showPassword = !showPassword"
              />
              <v-card-actions>
                <v-spacer />
                <v-btn color="primary" type="submit" :loading="loading">
                  Entrar
                </v-btn>
              </v-card-actions>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="3000"
      location="top right"
    >
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>
