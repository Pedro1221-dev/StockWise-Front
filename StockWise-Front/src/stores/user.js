// stores/user.js
import { defineStore } from 'pinia'
import { apiService } from '@/services/api.service'
import router from '@/router'

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
                
                // 1. Fazer login e obter token
                const response = await apiService.post('/users/login', credentials);
                console.log('Resposta do login:', response);

                if (!response.success || !response.accessToken) {
                    throw new Error(response.msg || 'Erro ao efetuar login');
                }

                // 2. Guardar token e extrair dados do utilizador
                const token = response.accessToken;
                const userData = this.extractUserDataFromToken(token);

                if (!userData) {
                    throw new Error('Erro ao processar dados do utilizador');
                }

                // 3. Atualizar estado
                localStorage.setItem('token', token);
                localStorage.setItem('userData', JSON.stringify(userData));
                this.user = userData;
                this.isAuthenticated = true;

                // 4. Redirecionar
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
            this.user = null;
            this.isAuthenticated = false;
            localStorage.removeItem('token');
            localStorage.removeItem('userData');

            if (router.currentRoute.value.name !== 'login') {
                router.push({ name: 'login' });
            }
        },

        /**
         * Limpa erros da store
         */
        clearError() {
            this.error = null;
        }
    }
});