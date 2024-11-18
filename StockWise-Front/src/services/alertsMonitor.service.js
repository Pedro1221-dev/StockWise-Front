// services/alertsMonitor.service.js
import { mqttService } from './mqtt.service';

class AlertsMonitorService {
    constructor() {
        this.monitoredHouses = new Map(); // house_id -> configuração
        this.initialized = false;
    }

    startMonitoring(house) {
        if (this.monitoredHouses.has(house.house_id)) return;

        console.log(`[AlertsMonitor] Iniciando monitorização para casa ${house.house_id}`);
        console.log(`[AlertsMonitor] Configuração:`, {
            min_temp: house.min_temperature,
            max_temp: house.max_temperature,
            buffer: house.buffer_zone || 1.0
        });

        // Configuração inicial para a casa
        this.monitoredHouses.set(house.house_id, {
            min_temperature: Number(house.min_temperature),
            max_temperature: Number(house.max_temperature),
            buffer_zone: Number(house.buffer_zone) || 1.0,
            outOfRangeCount: 0,
            inRangeCount: 0,
            lastAlertTimestamp: null,
            lastAlertType: null,
            currentStatus: 'normal', // 'normal', 'warning', 'critical'
            consecutiveAlerts: 0
        });

        this.subscribeToTemperature(house.house_id);
    }

    subscribeToTemperature(houseId) {
        const topic = `house/${houseId}/temperature`;
        
        mqttService.subscribe(topic, (data) => {
            console.log(`[AlertsMonitor] Recebida temperatura para casa ${houseId}:`, data);
            const config = this.monitoredHouses.get(houseId);
            if (!config) {
                console.warn(`[AlertsMonitor] Configuração não encontrada para casa ${houseId}`);
                return;
            }

            this.processTemperature(houseId, data.temperature, config);
        });
    }

    processTemperature(houseId, temperature, config) {
        const minLimit = config.min_temperature - config.buffer_zone;
        const maxLimit = config.max_temperature + config.buffer_zone;
        const now = Date.now();
        
        console.log(`[AlertsMonitor] Processando temperatura ${temperature}°C`, {
            minLimit,
            maxLimit,
            outOfRangeCount: config.outOfRangeCount,
            inRangeCount: config.inRangeCount,
            currentStatus: config.currentStatus
        });

        // Determinar tipo de alerta necessário
        let alertType = null;
        if (temperature < minLimit) {
            alertType = 'low_temperature';
        } else if (temperature > maxLimit) {
            alertType = 'high_temperature';
        }

        if (alertType) {
            config.outOfRangeCount++;
            config.inRangeCount = 0;

            // Lógica de alertas escalonados
            const shouldSendAlert = this.shouldSendAlert(config, alertType, now);
            
            if (shouldSendAlert) {
                console.log(`[AlertsMonitor] Enviando alerta para casa ${houseId}`);
                this.publishAlert(houseId, {
                    type: alertType,
                    title: alertType === 'low_temperature' ? 'Temperatura Baixa' : 'Temperatura Alta',
                     message: alertType === 'low_temperature' 
            ? `A temperatura caiu abaixo do limite mínimo de ${config.min_temperature}°C.` 
            : `A temperatura subiu acima do limite máximo de ${config.max_temperature}°C.`,
                    value: temperature,
                    threshold: alertType === 'low_temperature' ? 
                        config.min_temperature : config.max_temperature,
                    severity: this.determineSeverity(config)
                });

                // Atualizar estado após envio do alerta
                config.lastAlertTimestamp = now;
                config.lastAlertType = alertType;
                config.consecutiveAlerts++;
                
                // Atualizar status baseado no número de alertas consecutivos
                if (config.consecutiveAlerts >= 3) {
                    config.currentStatus = 'critical';
                } else if (config.consecutiveAlerts >= 1) {
                    config.currentStatus = 'warning';
                }
            }
        } else {
            config.inRangeCount++;
            config.outOfRangeCount = 0;

            // Verificar normalização
            if (config.inRangeCount >= 3 && config.currentStatus !== 'normal') {
                console.log(`[AlertsMonitor] Temperatura normalizada para casa ${houseId}`);
                this.publishAlert(houseId, {
                    type: 'temperature_normalized',
                    value: temperature,
                    title: 'Temperatura Normalizada',
                    message: 'A temperatura voltou ao intervalo normal.',
                    threshold: `${config.min_temperature} - ${config.max_temperature}`,
                    severity: 'success'
                });

                // Resetar estado
                config.currentStatus = 'normal';
                config.consecutiveAlerts = 0;
                config.lastAlertTimestamp = null;
                config.lastAlertType = null;
            }
        }
    }

    /**
     * Determina se um novo alerta deve ser enviado baseado no histórico
     */
    shouldSendAlert(config, currentAlertType, currentTime) {
        // Sempre enviar se for o primeiro alerta (após 3 leituras)
        if (config.outOfRangeCount < 3) return false;

        // Se não houver alerta anterior, enviar após 3 leituras
        if (!config.lastAlertTimestamp) return true;

        // Calcular intervalo desde último alerta
        const timeSinceLastAlert = currentTime - config.lastAlertTimestamp;
        
        // Definir intervalos baseados na severidade
/*         const intervals = {
            normal: 5 * 60 * 100,    // 5 minutos
            warning: 3 * 60 * 100,   // 3 minutos
            critical: 1 * 60 * 100   // 1 minuto
        };
 */
        const intervals = {
            normal: 10 * 1000,    // 10 segundos
            warning: 6 * 1000,    // 6 segundos
            critical: 2 * 1000    // 2 segundos
        };
        

        // Enviar se passou tempo suficiente
        return timeSinceLastAlert >= intervals[config.currentStatus];
    }

    /**
     * Determina a severidade do alerta baseado no histórico
     */
    determineSeverity(config) {
        if (config.consecutiveAlerts >= 3) return 'error';    // Crítico
        if (config.consecutiveAlerts >= 1) return 'warning';  // Aviso
        return 'info';  // Informativo
    }

    publishAlert(houseId, alertData) {
        const topic = `house/${houseId}/alerts/temperature`;
        const message = {
            ...alertData,
            timestamp: new Date().toISOString()
        };

        console.log(`[AlertsMonitor] Publicando no tópico ${topic}:`, message);
        mqttService.publish(topic, message);
    }

    stopMonitoring(houseId) {
        console.log(`[AlertsMonitor] Parando monitorização para casa ${houseId}`);
        this.monitoredHouses.delete(houseId);
        mqttService.unsubscribe(`house/${houseId}/temperature`);
    }

    cleanup() {
        console.log('[AlertsMonitor] Limpando todas as monitorizações');
        this.monitoredHouses.forEach((_, houseId) => {
            this.stopMonitoring(houseId);
        });
    }

    // Novos métodos para alertas de produtos
    monitorProduct(houseId, shelfId, product) {
        // Verificar stock baixo
        this.checkLowStock(houseId, shelfId, product);
    }

    checkLowStock(houseId, shelfId, product) {
        const netWeight = product.current_weight - product.container_weight;
        
        if (netWeight <= product.min_stock) {
            const topic = `house/${houseId}/alerts/products/stock`;
            this.publishProductAlert(topic, {
                type: 'low_stock',
                category: 'products',
                severity: 'warning',
                title: `Stock Baixo: ${product.name}`,
                message: `${product.name} está abaixo do mínimo! (${this.formatWeight(netWeight)}/${this.formatWeight(product.min_stock)})`,
                data: {
                    product_id: product.product_id,
                    shelf_id: shelfId,
                    current_weight: netWeight,
                    min_stock: product.min_stock
                }
            });
        }
    }

    publishProductAction(houseId, shelfId, product, action, newWeight = null) {
        console.log('[AlertsMonitor] Iniciando publishProductAction:', {
            houseId,
            shelfId,
            product,
            action,
            newWeight
        });

        const topic = `house/${houseId}/alerts/products/action`;
        let alertConfig;

        if (action === 'removed') {
            console.log('[AlertsMonitor] Configurando alerta de remoção');
            alertConfig = {
                type: 'product_removed',
                category: 'products',
                severity: 'info',
                title: `Produto Removido`,
                message: `${product.name} foi removido da prateleira`,
                data: {
                    product_id: product.product_id,
                    shelf_id: shelfId,
                    previous_weight: product.current_weight
                }
            };
        } else if (action === 'added') {
            console.log('[AlertsMonitor] Configurando alerta de adição');
            console.log(`o netWeight é ${newWeight}`);
            alertConfig = {
                type: 'product_added',
                category: 'products',
                severity: 'success',
                title: `Produto Reposto`,
                message: `${product.name} foi reposto na prateleira com ${this.formatWeight(newWeight - product.container_weight)}`,
                data: {
                    product_id: product.product_id,
                    shelf_id: shelfId,
                    new_weight: newWeight
                }
            };
        }

        if (alertConfig) {
            this.publishProductAlert(topic, alertConfig);
        } else {
            console.warn('[AlertsMonitor] Nenhuma configuração de alerta gerada para:', action);
        }
    }


    publishProductAlert(topic, data) {
        const message = {
            ...data,
            timestamp: new Date().toISOString(),
            house_id: this.getCurrentHouseId()
        };

        console.log(`[AlertsMonitor] Publicando alerta de produto no tópico ${topic}:`, message);
        
        try {
            mqttService.publish(topic, message);
            console.log('[AlertsMonitor] Alerta publicado com sucesso');
        } catch (error) {
            console.error('[AlertsMonitor] Erro ao publicar alerta:', error);
        }
    }

    // Utilitários
    formatWeight(weight) {
        if (!weight && weight !== 0) return 'N/D';
        const kg = weight / 1000;
        return kg >= 1 ? `${kg.toFixed(1)}kg` : `${weight}g`;
    }

    getCurrentHouseId() {
        // Implementar lógica para obter o house_id atual
        // Pode ser através do router ou de uma store
        return window.location.pathname.split('/')[2];
    }
}

export const alertsMonitor = new AlertsMonitorService();