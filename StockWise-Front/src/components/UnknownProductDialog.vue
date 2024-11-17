// components/UnknownProductDialog.vue

<script setup>
import { ref, computed, watch } from 'vue';
import { useProductsStore } from '@/stores/products';
import { generateRandomTag } from '@/utils/rfid.utils';

const props = defineProps({
    modelValue: Boolean,
    houseId: {
        type: [Number, String],
        required: true
    },
    shelves: {  // Agora recebemos todas as prateleiras
        type: Array,
        required: true
    }
});

const emit = defineEmits(['update:modelValue', 'product-registered']);

// Configurações predefinidas por tipo de produto
const productTypes = {
    dry_goods: {
        label: 'Produtos Secos',
        value: 'dry_goods',
        suggestions: ['Arroz', 'Massa', 'Feijão', 'Grão', 'Lentilhas', 'Quinoa'],
        containerWeight: 500,  // 500g
        maxCapacity: 5000,    // 5kg
        shelfPattern: /produtos?\s+secos?/i  // Padrão para identificar prateleiras de secos
    },
    spices: {
        label: 'Especiarias',
        value: 'spices',
        suggestions: ['Pimenta', 'Orégãos', 'Caril', 'Canela', 'Noz Moscada'],
        containerWeight: 100,  // 100g
        maxCapacity: 500,     // 500g
        shelfPattern: /especiarias?/i  // Padrão para identificar prateleiras de especiarias
    }
};

// Estado do formulário
const form = ref(null);
const isValid = ref(false);
const loading = ref(false);
const selectedType = ref(null);
const selectedShelf = ref(null);

const productsStore = useProductsStore();

// Estado inicial do formulário
const initialFormState = {
    name: '',
    rfid_tag: generateRandomTag(),
    container_weight: 0,
    max_capacity: 0,
    min_stock: 0,
    initial_weight: 0
};

const formData = ref({ ...initialFormState });

// Computed properties
const show = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

const getProductTypes = computed(() => 
    Object.values(productTypes).map(type => ({
        label: type.label,
        value: type.value
    }))
);

const getSuggestedNames = computed(() => {
    if (!selectedType.value) return [];
    return productTypes[selectedType.value]?.suggestions || [];
});

const getShelfRemainingCapacity = (shelf) => {
    const products = shelf.Products || [];
    const currentTotalWeight = products.reduce((sum, product) => 
        sum + (product.current_weight || 0), 0);
    
    // Calcular capacidade restante
    const remainingCapacity = shelf.max_weight - currentTotalWeight;
    
    console.log('Capacidade da prateleira:', {
        shelfName: shelf.name,
        maxWeight: shelf.max_weight,
        currentTotal: currentTotalWeight,
        remaining: remainingCapacity
    });
    
    return Math.max(0, remainingCapacity);
};

// Computed para capacidade disponível
const availableCapacity = computed(() => {
    if (!selectedShelf.value) return 0;
    return productsStore.getShelfAvailableCapacity(
        selectedShelf.value.shelf_id,
        selectedShelf.value
    );
});

// Computed para prateleiras disponíveis baseado no tipo selecionado
const availableShelves = computed(() => {
    if (!selectedType.value) return [];
    
    const typeConfig = productTypes[selectedType.value];
    
    return props.shelves.filter(shelf => {
        const matchesType = typeConfig.shelfPattern.test(shelf.name);
        const hasSpace = productsStore.isShelfAvailable(shelf, typeConfig);
        
        console.log(`[UnknownProductDialog] Avaliando prateleira ${shelf.name}:`, {
            matchesType,
            hasSpace
        });
        
        return matchesType && hasSpace;
    });
});



const getCapacityInfo = computed(() => {
    if (!selectedType.value) return '';
    
    const type = productTypes[selectedType.value];
    const netCapacity = type.maxCapacity - type.containerWeight;
    
    return `Capacidade útil disponível para produto: ${netCapacity}g
            (Recipiente: ${type.containerWeight}g, Capacidade Total: ${type.maxCapacity}g)`;
});

// Watch para atualizar dados baseado no tipo selecionado
watch(selectedType, (newType) => {
    if (!newType) {
        selectedShelf.value = null;
        return;
    }

    const typeDefaults = productTypes[newType];

    // Configuração inicial do formulário
    formData.value = {
        ...formData.value,
        container_weight: typeDefaults.containerWeight,
        max_capacity: typeDefaults.maxCapacity,
        min_stock: typeDefaults.containerWeight * 0.2
    };

    // Atualizar prateleiras disponíveis
    const shelves = availableShelves.value;
    selectedShelf.value = shelves.length > 0 ? shelves[0] : null;
});


// Watch para atualizar limites quando a prateleira muda
watch(selectedShelf, (newShelf) => {
    if (!newShelf || !selectedType.value) return;
    
    const typeDefaults = productTypes[selectedType.value];
    const maxPossible = Math.min(typeDefaults.maxCapacity, availableCapacity.value);
    
    formData.value.max_capacity = maxPossible;
    formData.value.initial_weight = Math.min(formData.value.initial_weight, maxPossible - formData.value.container_weight);
});

// Métodos
const handleSubmit = async () => {
    if (!form.value?.validate() || !selectedShelf.value) return;

    try {
        loading.value = true;

        const totalWeight = formData.value.initial_weight + formData.value.container_weight;
        
        // Validar capacidade antes de prosseguir
        productsStore.validateShelfCapacity(
            selectedShelf.value.shelf_id,
            selectedShelf.value,
            totalWeight
        );

        const newProduct = {
            name: formData.value.name,
            rfid_tag: formData.value.rfid_tag,
            shelf_id: selectedShelf.value.shelf_id,
            container_weight: formData.value.container_weight,
            min_stock: formData.value.min_stock,
            max_capacity: formData.value.max_capacity,
            current_weight: totalWeight,
            location_status: 'in_shelf'
        };

        await productsStore.registerProduct(newProduct);

        emit('product-registered', { ...newProduct, shelf: selectedShelf.value });

        resetForm();
        show.value = false;

    } catch (error) {
        console.error('Erro ao registar produto:', error);
        // Mostrar erro ao utilizador
    } finally {
        loading.value = false;
    }
};

const resetForm = () => {
    selectedType.value = null;
    selectedShelf.value = null;
    formData.value = { ...initialFormState };
    form.value?.reset();
};

const onCancel = () => {
    resetForm();
    show.value = false;
};

// Limpar formulário quando o diálogo for aberto
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        resetForm();
    }
});

// Modificar o watch do modelValue para incluir geração de nova tag
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        // Reset do formulário
        selectedType.value = null;
        selectedShelf.value = null;
        // Gerar nova tag RFID
        formData.value = { 
            ...initialFormState,
            rfid_tag: generateRandomTag() 
        };
        form.value?.reset();
    }
});
</script>

<template>
    <v-dialog
        v-model="show"
        max-width="600px"
        persistent
    >
        <v-card>
            <v-card-title class="text-h5 bg-primary text-white">
                Novo Produto
            </v-card-title>

            <v-card-text class="mt-4">
                <!-- Seletor de Tipo -->
                <v-select
                    v-model="selectedType"
                    :items="getProductTypes"
                    label="Tipo de Produto *"
                    item-title="label"
                    item-value="value"
                    :rules="[v => !!v || 'Tipo é obrigatório']"
                    required
                >
                    <template v-slot:prepend>
                        <v-icon :color="selectedType ? 'primary' : 'grey'">
                            {{ selectedType === 'dry_goods' ? 'mdi-food' : 'mdi-shaker-outline' }}
                        </v-icon>
                    </template>
                </v-select>

                <!-- Seletor de Prateleira -->
                <v-select
                    v-if="selectedType"
                    v-model="selectedShelf"
                    :items="availableShelves"
                    label="Prateleira *"
                    item-title="name"
                    :rules="[v => !!v || 'Prateleira é obrigatória']"
                    :disabled="availableShelves.length <= 1"
                    :hint="availableShelves.length === 0 ? 'Nenhuma prateleira disponível para este tipo de produto' : ''"
                    persistent-hint
                    required
                >
                    <template v-slot:item="{ props, item }">
                        <v-list-item v-bind="props">
                            <template v-slot:prepend>
                                <v-icon :color="'primary'">
                                    mdi-shelf
                                </v-icon>
                            </template>
                            <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                        </v-list-item>
                    </template>
                </v-select>

                <v-form
                    v-if="selectedShelf"
                    ref="form"
                    v-model="isValid"
                    @submit.prevent="handleSubmit"
                >
                    <!-- Nome do Produto -->
                    <v-combobox
                        v-model="formData.name"
                        :items="getSuggestedNames"
                        label="Nome do Produto *"
                        :rules="[v => !!v || 'Nome é obrigatório']"
                        required
                    ></v-combobox>

                    <!-- RFID Tag -->
                    <v-text-field
                        v-model="formData.rfid_tag"
                        label="RFID Tag"
                        readonly
                        :hint="`Tag lida pelo sensor ${selectedShelf?.rfid_sensor_id}`"
                        persistent-hint
                    ></v-text-field>

    <!-- Informações do Container -->
    <v-card
        class="my-4 pa-4"
        variant="outlined"
    >
        <div class="text-subtitle-1 mb-2">Informações do Recipiente e Capacidade</div>
        <div class="text-body-2">
            <div>Peso do Recipiente: {{ formData.container_weight }}g</div>
            <div>Capacidade Máxima Permitida: {{ formData.max_capacity }}g</div>
            <div class="mt-2">
                <v-chip
                    color="primary"
                    size="small"
                >
                    Espaço disponível na prateleira: {{ availableCapacity }}g
                </v-chip>
            </div>
            <div class="mt-2 text-medium-emphasis">
                Capacidade útil para produto: {{ formData.max_capacity - formData.container_weight }}g
            </div>
        </div>
    </v-card>
                    <!-- Stock Mínimo -->
                    <v-text-field
                        v-model.number="formData.min_stock"
                        type="number"
                        label="Stock Mínimo (g) *"
                        :rules="[
                            v => !!v || 'Stock mínimo é obrigatório',
                            v => v > 0 || 'Deve ser maior que 0',
                            v => v <= formData.max_capacity - formData.container_weight || 
                                'Não pode exceder a capacidade útil'
                        ]"
                        :hint="`Valor recomendado: ${Math.floor(formData.container_weight * 0.2)}g`"
                        persistent-hint
                        required
                    ></v-text-field>

<!-- Quantidade Inicial com regras atualizadas -->
<v-text-field
        v-model.number="formData.initial_weight"
        type="number"
        label="Quantidade Inicial (g) *"
        :rules="[
            v => !!v || 'Quantidade inicial é obrigatória',
            v => v >= 0 || 'Não pode ser negativa',
            v => v <= formData.max_capacity - formData.container_weight || 
                'Excede a capacidade útil disponível',
            v => v + formData.container_weight <= availableCapacity || 
                'Excede o espaço disponível na prateleira'
        ]"
        :hint="`Máximo permitido: ${formData.max_capacity - formData.container_weight}g`"
        persistent-hint
        required
    ></v-text-field>
                </v-form>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="pa-4">
                <v-spacer></v-spacer>
                <v-btn
                    color="error"
                    variant="text"
                    :disabled="loading"
                    @click="onCancel"
                >
                    Cancelar
                </v-btn>
                <v-btn
                    color="primary"
                    :loading="loading"
                    :disabled="!isValid || !selectedShelf"
                    @click="handleSubmit"
                >
                    Registar Produto
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.v-card-text {
    max-height: 70vh;
    overflow-y: auto;
}
</style>