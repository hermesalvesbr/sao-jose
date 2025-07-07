<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})
</script>

<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>Painel de Controle</v-card-title>
          <v-card-text>
            <p>Bem-vindo ao painel administrativo da Paróquia São José.</p>

            <!-- Cards de resumo rápido -->
            <v-row class="mt-4">
              <v-col cols="12" sm="6" md="4">
                <v-card color="primary" dark>
                  <v-card-text class="text-center">
                    <v-icon size="48">
                      mdi-cash-multiple
                    </v-icon>
                    <div class="text-h6 mt-2">
                      Ofertório Hoje
                    </div>
                    <div class="text-h4">
                      R$ 0,00
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6" md="4">
                <v-card color="secondary" dark>
                  <v-card-text class="text-center">
                    <v-icon size="48">
                      mdi-account-cash
                    </v-icon>
                    <div class="text-h6 mt-2">
                      Dízimos
                    </div>
                    <div class="text-h4">
                      R$ 0,00
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6" md="4">
                <v-card color="info" dark>
                  <v-card-text class="text-center">
                    <v-icon size="48">
                      mdi-calendar
                    </v-icon>
                    <div class="text-h6 mt-2">
                      Eventos
                    </div>
                    <div class="text-h4">
                      0
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
