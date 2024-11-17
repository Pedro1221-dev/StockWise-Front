<!-- StockWise-Front\src\components\ProductCard.vue -->
<script setup>
// Imports
import { ref, computed, onMounted } from 'vue';
import { mqttService } from '@/services/mqtt.service';
import { useProductsStore } from '@/stores/products';
import { storeToRefs } from 'pinia';
import { alertsMonitor } from '@/services/alertsMonitor.service';

// Props
const props = defineProps({
    product: {
        type: Object,
        required: true
    },
    shelfId: {
        type: [String, Number],
        required: true
    },
    houseId: {
        type: [String, Number],
        required: true
    },
    shelf: {  
        type: Object,
        required: true
    }
});

// Store setup
const productsStore = useProductsStore();
const { products } = storeToRefs(productsStore);
const originalWeight = ref(0);
const isUpdating = ref(false);


// Estado do diálogo
const quantityDialog = ref({
    show: false,
    amount: 0,
    previousWeight: 0
});

// Computed Properties - Produto e Pesos
const currentProduct = computed(() => 
    products.value.get(props.product.product_id) || props.product
);

const currentWeight = computed(() => currentProduct.value.current_weight || 0);
const containerWeight = computed(() => currentProduct.value.container_weight || 0);
const netWeight = computed(() => Math.max(0, currentWeight.value - containerWeight.value));

// Computed Properties - Status e Limites
const maxAllowedQuantity = computed(() => {
    // Peso restante na prateleira
    const availableWeight = productsStore.getShelfAvailableCapacity(props.shelfId, props.shelf);
    
    // Espaço máximo permitido no produto
    const maxProductCapacity = currentProduct.value.max_capacity - currentProduct.value.container_weight;
    
    // Ajustar para descontar o peso do container
    const maxWeightConsideringContainer = Math.max(0, availableWeight - containerWeight.value);

    // Devolver o menor valor entre o limite do produto e o espaço disponível na prateleira
    return Math.min(maxProductCapacity, maxWeightConsideringContainer);
});




const validateNewWeight = (newWeight) => {
    try {
        return productsStore.validateProductWeight(
            props.shelfId,
            newWeight,
            currentProduct.value.product_id
        );
    } catch (error) {
        return false;
    }
};

// Computed Properties - Interface
const locationStatus = computed(() => 
    currentProduct.value.location_status === 'in_shelf' ? 'Na Prateleira' : 'Fora da Prateleira'
);

const locationColor = computed(() => 
    currentProduct.value.location_status === 'in_shelf' ? 'success' : 'grey'
);

const stockDifference = computed(() => {
    if (currentProduct.value.location_status === 'removed') return 0;
    return netWeight.value - currentProduct.value.min_stock;
});

const stockStatusText = computed(() => {
    if (currentProduct.value.location_status === 'removed') {
        return 'Fora da Prateleira';
    }
    
    const diff = stockDifference.value;
    if (diff < 0) {
        return `${formatWeight(Math.abs(diff))} abaixo do mínimo`;
    }
    return `${formatWeight(diff)} acima do mínimo`;
});

const stockStatusColor = computed(() => {
    if (currentProduct.value.location_status === 'removed') return 'grey';
    
    const diff = stockDifference.value;
    if (diff < 0) return 'error';
    if (diff < currentProduct.value.min_stock * 0.2) return 'warning';
    return 'success';
});

// Computed Properties - Diálogo
const dialogTitle = computed(() => 
    `Ajustar Quantidade de ${currentProduct.value.name}`
);

const getQuantityChangeText = computed(() => {
    if (!quantityDialog.value.amount) return '';
    
    const currentAmount = currentProduct.value.location_status === 'in_shelf' 
        ? netWeight.value 
        : lastKnownWeight.value - containerWeight.value;
        
    const newAmount = Number(quantityDialog.value.amount);
    const difference = Math.abs(newAmount - currentAmount);
    
    if (newAmount > currentAmount) {
        return `Nova quantidade: ${formatWeight(newAmount)} (+${formatWeight(difference)})`;
    }
    if (newAmount < currentAmount) {
        return `Nova quantidade: ${formatWeight(newAmount)} (-${formatWeight(difference)})`;
    }
    return 'Quantidade mantida';
});


const lastKnownWeight = computed(() => {
    // Se o produto estiver na prateleira, usamos o peso atual
    if (currentProduct.value.location_status === 'in_shelf') {
        return currentWeight.value;
    }
    // Se estiver fora, usamos o último peso conhecido da BD
    return currentProduct.value.last_known_weight || 0;
});

// Validação
const isValidQuantity = computed(() => {
    const amount = Number(quantityDialog.value.amount);
    return amount >= 0 && amount <= maxAllowedQuantity.value;
});

// Métodos Utilitários
const formatWeight = (weight) => {
    if (!weight && weight !== 0) return 'N/D';
    const kg = weight / 1000;
    return kg >= 1 ? `${kg.toFixed(2)}kg` : `${weight}g`;
};

const onlyNumbers = (event) => {
    const charCode = (event.which) ? event.which : event.keyCode;
    if ((charCode > 31 && (charCode < 48 || charCode > 57)) && charCode !== 46) {
        event.preventDefault();
    }
};

// Métodos MQTT
const publishWeightEvent = (newWeight, previousWeight) => {
    mqttService.publish(
        `house/${props.houseId}/shelf/${props.shelfId}/weight`,
        {
            product_id: currentProduct.value.product_id,
            rfid_tag: currentProduct.value.rfid_tag,
            previous_weight: previousWeight,
            new_weight: newWeight,
            timestamp: new Date().toISOString()
        }
    );
};

const publishStatusEvent = (newStatus) => {
    mqttService.publish(
        `house/${props.houseId}/shelf/${props.shelfId}/product/status`,
        {
            product_id: currentProduct.value.product_id,
            rfid_tag: currentProduct.value.rfid_tag,
            location_status: newStatus,
            timestamp: new Date().toISOString()
        }
    );
};

// Handlers de ações
const handleProductRemoval = async () => {
    try {
        console.log('[ProductCard] Iniciando remoção do produto:', currentProduct.value.name);
        const currentTotalWeight = currentWeight.value;
        
        // Atualizar BD
        await productsStore.updateProduct(currentProduct.value.product_id, {
            current_weight: 0,
            location_status: 'removed',
            last_known_weight: currentTotalWeight
        });

        // Publicar eventos MQTT básicos
        publishWeightEvent(0, currentTotalWeight);
        publishStatusEvent('removed');

        // Publicar alerta de remoção
        console.log('[ProductCard] Publicando alerta de remoção:', {
            houseId: props.houseId,
            shelfId: props.shelfId,
            product: currentProduct.value
        });
        
        alertsMonitor.publishProductAction(
            props.houseId,
            props.shelfId,
            currentProduct.value,
            'removed'
        );

        // Não abrir diálogo aqui - apenas guardar o peso original
        originalWeight.value = currentTotalWeight;

    } catch (error) {
        console.error('[ProductCard] Erro ao remover produto:', error);
    }
};

// Handler do Sensor RFID
const simulateRFIDScan = () => {
    console.log('[ProductCard] Simulando scan RFID:', {
        estado: currentProduct.value.location_status,
        prateleira: props.shelf,
        capacidade: productsStore.getShelfAvailableCapacity(props.shelfId, props.shelf)
    });
    
    try {
        if (currentProduct.value.location_status === 'removed') {
            const availableWeight = productsStore.getShelfAvailableCapacity(props.shelfId, props.shelf);

            // Garantir que há espaço suficiente na prateleira para o peso líquido
            if (availableWeight < currentProduct.value.container_weight) {
                quantityDialog.value = {
                    show: true,
                    amount: 0,
                    previousWeight: originalWeight.value,
                    error: `Capacidade insuficiente na prateleira. Disponível: ${formatWeight(availableWeight)}`
                };
                return;
            }

            quantityDialog.value = {
                show: true,
                amount: 0,
                previousWeight: originalWeight.value,
                error: null
            };
        } else {
            handleProductRemoval();
        }
    } catch (error) {
        console.error('[ProductCard] Erro:', error);
    }
};




// Handlers do Diálogo
const confirmQuantityChange = async () => {
    try {
        isUpdating.value = true;

        const amount = Number(quantityDialog.value.amount); // Quantidade ajustada
        const newTotalWeight = amount + containerWeight.value; // Peso total: produto + container
        const netWeight = Math.max(0, newTotalWeight - containerWeight.value); // Peso líquido

        // Validar capacidade da prateleira
        productsStore.validateShelfCapacity(
            props.shelfId,
            props.shelf,
            newTotalWeight, // Peso total
            currentProduct.value.product_id
        );

        // Atualizar o peso do produto
        const updatedProduct = await productsStore.updateProduct(currentProduct.value.product_id, {
            current_weight: newTotalWeight,
            location_status: 'in_shelf',
            last_known_weight: originalWeight.value // Atualiza o peso anterior
        });

        console.log('[confirmQuantityChange] Produto atualizado:', updatedProduct);

        // Publicar eventos MQTT
        publishWeightEvent(newTotalWeight, originalWeight.value);
        publishStatusEvent('in_shelf');

        // Emitir alerta de reposição
        alertsMonitor.publishProductAction(
            props.houseId,
            props.shelfId,
            updatedProduct, // Produto atualizado
            'added', // Nova ação "added" para reposição
            newTotalWeight // Passar o novo peso total
        );

        // Verificar se o stock está abaixo do mínimo e emitir alerta
        if (netWeight <= currentProduct.value.min_stock) {
            console.log('[confirmQuantityChange] Emitindo alerta de stock baixo.');
            alertsMonitor.checkLowStock(props.houseId, props.shelfId, {
                ...updatedProduct,
                current_weight: newTotalWeight // Atualizar o peso atual no alerta
            });
        }

        closeQuantityDialog(); // Fechar diálogo

    } catch (error) {
        console.error('Erro ao atualizar produto:', error.message);
        // Adicionar feedback visual ou notificação
    } finally {
        isUpdating.value = false;
    }
};





const closeQuantityDialog = () => {
    quantityDialog.value = {
        show: false,  
        amount: 0,
        previousWeight: 0
    };
};
const isMounted = ref(false);

onMounted(() => {
    isMounted.value = true;
});
</script>

<template>
    <v-card 
        variant="outlined" 
        class="w-100"
        :class="{'bg-grey-lighten-4': currentProduct.location_status === 'removed'}"
    >
        <v-card-item>
            <!-- Cabeçalho do produto -->
            <div class="d-flex justify-space-between align-center mb-2">
                <div class="d-flex align-center">
                    <div class="text-h6">{{ currentProduct.name }}</div>
                    <v-chip
                        :color="locationColor"
                        size="small"
                        class="ml-2"
                    >
                        {{ locationStatus }}
                    </v-chip>
                </div>
                <v-chip
                    :color="stockStatusColor"
                    size="small"
                >
                    {{ stockStatusText }}
                </v-chip>
            </div>

            <!-- Detalhes do produto -->
            <div class="text-body-2 mb-3">
                <div class="mb-1 d-flex justify-space-between align-center">
                    <span>
                        Peso Total: <strong>{{ formatWeight(currentWeight) }}</strong>
                        <v-tooltip location="end">
                            <template v-slot:activator="{ props }">
                                <v-icon
                                    size="small"
                                    color="grey"
                                    class="ml-1"
                                    v-bind="props"
                                >
                                    mdi-information
                                </v-icon>
                            </template>
                            <span>Inclui peso do container ({{ formatWeight(containerWeight) }})</span>
                        </v-tooltip>
                    </span>
                    <span class="text-caption">
                        (máx: {{ formatWeight(currentProduct.max_capacity) }})
                    </span>
                </div>
                <div class="d-flex justify-space-between align-center">
                    <span>Peso Líquido: <strong>{{ formatWeight(netWeight) }}</strong></span>
                    <span>Mínimo: {{ formatWeight(currentProduct.min_stock) }}</span>
                </div>
            </div>

            <!-- Simulação do Sensor RFID -->
            <v-card-actions class="px-0 pb-0">
                <v-btn
                    block
                    :color="currentProduct.location_status === 'in_shelf' ? 'error' : 'success'"
                    variant="tonal"
                    @click="simulateRFIDScan"
                >
                    <v-icon class="mr-2">
                        {{ currentProduct.location_status === 'in_shelf' ? 'mdi-exit-run' : 'mdi-login' }}
                    </v-icon>
                    Simular Passagem pelo Sensor RFID
                </v-btn>
            </v-card-actions>
        </v-card-item>

        <!-- Diálogo de Ajuste de Quantidade -->
        <v-dialog
    v-if="isMounted"
    v-model="quantityDialog.show"
    max-width="400px"
>
    <v-card>
        <v-card-title>{{ dialogTitle }}</v-card-title>
        <v-card-text>
            <!-- Mensagem de Erro -->
            <v-alert
                v-if="quantityDialog.error"
                type="error"
                class="mb-4"
            >
                {{ quantityDialog.error }}
            </v-alert>

            <!-- Informação do estado atual -->
            <div class="mb-4">
                <p v-if="currentProduct.location_status === 'in_shelf'" class="text-subtitle-1">
                    Quantidade atual: {{ formatWeight(netWeight) }}
                </p>
                <p v-else class="text-subtitle-1">
                    Última quantidade registada: {{ formatWeight(lastKnownWeight - containerWeight) }}
                </p>
            </div>

            <!-- Campo de entrada -->
            <v-text-field
                v-model="quantityDialog.amount"
                type="number"
                label="Nova quantidade (g)"
                :rules="[ 
                    v => (v !== null && v !== '') || 'Quantidade é obrigatória',
                    v => Number(v) >= 0 || 'Quantidade não pode ser negativa',
                    v => Number(v) <= maxAllowedQuantity || 
                        `Quantidade não pode exceder ${formatWeight(maxAllowedQuantity)}` 
                ]"
                :hint="'Introduza a quantidade que pretende ajustar, considerando o limite da prateleira e do produto.'"
                persistent-hint
                @keypress="onlyNumbers"
                :disabled="!!quantityDialog.error"
            >
                <template v-slot:append>
                    <span class="text-caption">
                        máx: {{ formatWeight(maxAllowedQuantity) }}
                    </span>
                </template>
            </v-text-field>

            <!-- Indicador de alteração -->
            <div v-if="quantityDialog.amount && !quantityDialog.error" class="mt-4">
                <v-chip
                    size="small"
                    :color="getQuantityChangeText.includes('+') ? 'success' : 'warning'"
                    variant="outlined"
                    class="px-3 py-2"
                >
                    <v-icon size="small" :class="{'mr-2': true}">
                        {{ getQuantityChangeText.includes('+') ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                    </v-icon>
                    {{ getQuantityChangeText }}
                </v-chip>
            </div>
        </v-card-text>

        <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn 
                color="primary" 
                @click="confirmQuantityChange"
                :disabled="!isValidQuantity || !!quantityDialog.error"
                :loading="isUpdating"
            >
                {{ isUpdating ? 'A confirmar...' : 'Confirmar' }}
            </v-btn>
            <v-btn 
                color="error" 
                text 
                @click="closeQuantityDialog"
                :disabled="isUpdating"
            >
                Cancelar
            </v-btn>
        </v-card-actions>
    </v-card>
</v-dialog>

    </v-card>
</template>