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
            if (!force && this.houses.length > 0) return;

            try {
                const userStore = useUserStore();
                const token = localStorage.getItem('token');
                const userId = userStore.user?.user_id;

                if (!token || !userId) {
                    throw new Error('Dados de autenticação inválidos');
                }

                const response = await housesService.getUserHouses(userId, token);
                
                if (response.success) {
                    this.houses = response.data;
                    await this.initializeHouseServices();

                    // Inicializar sistema de alertas
                    this.initializeAlertSystem();
                }
            } catch (error) {
                console.error('Erro ao carregar casas:', error);
                throw error;
            }
        },

        async initializeHouseServices() {
            try {
                // Garantir conexão MQTT
                if (mqttService.connectionStatus !== 'connected') {
                    await mqttService.connect();
                }

                // Inicializar serviços para cada casa
                for (const house of this.houses) {
                    // Criar e iniciar simulador
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
                }
            } catch (error) {
                console.error('Erro ao inicializar serviços:', error);
                throw error;
            }
        },

        /**
         * Inicializa o sistema de alertas para todas as casas
         */
        initializeAlertSystem() {
            const alertsStore = useAlertsStore();
            
            for (const house of this.houses) {
                // Iniciar monitorização de temperatura para alertas
                alertsMonitor.startMonitoring(house);
                
                // Subscrever aos alertas na store
                alertsStore.subscribeToHouseAlerts(house.house_id);
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