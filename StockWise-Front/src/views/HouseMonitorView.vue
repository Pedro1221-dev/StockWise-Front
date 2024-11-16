<!-- views/HouseMonitorView.vue -->
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
  
      <!-- House Details Header -->
      <div v-if="house" class="d-flex align-center mb-6">
        <div>
          <h1 class="text-h4 mb-2">{{ house.name }}</h1>
          <div class="d-flex align-center">
            <!-- Temperature Display -->
            <v-chip
              :color="temperatureColor"
              class="mr-4"
            >
              <template v-slot:prepend>
                <v-icon :color="temperatureColor">
                  {{ temperatureIcon }}
                </v-icon>
              </template>
              {{ formattedTemperature }}
            </v-chip>
  
            <!-- House Details -->
            <span class="text-body-1 grey--text">
              Limites: {{ house.min_temperature }}°C - {{ house.max_temperature }}°C
            </span>
          </div>
        </div>
      </div>
  
      <!-- Shelves Grid -->
      <v-row v-if="house?.shelves?.length">
        <v-col
          v-for="shelf in house.shelves"
          :key="shelf.shelf_id"
          cols="12"
          md="6"
        >
          <ShelfCard
            :shelf="shelf"
            @update="fetchHouseData"
          />
        </v-col>
      </v-row>
  
      <!-- No Shelves State -->
      <v-card
        v-else-if="!loading"
        class="text-center pa-6"
      >
        <v-card-text>
          <p class="text-h6 mb-2">Sem Prateleiras</p>
          <p class="text-body-1">Esta casa ainda não tem prateleiras configuradas.</p>
        </v-card-text>
      </v-card>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useTemperatureStore } from '@/stores/temperature'
  import { mqttService } from '@/services/mqtt.service'
  import ShelfCard from '@/components/ShelfCard.vue'
  
  // Route & House Data
  const route = useRoute()
  const router = useRouter()
  const houseId = computed(() => route.params.id)
const house = ref(null)
const loading = ref(true)
const error = ref(null)

  
  // Temperature Store
  const temperatureStore = useTemperatureStore()
  
  // Computed Properties
  const currentTemperature = computed(() => 
    temperatureStore.getHouseTemperature(houseId)
  )
  
  const formattedTemperature = computed(() => {
    const temp = currentTemperature.value
    return temp !== null ? `${temp.toFixed(1)}°C` : 'Aguardando...'
  })
  
  const isTemperatureInRange = computed(() => {
    if (!house.value || !currentTemperature.value) return true
    return temperatureStore.isTemperatureInRange(
      houseId,
      house.value.min_temperature,
      house.value.max_temperature
    )
  })
  
  const temperatureIcon = computed(() => {
    if (!currentTemperature.value) return 'mdi-thermometer'
    return isTemperatureInRange.value ? 'mdi-thermometer' : 'mdi-alert-circle'
  })
  
  const temperatureColor = computed(() => {
    if (!currentTemperature.value) return 'grey'
    return isTemperatureInRange.value ? 'primary' : 'error'
  })
  
  // Methods
  const fetchHouseData = async () => {
  try {
    loading.value = true
    error.value = null

    const response = await fetch(`/api/houses/${houseId.value}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      throw new Error('Erro ao carregar dados da casa')
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.message)
    }

    house.value = data.data

  } catch (err) {
    console.error('Erro ao carregar casa:', err)
    error.value = err.message
    // Redirecionar para a lista de casas em caso de erro
    router.push({ name: 'houses' })
  } finally {
    loading.value = false
  }
}
  
  const clearError = () => {
    error.value = null
  }
  
  // Lifecycle Hooks
  onMounted(async () => {
  try {
   // await fetchHouseData()
    if (house.value) {
      await temperatureStore.subscribeToHouseTemperature(house.value)
    }
  } catch (err) {
    console.error('Erro ao montar componente:', err)
    error.value = 'Erro ao carregar dados da casa'
  }
})
  onBeforeUnmount(() => {
    temperatureStore.unsubscribeFromHouseTemperature(houseId)
  })
  </script>