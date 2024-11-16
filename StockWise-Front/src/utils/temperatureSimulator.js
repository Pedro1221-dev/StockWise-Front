// utils/temperatureSimulator.js
import { mqttService } from "@/services/mqtt.service";

export class TemperatureSimulator {
    constructor(houseId) {
        this.houseId = houseId;
        this.interval = null;
        this.baseTemp = 15;
    }

    start() {
        // Enviar uma leitura inicial imediatamente
        this.publishTemperature();
        
        // Começar intervalo de atualizações
        this.interval = setInterval(() => this.publishTemperature(), 5000);
    }

    publishTemperature() {
        const temp = this.baseTemp + (Math.random() * 2 - 1);
        
        const message = {
            temperature: parseFloat(temp.toFixed(1)),
            timestamp: new Date().toISOString()
        };

        try {
            mqttService.publish(
                `house/${this.houseId}/temperature`,
                JSON.stringify(message)
            );
        } catch (error) {
            console.error('Erro ao publicar temperatura:', error);
        }
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}