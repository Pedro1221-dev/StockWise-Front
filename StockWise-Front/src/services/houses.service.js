// services/houses.service.js
import { apiService } from './api.service'

class HousesService {
    /**
     * Obtém todas as casas do utilizador autenticado
     * @param {string} userId - ID do utilizador
     * @param {string} token - Token de autenticação
     * @returns {Promise} Lista de casas do utilizador
     */
    async getUserHouses(userId, token) {
        if (!userId || !token) {
            throw new Error('ID do utilizador e token são obrigatórios');
        }

        try {
            const response = await apiService.get(`/users/${userId}/houses`, token);
            
            if (response.success) {
                // Processar cada casa para definir o role correto
                response.data = response.data.map(house => {
                    // Verificar se o utilizador é o proprietário comparando user_id
                    const isOwner = house.user_id === userId;
                    return {
                        ...house,
                        role: isOwner ? 'owner' : 'member'
                    };
                });
            }
            
            return response;
        } catch (error) {
            console.error('Erro ao obter casas:', error);
            throw error;
        }
    }

    /**
     * Regista uma nova casa
     * @param {Object} houseData - Dados da casa
     * @param {string} token - Token de autenticação
     * @returns {Promise} Casa criada
     */
    async registerHouse(houseData, token) {
        if (!token) {
            throw new Error('Token de autenticação é obrigatório');
        }

        try {
            return await apiService.post('/houses', houseData, token);
        } catch (error) {
            console.error('Erro ao registar casa:', error);
            throw error;
        }
    }

        /**
     * Obtém detalhes de uma casa específica
     * @param {string} houseId - ID da casa
     * @param {string} token - Token de autenticação
     * @returns {Promise} Detalhes da casa
     */
        async getHouseDetails(houseId, token) {
            if (!houseId || !token) {
                throw new Error('ID da casa e token são obrigatórios');
            }
    
            try {
                return await apiService.get(`/houses/${houseId}`, token);
            } catch (error) {
                console.error('Erro ao obter detalhes da casa:', error);
                throw error;
            }
        }
        
}



export const housesService = new HousesService();