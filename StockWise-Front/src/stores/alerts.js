// stores/alerts.js
import { defineStore } from 'pinia';
import { mqttService } from '@/services/mqtt.service';
import { useHousesStore } from './houses';
export const useAlertsStore = defineStore('alerts', {
    state: () => ({
        alerts: [], // Array de alertas ativos
        subscribedHouses: new Set(), // Set de house_ids subscritos
        unreadCount: 0
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
         */
       subscribeToHouseAlerts(houseId) {
        if (this.subscribedHouses.has(houseId)) return;
        console.log(`[AlertsStore] Iniciando subscrição de alertas para casa ${houseId}`);

        // Subscrever a alertas de temperatura
        const tempTopic = `house/${houseId}/alerts/temperature`;
        console.log(`[AlertsStore] Subscrevendo a ${tempTopic}`);
        mqttService.subscribe(tempTopic, (message) => {
            console.log(`[AlertsStore] Alerta de temperatura recebido:`, message);
            this.handleAlert(houseId, {
                ...message,
                category: 'temperature'
            });
        });

        // Subscrever a alertas de produtos
        const productsTopic = `house/${houseId}/alerts/products/+`;
        console.log(`[AlertsStore] Subscrevendo a ${productsTopic}`);
        mqttService.subscribe(productsTopic, (message) => {
            console.log(`[AlertsStore] Alerta de produto recebido:`, message);
            this.handleAlert(houseId, message);
        });

        this.subscribedHouses.add(houseId);
    },

    /**
     * Processa um alerta recebido
     */
    handleAlert(houseId, message) {
        console.log(`[AlertsStore] Processando alerta:`, { houseId, message });

        // Gerar ID único para o alerta
        const alertId = Date.now() + Math.random().toString(36).substring(7);

        const newAlert = {
            id: alertId,
            houseId,
            houseName: this.getHouseName(houseId),
            type: message.type,
            category: message.category,
            title: message.title,
            message: message.message,
            severity: message.severity,
            timestamp: message.timestamp,
            data: message.data,
            read: false,
            dismissed: false
        };

        console.log(`[AlertsStore] Criando novo alerta:`, newAlert);
        this.createAlert(newAlert);
    },

    /**
     * Adiciona um novo alerta
     */
    createAlert(alert) {
        this.alerts.unshift(alert);
        this.unreadCount++;
        console.log(`[AlertsStore] Alerta criado, total não lidos: ${this.unreadCount}`);
        console.log(`[AlertsStore] Alertas ativos:`, this.alerts);
    },

    /**
     * Limpa subscrições para uma casa específica
     */
    unsubscribeFromHouseAlerts(houseId) {
        console.log(`[AlertsStore] Limpando subscrições para casa ${houseId}`);
        mqttService.unsubscribe(`house/${houseId}/alerts/temperature`);
        mqttService.unsubscribe(`house/${houseId}/alerts/products/+`);
        this.subscribedHouses.delete(houseId);
    },

        /**
         * Marca um alerta como lido
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
                  console.log('[AlertsStore] Limpando todos os alertas');
                  this.alerts = [];
                  this.unreadCount = 0;
              },
        /**
         * Limpa todos os alertas e subscrições
         */
        clearAll() {
            this.subscribedHouses.forEach(houseId => {
                mqttService.unsubscribe(`house/${houseId}/alerts/temperature`);
            });
            this.subscribedHouses.clear();
            this.alerts = [];
            this.unreadCount = 0;
        }
    }
});