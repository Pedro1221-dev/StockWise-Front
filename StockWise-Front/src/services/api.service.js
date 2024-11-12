// services/api.service.js

import axios from 'axios'

class ApiService {
    constructor() {
        this.api = axios.create({
            baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        })

        // Interceptor para tratar respostas e erros
        this.api.interceptors.response.use(
            response => response.data,
            error => {
                if (error.response) {
                    // O servidor respondeu com um status de erro
                    return Promise.reject(this.formatError(error.response.data))
                } else if (error.request) {
                    // A requisição foi feita mas não houve resposta
                    return Promise.reject({
                        success: false,
                        msg: 'Erro de conexão com o servidor. Por favor, tente novamente.'
                    })
                } else {
                    // Algo aconteceu na configuração da requisição
                    return Promise.reject({
                        success: false,
                        msg: 'Erro na configuração do pedido.'
                    })
                }
            }
        )
    }

    /**
     * Formata erro para um formato consistente
     * @param {Object} errorData - Dados do erro
     * @returns {Object} Erro formatado
     */
    formatError(errorData) {
        if (Array.isArray(errorData.msg)) {
            // Se for um array de erros, pega o primeiro
            return {
                ...errorData,
                msg: errorData.msg[0]
            }
        }
        return errorData
    }

    /**
     * Executa uma requisição POST
     * @param {string} endpoint - Endpoint da API
     * @param {Object} data - Dados a serem enviados
     * @param {string} [token] - Token de autenticação (opcional)
     * @returns {Promise} Resultado da requisição
     */
    async post(endpoint, data, token = null) {
        try {
            const headers = {}
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }

            if (import.meta.env.DEV) {
                console.log(`Enviando pedido POST para ${endpoint}:`, data)
            }

            const response = await this.api.post(endpoint, data, { headers })
            return response
        } catch (error) {
            throw error // Já formatado pelo interceptor
        }
    }

    /**
     * Executa uma requisição GET
     * @param {string} endpoint - Endpoint da API
     * @param {string} [token] - Token de autenticação (opcional)
     * @returns {Promise} Resultado da requisição
     */
    async get(endpoint, token = null) {
        try {
            const headers = {}
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }

            const response = await this.api.get(endpoint, { headers })
            return response
        } catch (error) {
            throw error // Já formatado pelo interceptor
        }
    }
}

// Exportar uma única instância do serviço
export const apiService = new ApiService()