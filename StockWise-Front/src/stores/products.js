// StockWise-Front\src\stores\products.js
import { defineStore } from 'pinia';
import { mqttService } from '@/services/mqtt.service';
import { productsService } from '@/services/products.service';


export const useProductsStore = defineStore('products', {
    state: () => ({
        // Map de product_id -> product data
        products: new Map(),
        // Map de shelf_id -> total weight
        shelfWeights: new Map()
    }),

    actions: {
        initializeProducts(shelves) {
            // Inicializar produtos de todas as prateleiras
            shelves.forEach(shelf => {
                shelf.Products.forEach(product => {
                    this.products.set(product.product_id, {
                        ...product,
                        shelf_id: shelf.shelf_id
                    });
                });
                // Inicializar peso total da prateleira
                this.updateShelfWeight(shelf.shelf_id);
            });

            // Subscrever aos tópicos MQTT relevantes
            this.subscribeToProductEvents();
        },

        async updateProduct(productId, updates) {
            try {
                const product = this.products.get(productId);
                if (!product) {
                    console.warn('Produto não encontrado:', productId);
                    return;
                }

                // Log do estado anterior
                console.log('Estado anterior do produto:', {
                    productId,
                    oldState: { ...product }
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

                console.log('Produto atualizado:', {
                    productId,
                    updates,
                    newState: updatedProduct
                });

                // Atualizar peso total da prateleira
                this.updateShelfWeight(product.shelf_id);

            } catch (error) {
                console.error('Erro ao atualizar produto:', error);
                throw error;
            }
        },

        updateShelfWeight(shelfId) {
            // Calcular peso total da prateleira
            let totalWeight = 0;
            this.products.forEach(product => {
                if (product.shelf_id === shelfId && product.location_status === 'in_shelf') {
                    totalWeight += product.current_weight || 0;
                }
            });
            this.shelfWeights.set(shelfId, totalWeight);

            console.log('Peso da prateleira atualizado:', {
                shelfId,
                totalWeight
            });
        },

        async registerProduct(productData) {
            try {
                console.log('[ProductsStore] Registando novo produto:', productData);
        
                // Enviar para a API
                const token = localStorage.getItem('token');
                const response = await productsService.create(productData, token);
        
                if (!response.success) {
                    throw new Error(response.message || 'Erro ao registar produto');
                }
        
                // Adicionar à store
                const newProduct = response.data;
                this.products.set(newProduct.product_id, newProduct);
        
                // Atualizar peso total da prateleira
                this.updateShelfWeight(newProduct.shelf_id);
        
                console.log('[ProductsStore] Produto registado com sucesso:', newProduct);
                return newProduct;
        
            } catch (error) {
                console.error('[ProductsStore] Erro ao registar produto:', error);
                throw error;
            }
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

        getShelfWeight: (state) => (shelfId) => {
            return state.shelfWeights.get(shelfId) || 0;
        },

        getShelfProducts: (state) => (shelfId) => {
            const shelfProducts = [];
            state.products.forEach(product => {
                if (product.shelf_id === shelfId) {
                    shelfProducts.push(product);
                }
            });
            return shelfProducts;
        }
    }
});