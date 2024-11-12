//LoginForm.vue
<template>
  <div>
    <v-card
      class="mx-auto pa-12 pb-8"
      elevation="8"
      max-width="448"
      rounded="lg"
    >
      <div class="text-h4 text-center mb-8">Entrar</div>

      <!-- Alerta de erro -->
      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        closable
        class="mb-4"
        @click:close="clearError"
      >
        {{ errorMessage }}
      </v-alert>

      <!-- Formulário com validação imediata -->
      <v-form
        ref="formRef"
        v-model="isValid"
        @submit.prevent="handleSubmit"
      >
        <!-- Campo de login unificado -->
        <v-text-field
          v-model="form.login"
          :rules="loginRules"
          :error-messages="loginError"
          label="Email ou Nome de Utilizador"
          placeholder="Insira o seu email ou nome de utilizador"
          prepend-inner-icon="mdi-account"
          variant="outlined"
          required
          @update:model-value="handleLoginInput"
          :readonly="loading"
          class="mb-4"
        ></v-text-field>

        <!-- Campo de password -->
        <v-text-field
          v-model="form.password"
          :rules="passwordRules"
          :error-messages="passwordError"
          :type="showPassword ? 'text' : 'password'"
          label="Password"
          placeholder="Insira a sua password"
          prepend-inner-icon="mdi-lock"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          variant="outlined"
          required
          @update:model-value="handlePasswordInput"
          :readonly="loading"
          @click:append-inner="showPassword = !showPassword"
        ></v-text-field>

        <!-- Botão de submissão -->
        <v-btn 
          :loading="loading"
          block
          color="primary"
          size="large"
          type="submit"
          variant="elevated"
          :disabled="!isValid || loading"
          class="mt-4"
        >
          {{ loading ? 'A processar...' : 'Entrar' }}
        </v-btn>
      </v-form>

      <!-- Link para registo -->
      <v-card-text class="text-center mt-4">
        Não tem conta?
        <RouterLink to="/register" class="text-primary text-decoration-none">
          Registar agora
        </RouterLink>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// Refs para controlo do formulário
const formRef = ref(null)
const isValid = ref(false)
const loading = ref(false)
const showPassword = ref(false)

// Estado dos erros
const errorMessage = ref('')
const loginError = ref('')
const passwordError = ref('')

// Estado do formulário
const form = reactive({
  login: '',     // Alterado de 'email' para 'login'
  password: ''
})

// Regras de validação
const loginRules = [
  v => !!v || 'O email ou nome de utilizador é obrigatório',
  v => v.length >= 3 || 'O email ou nome de utilizador deve ter pelo menos 3 caracteres'
]

const passwordRules = [
  v => !!v || 'A password é obrigatória'
]

// Funções de manipulação de input
const handleLoginInput = () => {
  loginError.value = ''
  validateLogin()
}

const handlePasswordInput = () => {
  passwordError.value = ''
  validatePassword()
}

// Funções de validação
const validateLogin = () => {
  const results = loginRules
    .map(rule => rule(form.login))
    .filter(result => result !== true)
  loginError.value = results[0] || ''
  return !results.length
}

const validatePassword = () => {
  const results = passwordRules
    .map(rule => rule(form.password))
    .filter(result => result !== true)
  passwordError.value = results[0] || ''
  return !results.length
}

// Limpar erro
const clearError = () => {
  errorMessage.value = ''
  loginError.value = ''
  passwordError.value = ''
}

// Função de submissão
const handleSubmit = async () => {
  try {
    // Validar formulário
    if (!validateLogin() || !validatePassword()) {
      return
    }

    loading.value = true
    clearError()

    await userStore.login(form)
    router.push({ name: 'houses' })
  } catch (error) {
    errorMessage.value = error.msg || 'Erro ao efetuar login. Por favor, tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.v-card {
  margin-top: 10vh;
}
</style>