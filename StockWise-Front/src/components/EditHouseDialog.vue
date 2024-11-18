<!-- src/components/EditHouseDialog.vue -->
<template>
  <v-dialog 
    v-model="dialogVisible" 
    max-width="500px"
    @update:model-value="handleDialogUpdate"
  >
    <v-card v-if="dialogVisible">
      <v-card-title>
        <span class="text-h5">Editar Casa</span>
      </v-card-title>

      <v-card-text>
        <!-- Alerta de Erro -->
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          closable
          class="mb-4"
          @click:close="error = ''"
        >
          {{ error }}
        </v-alert>

        <!-- Alerta de Validação -->
        <v-alert
          v-if="validationError"
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          {{ validationError }}
        </v-alert>

        <v-form
          ref="form"
          v-model="isValid"
          @submit.prevent="handleSubmit"
          validate-on="input"
        >
          <!-- Nome da Casa -->
          <v-text-field
            v-model="formData.name"
            label="Nome da Casa *"
            :rules="nameRules"
            required
            :error-messages="nameError"
            @update:model-value="validateName"
            :disabled="loading"
          ></v-text-field>

          <!-- Temperatura Mínima -->
          <v-text-field
            v-model.number="formData.min_temperature"
            label="Temperatura Mínima (°C) *"
            type="number"
            :rules="minTempRules"
            required
            :error-messages="minTempError"
            @update:model-value="validateTemperatures"
            :disabled="loading"
            hint="Deve ser menor que a temperatura máxima"
            persistent-hint
          ></v-text-field>

          <!-- Temperatura Máxima -->
          <v-text-field
            v-model.number="formData.max_temperature"
            label="Temperatura Máxima (°C) *"
            type="number"
            :rules="maxTempRules"
            required
            :error-messages="maxTempError"
            @update:model-value="validateTemperatures"
            :disabled="loading"
            hint="Deve ser maior que a temperatura mínima"
            persistent-hint
          ></v-text-field>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          @click="handleSubmit"
          :disabled="!isValid || hasErrors || loading"
          :loading="loading"
        >
          Guardar
        </v-btn>
        <v-btn
          color="grey"
          @click="closeDialog"
          :disabled="loading"
        >
          Cancelar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>


<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useHousesStore } from '@/stores/houses';

// Props e Emits
const props = defineProps({
  modelValue: Boolean,
  house: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'house-updated']);

// Controle do diálogo
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Método para controlar a atualização do diálogo
const handleDialogUpdate = (value) => {
  if (!value) {
    // Primeiro emitir a atualização do modelo
    emit('update:modelValue', false);
    // Depois limpar o formulário
    nextTick(() => {
      resetForm();
    });
  }
};

// Setup
const housesStore = useHousesStore();
const form = ref(null);
const isValid = ref(false);
const loading = ref(false);
const error = ref('');

// Estado de erros de validação
const nameError = ref('');
const minTempError = ref('');
const maxTempError = ref('');
const validationError = ref('');

// Form data com valores iniciais vazios
const formData = ref({
  name: '',
  min_temperature: '',
  max_temperature: ''
});

// Regras de validação atualizadas com verificações de null/undefined
const nameRules = [
  v => (v !== null && v !== undefined && v !== '') || 'Nome é obrigatório',
  v => !v || v.length >= 3 || 'Nome deve ter pelo menos 3 caracteres',
  v => !v || v.length <= 50 || 'Nome não pode ter mais de 50 caracteres'
];

const minTempRules = [
  v => (v !== null && v !== undefined && v !== '') || 'Temperatura mínima é obrigatória',
  v => !isNaN(Number(v)) || 'Temperatura deve ser um número',
  v => Number(v) >= 0 || 'Temperatura deve ser maior ou igual a 0'
];

const maxTempRules = [
  v => (v !== null && v !== undefined && v !== '') || 'Temperatura máxima é obrigatória',
  v => !isNaN(Number(v)) || 'Temperatura deve ser um número',
  v => Number(v) >= 0 || 'Temperatura deve ser maior ou igual a 0'
];

// Computed properties
const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const hasErrors = computed(() => {
  return !!(nameError.value || minTempError.value || maxTempError.value || validationError.value);
});

// Métodos de validação
const validateName = () => {
  nameError.value = '';
  const result = nameRules
    .map(rule => rule(formData.value.name))
    .find(result => result !== true);
  
  if (result !== undefined) {
    nameError.value = result;
    return false;
  }
  return true;
};

const validateTemperatures = () => {
  minTempError.value = '';
  maxTempError.value = '';
  validationError.value = '';

  const min = Number(formData.value.min_temperature);
  const max = Number(formData.value.max_temperature);

  // Validar temperatura mínima
  const minResult = minTempRules
    .map(rule => rule(formData.value.min_temperature))
    .find(result => result !== true);

  if (minResult !== undefined) {
    minTempError.value = minResult;
    return false;
  }

  // Validar temperatura máxima
  const maxResult = maxTempRules
    .map(rule => rule(formData.value.max_temperature))
    .find(result => result !== true);

  if (maxResult !== undefined) {
    maxTempError.value = maxResult;
    return false;
  }

  // Validar relação entre temperaturas
  if (!isNaN(min) && !isNaN(max) && min >= max) {
    validationError.value = 'A temperatura mínima deve ser menor que a temperatura máxima';
    return false;
  }

  return true;
};

// Método dedicado para resetar o formulário
const resetForm = () => {
  // Garantir que o reset só acontece quando necessário
  if (!dialogVisible.value) {
    // Resetar dados do formulário com valores vazios
    formData.value = {
      name: '',
      min_temperature: '',
      max_temperature: ''
    };

    // Resetar estados de erro
    error.value = '';
    nameError.value = '';
    minTempError.value = '';
    maxTempError.value = '';
    validationError.value = '';

    // Resetar estado de validação
    isValid.value = false;

    // Resetar o formulário Vuetify após a atualização do DOM
    nextTick(() => {
      if (form.value) {
        try {
          form.value.reset();
        } catch (error) {
          console.warn('Aviso: Não foi possível resetar o formulário', error);
        }
      }
    });
  }
};

// Watch para inicializar dados do formulário
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    nextTick(() => {
      // Inicializar com valores da casa, usando operador nullish para valores vazios
      formData.value = {
        name: props.house.name || '',
        min_temperature: props.house.min_temperature ?? '',
        max_temperature: props.house.max_temperature ?? ''
      };
      
      // Validar após a atualização do DOM
      validateName();
      validateTemperatures();
    });
  }
});

// Watch para validação em tempo real
watch(() => formData.value.min_temperature, validateTemperatures);
watch(() => formData.value.max_temperature, validateTemperatures);

// Método de submissão
const handleSubmit = async () => {
  if (!validateForm()) return;

  loading.value = true;
  error.value = '';

  try {
    await housesStore.updateHouse(props.house.house_id, formData.value);
    emit('house-updated');
    closeDialog();
  } catch (err) {
    error.value = err.message || 'Erro ao atualizar casa';
  } finally {
    loading.value = false;
  }
};

// Método para validação completa do formulário
const validateForm = () => {
  const nameValid = validateName();
  const temperaturesValid = validateTemperatures();
  return nameValid && temperaturesValid;
};

// Método para fechar o diálogo
const closeDialog = () => {
  dialogVisible.value = false;
};
</script>