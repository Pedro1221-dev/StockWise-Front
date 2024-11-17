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
                const callbacks = this.subscribers.get(topic);
                if (!callbacks) return;

                let parsedMessage;
                try {
                    // Tentar parse do buffer como string primeiro
                    const messageStr = message.toString();
                    try {
                        // Tentar parse como JSON
                        parsedMessage = JSON.parse(messageStr);
                    } catch (e) {
                        // Se falhar, usar a string diretamente
                        parsedMessage = messageStr;
                    }

                    // Log para debug
                    console.log('MQTT Mensagem Recebida:', {
                        topic,
                        rawMessage: messageStr,
                        parsedMessage
                    });

                    // Notificar todos os callbacks subscritos
                    callbacks.forEach(callback => {
                        try {
                            callback(parsedMessage, topic);
                        } catch (err) {
                            console.error('Erro no callback do subscriber:', err);
                        }
                    });
                } catch (error) {
                    console.error('Erro ao processar mensagem MQTT:', {
                        topic,
                        error,
                        rawMessage: message.toString()
                    });
                }
            });

            this.client.on('error', (error) => {
                console.error('Erro na conexão MQTT:', error);
                this.connectionStatus = 'error';
            });

            this.client.on('offline', () => {
                console.warn('Cliente MQTT offline');
                this.connectionStatus = 'disconnected';
            });

        } catch (error) {
            console.error('Erro ao conectar ao broker MQTT:', error);
            this.connectionStatus = 'error';
            throw error;
        }
    }

    subscribe(topic, callback) {
        if (!this.subscribers.has(topic)) {
            console.log('Subscrevendo ao tópico:', topic);
            this.subscribers.set(topic, new Set());
            this.client?.subscribe(topic, { qos: 1 });
        }
        this.subscribers.get(topic).add(callback);
    }

    publish(topic, message) {
        if (!this.client?.connected) {
            console.warn('Cliente MQTT não conectado ao tentar publicar:', {
                topic,
                message
            });
            return;
        }

        try {
            // Garantir que a mensagem seja uma string
            const messageStr = typeof message === 'string' 
                ? message 
                : JSON.stringify(message);

            console.log('Publicando MQTT:', {
                topic,
                message: messageStr
            });

            this.client.publish(topic, messageStr, { qos: 1 }, (error) => {
                if (error) {
                    console.error('Erro ao publicar mensagem:', {
                        topic,
                        message: messageStr,
                        error
                    });
                }
            });
        } catch (error) {
            console.error('Erro ao preparar mensagem para publicação:', {
                topic,
                message,
                error
            });
        }
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
        console.log('Resubscrevendo a todos os tópicos...');
        for (const [topic] of this.subscribers) {
            console.log('Resubscrevendo ao tópico:', topic);
            this.client.subscribe(topic, { qos: 1 });
        }
    }

    cleanup() {
        console.log('Limpando conexão MQTT...');
        if (this.client) {
            this.subscribers.clear();
            this.client.end();
            this.client = null;
            this.connectionStatus = 'disconnected';
        }
    }
}

export const mqttService = new MQTTService();