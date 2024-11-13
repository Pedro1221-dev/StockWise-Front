// services/mqtt.service.js
import mqtt from 'mqtt'

class MQTTService {
    constructor() {
        this.client = null
        this.subscribers = new Map()
        this.connectionStatus = 'disconnected'
        this.maxReconnectAttempts = 5
        this.reconnectAttempts = 0
    }

    /**
     * Conecta ao broker MQTT
     * @returns {Promise} Promessa que resolve quando conectado
     */
    async connect() {
        if (this.client) return;

        return new Promise((resolve, reject) => {
            try {
                // Conectar ao broker
                this.client = mqtt.connect('mqtt://localhost:1883', {
                    clientId: `stockwise_front_${Math.random().toString(16).substring(2, 10)}`,
                    clean: true,
                    connectTimeout: 4000,
                    reconnectPeriod: 1000
                });

                // Configurar handlers
                this.client.on('connect', () => {
                    console.log('Conectado ao broker MQTT');
                    this.connectionStatus = 'connected';
                    this.reconnectAttempts = 0;
                    resolve();
                });

                this.client.on('error', (err) => {
                    console.error('Erro MQTT:', err);
                    this.handleError(err);
                    reject(err);
                });

                this.client.on('message', (topic, message) => {
                    this.handleMessage(topic, message);
                });

                this.client.on('close', () => {
                    this.connectionStatus = 'disconnected';
                    console.log('Conexão MQTT fechada');
                });

            } catch (error) {
                console.error('Erro ao conectar ao broker MQTT:', error);
                reject(error);
            }
        });
    }

    /**
     * Gere erros de conexão
     * @param {Error} error - Erro ocorrido
     * @private
     */
    handleError(error) {
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Número máximo de tentativas de reconexão atingido');
            this.cleanup();
        }
    }

    /**
     * Processa mensagens recebidas
     * @param {string} topic - Tópico da mensagem
     * @param {Buffer} message - Conteúdo da mensagem
     * @private
     */
    handleMessage(topic, message) {
        try {
            const parsedMessage = JSON.parse(message.toString());
            const subscribers = this.subscribers.get(topic);
            
            if (subscribers) {
                subscribers.forEach(callback => callback(parsedMessage));
            }
        } catch (error) {
            console.error('Erro ao processar mensagem MQTT:', error);
        }
    }

    /**
     * Subscreve a um tópico
     * @param {string} topic - Tópico a subscrever
     * @param {Function} callback - Função de callback para mensagens
     */
    subscribe(topic, callback) {
        if (!this.client) throw new Error('Cliente MQTT não inicializado');

        this.client.subscribe(topic, { qos: 1 }, (error) => {
            if (error) {
                console.error(`Erro ao subscrever ${topic}:`, error);
                return;
            }
            
            if (!this.subscribers.has(topic)) {
                this.subscribers.set(topic, new Set());
            }
            this.subscribers.get(topic).add(callback);
            
            console.log(`Subscrito ao tópico: ${topic}`);
        });
    }

    /**
     * Remove subscrição de um tópico
     * @param {string} topic - Tópico a dessubscrever
     * @param {Function} callback - Callback a remover
     */
    unsubscribe(topic, callback) {
        const subscribers = this.subscribers.get(topic);
        if (subscribers) {
            subscribers.delete(callback);
            if (subscribers.size === 0) {
                this.subscribers.delete(topic);
                this.client?.unsubscribe(topic);
            }
        }
    }

    /**
     * Publica mensagem num tópico
     * @param {string} topic - Tópico para publicação
     * @param {Object} message - Mensagem a publicar
     */
    publish(topic, message) {
        if (!this.client) throw new Error('Cliente MQTT não inicializado');

        this.client.publish(topic, JSON.stringify(message), { qos: 1 });
    }

    /**
     * Limpa recursos
     */
    cleanup() {
        if (this.client) {
            this.client.end(true);
            this.client = null;
            this.subscribers.clear();
        }
    }
}

// Exportar instância única do serviço
export const mqttService = new MQTTService();