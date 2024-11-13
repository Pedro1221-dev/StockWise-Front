// stores/houses.js
import { defineStore } from 'pinia'
import { housesService } from '@/services/houses.service'
import { useUserStore } from './user'

export const useHousesStore = defineStore('houses', {
    state: () => ({
        houses: [],
        loading: false,
        error: null,
        lastFetch: null
    }),

    getters: {
        getHouses: (state) => state.houses,
        hasHouses: (state) => state.houses.length > 0,
        needsRefresh: (state) => !state.lastFetch || (Date.now() - state.lastFetch) > 300000 // 5 minutos
    },

    actions: {
        /**
         * Carrega as casas do utilizador
         * @param {boolean} force - Força recarregamento mesmo se cache existe
         */
        async fetchUserHouses(force = false) {
            // Se já temos dados recentes e não é forçado, retornar
            if (!force && !this.needsRefresh && this.houses.length > 0) {
                return;
            }

            this.loading = true;
            this.error = null;
            
            try {
                const userStore = useUserStore();
                // Garantir que o userStore está inicializado
                await userStore.init();

                if (!userStore.isAuthenticated) {
                    throw new Error('Utilizador não autenticado');
                }

                // Garantir que temos o token e user_id
                const token = localStorage.getItem('token');
                const userId = userStore.user?.user_id;

                if (!token || !userId) {
                    throw new Error('Dados de autenticação inválidos');
                }

                const response = await housesService.getUserHouses(userId, token);

                if (response.success) {
                    this.houses = response.data;
                    this.lastFetch = Date.now();
                } else {
                    throw new Error(response.msg || 'Erro ao obter casas');
                }
            } catch (error) {
                this.error = error.message || 'Erro ao carregar casas';
                console.error('Erro ao carregar casas:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        /**
         * Regista uma nova casa
         */
        async registerHouse(houseData) {
            this.loading = true;
            this.error = null;

            try {
                const userStore = useUserStore();
                if (!userStore.isAuthenticated) {
                    throw new Error('Utilizador não autenticado');
                }

                const token = localStorage.getItem('token');
                const response = await housesService.registerHouse(houseData, token);
                
                if (response.success) {
                    // Adicionar nova casa e atualizar timestamp
                    this.houses.push(response.data);
                    this.lastFetch = Date.now();
                    return response.data;
                } else {
                    throw new Error(response.msg || 'Erro ao registar casa');
                }
            } catch (error) {
                this.error = error.message || 'Erro ao registar casa';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        /**
         * Limpa o estado das casas
         */
        clearHouses() {
            this.houses = [];
            this.error = null;
            this.lastFetch = null;
        }
    }
});