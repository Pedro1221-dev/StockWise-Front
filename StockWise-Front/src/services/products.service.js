// services/products.service.js
import { apiService } from './api.service';

class ProductsService {
    /**
     * Atualiza um produto na base de dados
     * @param {number} productId - ID do produto
     * @param {Object} updates - Dados a atualizar
     * @param {string} token - Token de autenticação
     */
    async updateProduct(productId, updates, token) {
        try {
            console.log('Enviando atualização do produto:', {
                productId,
                updates
            });

            return await apiService.patch(`/products/${productId}`, updates, token);
        } catch (error) {
            console.error('Erro ao atualizar produto:', error);
            throw error;
        }
    }
}

export const productsService = new ProductsService();