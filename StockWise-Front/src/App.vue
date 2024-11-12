<script setup>
import { RouterView } from 'vue-router'

// Por enquanto, mantemos o App.vue simples
// Mais tarde adicionaremos funcionalidades conforme necessário
</script>

<template>
  <v-app>
    <v-main>
      <v-container>
        <RouterView />
      </v-container>
    </v-main>
  </v-app>
</template>

<style>
/* Estilos globais podem ser adicionados aqui */
.v-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
}
</style>