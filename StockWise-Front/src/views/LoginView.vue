<!-- src/views/LoginView.vue -->
<template>
  <main>
    <!-- Alerta de token expirado -->
    <v-alert
      v-if="showExpiredAlert"
      type="warning"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="clearExpiredAlert"
    >
      A sua sessão expirou. Por favor, faça login novamente.
    </v-alert>

    <LoginForm />
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import LoginForm from '../components/LoginForm.vue';

const route = useRoute();
const showExpiredAlert = ref(false);

onMounted(() => {
  // Verificar se o utilizador foi redirecionado por token expirado
  showExpiredAlert.value = route.query.expired === 'true';
});

const clearExpiredAlert = () => {
  showExpiredAlert.value = false;
};
</script>