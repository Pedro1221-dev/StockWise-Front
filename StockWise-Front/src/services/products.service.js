// services/products.service.js
import { apiService } from './api.service';

class ProductsService {
    /**
     * Cria um novo produto
     * @param {Object} productData - Dados do produto
     * @param {string} token - Token de autenticação
     * @returns {Promise} Promise com resultado da operação
     */
    async create(productData, token) {
        try {
            console.log('[ProductsService] Criando novo produto:', productData);
            return await apiService.post('/products', productData, token);
        } catch (error) {
            console.error('[ProductsService] Erro ao criar produto:', error);
            throw error;
        }
    }

    /**
     * Atualiza um produto existente
     * @param {number} productId - ID do produto
     * @param {Object} updates - Dados a atualizar
     * @param {string} token - Token de autenticação
     * @returns {Promise} Promise com resultado da operação
     */
    async updateProduct(productId, updates, token) {
        try {
            console.log('[ProductsService] Atualizando produto:', { productId, updates });
            return await apiService.patch(`/products/${productId}`, updates, token);
        } catch (error) {
            console.error('[ProductsService] Erro ao atualizar produto:', error);
            throw error;
        }
    }

    /**
     * Obtém produtos de uma prateleira
     * @param {number} shelfId - ID da prateleira
     * @param {string} token - Token de autenticação
     * @returns {Promise} Promise com produtos da prateleira
     */
    async getByShelf(shelfId, token) {
        try {
            return await apiService.get(`/products/shelf/${shelfId}`, token);
        } catch (error) {
            console.error('[ProductsService] Erro ao retrieve produtos da prateleira:', error);
            throw error;
        }
    }
}

export const productsService = new ProductsService();