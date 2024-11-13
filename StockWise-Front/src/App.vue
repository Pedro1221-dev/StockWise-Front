<script setup>
import { RouterView } from 'vue-router'
import Header from '@/components/Header.vue'

// Por enquanto, mantemos o App.vue simples
// Mais tarde adicionaremos funcionalidades conforme necessário

</script>

<template>
  <v-app>
    <Header />
    <v-main>
      <v-container>
        <RouterView />
      </v-container>
    </v-main>
  </v-app>
</template>

<style>
.v-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
}
</style>