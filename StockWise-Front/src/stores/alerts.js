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
         * Subscreve aos alertas de uma casa
         */
        subscribeToHouseAlerts(houseId) {
            if (this.subscribedHouses.has(houseId)) return;

            const topic = `house/${houseId}/alerts/temperature`;
            console.log(`[AlertsStore] Subscrevendo a alertas da casa ${houseId}`);

            mqttService.subscribe(topic, (message) => {
                console.log(`[AlertsStore] Alerta recebido para casa ${houseId}:`, message);
                this.handleAlert(houseId, message);
            });

            this.subscribedHouses.add(houseId);
        },

        /**
         * Processa um alerta recebido
         */
     /**
         * Processa um alerta recebido
         */
     handleAlert(houseId, message) {
      const alertTypes = {
          'high_temperature': {
              title: 'Temperatura Alta',
              severity: 'error',
              formatMessage: (data, houseName) => 
                  `${houseName}: Temperatura ${data.value.toFixed(1)}°C acima do limite de ${data.threshold}°C`
          },
          'low_temperature': {
              title: 'Temperatura Baixa',
              severity: 'warning',
              formatMessage: (data, houseName) => 
                  `${houseName}: Temperatura ${data.value.toFixed(1)}°C abaixo do limite de ${data.threshold}°C`
          },
          'temperature_normalized': {
              title: 'Temperatura Normalizada',
              severity: 'success',
              formatMessage: (data, houseName) => 
                  `${houseName}: Temperatura ${data.value.toFixed(1)}°C retornou aos limites normais (${data.threshold}°C)`
          }
      };

      const alertConfig = alertTypes[message.type];
      if (!alertConfig) {
          console.warn(`[AlertsStore] Tipo de alerta desconhecido:`, message.type);
          return;
      }

      const houseName = this.getHouseName(houseId);

      const newAlert = {
          id: Date.now(),
          houseId,
          houseName,
          type: message.type,
          category: 'temperature',
          title: `${houseName} - ${alertConfig.title}`,
          message: alertConfig.formatMessage(message, houseName),
          severity: message.severity || alertConfig.severity,
          timestamp: message.timestamp,
          read: false,
          dismissed: false,
          value: message.value
      };

      console.log(`[AlertsStore] Criando novo alerta:`, newAlert);
      this.createAlert(newAlert);
  },


        /**
         * Adiciona um novo alerta
         */
        createAlert(alert) {
            // Adicionar ao início da lista
            this.alerts.unshift(alert);
            this.unreadCount++;

            console.log(`[AlertsStore] Alerta criado, total não lidos:`, this.unreadCount);
            console.log(`[AlertsStore] Alertas ativos:`, this.alerts);
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