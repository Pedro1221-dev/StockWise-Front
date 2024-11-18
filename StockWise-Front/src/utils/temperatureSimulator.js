// StockWise-Front\src\utils\temperatureSimulator.js
import { mqttService } from "@/services/mqtt.service";

export class TemperatureSimulator {
    constructor(houseId, baseTemp = 19) {
        this.houseId = houseId;
        this.baseTemp = baseTemp;
        this.interval = null;
    }

    start() {
        // Enviar temperatura inicial
        this.publishTemperature();
        
        // Iniciar atualizações periódicas
        this.interval = setInterval(() => this.publishTemperature(), 5000);
    }

    publishTemperature() {
        const temp = this.baseTemp + (Math.random() * 2 - 1);
        const message = {
            temperature: parseFloat(temp.toFixed(1)),
            timestamp: new Date().toISOString()
        };

        mqttService.publish(`house/${this.houseId}/temperature`, message);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}