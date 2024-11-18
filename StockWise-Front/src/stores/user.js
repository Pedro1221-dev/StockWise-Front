// StockWise-Front\src\stores\user.js
import { defineStore } from 'pinia'
import { apiService } from '@/services/api.service'
import router from '@/router'
import { useHousesStore } from './houses'

export const useUserStore = defineStore('users', {
    state: () => ({
        user: null,
        isAuthenticated: false,
        error: null,
        initialized: false
    }),

    getters: {
        getCurrentUser: (state) => state.user,
        getAuthStatus: (state) => state.isAuthenticated
    },

    actions: {
        /**
         * Extrai dados do utilizador do token JWT
         * @param {string} token - Token JWT
         * @returns {Object} Dados do utilizador
         * @private
         */
        extractUserDataFromToken(token) {
            try {
                // Decodificar a parte payload do token (2ª parte)
                const tokenParts = token.split('.');
                const payload = JSON.parse(atob(tokenParts[1]));
                
                // Criar objeto com dados básicos do utilizador
                return {
                    user_id: payload.user_id,
                    email: payload.email
                };
            } catch (error) {
                console.error('Erro ao extrair dados do token:', error);
                return null;
            }
        },

        /**
         * Inicializa o estado do utilizador
         */
        async init() {
            if (this.initialized) return;

            try {
                const token = localStorage.getItem('token');
                const userDataStr = localStorage.getItem('userData');

                if (token) {
                    if (userDataStr) {
                        // Se temos dados guardados, usar esses
                        this.user = JSON.parse(userDataStr);
                    } else {
                        // Se não, extrair do token
                        this.user = this.extractUserDataFromToken(token);
                    }
                    this.isAuthenticated = !!this.user;
                }
            } catch (error) {
                console.error('Erro ao inicializar utilizador:', error);
                this.logout();
            } finally {
                this.initialized = true;
            }
        },

        /**
         * Efetua login do utilizador
         */
        async login(credentials) {
            try {
                this.error = null;
                
                const response = await apiService.post('/users/login', credentials);
                
                if (!response.success || !response.accessToken) {
                    throw new Error(response.msg || 'Erro ao efetuar login');
                }

                // Processar login e autenticação
                const token = response.accessToken;
                const userData = this.extractUserDataFromToken(token);

                if (!userData) {
                    throw new Error('Erro ao processar dados do utilizador');
                }

                localStorage.setItem('token', token);
                localStorage.setItem('userData', JSON.stringify(userData));
                this.user = userData;
                this.isAuthenticated = true;

                // Carregar casas e inicializar simuladores/subscrições
                await this.initializeAfterLogin();

                // Redirecionar
                const redirect = router.currentRoute.value.query.redirect;
                await router.replace(redirect || '/houses');

                return response;
            } catch (error) {
                this.error = error.message || 'Erro ao efetuar login';
                console.error('Erro no login:', error);
                this.logout();
                throw error;
            }
        },

        // Adicionar nas actions do useUserStore
async createUser(userData) {
    try {
        console.log('A tentar criar utilizador:', userData);
        
        // Fazer pedido à API
        const response = await apiService.post('/users', userData);
        
        if (!response.success) {
            throw new Error(response.msg || 'Erro ao criar utilizador');
        }

        console.log('Utilizador criado com sucesso:', response.data);
        return response;
        
    } catch (error) {
        console.error('Erro ao criar utilizador:', error);
        throw error;
    }
},

                /**
         * Inicializa recursos após login
         */
// src/stores/user.js
async initializeAfterLogin() {
    try {
        const { fetchUserHouses } = useHousesStore();
        await fetchUserHouses(true);
    } catch (error) {
        // Apenas loggar o erro, mas não o propagar se for relacionado com "no houses"
        if (!error.msg?.includes('No houses found')) {
            throw error;
        }
        console.log('Utilizador sem casas registadas - normal para novos utilizadores');
    }
},
        /**
         * Verifica estado de autenticação
         */
        checkAuth() {
            const token = localStorage.getItem('token');
            return !!token && this.isAuthenticated;
        },

 /**
         * Efetua logout do utilizador
         */
 logout() {
    // Parar simuladores
 //   temperatureSimulatorService.stopAll();
    
    // Limpar subscrições MQTT
  //  mqttSubscriptionManager.clearAllSubscriptions();
    
    // Limpar dados do utilizador
    this.user = null;
    this.isAuthenticated = false;
    localStorage.removeItem('token');
    localStorage.removeItem('userData');

    if (router.currentRoute.value.name !== 'login') {
        router.push({ name: 'login' });
    }
},

        /**
         * Força logout sem redirecionar (usado no caso de token expirado)
         */
        forceLogout() {
            this.user = null;
            this.isAuthenticated = false;
            this.initialized = false;
        },
        /**
         * Limpa erros da store
         */
        clearError() {
            this.error = null;
        }
    }
});