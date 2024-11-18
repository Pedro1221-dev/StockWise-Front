// StockWise-Front\src\components\UserHouseCard.vue
<template>
  <v-card class="house-card">
    <!-- Header com nome e role -->
    <v-card-title class="d-flex align-center justify-space-between">
      {{ house.name }}
      <v-chip
        :color="isOwner ? 'primary' : 'secondary'"
        size="small"
        class="ml-2"
      >
        {{ isOwner ? 'Proprietário' : 'Membro' }}
      </v-chip>
    </v-card-title>

         <!-- Informações de temperatura -->
    <v-card-text>
      <div class="temperature-info">
        <!-- Limites configurados -->
        <div class="d-flex align-center mb-2">
          <v-icon color="blue" class="mr-2">mdi-thermometer-low</v-icon>
          <span>Mín: {{ house.min_temperature }}°C</span>
        </div>
        <div class="d-flex align-center mb-3">
          <v-icon color="red" class="mr-2">mdi-thermometer-high</v-icon>
          <span>Máx: {{ house.max_temperature }}°C</span>
        </div>

        <!-- Alerta de temperatura -->
        <v-alert
          v-if="!isTemperatureInRange && currentTemperature"
          density="compact"
          type="warning"
          variant="tonal"
          class="mb-3"
        >
          <div class="d-flex align-center">
            <span class="text-caption">
              Temperatura fora dos limites!
            </span>
          </div>
        </v-alert>

        <!-- Temperatura atual -->
        <div class="d-flex align-center mb-2">
          <v-icon 
            :color="temperatureColor" 
            size="large"
            class="mr-2"
          >
            {{ temperatureIcon }}
          </v-icon>
          <div>
            <div class="text-subtitle-1">
              Temperatura atual:
              <span :class="{'text-error': !isTemperatureInRange}">
                {{ formattedTemperature }}
              </span>
            </div>
            <div v-if="temperatureTimestamp" class="text-caption text-grey">
              Última atualização: {{ formatTimestamp(temperatureTimestamp) }}
            </div>
          </div>
        </div>
      </div>

      <div class="text-caption text-grey mt-2">
        Criada em: {{ formatDate(house.created_at) }}
      </div>
    </v-card-text>

    <v-divider></v-divider>

    <!-- Ações -->
    <v-card-actions>
      <v-btn
        color="primary"
        variant="text"
        prepend-icon="mdi-monitor"
        @click="goToMonitoring"
      >
        Monitorizar
      </v-btn>

      <v-spacer></v-spacer>

      <!-- Menu de ações (apenas para proprietários) -->
      <v-menu v-if="isOwner">
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            v-bind="props"
          >
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item
            prepend-icon="mdi-account-plus"
            @click="showInviteDialog = true"
          >
            <v-list-item-title>Convidar Utilizador</v-list-item-title>
          </v-list-item>
          
          <v-list-item
            prepend-icon="mdi-pencil"
            @click="showEditDialog = true"
          >
            <v-list-item-title>Editar</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-card-actions>

    <!-- Diálogos -->
    <v-dialog v-model="showInviteDialog" max-width="500px">
      <!-- Implementar componente de convite aqui -->
    </v-dialog>

    <EditHouseDialog
  v-model="showEditDialog"
  :house="house"
  @house-updated="$emit('update')"
/>
  </v-card>

</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTemperatureStore } from '@/stores/temperature';
import EditHouseDialog from './EditHouseDialog.vue';
const props = defineProps({
  house: {
    type: Object,
    required: true
  }
});

const router = useRouter();
const temperatureStore = useTemperatureStore();

// Estado local para diálogos
const showInviteDialog = ref(false);
const showEditDialog = ref(false);

// Computed properties
const isOwner = computed(() => props.house.role === 'owner');

const currentTemperature = computed(() => 
  temperatureStore.getHouseTemperature(props.house.house_id)
);

const temperatureTimestamp = computed(() => 
  temperatureStore.getHouseTemperatureTimestamp(props.house.house_id)
);

const isTemperatureInRange = computed(() => 
  temperatureStore.isTemperatureInRange(
    props.house.house_id,
    Number(props.house.min_temperature),
    Number(props.house.max_temperature)
  )
);

const formattedTemperature = computed(() => {
  const temp = currentTemperature.value;
  return temp !== null ? `${temp.toFixed(1)}°C` : 'Aguardando...';
});

const temperatureIcon = computed(() => {
  if (!currentTemperature.value) return 'mdi-thermometer';
  return isTemperatureInRange.value ? 'mdi-thermometer' : 'mdi-alert-circle';
});

const temperatureColor = computed(() => {
  if (!currentTemperature.value) return 'grey';
  return isTemperatureInRange.value ? 'primary' : 'error';
});

// Métodos
const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const goToMonitoring = () => {
  console.log(`Navegando para monitorização da casa ${props.house.house_id}`);
  router.push({
    name: 'house-monitor',
    params: { id: props.house.house_id }
  });
};
</script>

<style scoped>
.house-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.temperature-info {
  font-size: 1.1rem;
}

.current-temperature {
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.03);
  padding: 12px;
}
</style>