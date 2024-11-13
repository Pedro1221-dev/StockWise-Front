// src/views/ErrorPage.vue
<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="text-center pa-6">
          <v-card-title class="text-h4 mb-4">
            {{ title }}
          </v-card-title>
          
          <v-card-text class="text-body-1">
            {{ message }}
          </v-card-text>
          
          <v-progress-linear
            v-if="showCountdown"
            :model-value="progress"
            color="primary"
            height="10"
            rounded
            class="mb-4"
          ></v-progress-linear>

          <v-card-text v-if="showCountdown" class="text-body-2">
            A redirecionar em {{ countdown }} segundos...
          </v-card-text>

          <v-card-actions class="justify-center">
            <v-btn
              color="primary"
              @click="handleManualRedirect"
              :loading="loading"
            >
              {{ redirectButtonText }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  title: {
    type: String,
    default: 'Oops! Algo correu mal.'
  },
  message: {
    type: String,
    default: 'A página que procura não está disponível.'
  },
  redirectPath: {
    type: String,
    default: '/houses'
  },
  redirectButtonText: {
    type: String,
    default: 'Voltar'
  },
  autoRedirect: {
    type: Boolean,
    default: true
  },
  redirectDelay: {
    type: Number,
    default: 5 // segundos
  }
})

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const countdown = ref(props.redirectDelay)
const progress = ref(100)
const timer = ref(null)
const showCountdown = ref(props.autoRedirect)

// Função de redirecionamento
async function performRedirect() {
  loading.value = true
  clearInterval(timer.value)
  
  try {
    // Verificar autenticação antes de redirecionar
    const isAuthenticated = userStore.checkAuth()
    const targetPath = isAuthenticated ? '/houses' : '/login'
    
    await router.push({ path: targetPath, replace: true })
  } catch (error) {
    console.error('Erro ao redirecionar:', error)
    // Em caso de erro, tentar redirecionar para a rota padrão
    await router.push({ path: '/', replace: true })
  } finally {
    loading.value = false
  }
}

// Iniciar contagem regressiva
function startCountdown() {
  const startTime = Date.now()
  const duration = props.redirectDelay * 1000

  timer.value = setInterval(() => {
    const elapsed = Date.now() - startTime
    const remaining = duration - elapsed
    
    if (remaining <= 0) {
      performRedirect()
      return
    }

    countdown.value = Math.ceil(remaining / 1000)
    progress.value = (remaining / duration) * 100
  }, 100)
}

// Função para redirecionamento manual (botão)
function handleManualRedirect() {
  if (!loading.value) {
    performRedirect()
  }
}

onMounted(() => {
  if (props.autoRedirect) {
    startCountdown()
  }
})

onBeforeUnmount(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
})
</script>