// stores/alerts.js
import { defineStore } from 'pinia';
import { mqttService } from '@/services/mqtt.service';

export const useAlertsStore = defineStore('alerts', {
  state: () => ({
    alerts: new Map(), // Map de house_id -> array de alertas
    unreadCount: 0,
    temperatureStates: new Map() // Controle de estados de temperatura por casa
  }),

  getters: {
    hasUnreadAlerts: state => state.unreadCount > 0,
    getHouseAlerts: state => houseId => state.alerts.get(houseId) || []
  },

  actions: {
    initializeHouseState(houseId) {
      if (!this.temperatureStates.has(houseId)) {
        this.temperatureStates.set(houseId, {
          outOfRangeCount: 0,
          inRangeCount: 0,
          isAlertActive: false,
          lastAlertTime: null
        });
      }
    },

    processTemperatureReading(houseId, temperature, configs) {
      const state = this.temperatureStates.get(houseId);
      if (!state) return;

      const { min_temperature, max_temperature, buffer_zone } = configs;
      const isOutOfRange = temperature < (min_temperature - buffer_zone) || 
                          temperature > (max_temperature + buffer_zone);

      if (isOutOfRange) {
        state.outOfRangeCount++;
        state.inRangeCount = 0;
      } else {
        state.inRangeCount++;
        state.outOfRangeCount = 0;
      }

      // Gerar alerta após 3 leituras consecutivas fora do range
      if (state.outOfRangeCount >= 3 && !state.isAlertActive) {
        this.createTemperatureAlert(houseId, temperature, configs);
        state.isAlertActive = true;
      }

      // Normalizar após 3 leituras consecutivas dentro do range
      if (state.inRangeCount >= 3 && state.isAlertActive) {
        this.createNormalizationAlert(houseId, temperature);
        state.isAlertActive = false;
      }
    },

    createTemperatureAlert(houseId, temperature, configs) {
      const alert = {
        id: Date.now(),
        type: 'temperature',
        severity: 'high',
        message: `Temperatura ${temperature.toFixed(1)}°C ${
          temperature > configs.max_temperature ? 'acima' : 'abaixo'
        } do limite`,
        timestamp: new Date().toISOString(),
        read: false,
        houseId
      };

      this.addAlert(houseId, alert);
    },

    createNormalizationAlert(houseId, temperature) {
      const alert = {
        id: Date.now(),
        type: 'temperature',
        severity: 'info',
        message: `Temperatura normalizada: ${temperature.toFixed(1)}°C`,
        timestamp: new Date().toISOString(),
        read: false,
        houseId
      };

      this.addAlert(houseId, alert);
    },

    addAlert(houseId, alert) {
      if (!this.alerts.has(houseId)) {
        this.alerts.set(houseId, []);
      }
      this.alerts.get(houseId).unshift(alert);
      this.unreadCount++;
    },

    markAsRead(alertId) {
      this.alerts.forEach(houseAlerts => {
        const alert = houseAlerts.find(a => a.id === alertId);
        if (alert && !alert.read) {
          alert.read = true;
          this.unreadCount--;
        }
      });
    },

    markAllAsRead() {
      this.alerts.forEach(houseAlerts => {
        houseAlerts.forEach(alert => {
          if (!alert.read) {
            alert.read = true;
          }
        });
      });
      this.unreadCount = 0;
    }
  }
});