// stores/temperature.js
import { defineStore } from 'pinia';
import { mqttService } from '@/services/mqtt.service';
import { useAlertsStore } from './alerts';

export const useTemperatureStore = defineStore('temperature', {
    state: () => ({
        temperatures: new Map(), // Map de house_id -> {value, timestamp}
        loading: false,
        error: null
    }),

    getters: {
        // Obter temperatura de uma casa específica
        getHouseTemperature: (state) => (houseId) => {
            return state.temperatures.get(houseId)?.value || null;
        },

        // Verificar se temperatura está dentro dos limites
        // IMPORTANTE: Corrigido para seguir o mesmo padrão de arrow function
        isTemperatureInRange: (state) => (houseId, minTemp, maxTemp) => {
            const temp = state.temperatures.get(houseId)?.value;
            if (temp === null || temp === undefined) return true; // Se não há leitura, assumir OK
            return temp >= minTemp && temp <= maxTemp;
        }
    },

    actions: {
        async subscribeToHouseTemperature(house) { 
            this.loading = true;
            
            try {
                if (!mqttService.client?.connected) {
                    await mqttService.connect();
                }

                const topic = `house/${house.house_id}/temperature`;
                const alertsStore = useAlertsStore();
                
                // Inicializar estado de alertas para esta casa
                alertsStore.initializeHouseState(house.house_id);
                
                // Callback para processar mensagens
                const handleTemperature = (data) => {
                    // console.log('Temperatura recebida:', data);
                    if (typeof data.temperature === 'number') {
                        this.temperatures.set(house.house_id, {
                            value: data.temperature,
                            timestamp: data.timestamp || new Date().toISOString()
                        });
                        
                        // Processar temperatura para alertas
                        alertsStore.processTemperatureReading(
                            house.house_id, 
                            data.temperature, 
                            {
                                min_temperature: house.min_temperature,
                                max_temperature: house.max_temperature,
                                buffer_zone: house.buffer_zone || 1.0 // valor padrão caso não exista
                            }
                        );
                    } else {
                        console.warn('Temperatura inválida recebida:', data);
                    }
                };

                mqttService.subscribe(topic, handleTemperature);
                
            } catch (error) {
                console.error(`Erro ao subscrever temperatura da casa ${house.house_id}:`, error);
                this.error = 'Erro ao monitorizar temperatura';
            } finally {
                this.loading = false;
            }
        },

        unsubscribeFromHouseTemperature(houseId) {
            const topic = `house/${houseId}/temperature`;
            this.temperatures.delete(houseId);
            if (mqttService.client?.connected) {
               // mqttService.unsubscribe(topic);
            }
        }
    }
});