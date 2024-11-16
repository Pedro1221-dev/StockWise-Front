// stores/temperature.js
import { defineStore } from 'pinia';

export const useTemperatureStore = defineStore('temperature', {
    state: () => ({
        temperatures: new Map(), // Map de house_id -> {value, timestamp}
        loading: false,
        error: null
    }),

    getters: {
        getHouseTemperature: (state) => (houseId) => {
            const temp = state.temperatures.get(houseId);
            return temp?.value ?? null;
        },

        getHouseTemperatureTimestamp: (state) => (houseId) => {
            const temp = state.temperatures.get(houseId);
            return temp?.timestamp ?? null;
        },

        isTemperatureInRange: (state) => (houseId, minTemp, maxTemp) => {
            const temp = state.temperatures.get(houseId)?.value;
            if (temp === null || temp === undefined) return true;
            return temp >= minTemp && temp <= maxTemp;
        }
    },

    actions: {
        /**
         * Atualiza a temperatura de uma casa
         */
        updateTemperature(houseId, data) {
            console.log(`Atualizando temperatura para casa ${houseId}:`, data);
            this.temperatures.set(houseId, {
                value: data.value,
                timestamp: data.timestamp
            });
        },

        /**
         * Limpa as temperaturas
         */
        clearTemperatures() {
            this.temperatures.clear();
        }
    }
});