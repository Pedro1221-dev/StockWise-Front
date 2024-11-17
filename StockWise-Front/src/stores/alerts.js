// stores/alerts.js
import { defineStore } from 'pinia';
import { mqttService } from '@/services/mqtt.service';
import { useHousesStore } from './houses';

export const useAlertsStore = defineStore('alerts', {
    state: () => ({
        alerts: [],              // Array de alertas ativos
        subscribedHouses: new Set(), // Set de house_ids subscritos
        unreadCount: 0,          // Contador de alertas não lidos
        topicSubscriptions: new Map(), // Mapa de subscrições ativas
        debugMode: true          // Modo de debug para logging
    }),

    getters: {
        hasUnreadAlerts: (state) => state.unreadCount > 0,
        
        getActiveAlerts: (state) => (houseId) => 
            state.alerts.filter(alert => 
                alert.houseId === houseId && !alert.dismissed
            ),

        getHouseName: () => (houseId) => {
            const housesStore = useHousesStore();
            const house = housesStore.houses.find(h => h.house_id === houseId);
            return house ? house.name : `Casa ${houseId}`;
        }
    },

    actions: {
        /**
         * Subscreve aos alertas de uma casa específica
         * @param {number|string} houseId - ID da casa
         */
        subscribeToHouseAlerts(houseId) {
            if (this.subscribedHouses.has(houseId)) {
                this.log(`Já subscrito aos alertas da casa ${houseId}`);
                return;
            }

            this.log(`Iniciando subscrição de alertas para casa ${houseId}`);

            // Definir padrões de tópicos
            const topicPatterns = [
                `house/${houseId}/alerts/temperature`,
                `house/${houseId}/alerts/products/#` // Wildcard para todos os subtópicos de produtos
            ];

            // Subscrever a cada padrão
            topicPatterns.forEach(pattern => {
                this.log(`Subscrevendo ao padrão: ${pattern}`);
                
                const callback = (message, topic) => {
                    this.log(`Alerta recebido em ${topic}:`, message);
                    this.handleAlert(houseId, message, topic);
                };

                // Guardar referência da subscrição
                this.topicSubscriptions.set(pattern, callback);
                
                // Subscrever via MQTT
                mqttService.subscribe(pattern, callback);
            });

            this.subscribedHouses.add(houseId);
        },

        /**
         * Processa um alerta recebido
         * @param {number|string} houseId - ID da casa
         * @param {Object} message - Mensagem do alerta
         * @param {string} topic - Tópico que originou o alerta
         */
        handleAlert(houseId, message, topic) {
            this.log('Processando alerta:', { houseId, message, topic });

            // Extrair categoria do tópico
            const category = this.extractCategoryFromTopic(topic);
            
            // Gerar ID único para o alerta
            const alertId = Date.now() + Math.random().toString(36).substring(7);

            const newAlert = {
                id: alertId,
                houseId,
                houseName: this.getHouseName(houseId),
                type: message.type,
                category,
                title: message.title,
                message: message.message,
                severity: message.severity,
                timestamp: message.timestamp,
                data: message.data,
                read: false,
                dismissed: false
            };

            this.log('Criando novo alerta:', newAlert);
            this.createAlert(newAlert);
        },

        /**
         * Extrai a categoria do alerta do tópico
         * @param {string} topic - Tópico MQTT
         * @returns {string} Categoria do alerta
         */
        extractCategoryFromTopic(topic) {
            const parts = topic.split('/');
            const alertType = parts[parts.indexOf('alerts') + 1];
            return alertType || 'unknown';
        },

        /**
         * Adiciona um novo alerta
         * @param {Object} alert - Dados do alerta
         */
        createAlert(alert) {
            this.alerts.unshift(alert);
            this.unreadCount++;
            this.log(`Alerta criado, total não lidos: ${this.unreadCount}`);
            this.log('Alertas ativos:', this.alerts);
        },

        /**
         * Cancela subscrição dos alertas de uma casa
         * @param {number|string} houseId - ID da casa
         */
        unsubscribeFromHouseAlerts(houseId) {
            this.log(`Limpando subscrições para casa ${houseId}`);
            
            // Construir padrões dos tópicos
            const patterns = [
                `house/${houseId}/alerts/temperature`,
                `house/${houseId}/alerts/products/#`
            ];

            // Cancelar cada subscrição
            patterns.forEach(pattern => {
                const callback = this.topicSubscriptions.get(pattern);
                if (callback) {
                    mqttService.unsubscribe(pattern, callback);
                    this.topicSubscriptions.delete(pattern);
                }
            });

            this.subscribedHouses.delete(houseId);
        },

        /**
         * Marca um alerta como lido
         * @param {string} alertId - ID do alerta
         */
        markAsRead(alertId) {
            const alert = this.alerts.find(a => a.id === alertId);
            if (alert && !alert.read) {
                alert.read = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
            }
        },

        /**
         * Marca todos os alertas como lidos
         */
        markAllAsRead() {
            this.alerts.forEach(alert => {
                if (!alert.read) {
                    alert.read = true;
                }
            });
            this.unreadCount = 0;
        },

        /**
         * Descarta um alerta
         * @param {string} alertId - ID do alerta
         */
        dismissAlert(alertId) {
            const alert = this.alerts.find(a => a.id === alertId);
            if (alert) {
                alert.dismissed = true;
                if (!alert.read) {
                    alert.read = true;
                    this.unreadCount--;
                }
            }
        },

        /**
         * Limpa todos os alertas
         */
        clearAllAlerts() {
            this.log('Limpando todos os alertas');
            this.alerts = [];
            this.unreadCount = 0;
        },

        /**
         * Limpa todas as subscrições e alertas
         */
        clearAll() {
            // Limpar todas as subscrições MQTT
            this.topicSubscriptions.forEach((callback, pattern) => {
                mqttService.unsubscribe(pattern, callback);
            });

            // Limpar todas as estruturas de dados
            this.topicSubscriptions.clear();
            this.subscribedHouses.clear();
            this.alerts = [];
            this.unreadCount = 0;
        },

        // Método de logging
        log(...args) {
            if (this.debugMode) {
                console.log('[AlertsStore]', ...args);
            }
        }
    }
});