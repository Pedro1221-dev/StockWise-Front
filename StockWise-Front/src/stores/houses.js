// stores/houses.js
import { defineStore } from 'pinia';
import { housesService } from '@/services/houses.service';
import { useUserStore } from './user';
import { mqttService } from '@/services/mqtt.service';
import { TemperatureSimulator } from '@/utils/temperatureSimulator';
import { useTemperatureStore } from './temperature';
import { useAlertsStore } from './alerts';
import { alertsMonitor } from '@/services/alertsMonitor.service';

export const useHousesStore = defineStore('houses', {
    state: () => ({
        houses: [],
        loading: false,
        error: null,
        lastFetch: null,
        simulators: new Map() // house_id -> simulator
    }),

    actions: {
        async fetchUserHouses(force = false) {
            try {
                console.log('[HousesStore] Iniciando fetchUserHouses');
                
                if (!force && this.houses.length > 0) {
                    console.log('[HousesStore] Usando casas em cache');
                    return;
                }

                const userStore = useUserStore();
                const token = localStorage.getItem('token');
                const userId = userStore.user?.user_id;

                if (!token || !userId) {
                    throw new Error('Dados de autenticação inválidos');
                }

                const response = await housesService.getUserHouses(userId, token);
                
                if (response.success) {
                    this.houses = response.data;
                    console.log('[HousesStore] Casas carregadas:', this.houses);
                    
                    // Inicializar serviços
                    await this.initializeHouseServices();
                }
            } catch (error) {
                console.error('[HousesStore] Erro ao carregar casas:', error);
                throw error;
            }
        },

        async initializeHouseServices() {
            try {
                console.log('[HousesStore] Inicializando serviços das casas');

                // Garantir conexão MQTT
                if (mqttService.connectionStatus !== 'connected') {
                    await mqttService.connect();
                }

                // Inicializar serviços para cada casa
                for (const house of this.houses) {
                    console.log(`[HousesStore] Inicializando serviços para casa ${house.house_id}`);

                    // Inicializar simulador de temperatura
                    if (!this.simulators.has(house.house_id)) {
                        const simulator = new TemperatureSimulator(house.house_id);
                        simulator.start();
                        this.simulators.set(house.house_id, simulator);
                    }

                      // Subscrever ao tópico de temperatura
                      const topic = `house/${house.house_id}/temperature`;
                      mqttService.subscribe(topic, (data) => {
                          console.log(`Temperatura recebida para casa ${house.house_id}:`, data);
                          useTemperatureStore().updateTemperature(house.house_id, {
                              value: data.temperature,
                              timestamp: data.timestamp
                          });
                      });

                    // Inicializar sistema de alertas
                    await this.initializeAlertSystem(house);
                }
            } catch (error) {
                console.error('[HousesStore] Erro ao inicializar serviços:', error);
                throw error;
            }
        },

        /**
         * Inicializa o sistema de alertas para todas as casas
         */

        async initializeAlertSystem(house) {
            try {
                console.log(`[HousesStore] Inicializando sistema de alertas para casa ${house.house_id}`);

                // Iniciar monitorização de temperatura
                alertsMonitor.startMonitoring(house);

                // Iniciar monitorização de alertas gerais (temperatura e produtos)
                const alertsStore = useAlertsStore();
                alertsStore.subscribeToHouseAlerts(house.house_id);

                console.log(`[HousesStore] Sistema de alertas inicializado com sucesso para casa ${house.house_id}`);
            } catch (error) {
                console.error(`[HousesStore] Erro ao inicializar alertas para casa ${house.house_id}:`, error);
                throw error;
            }
        },

        clearAllServices() {
            // Parar simuladores
            this.simulators.forEach(simulator => simulator.stop());
            this.simulators.clear();

            // Limpar subscrições MQTT
            this.houses.forEach(house => {
                const topic = `house/${house.house_id}/temperature`;
                mqttService.unsubscribe(topic);
            });

            // Parar monitorizações de alertas
            alertsMonitor.cleanup();
            
            // Limpar alertas
            useAlertsStore().clearAll();

            // Limpar dados
            this.houses = [];
            this.lastFetch = null;
        }
    }
});