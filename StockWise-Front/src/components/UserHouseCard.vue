// components/UserHouseCard.vue
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

        <!-- Temperatura atual -->
        <div class="current-temperature pb-2">
          <div class="d-flex align-center">
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
                  {{ currentTemperature }}
                </span>
              </div>
              <div v-if="temperatureTimestamp" class="text-caption text-grey">
                Última atualização: {{ formatTimestamp(temperatureTimestamp) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Data de criação -->
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

    <v-dialog v-model="showEditDialog" max-width="500px">
      <!-- Implementar componente de edição aqui -->
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useTemperatureStore } from '@/stores/temperature'
import { mqttService } from '@/services/mqtt.service'

const props = defineProps({
  house: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const temperatureStore = useTemperatureStore()

// Estado local
const showInviteDialog = ref(false)
const showEditDialog = ref(false)

// Computed properties
const isOwner = computed(() => props.house.role === 'owner')

const currentTemperature = computed(() => {
  const temp = temperatureStore.getHouseTemperature(props.house.house_id)
  return temp !== null ? `${temp.toFixed(1)}°C` : 'Aguardando...'
})

const temperatureTimestamp = computed(() => {
  const data = temperatureStore.temperatures.get(props.house.house_id)
  return data?.timestamp
})

const isTemperatureInRange = computed(() => {
  return temperatureStore.isTemperatureInRange(
    props.house.house_id,
    props.house.min_temperature,
    props.house.max_temperature
  )
})

const temperatureIcon = computed(() => {
  if (!isTemperatureInRange.value) {
    return 'mdi-alert-circle'
  }
  return 'mdi-thermometer'
})

const temperatureColor = computed(() => {
  if (!isTemperatureInRange.value) {
    return 'error'
  }
  return 'primary'
})

// Métodos
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const goToMonitoring = () => {
  router.push(`/houses/${props.house.house_id}/monitor`)
}

// Lifecycle hooks
onMounted(async () => {
  // Garantir conexão MQTT
  if (mqttService.connectionStatus !== 'connected') {
    await mqttService.connect()
  }
  
  // Subscrever à temperatura desta casa
  temperatureStore.subscribeToHouseTemperature(props.house.house_id)
})

onBeforeUnmount(() => {
  // Limpar subscrição ao desmontar
  temperatureStore.unsubscribeFromHouseTemperature(props.house.house_id)
})
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