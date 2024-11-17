// stores/products.js
import { defineStore } from 'pinia';
import { mqttService } from '@/services/mqtt.service';
import { productsService } from '@/services/products.service';

export const useProductsStore = defineStore('products', {
    state: () => ({
        products: new Map(),
        shelfWeights: new Map(),
        loading: false,
        error: null
    }),

    actions: {
        // Inicialização
        initializeProducts(shelves) {
            console.log('[ProductsStore] Inicializando produtos:', shelves);

            shelves.forEach(shelf => {
                // Registar produtos
                shelf.Products.forEach(product => {
                    this.products.set(product.product_id, {
                        ...product,
                        shelf_id: shelf.shelf_id
                    });
                });

                // Calcular peso inicial da prateleira
                this.updateShelfWeight(shelf.shelf_id);
            });

            // Iniciar subscrições MQTT
            this.subscribeToProductEvents();
        },

        // Gestão de Produtos
        async registerProduct(productData) {
            try {
                console.log('[ProductsStore] A registar novo produto:', productData);

                const token = localStorage.getItem('token');
                const response = await productsService.create(productData, token);

                if (!response.success) {
                    throw new Error(response.message || 'Erro ao registar produto');
                }

                // Adicionar à store local
                const newProduct = response.data;
                this.products.set(newProduct.product_id, newProduct);

                // Atualizar peso da prateleira
                this.updateShelfWeight(newProduct.shelf_id);

                return newProduct;
            } catch (error) {
                console.error('[ProductsStore] Erro ao registar produto:', error);
                throw error;
            }
        },

        async updateProduct(productId, updates) {
            try {
                const product = this.products.get(productId);
                if (!product) {
                    throw new Error('Produto não encontrado');
                }

                console.log('[ProductsStore] Atualizando produto:', {
                    productId,
                    currentState: { ...product },
                    updates
                });

                // Atualizar na BD
                const token = localStorage.getItem('token');
                const response = await productsService.updateProduct(productId, updates, token);

                if (!response.success) {
                    throw new Error(response.message || 'Erro ao atualizar produto');
                }

                // Atualizar estado local
                const updatedProduct = {
                    ...product,
                    ...updates
                };
                this.products.set(productId, updatedProduct);

                // Atualizar peso da prateleira
                this.updateShelfWeight(product.shelf_id);

                return updatedProduct;
            } catch (error) {
                console.error('[ProductsStore] Erro ao atualizar produto:', error);
                throw error;
            }
        },

        // Gestão de Peso das Prateleiras
        updateShelfWeight(shelfId) {
            let totalWeight = 0;

            this.products.forEach(product => {
                if (product.shelf_id === shelfId &&
                    product.location_status === 'in_shelf') {
                    totalWeight += product.current_weight || 0;
                }
            });

            console.log('[ProductsStore] Peso atualizado da prateleira:', {
                shelfId,
                newTotal: totalWeight,
                produtos: Array.from(this.products.values())
                    .filter(p => p.shelf_id === shelfId)
                    .map(p => ({
                        id: p.product_id,
                        nome: p.name,
                        peso: p.current_weight,
                        estado: p.location_status
                    }))
            });

            this.shelfWeights.set(shelfId, totalWeight);
            return totalWeight;
        },

        // Validações
        validateShelfCapacity(shelfId, shelf, newWeight, excludedProductId = null) {
            if (!shelf) throw Error("Prateleira não encontrada");

            let currentShelfWeight = 0;

            // Calcular o peso atual na prateleira, excluindo o produto em questão (se aplicável)
            this.products.forEach(product => {
                if (product.shelf_id === shelfId &&
                    product.location_status === 'in_shelf' &&
                    product.product_id !== excludedProductId) {
                    currentShelfWeight += product.current_weight || 0;
                }
            });

            const projectedTotal = currentShelfWeight + newWeight; // Considerar o peso total projetado

            console.log("[ProductsStore] Validando capacidade:", {
                shelfId,
                currentTotal: currentShelfWeight,
                newWeight,
                projectedTotal,
                maxWeight: shelf.max_weight,
                excludedProductId
            });

            // Verificar se o peso projetado excede a capacidade máxima
            if (projectedTotal > shelf.max_weight) {
                const availableWeight = shelf.max_weight - currentShelfWeight;
                throw Error(`Capacidade excedida. Disponível: ${availableWeight}g`);
            }

            return true; // Validação bem-sucedida
        },

        isShelfAvailable(shelf, typeConfig) {
            if (!shelf || !typeConfig) return false;

            // Capacidade restante na prateleira
            const remainingCapacity = this.getShelfAvailableCapacity(shelf.shelf_id, shelf);

            // Verificar se há capacidade suficiente para o peso do recipiente
            const hasCapacity = remainingCapacity >= typeConfig.containerWeight;

            console.log(`[ProductsStore] Verificando prateleira: ${shelf.name}`, {
                remainingCapacity,
                requiredCapacity: typeConfig.containerWeight,
                isAvailable: hasCapacity
            });

            return hasCapacity;
        },

        subscribeToProductEvents() {
            // Subscrever a eventos de peso
            mqttService.subscribe('house/+/shelf/+/weight', (message, topic) => {
                const [, houseId, , shelfId] = topic.split('/');

                if (message.product_id) {
                    this.updateProduct(message.product_id, {
                        current_weight: message.new_weight
                    });
                }
            });

            // Subscrever a eventos de status
            mqttService.subscribe('house/+/shelf/+/product/status', (message, topic) => {
                const [, houseId, , shelfId] = topic.split('/');

                if (message.product_id) {
                    this.updateProduct(message.product_id, {
                        location_status: message.location_status
                    });
                }
            });

            console.log('Subscrições MQTT inicializadas');
        },

        cleanup() {
            mqttService.unsubscribe('house/+/shelf/+/weight');
            mqttService.unsubscribe('house/+/shelf/+/product/status');
        }
    },

    getters: {
        getProduct: (state) => (productId) => {
            return state.products.get(productId);
        },

        getShelfProducts: (state) => (shelfId) => {
            return Array.from(state.products.values())
                .filter(product => product.shelf_id === shelfId);
        },

        getCurrentShelfWeight: (state) => (shelfId) => {
            return state.shelfWeights.get(shelfId) || 0;
        },

        getShelfAvailableCapacity: (state) => (shelfId, shelf) => {
            if (!shelf) return 0;

            const currentWeight = state.shelfWeights.get(shelfId) || 0;
            const availableCapacity = Math.max(0, shelf.max_weight - currentWeight);

            console.log('[ProductsStore] Capacidade disponível:', {
                shelfId,
                maxWeight: shelf.max_weight,
                currentWeight,
                available: availableCapacity
            });

            return availableCapacity;
        },

        canAddWeightToShelf: (state) => (shelfId, shelf, weightToAdd) => {
            if (!shelf) return false;
            const available = state.getShelfAvailableCapacity(shelfId, shelf);
            return weightToAdd <= available;
        }
    }
});
