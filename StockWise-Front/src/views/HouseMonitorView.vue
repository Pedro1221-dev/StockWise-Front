// views/HouseMonitorView.vue
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
            @click:close="error = null"
        >
            {{ error }}
        </v-alert>

        <!-- House Details Header -->
        <div v-if="house" class="d-flex flex-column mb-6">
            <div class="d-flex align-center justify-space-between mb-4">
                <h1 class="text-h4">{{ house.name }}</h1>
                
                <!-- Temperature Display -->
                <v-chip
                    :color="temperatureColor"
                    size="large"
                    class="pa-4"
                >
                    <template v-slot:prepend>
                        <v-icon :color="temperatureColor" class="mr-2">
                            {{ temperatureIcon }}
                        </v-icon>
                    </template>
                    <div class="d-flex flex-column">
                        <span class="font-weight-bold">{{ formattedTemperature }}</span>
                        <span class="text-caption">
                            Limite: {{ house.min_temperature }}°C - {{ house.max_temperature }}°C
                        </span>
                    </div>
                </v-chip>
            </div>

            <!-- Alertas de Temperatura -->
            <v-alert
                v-if="!isTemperatureInRange && currentTemperature"
                density="compact"
                type="warning"
                variant="tonal"
                class="mb-4"
            >
                <template v-slot:prepend>
                    <v-icon>mdi-alert</v-icon>
                </template>
                Temperatura fora dos limites definidos!
            </v-alert>

            <v-btn
        color="primary"
        @click="simulateUnknownProduct"
        class="mb-4"
        max-width="400"
    >
        <v-icon class="mr-2">mdi-plus-circle</v-icon>
        Simular Produto Desconhecido
    </v-btn>
        </div>

        <!-- Shelves Grid -->
        <v-row v-if="house?.Shelves?.length">
            <v-col
                v-for="shelf in house.Shelves"
                :key="shelf.shelf_id"
                cols="12"
                md="6"
                lg="4"
            >
                <ShelfCard
                    :shelf="shelf"
                    :house-id="Number(route.params.id)"
                />
            </v-col>
        </v-row>

        <!-- No Shelves State -->
        <v-card
            v-else-if="!loading && house"
            class="text-center pa-6"
        >
            <v-card-title class="text-h6 mb-2">
                Sem Prateleiras
            </v-card-title>
            <v-card-text>
                <p class="text-body-1">Esta casa ainda não tem prateleiras configuradas.</p>
            </v-card-text>
        </v-card>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTemperatureStore } from '@/stores/temperature'
import { useProductsStore } from '@/stores/products';
import { housesService } from '@/services/houses.service'
import ShelfCard from '@/components/ShelfCard.vue'

// Router e stores
const route = useRoute()
const router = useRouter()
const temperatureStore = useTemperatureStore()
const productsStore = useProductsStore();

// Estado local
const house = ref(null)
const loading = ref(true)
const error = ref(null)

// Computed properties para temperatura
const currentTemperature = computed(() => {
    console.log('Buscando temperatura para casa:', route.params.id);
    const temp = temperatureStore.getHouseTemperature(Number(route.params.id));
    console.log('Temperatura obtida:', temp);
    return temp;
});

const formattedTemperature = computed(() => {
    const temp = currentTemperature.value;
    console.log('Formatando temperatura:', temp);
    return temp !== null ? `${temp.toFixed(1)}°C` : 'Aguardando...';
});

const isTemperatureInRange = computed(() => {
    if (!house.value || currentTemperature.value === null) return true;
    return temperatureStore.isTemperatureInRange(
        Number(route.params.id),
        Number(house.value.min_temperature),
        Number(house.value.max_temperature)
    );
});

const temperatureIcon = computed(() => {
    if (!currentTemperature.value) return 'mdi-thermometer';
    return isTemperatureInRange.value ? 'mdi-thermometer' : 'mdi-alert-circle';
});

const temperatureColor = computed(() => {
    if (!currentTemperature.value) return 'grey';
    return isTemperatureInRange.value ? 'success' : 'error';
});

// Métodos
const fetchHouseData = async () => {
    try {
        loading.value = true;
        error.value = null;

        const token = localStorage.getItem('token');
        const response = await housesService.getHouseDetails(route.params.id, token);

        if (!response.success) {
            throw new Error(response.message || 'Erro ao carregar dados da casa');
        }

        house.value = response.data;
        console.log('Dados da casa carregados:', house.value);

        // Inicializar produtos na store
        productsStore.initializeProducts(house.value.Shelves);

    } catch (err) {
        console.error('Erro ao carregar casa:', err);
        error.value = err.message;
    } finally {
        loading.value = false;
    }
};

const simulateUnknownProduct = () => {
    mqttService.publish(`house/${route.params.id}/unknown_product`, {
        rfid_tag: generateRandomTag(),
        shelf_id: selectedShelf.value,
        timestamp: new Date().toISOString()
    });
};
const clearError = () => {
    error.value = null;
};

// Lifecycle hooks
onMounted(async () => {
    await fetchHouseData();
});

onBeforeUnmount(() => {
    // Limpar subscrições MQTT
    productsStore.cleanup();
});
</script>

<style scoped>
.temperature-info {
    font-size: 1.1rem;
}
</style>