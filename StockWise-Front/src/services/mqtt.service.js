// services/mqtt.service.js

import mqtt from 'mqtt'

class MQTTService {
    constructor() {
        this.client = null
        this.subscribers = new Map()
        this.maxReconnectAttempts = 5
        this.reconnectAttempts = 0
    }

    async connect() {
        try {
            // Usar protocolo TCP direto em vez de WebSocket
            const brokerUrl = 'mqtt://localhost:1883'
            
            this.client = mqtt.connect(brokerUrl, {
                clientId: `stockwise_front_${Math.random().toString(16).substr(2, 8)}`,
                clean: true,
                connectTimeout: 4000,
                reconnectPeriod: 1000,
                // Desabilitar WebSocket
                protocol: 'mqtt',
                rejectUnauthorized: false
            })

            return new Promise((resolve, reject) => {
                this.client.on('connect', () => {
                    console.log('MQTT conectado')
                    this.reconnectAttempts = 0
                    resolve()
                })

                this.client.on('error', (err) => {
                    console.error('Erro MQTT:', err)
                    this.handleError(err)
                    reject(err)
                })

                this.client.on('close', () => {
                    console.log('Conexão MQTT fechada')
                })

                this.client.on('message', (topic, message) => {
                    this.handleMessage(topic, message)
                })
            })
        } catch (error) {
            console.error('Erro ao conectar ao broker MQTT:', error)
            throw error
        }
    }

    handleMessage(topic, message) {
        try {
            const parsedMessage = JSON.parse(message.toString())
            const subscribers = this.subscribers.get(topic)
            
            if (subscribers) {
                subscribers.forEach(callback => callback(parsedMessage))
            }
        } catch (error) {
            console.error('Erro ao processar mensagem:', error)
        }
    }

    handleError(error) {
        this.reconnectAttempts++
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Número máximo de tentativas de reconexão atingido')
            this.cleanup()
        }
    }

    subscribe(topic, callback) {
        if (!this.client) {
            throw new Error('Cliente MQTT não inicializado')
        }

        this.client.subscribe(topic, { qos: 1 }, (error) => {
            if (error) {
                console.error(`Erro ao subscrever ${topic}:`, error)
                return
            }
            
            if (!this.subscribers.has(topic)) {
                this.subscribers.set(topic, new Set())
            }
            this.subscribers.get(topic).add(callback)
            
            console.log(`Subscrito ao tópico: ${topic}`)
        })
    }

    unsubscribe(topic, callback) {
        if (!this.client) return

        const subscribers = this.subscribers.get(topic)
        if (subscribers) {
            subscribers.delete(callback)
            if (subscribers.size === 0) {
                this.client.unsubscribe(topic)
                this.subscribers.delete(topic)
            }
        }
    }

    publish(topic, message) {
        if (!this.client) {
            throw new Error('Cliente MQTT não inicializado')
        }

        this.client.publish(topic, JSON.stringify(message), { qos: 1 })
    }

    cleanup() {
        if (this.client) {
            this.client.end(true)
            this.client = null
            this.subscribers.clear()
            console.log('Recursos MQTT limpos')
        }
    }
}

// Exportar uma única instância do serviço
export const mqttService = new MQTTService()