// views/UserHousesListView.vue
<template>
  <div>
    <!-- Loading state -->
    <v-progress-linear
      v-if="loading"
      indeterminate
      color="primary"
    ></v-progress-linear>

    <!-- Error state -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
      @click:close="clearError"
    >
      {{ error }}
    </v-alert>

    <!-- Empty state -->
    <v-card
      v-if="!loading && !error && !hasHouses"
      class="text-center pa-6 mb-4"
    >
      <v-card-text>
        <p class="text-h6 mb-2">Sem Casas Registadas</p>
        <p class="text-body-1">Registe uma nova casa para começar.</p>
      </v-card-text>
      <v-card-actions class="justify-center">
        <v-btn
          color="primary"
          @click="showRegisterDialog = true"
        >
          Registar Casa
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Houses list -->
    <div v-else class="houses-grid">
      <UserHouseCard
        v-for="house in houses"
        :key="house.house_id"
        :house="house"
        @update="fetchHouses"
      />

      <!-- Add house button -->
      <v-card
        class="add-house-card d-flex align-center justify-center"
        elevation="1"
        @click="showRegisterDialog = true"
      >
        <v-icon size="48" color="grey">mdi-plus</v-icon>
      </v-card>
    </div>

    <!-- Register house dialog -->
    <v-dialog v-model="showRegisterDialog" max-width="500px">
      <v-card>
        <v-card-title>Registar Nova Casa</v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="isValid" @submit.prevent="registerHouse">
            <v-text-field
              v-model="newHouse.name"
              label="Nome da Casa"
              required
              :rules="[v => !!v || 'Nome é obrigatório']"
            ></v-text-field>

            <v-text-field
              v-model.number="newHouse.min_temperature"
              label="Temperatura Mínima"
              type="number"
              required
              :rules="temperatureRules"
            ></v-text-field>

            <v-text-field
              v-model.number="newHouse.max_temperature"
              label="Temperatura Máxima"
              type="number"
              required
              :rules="[
                ...temperatureRules,
                v => v > newHouse.min_temperature || 'Temperatura máxima deve ser maior que a mínima'
              ]"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="registerHouse"
            :disabled="!isValid || registerLoading"
            :loading="registerLoading"
          >
            Registar
          </v-btn>
          <v-btn
            color="grey"
            @click="showRegisterDialog = false"
            :disabled="registerLoading"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useHousesStore } from '@/stores/houses';
import UserHouseCard from '@/components/UserHouseCard.vue';

const housesStore = useHousesStore();
const { houses, loading, error } = storeToRefs(housesStore);
const hasHouses = computed(() => houses.value.length > 0);

// Form refs e state
const form = ref(null);
const isValid = ref(false);
const showRegisterDialog = ref(false);
const registerLoading = ref(false);

// Nova casa
const newHouse = ref({
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

// Métodos
const fetchHouses = () => {
  housesStore.fetchUserHouses(true);
};

const registerHouse = async () => {
  if (!form.value?.validate()) return;

  registerLoading.value = true;
  try {
    await housesStore.registerHouse(newHouse.value);
    showRegisterDialog.value = false;
    newHouse.value = { name: '', min_temperature: '', max_temperature: '' };
  } catch (error) {
    console.error('Erro ao registar casa:', error);
  } finally {
    registerLoading.value = false;
  }
};

const clearError = () => {
  housesStore.error = null;
};
</script>

<style scoped>
.houses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.add-house-card {
  height: 200px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-house-card:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>