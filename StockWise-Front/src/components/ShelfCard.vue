<template>
    <v-card class="shelf-card">
        <!-- Cabeçalho da Prateleira -->
        <v-card-title class="d-flex justify-space-between align-center">
            <div class="d-flex align-center">
                <span>{{ shelf.name }}</span>
                <v-tooltip text="Capacidade máxima">
                    <template v-slot:activator="{ props }">
                        <v-chip
                            class="ml-2"
                            size="small"
                            color="grey"
                            v-bind="props"
                        >
                            {{ formatWeight(shelf.max_weight) }}
                        </v-chip>
                    </template>
                </v-tooltip>
            </div>
            
            <!-- Peso atual total da prateleira -->
            <v-chip
                :color="getWeightStatusColor"
                size="small"
            >
                {{ formatWeight(currentTotalWeight) }}
            </v-chip>
        </v-card-title>

        <v-divider class="my-2"></v-divider>

        <!-- Lista de Produtos -->
        <v-list v-if="shelf.Products?.length" density="compact">
            <v-list-item
                v-for="product in shelf.Products"
                :key="product.product_id"
                :title="product.name"
                :subtitle="getProductStatus(product)"
            >
                <template v-slot:prepend>
                    <v-icon
                        :color="getProductStatusColor(product)"
                        :icon="getProductStatusIcon(product)"
                        size="small"
                    ></v-icon>
                </template>

                <template v-slot:append>
                    <v-chip
                        size="x-small"
                        :color="getStockLevelColor(product)"
                        class="ml-2"
                    >
                        {{ formatWeight(getProductWeight(product.rfid_tag)) }}
                    </v-chip>
                </template>
            </v-list-item>
        </v-list>

        <!-- Estado Vazio -->
        <v-card-text v-else class="text-center py-4">
            <v-icon
                icon="mdi-package-variant"
                color="grey-lighten-1"
                size="48"
            ></v-icon>
            <div class="text-body-2 text-grey mt-2">
                Sem produtos registados
            </div>
        </v-card-text>

        <!-- Informações dos Sensores -->
        <v-card-text class="d-flex justify-space-between text-caption text-grey">
            <div>RFID: {{ shelf.rfid_sensor_id }}</div>
            <div>Peso: {{ shelf.weight_sensor_id }}</div>
        </v-card-text>
    </v-card>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { mqttService } from '@/services/mqtt.service';

const props = defineProps({
    shelf: {
        type: Object,
        required: true
    },
    houseId: {
        type: [String, Number],
        required: true
    }
});

// Estado local para pesos dos produtos
const productWeights = ref(new Map());
const currentShelfWeight = ref(0);

// Computed Properties
const currentTotalWeight = computed(() => {
    return currentShelfWeight.value;
});

const getWeightStatusColor = computed(() => {
    const totalWeight = currentTotalWeight.value;
    const maxWeight = props.shelf.max_weight;
    
    if (totalWeight >= maxWeight) return 'error';
    if (totalWeight >= maxWeight * 0.8) return 'warning';
    return 'success';
});

// Métodos de formatação e utilidade
const formatWeight = (weight) => {
    if (weight === null || weight === undefined) return 'N/A';
    return `${(weight / 1000).toFixed(1)}kg`;
};

const getProductWeight = (rfidTag) => {
    return productWeights.value.get(rfidTag) || 0;
};

const getProductNetWeight = (product) => {
    const grossWeight = getProductWeight(product.rfid_tag);
    return Math.max(0, grossWeight - product.container_weight);
};

const getProductStatus = (product) => {
    const netWeight = getProductNetWeight(product);
    return `Stock atual: ${formatWeight(netWeight)}`;
};

const getProductStatusColor = (product) => {
    const netWeight = getProductNetWeight(product);
    
    if (netWeight <= product.min_stock) return 'error';
    if (netWeight <= product.min_stock * 1.2) return 'warning';
    return 'success';
};

const getProductStatusIcon = (product) => {
    const netWeight = getProductNetWeight(product);
    
    if (netWeight <= product.min_stock) return 'mdi-alert-circle';
    if (netWeight <= product.min_stock * 1.2) return 'mdi-alert';
    return 'mdi-check-circle';
};

const getStockLevelColor = (product) => {
    const netWeight = getProductNetWeight(product);
    
    if (netWeight <= product.min_stock) return 'error';
    if (netWeight <= product.min_stock * 1.2) return 'warning';
    return 'success';
};

// Manipuladores MQTT
const handleWeightUpdate = (message) => {
    try {
        currentShelfWeight.value = message.weight;
    } catch (error) {
        console.error('Erro ao processar atualização de peso:', error);
    }
};

const handleRFIDUpdate = (message) => {
    try {
        if (message.weight && message.rfid_tag) {
            productWeights.value.set(message.rfid_tag, message.weight);
        }
    } catch (error) {
        console.error('Erro ao processar atualização RFID:', error);
    }
};

// Lifecycle hooks
onMounted(() => {
    // Subscrever aos tópicos MQTT relevantes
    const weightTopic = `house/${props.houseId}/shelf/${props.shelf.shelf_id}/weight`;
    const rfidTopic = `house/${props.houseId}/shelf/${props.shelf.shelf_id}/rfid`;
    
    mqttService.subscribe(weightTopic, handleWeightUpdate);
    mqttService.subscribe(rfidTopic, handleRFIDUpdate);

    // Inicializar com valores simulados para demonstração
    props.shelf.Products?.forEach(product => {
        const simulatedWeight = product.container_weight + (product.min_stock * 1.5);
        productWeights.value.set(product.rfid_tag, simulatedWeight);
    });
});

onUnmounted(() => {
    // Limpar subscrições MQTT
    const weightTopic = `house/${props.houseId}/shelf/${props.shelf.shelf_id}/weight`;
    const rfidTopic = `house/${props.houseId}/shelf/${props.shelf.shelf_id}/rfid`;
    
    mqttService.unsubscribe(weightTopic);
    mqttService.unsubscribe(rfidTopic);
});
</script>

<style scoped>
.shelf-card {
    height: 100%;
}

.v-list-item {
    min-height: 48px;
}

.sensor-info {
    font-size: 0.75rem;
    color: rgba(0, 0, 0, 0.6);
}
</style>