// services/api.service.js
import axios from 'axios';

class ApiService {
    constructor() {
        this.api = axios.create({
            baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Interceptor para tratar respostas e erros
        this.api.interceptors.response.use(
            response => response.data,
            error => {
                if (error.response) {
                    return Promise.reject(this.formatError(error.response.data));
                } else if (error.request) {
                    return Promise.reject({
                        success: false,
                        msg: 'Erro de conexão com o servidor. Por favor, tente novamente.'
                    });
                } else {
                    return Promise.reject({
                        success: false,
                        msg: 'Erro na configuração do pedido.'
                    });
                }
            }
        );
    }

    /**
     * Formata erro para um formato consistente
     */
    formatError(errorData) {
        if (Array.isArray(errorData.msg)) {
            return {
                ...errorData,
                msg: errorData.msg[0]
            };
        }
        return errorData;
    }

    /**
     * Obtém headers com token de autenticação
     */
    getAuthHeaders(token) {
        return {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
    }

    /**
     * GET request
     */
    async get(endpoint, token = null) {
        try {
            const config = token ? this.getAuthHeaders(token) : {};
            const response = await this.api.get(endpoint, config);
            return response;
        } catch (error) {
            throw error;
        }
    }

    /**
     * POST request
     */
    async post(endpoint, data, token = null) {
        try {
            const config = token ? this.getAuthHeaders(token) : {};
            
            if (import.meta.env.DEV) {
                console.log(`Enviando pedido POST para ${endpoint}:`, data);
            }
            
            const response = await this.api.post(endpoint, data, config);
            return response;
        } catch (error) {
            throw error;
        }
    }

    /**
     * PATCH request
     */
    async patch(endpoint, data, token = null) {
        try {
            const config = token ? this.getAuthHeaders(token) : {};
            
            if (import.meta.env.DEV) {
                console.log(`Enviando pedido PATCH para ${endpoint}:`, data);
            }
            console.log('Enviando pedido PATCH para', endpoint, ':', data);
            const response = await this.api.patch(endpoint, data, config);
            return response;
        } catch (error) {
            throw error;
        }
    }
}

export const apiService = new ApiService();