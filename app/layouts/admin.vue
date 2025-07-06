<script setup lang="ts">
</script>

<template>
  <v-app>
    <v-main>
      <slot />
    </v-main>

    <v-bottom-navigation grow>
      <v-btn value="resumo" to="/admin/resumo">
        <v-icon>mdi-home</v-icon>
        <span>Resumo</span>
      </v-btn>

      <v-btn value="ofertorio">
        <v-icon>mdi-cash-multiple</v-icon>
        <span>Ofertório</span>
      </v-btn>

      <v-btn value="dizimos">
        <v-icon>mdi-account-cash</v-icon>
        <span>Dízimos</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>
