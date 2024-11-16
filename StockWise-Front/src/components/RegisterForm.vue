// StockWise-Front\src\components\RegisterForm.vue
<template>
  <div>
    <v-card
      class="mx-auto pa-12 pb-8"
      elevation="8"
      max-width="448"
      rounded="lg"
    >
      <div class="text-h4 text-center mb-8">Criar Conta</div>

      <!-- Sistema unificado de alertas -->
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
        v-model:valid="isValid"
        @submit.prevent="handleSubmit"
      >
        <!-- Campo de nome de utilizador -->
        <v-text-field
          v-model="form.name"
          :rules="nameRules"
          :error-messages="nameError"
          label="Nome de Utilizador"
          placeholder="Insira um nome de utilizador único"
          prepend-inner-icon="mdi-account"
          variant="outlined"
          required
          @update:model-value="handleNameInput"
          @blur="validateName"
          :readonly="loading"
          class="mb-4"
        ></v-text-field>

        <!-- Campo de email -->
        <v-text-field
          v-model="form.email"
          :rules="emailRules"
          :error-messages="emailError"
          label="Email"
          placeholder="exemplo@email.com"
          prepend-inner-icon="mdi-email"
          variant="outlined"
          required
          @update:model-value="handleEmailInput"
          @blur="validateEmail"
          :readonly="loading"
          class="mb-4"
          type="email"
        ></v-text-field>

        <!-- Campo de password -->
        <v-text-field
          v-model="form.password"
          :rules="passwordRules"
          :error-messages="passwordError"
          :type="showPassword ? 'text' : 'password'"
          label="Password"
          placeholder="Insira uma password segura"
          prepend-inner-icon="mdi-lock"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          variant="outlined"
          required
          @update:model-value="handlePasswordInput"
          @blur="validatePassword"
          :readonly="loading"
          @click:append-inner="showPassword = !showPassword"
          hint="A password deve ter pelo menos 8 caracteres, incluindo números e caracteres especiais"
          persistent-hint
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
          {{ loading ? 'A processar...' : 'Registar' }}
        </v-btn>
      </v-form>

      <!-- Link para login -->
      <v-card-text class="text-center mt-4">
        Já tem conta?
        <RouterLink to="/" class="text-primary text-decoration-none">
          Entrar agora
        </RouterLink>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
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
const nameError = ref('')
const emailError = ref('')
const passwordError = ref('')

// Estado do formulário
const form = reactive({
  name: '',
  email: '',
  password: ''
})

// Regras de validação (mantém as mesmas regras)
const nameRules = [
  v => !!v || 'O nome de utilizador é obrigatório',
  v => v.length >= 3 || 'O nome de utilizador deve ter pelo menos 3 caracteres',
  v => v.length <= 50 || 'O nome de utilizador não pode ter mais de 50 caracteres',
  v => /^[a-zA-Z0-9_]+$/.test(v) || 'O nome só pode conter letras, números e underscore'
]

const emailRules = [
  v => !!v || 'O email é obrigatório',
  v => /.+@.+\..+/.test(v) || 'Insira um email válido'
]

const passwordRules = [
  v => !!v || 'A password é obrigatória',
  v => v.length >= 8 || 'A password deve ter pelo menos 8 caracteres',
  v => /[0-9]/.test(v) || 'A password deve conter pelo menos um número',
  v => /[!@#$%^&*(),.?":{}|<>]/.test(v) || 'A password deve conter pelo menos um caractere especial'
]

// Funções de manipulação de input
const handleNameInput = () => {
  nameError.value = ''
  validateForm()
}

const handleEmailInput = () => {
  emailError.value = ''
  validateForm()
}

const handlePasswordInput = () => {
  passwordError.value = ''
  validateForm()
}

// Função genérica de validação de campo
const validateField = (value, rules) => {
  for (const rule of rules) {
    const result = rule(value)
    if (result !== true) {
      return { isValid: false, error: result }
    }
  }
  return { isValid: true, error: '' }
}

// Funções de validação específicas
const validateName = () => {
  const result = validateField(form.name, nameRules)
  nameError.value = result.error
  return result.isValid
}

const validateEmail = () => {
  const result = validateField(form.email, emailRules)
  emailError.value = result.error
  return result.isValid
}

const validatePassword = () => {
  const result = validateField(form.password, passwordRules)
  passwordError.value = result.error
  return result.isValid
}

// Validação completa do formulário
const validateForm = () => {
  const nameValid = validateName()
  const emailValid = validateEmail()
  const passwordValid = validatePassword()
  
  isValid.value = nameValid && emailValid && passwordValid
  return isValid.value
}

// Limpar erros
const clearError = () => {
  errorMessage.value = ''
  nameError.value = ''
  emailError.value = ''
  passwordError.value = ''
}

// Função de submissão
const handleSubmit = async () => {
  try {
    if (!validateForm()) {
      return
    }

    loading.value = true
    clearError()

    await userStore.createUser(form)
    router.push('/')
  } catch (error) {
    errorMessage.value = Array.isArray(error.msg) 
      ? error.msg[0] 
      : error.msg || 'Erro ao criar utilizador. Por favor, tente novamente.'
  } finally {
    loading.value = false
  }
}

// Observar mudanças no formulário para validação em tempo real
watch([() => form.name, () => form.email, () => form.password], () => {
  validateForm()
})
</script>

<style scoped>
.v-card {
  margin-top: 10vh;
}

:deep(.v-text-field .v-messages) {
  min-height: 20px;
}

:deep(.v-text-field .v-input__details) {
  padding-top: 4px;
}
</style>