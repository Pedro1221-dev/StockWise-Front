// stores/temperature.js
import { defineStore } from 'pinia'
import { mqttService } from '@/services/mqtt.service'

export const useTemperatureStore = defineStore('temperature', {
    state: () => ({
        temperatures: new Map(), // Mapa de house_id -> temperatura atual
        loading: false,
        error: null
    }),

    getters: {
        /**
         * Obtém temperatura de uma casa específica
         * @param {string} houseId - ID da casa
         * @returns {number|null} Temperatura ou null se não disponível
         */
        getHouseTemperature: (state) => (houseId) => {
            return state.temperatures.get(houseId)?.value || null;
        },

        /**
         * Verifica se temperatura está dentro dos limites
         * @param {string} houseId - ID da casa
         * @returns {boolean} true se temperatura está nos limites
         */
        isTemperatureInRange: (state) => (houseId, minTemp, maxTemp) => {
            const temp = state.temperatures.get(houseId)?.value;
            if (!temp) return true; // Se não há leitura, assumir OK
            return temp >= minTemp && temp <= maxTemp;
        }
    },

    actions: {
        /**
         * Subscreve ao tópico de temperatura de uma casa
         * @param {string} houseId - ID da casa
         */
        subscribeToHouseTemperature(houseId) {
            const topic = `house/${houseId}/temperature`;
            
            // Callback para processar mensagens de temperatura
            const handleTemperature = (message) => {
                if (message.temperature !== undefined) {
                    this.temperatures.set(houseId, {
                        value: parseFloat(message.temperature),
                        timestamp: message.timestamp || new Date().toISOString()
                    });
                }
            };

            try {
                // Guardar callback para poder dessubscrever depois
                this.temperatures.set(houseId, { callback: handleTemperature });
                
                // Subscrever ao tópico
                mqttService.subscribe(topic, handleTemperature);
            } catch (error) {
                console.error(`Erro ao subscrever temperatura da casa ${houseId}:`, error);
                this.error = 'Erro ao monitorizar temperatura';
            }
        },

        /**
         * Cancela subscrição de temperatura de uma casa
         * @param {string} houseId - ID da casa
         */
        unsubscribeFromHouseTemperature(houseId) {
            const topic = `house/${houseId}/temperature`;
            const data = this.temperatures.get(houseId);
            
            if (data?.callback) {
                mqttService.unsubscribe(topic, data.callback);
                this.temperatures.delete(houseId);
            }
        },

        /**
         * Limpa todas as subscrições
         */
        clearAllSubscriptions() {
            this.temperatures.forEach((data, houseId) => {
                if (data.callback) {
                    this.unsubscribeFromHouseTemperature(houseId);
                }
            });
            this.temperatures.clear();
        }
    }
});