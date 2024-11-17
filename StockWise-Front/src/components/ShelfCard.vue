// StockWise-Front\src\components\ShelfCard.vue
<script setup>
import { computed } from 'vue';
import { useProductsStore } from '@/stores/products';
import ProductCard from './ProductCard.vue';

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



const productsStore = useProductsStore();

// Computed properties agora usando a store
const currentShelfWeight = computed(() => 
    productsStore.getShelfWeight(props.shelf.shelf_id)
);

const weightPercentage = computed(() => {
    const currentWeight = currentShelfWeight.value;
    const maxWeight = props.shelf.max_weight;
    if (!currentWeight || !maxWeight) return 0;
    return Math.min((currentWeight / maxWeight) * 100, 100);
});

const weightStatusColor = computed(() => {
    const percentage = weightPercentage.value;
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    return 'success';
});

// Formatting helper
const formatWeight = (weight) => {
    if (!weight && weight !== 0) return 'N/D';
    const kg = weight / 1000;
    return kg >= 1 ? `${kg.toFixed(1)}kg` : `${weight}g`;
};
</script>

<template>
    <v-card class="shelf-card">
        <!-- Cabeçalho com informações da prateleira -->
        <v-card-title class="d-flex flex-column">
            <div class="text-h6">{{ shelf.name }}</div>
            <div class="text-subtitle-2 text-medium-emphasis">
                Peso máximo permitido: {{ formatWeight(shelf.max_weight) }}
            </div>
        </v-card-title>

        <!-- Barra de progresso do peso total -->
        <v-card-text>
            <div class="d-flex align-center gap-2 mb-4">
                <span class="font-weight-medium" style="min-width: 200px">
                    Peso atual: {{ formatWeight(currentShelfWeight) }}
                </span>
                <v-progress-linear
                    :model-value="weightPercentage"
                    :color="weightStatusColor"
                    height="20"
                    class="flex-grow-1"
                    rounded
                >
                    <template v-slot:default="{ value }">
                        <span class="text-caption">{{ Math.ceil(value) }}%</span>
                    </template>
                </v-progress-linear>
            </div>

            <!-- Lista de produtos -->
            <v-list>
                <v-list-item
                    v-for="product in shelf.Products"
                    :key="product.product_id"
                    class="mb-3 px-0"
                >
                    <ProductCard
                        :product="product"
                        :shelf-id="shelf.shelf_id"
                        :house-id="houseId"
                    />
                </v-list-item>
            </v-list>
        </v-card-text>
    </v-card>
</template>

<style scoped>
.shelf-card {
    margin-bottom: 16px;
}

.gap-2 {
    gap: 8px;
}

.v-list-item {
    padding: 8px 0;
}
</style>