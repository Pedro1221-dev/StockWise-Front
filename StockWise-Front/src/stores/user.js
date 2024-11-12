// stores/user.js

import { defineStore } from 'pinia'
import { apiService } from '@/services/api.service'

export const useUserStore = defineStore('users', {
    state: () => ({
        // Estado do utilizador
        user: null,
        isAuthenticated: false,
        error: null
    }),

    getters: {
        // Podemos adicionar getters conforme necessário
        getCurrentUser: (state) => state.user,
        getAuthStatus: (state) => state.isAuthenticated
    },

    actions: {
        /**
         * Criar novo utilizador
         * @param {Object} userData - Dados do novo utilizador
         * @returns {Promise} Resultado da criação
         */
        async createUser(userData) {
            try {
                this.error = null
                const response = await apiService.post('/users', userData)
                
                if (response.success) {
                    return response.data
                } else {
                    throw new Error(response.msg || 'Erro ao criar utilizador')
                }
            } catch (error) {
                this.error = error.msg || 'Erro ao criar utilizador'
                throw error
            }
        },

        /**
         * Login do utilizador
         * @param {Object} credentials - Credenciais (login e password)
         * @returns {Promise} Resultado do login
         */
        async login(credentials) {
            try {
                this.error = null
                
                // Adaptar credenciais para o formato esperado pelo backend
                const loginData = {
                    login: credentials.login || credentials.email, // Suporta ambos os formatos
                    password: credentials.password
                }

                const response = await apiService.post('/users/login', loginData)
                
                if (response.success) {
                    // Guardar dados do utilizador
                    this.user = response.data
                    this.isAuthenticated = true
                    
                    // Guardar token em localStorage
                    localStorage.setItem('token', response.accessToken)
                    
                    return response
                } else {
                    throw new Error(response.msg || 'Erro ao efetuar login')
                }
            } catch (error) {
                this.error = error.msg || 'Erro ao efetuar login'
                throw error
            }
        },

        /**
         * Logout do utilizador
         */
        logout() {
            // Limpar estado
            this.user = null
            this.isAuthenticated = false
            
            // Remover token do localStorage
            localStorage.removeItem('token')
        },

        /**
         * Verificar se existe uma sessão ativa
         * @returns {boolean} Estado da sessão
         */
        checkAuth() {
            const token = localStorage.getItem('token')
            if (token) {
                this.isAuthenticated = true
                return true
            }
            return false
        },

        /**
         * Limpar erro
         */
        clearError() {
            this.error = null
        }
    }
})