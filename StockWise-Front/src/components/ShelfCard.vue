<!-- components/ShelfCard.vue -->
<template>
    <v-card class="shelf-card">
      <v-card-title class="d-flex justify-space-between align-center">
        {{ shelf.name }}
        <v-chip
          :color="weightColor"
          size="small"
        >
          {{ formattedWeight }}
        </v-chip>
      </v-card-title>
  
      <v-divider class="my-2"></v-divider>
  
      <!-- Products List -->
      <v-list v-if="shelf.products?.length">
        <v-list-item
          v-for="product in shelf.products"
          :key="product.product_id"
          :subtitle="getProductStatus(product)"
        >
          <template v-slot:prepend>
            <v-icon
              :color="getProductStatusColor(product)"
              class="mr-2"
            >
              {{ getProductStatusIcon(product) }}
            </v-icon>
          </template>
  
          <v-list-item-title>{{ product.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
  
      <v-card-text v-else class="text-center">
        <p class="text-body-2">Sem produtos registados</p>
      </v-card-text>
  
      <!-- Sensor IDs -->
      <v-card-text class="text-caption">
        <div class="d-flex justify-space-between grey--text">
          <span>RFID: {{ shelf.rfid_sensor_id }}</span>
          <span>Peso: {{ shelf.weight_sensor_id }}</span>
        </div>
      </v-card-text>
    </v-card>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  const props = defineProps({
    shelf: {
      type: Object,
      required: true
    }
  })
  
  // Computed
  const formattedWeight = computed(() => {
    // TODO: Implementar lógica real de peso
    return 'Aguardando...'
  })
  
  const weightColor = computed(() => {
    // TODO: Implementar lógica de cor baseada no peso
    return 'grey'
  })
  
  // Methods
  const getProductStatus = (product) => {
    // TODO: Implementar lógica real de status
    return `Stock: Aguardando...`
  }
  
  const getProductStatusColor = (product) => {
    // TODO: Implementar lógica real de cor
    return 'grey'
  }
  
  const getProductStatusIcon = (product) => {
    // TODO: Implementar lógica real de ícone
    return 'mdi-package-variant-closed'
  }
  </script>
  
  <style scoped>
  .shelf-card {
    height: 100%;
  }
  </style>