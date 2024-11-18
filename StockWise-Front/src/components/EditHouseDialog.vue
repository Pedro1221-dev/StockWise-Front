<!-- src/components/EditHouseDialog.vue -->
<template>
  <v-dialog v-model="show" max-width="500px">
    <v-card>
      <v-card-title>
        <span class="text-h5">Editar Casa</span>
      </v-card-title>

      <v-card-text>
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

        <v-form ref="form" v-model="isValid" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="formData.name"
            label="Nome da Casa"
            required
            :rules="[v => !!v || 'Nome é obrigatório']"
          ></v-text-field>

          <v-text-field
            v-model.number="formData.min_temperature"
            label="Temperatura Mínima"
            type="number"
            required
            :rules="temperatureRules"
          ></v-text-field>

          <v-text-field
            v-model.number="formData.max_temperature"
            label="Temperatura Máxima"
            type="number"
            required
            :rules="[
              ...temperatureRules,
              v => v > formData.min_temperature || 'Temperatura máxima deve ser maior que a mínima'
            ]"
          ></v-text-field>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          @click="handleSubmit"
          :disabled="!isValid || loading"
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
import { ref, computed, watch } from 'vue';
import { useHousesStore } from '@/stores/houses';

const props = defineProps({
  modelValue: Boolean,
  house: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'house-updated']);

// Setup
const housesStore = useHousesStore();
const form = ref(null);
const isValid = ref(false);
const loading = ref(false);
const error = ref('');

// Computed
const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Form data
const formData = ref({
  name: '',
  min_temperature: '',
  max_temperature: ''
});

// Regras de validação
const temperatureRules = [
  v => !!v || 'Temperatura é obrigatória',
  v => !isNaN(v) || 'Temperatura deve ser um número',
  v => v >= 0 || 'Temperatura deve ser maior ou igual a 0'
];

// Watch para inicializar dados do formulário
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    formData.value = {
      name: props.house.name,
      min_temperature: props.house.min_temperature,
      max_temperature: props.house.max_temperature
    };
  }
});

// Métodos
const handleSubmit = async () => {
  if (!form.value?.validate()) return;

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

const closeDialog = () => {
  show.value = false;
  error.value = '';
  form.value?.reset();
};
</script>