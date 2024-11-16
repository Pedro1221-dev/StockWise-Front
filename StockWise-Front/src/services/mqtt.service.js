// services/mqtt.service.js
import mqtt from 'mqtt';

class MQTTService {
    constructor() {
        this.client = null;
        this.subscribers = new Map();
        this.connectionStatus = 'disconnected';
    }

    async connect() {
        if (this.connectionStatus === 'connected') {
            console.log('Cliente MQTT já conectado');
            return;
        }

        try {
            console.log('Conectando ao broker MQTT...');
            this.connectionStatus = 'connecting';

            const options = {
                clientId: 'stockwise_' + Math.random().toString(16).slice(2, 8),
                clean: true,
                connectTimeout: 4000,
                reconnectPeriod: 1000
            };

            this.client = mqtt.connect('ws://localhost:9001', options);

            this.client.on('connect', () => {
                console.log('✓ Conectado ao broker MQTT');
                this.connectionStatus = 'connected';
                this.resubscribeAll();
            });

            this.client.on('message', (topic, message) => {
                try {
                    const callbacks = this.subscribers.get(topic);
                    if (callbacks) {
                        const parsedMessage = JSON.parse(message.toString());
                        callbacks.forEach(callback => callback(parsedMessage));
                    }
                } catch (error) {
                    console.error('Erro ao processar mensagem MQTT:', error);
                }
            });

        } catch (error) {
            console.error('Erro ao conectar ao broker MQTT:', error);
            this.connectionStatus = 'error';
            throw error;
        }
    }

    subscribe(topic, callback) {
        if (!this.subscribers.has(topic)) {
            this.subscribers.set(topic, new Set());
            this.client.subscribe(topic, { qos: 1 });
        }
        this.subscribers.get(topic).add(callback);
        console.log(`Subscrito ao tópico: ${topic}`);
    }

    publish(topic, message) {
        if (!this.client?.connected) return;
        
        const messageStr = typeof message === 'string' ? 
            message : JSON.stringify(message);

        this.client.publish(topic, messageStr, { qos: 1 });
    }

    unsubscribe(topic, callback) {
        const callbacks = this.subscribers.get(topic);
        if (!callbacks) return;

        if (callback) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.subscribers.delete(topic);
                this.client?.unsubscribe(topic);
            }
        } else {
            this.subscribers.delete(topic);
            this.client?.unsubscribe(topic);
        }
    }

    resubscribeAll() {
        for (const [topic] of this.subscribers) {
            this.client.subscribe(topic, { qos: 1 });
        }
    }

    cleanup() {
        if (this.client) {
            this.subscribers.clear();
            this.client.end();
            this.client = null;
            this.connectionStatus = 'disconnected';
        }
    }
}

export const mqttService = new MQTTService();