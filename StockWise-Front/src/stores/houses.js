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
        
        // Atualizar o estado mesmo se não houver casas
        this.houses = response.data || [];
        console.log('[HousesStore] Casas carregadas:', this.houses);
        
        // Inicializar serviços apenas se houver casas
        if (this.houses.length > 0) {
            await this.initializeHouseServices();
        }

        return true; // Indicar sucesso mesmo sem casas

    } catch (error) {
        console.warn('[HousesStore] Erro ao carregar casas:', error);
        // Não propagar o erro se for apenas "no houses"
        if (!error.msg?.includes('No houses found')) {
            throw error;
        }
        // Definir array vazio para casas
        this.houses = [];
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


async registerHouse(houseData) {
    try {
        console.log('[HousesStore] A registar nova casa:', houseData);
        
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Token não encontrado');
        }

        // Chamar o serviço para registar a casa
        const response = await housesService.registerHouse(houseData, token);
        
        if (!response.success) {
            throw new Error(response.message || 'Erro ao registar casa');
        }

        // Adicionar a nova casa ao array de casas
        this.houses.push(response.data);

        // Inicializar serviços para a nova casa
        await this.initializeHouseServices();

        console.log('[HousesStore] Casa registada com sucesso:', response.data);
        return response.data;

    } catch (error) {
        console.error('[HousesStore] Erro ao registar casa:', error);
        throw error;
    }
},

async updateHouse(houseId, houseData) {
    try {
        console.log('[HousesStore] A atualizar casa:', { houseId, data: houseData });
        
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Token não encontrado');
        }

        const response = await housesService.updateHouse(houseId, houseData, token);
        
        if (!response.success) {
            throw new Error(response.message || 'Erro ao atualizar casa');
        }

        // Atualizar apenas a casa específica no estado local
        const index = this.houses.findIndex(h => h.house_id === Number(houseId));
        if (index !== -1) {
            // Atualizar preservando outros campos
            this.houses[index] = {
                ...this.houses[index],
                ...houseData,
                house_id: Number(houseId) // Garantir que o ID se mantém
            };
        }

        return response;
    } catch (error) {
        console.error('[HousesStore] Erro ao atualizar casa:', error);
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