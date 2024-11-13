<template>
  <v-app-bar app color="primary" dark>
    <v-toolbar-title>StockWise</v-toolbar-title>
    <v-spacer></v-spacer>
    
    <!-- Menu do utilizador -->
    <v-menu v-if="isAuthenticated" offset-y>
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props">
          <v-icon>mdi-account-circle</v-icon>
        </v-btn>
      </template>
      
      <v-list>
        <v-list-item @click="handleLogout">
          <v-list-item-title>
            <v-icon left>mdi-logout</v-icon>
            Terminar Sessão
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'

const router = useRouter()
const userStore = useUserStore()
const { isAuthenticated } = storeToRefs(userStore)

// Função para gerir o logout
const handleLogout = async () => {
  try {
    userStore.logout()
    await router.push({ name: 'login' })
  } catch (error) {
    console.error('Erro ao terminar sessão:', error)
  }
}
</script>