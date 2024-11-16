// services/mqtt.service.js
import mqtt from 'mqtt';

class MQTTService {
    constructor() {
        this.client = null;
        this.subscribers = new Map();
    }

    async connect() {
        try {
            console.log('Iniciando conexão MQTT...');
            
            // Configuração do cliente
            const options = {
                clientId: 'stockwise_' + Math.random().toString(16).slice(2, 8),
                clean: true,
                connectTimeout: 4000,
                reconnectPeriod: 1000
            };

            // Conectar ao broker
            this.client = mqtt.connect('ws://localhost:9001', options);

            // Handler de conexão
            this.client.on('connect', () => {
                console.log('✓ Conectado ao broker MQTT');
            });

            // Handler de erro
            this.client.on('error', (error) => {
                console.error('Erro MQTT:', error);
            });

            // Handler de mensagem

this.client.on('message', (topic, message) => {
    try {
        const callbacks = this.subscribers.get(topic);
        if (callbacks) {
            const parsedMessage = JSON.parse(message.toString());
            callbacks.forEach(callback => {
                try {
                    callback(parsedMessage);
                } catch (error) {
                    console.error('Erro no callback do tópico:', topic, error);
                }
            });
        }
    } catch (error) {
        console.error('Erro ao processar mensagem MQTT:', error, {
            topic,
            message: message.toString()
        });
    }
});

        } catch (error) {
            console.error('Erro ao conectar ao broker MQTT:', error);
            throw error;
        }
    }

    // Subscrever a um tópico
    subscribe(topic, callback) {
        if (!this.client) {
            throw new Error('Cliente MQTT não inicializado');
        }
    
        if (!this.subscribers.has(topic)) {
            this.subscribers.set(topic, new Set());
        }
        this.subscribers.get(topic).add(callback);
    
        // Adicionar QoS na subscrição
        this.client.subscribe(topic, { qos: 1 }, (error) => {
            if (error) {
                console.error(`Erro ao subscrever ao tópico ${topic}:`, error);
            } else {
                console.log(`Subscrito ao tópico: ${topic}`);
            }
        });
    }

    // Publicar mensagem
    publish(topic, message) {
        if (!this.client) {
            throw new Error('Cliente MQTT não inicializado');
        }

        this.client.publish(topic, message, {}, (error) => {
            if (error) {
                console.error(`Erro ao publicar no tópico ${topic}:`, error);
            }
        });
    }

    // Limpar recursos
    cleanup() {
        if (this.client) {
            this.client.end();
            this.client = null;
        }
        this.subscribers.clear();
    }
}

export const mqttService = new MQTTService();