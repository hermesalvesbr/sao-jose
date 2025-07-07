<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})
</script>

<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="text-h5">
            Gestão de Dízimos
          </v-card-title>
          <v-card-text>
            <p>Aqui você pode gerenciar os dízimos da paróquia.</p>

            <!-- Exemplo de funcionalidades futuras -->
            <v-row>
              <v-col cols="12" sm="6" md="4">
                <v-card variant="outlined" class="text-center pa-4">
                  <v-icon size="48" color="primary">
                    mdi-plus-circle
                  </v-icon>
                  <v-card-title class="text-subtitle-1">
                    Registrar Dízimo
                  </v-card-title>
                  <v-btn color="primary" variant="outlined" class="mt-2">
                    Adicionar
                  </v-btn>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6" md="4">
                <v-card variant="outlined" class="text-center pa-4">
                  <v-icon size="48" color="secondary">
                    mdi-chart-line
                  </v-icon>
                  <v-card-title class="text-subtitle-1">
                    Relatórios
                  </v-card-title>
                  <v-btn color="secondary" variant="outlined" class="mt-2">
                    Ver Relatórios
                  </v-btn>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6" md="4">
                <v-card variant="outlined" class="text-center pa-4">
                  <v-icon size="48" color="info">
                    mdi-account-group
                  </v-icon>
                  <v-card-title class="text-subtitle-1">
                    Dizimistas
                  </v-card-title>
                  <v-btn color="info" variant="outlined" class="mt-2">
                    Gerenciar
                  </v-btn>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
