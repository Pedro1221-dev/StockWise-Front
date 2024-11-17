// StockWise-Front\src\components\Header.vue
<template>
  <v-app-bar>
    <v-app-bar-title>
      <router-link 
        to="/houses" 
        class="text-decoration-none primary--text"
      >
        StockWise
      </router-link>
    </v-app-bar-title>

    <v-spacer></v-spacer>

    <!-- Componente de Notificações -->
    <AlertsNotification v-if="isAuthenticated" />

    <!-- Menu de Utilizador -->
    <v-btn
      v-if="isAuthenticated"
      icon
      @click="logout"
    >
      <v-icon>mdi-logout</v-icon>
    </v-btn>
  </v-app-bar>
</template>

<script setup>
import { computed } from 'vue';
import { useUserStore } from '@/stores/user';
import AlertsNotification from './AlertsNotification.vue';

const userStore = useUserStore();
const isAuthenticated = computed(() => userStore.isAuthenticated);

const logout = () => {
  userStore.logout();
};
</script>