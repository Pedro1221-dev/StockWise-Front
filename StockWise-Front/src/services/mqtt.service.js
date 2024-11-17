// services/mqtt.service.js
import mqtt from 'mqtt';

class MQTTService {
    constructor() {
        this.client = null;
        this.subscribers = new Map();
        this.connectionStatus = 'disconnected';
        this.debugMode = true;
    }

    /**
     * Estabelece conexão com o broker MQTT
     */
    async connect() {
        if (this.connectionStatus === 'connected') {
            this.log('Cliente MQTT já conectado');
            return;
        }

        try {
            this.log('Conectando ao broker MQTT...');
            this.connectionStatus = 'connecting';

            const options = {
                clientId: 'stockwise_' + Math.random().toString(16).slice(2, 8),
                clean: true,
                connectTimeout: 4000,
                reconnectPeriod: 1000,
                protocolVersion: 5 // MQTT 5.0
            };

            this.client = mqtt.connect('ws://localhost:9001', options);
            await this.setupEventHandlers();

        } catch (error) {
            this.error('Erro ao conectar ao broker MQTT:', error);
            this.connectionStatus = 'error';
            throw error;
        }
    }

    /**
     * Configura os handlers de eventos MQTT
     */
    async setupEventHandlers() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout ao conectar ao broker MQTT'));
            }, 5000);

            this.client.on('connect', () => {
                this.log('✓ Conectado ao broker MQTT');
                this.connectionStatus = 'connected';
                this.resubscribeAll();
                clearTimeout(timeout);
                resolve();
            });

            this.client.on('message', (topic, message) => this.handleMessage(topic, message));

            this.client.on('error', (error) => {
                this.error('Erro na conexão MQTT:', error);
                this.connectionStatus = 'error';
                clearTimeout(timeout);
                reject(error);
            });

            this.client.on('offline', () => {
                this.warn('Cliente MQTT offline');
                this.connectionStatus = 'disconnected';
            });
        });
    }

    /**
     * Processa mensagens recebidas do broker
     */
    handleMessage(topic, message) {
        try {
            // Processar a mensagem
            const messageStr = message.toString();
            let parsedMessage;
            
            try {
                parsedMessage = JSON.parse(messageStr);
            } catch (e) {
                parsedMessage = messageStr;
            }

            this.log('Mensagem MQTT Recebida:', {
                topic,
                parsedMessage
            });

            // Encontrar todos os callbacks interessados neste tópico
            for (const [subscribedTopic, callbacks] of this.subscribers) {
                if (this.topicMatches(topic, subscribedTopic)) {
                    callbacks.forEach(callback => {
                        try {
                            // IMPORTANTE: Passar uma cópia profunda da mensagem
                            const messageCopy = JSON.parse(JSON.stringify(parsedMessage));
                            callback(messageCopy, topic);
                        } catch (err) {
                            this.error('Erro no callback do subscriber:', err);
                        }
                    });
                }
            }
        } catch (error) {
            this.error('Erro ao processar mensagem MQTT:', error);
        }
    }

    /**
     * Verifica se um tópico corresponde a um padrão de subscrição
     */
    topicMatches(actualTopic, pattern) {
        // Converter wildcards em regex
        const regexPattern = pattern
            .replace(/\+/g, '[^/]+')     // + corresponde a um nível
            .replace(/#/g, '.*');        // # corresponde a múltiplos níveis
        
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(actualTopic);
    }

    /**
     * Subscreve a um tópico
     */
    subscribe(topic, callback) {
        if (!this.subscribers.has(topic)) {
            this.log('Subscrevendo ao tópico:', topic);
            this.subscribers.set(topic, new Set());
            
            // Configurar opções MQTT 5.0
            const options = {
                qos: 1,
                properties: {
                    subscriptionIdentifier: Math.floor(Math.random() * 100000)
                }
            };

            this.client?.subscribe(topic, options);
        }
        this.subscribers.get(topic).add(callback);
    }

    /**
     * Publica uma mensagem
     */
    publish(topic, message) {
        if (!this.client?.connected) {
            this.warn('Cliente MQTT não conectado ao tentar publicar:', {
                topic,
                message
            });
            return;
        }

        try {
            const messageStr = typeof message === 'string' 
                ? message 
                : JSON.stringify(message);

            this.log('Publicando MQTT:', {
                topic,
                message: JSON.parse(messageStr) // Log mais legível
            });

            // Configurar opções MQTT 5.0
            const options = {
                qos: 1,
                properties: {
                    messageExpiryInterval: 3600,
                    contentType: 'application/json'
                }
            };

            this.client.publish(topic, messageStr, options, (error) => {
                if (error) {
                    this.error('Erro ao publicar mensagem:', error);
                }
            });
        } catch (error) {
            this.error('Erro ao preparar mensagem para publicação:', error);
        }
    }

    /**
     * Cancela subscrição de um tópico
     */
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

    /**
     * Resubscreve a todos os tópicos após reconexão
     */
    resubscribeAll() {
        this.log('Resubscrevendo a todos os tópicos...');
        for (const [topic] of this.subscribers) {
            this.log('Resubscrevendo ao tópico:', topic);
            this.client.subscribe(topic, { qos: 1 });
        }
    }

    /**
     * Limpa todas as subscrições e desconecta
     */
    cleanup() {
        this.log('Limpando conexão MQTT...');
        if (this.client) {
            this.subscribers.clear();
            this.client.end();
            this.client = null;
            this.connectionStatus = 'disconnected';
        }
    }

    // Métodos de logging
    log(...args) {
        if (this.debugMode) console.log('[MQTTService]', ...args);
    }

    warn(...args) {
        if (this.debugMode) console.warn('[MQTTService]', ...args);
    }

    error(...args) {
        console.error('[MQTTService]', ...args);
    }
}

export const mqttService = new MQTTService();