// components/AlertsNotification.vue
<template>
  <div class="alerts-container">
    <!-- Sino com badge -->
    <v-badge
      :content="unreadCount"
      :model-value="hasUnreadAlerts"
      color="error"
      location="top end"
    >
      <v-btn
        icon
        @click="showMenu = !showMenu"
        :color="hasUnreadAlerts ? 'primary' : undefined"
      >
        <v-icon>mdi-bell</v-icon>
      </v-btn>
    </v-badge>

    <!-- Menu de alertas -->
    <v-menu
      v-model="showMenu"
      :close-on-content-click="false"
      location="bottom end"
      max-width="600"
    >
      <v-card class="alerts-menu">
        <!-- Cabeçalho -->
        <v-card-title class="d-flex justify-space-between align-center py-2 px-4">
          <span class="text-subtitle-1">Notificações</span>
          <div class="d-flex align-center gap-2">
            <!-- Botão marcar como lidas -->
            <v-btn
              v-if="hasUnreadAlerts"
              variant="text"
              density="compact"
              prepend-icon="mdi-email-open"
              size="small"
              @click="markAllAsRead"
            >
              Marcar todas como lidas
            </v-btn>

            <!-- Botão limpar todas -->
            <v-btn
              v-if="hasAlerts"
              variant="text"
              density="compact"
              prepend-icon="mdi-delete"
              size="small"
              color="error"
              @click="clearAllAlerts"
            >
              Limpar todas
            </v-btn>
          </div>
        </v-card-title>

        <v-divider></v-divider>

        <!-- Lista de alertas -->
        <v-list v-if="hasAlerts" class="alerts-list">
          <v-list-item
            v-for="alert in sortedAlerts"
            :key="alert.id"
            :class="[
              { 'unread': !alert.read },
              `severity-${alert.severity}`
            ]"
            :active="!alert.read"
            @click="markAsRead(alert.id)"
          >
            <!-- Ícone do alerta -->
            <template v-slot:prepend>
              <v-icon :color="getAlertColor(alert)" size="small">
                {{ getAlertIcon(alert) }}
              </v-icon>
            </template>

            <!-- Conteúdo do alerta -->
            <v-list-item-title class="text-subtitle-2 mb-1">
              {{ alert.title }}
            </v-list-item-title>

            <v-list-item-subtitle class="text-caption text-medium-emphasis">
              {{ alert.message }}
            </v-list-item-subtitle>

            <v-list-item-subtitle class="text-caption text-disabled mt-1">
              {{ formatTimestamp(alert.timestamp) }}
            </v-list-item-subtitle>

            <!-- Botão de fechar -->
            <template v-slot:append>
              <v-btn
                icon="mdi-close"
                variant="text"
                density="compact"
                size="x-small"
                @click.stop="dismissAlert(alert.id)"
              ></v-btn>
            </template>
          </v-list-item>
        </v-list>

        <!-- Estado vazio -->
        <v-card-text v-else class="text-center py-8">
          <v-icon
            icon="mdi-bell-outline"
            color="grey-lighten-1"
            size="48"
          ></v-icon>
          <div class="text-body-2 text-grey mt-2">
            Sem notificações
          </div>
        </v-card-text>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAlertsStore } from '@/stores/alerts';

const alertsStore = useAlertsStore();
const showMenu = ref(false);

// Computed properties
const hasUnreadAlerts = computed(() => alertsStore.hasUnreadAlerts);
const unreadCount = computed(() => alertsStore.unreadCount);
const hasAlerts = computed(() => alertsStore.alerts.length > 0);

const sortedAlerts = computed(() => 
  [...alertsStore.alerts]
    .filter(alert => !alert.dismissed)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
);

// Métodos de utilidade
const getAlertColor = (alert) => {
  switch (alert.severity) {
    case 'error': return 'error';
    case 'warning': return 'warning';
    case 'success': return 'success';
    case 'info': return 'info';
    default: return 'grey';
  }
};

const getAlertIcon = (alert) => {
  // Ícones baseados no tipo e severidade
  const icons = {
    temperature: {
      high_temperature: {
        info: 'mdi-thermometer-high',
        warning: 'mdi-thermometer-alert',
        error: 'mdi-thermometer-alert'
      },
      low_temperature: {
        info: 'mdi-thermometer-low',
        warning: 'mdi-thermometer-alert',
        error: 'mdi-thermometer-alert'
      },
      temperature_normalized: {
        success: 'mdi-thermometer-check'
      }
    },
    // Preparado para futuros tipos de alerta
    weight: {
      overweight: 'mdi-weight',
      low_stock: 'mdi-package-down'
    },
    rfid: {
      unregistered: 'mdi-help-circle',
      removed: 'mdi-package-remove'
    }
  };

  // Tentar obter ícone específico
  if (icons[alert.category]?.[alert.type]?.[alert.severity]) {
    return icons[alert.category][alert.type][alert.severity];
  }

  // Fallback para ícone genérico
  return 'mdi-bell';
};

const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  });
};

// Ações
const markAsRead = (alertId) => {
  alertsStore.markAsRead(alertId);
};

const markAllAsRead = () => {
  alertsStore.markAllAsRead();
};

const dismissAlert = (alertId) => {
  alertsStore.dismissAlert(alertId);
};

const clearAllAlerts = () => {
  alertsStore.clearAllAlerts();
  showMenu.value = false;
};
</script>

<style scoped>
.alerts-container {
  position: relative;
}

.alerts-menu {
  max-height: 400px;
}

.alerts-list {
  max-height: 300px;
  overflow-y: auto;
}

/* Cores baseadas na severidade */
.severity-error {
  border-left: 4px solid var(--v-theme-error);
}

.severity-warning {
  border-left: 4px solid var(--v-theme-warning);
}

.severity-success {
  border-left: 4px solid var(--v-theme-success);
}

.severity-info {
  border-left: 4px solid var(--v-theme-info);
}

.unread {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.v-list-item {
  border-bottom: 1px solid rgba(var(--v-border-opacity), 0.12);
  transition: all 0.2s ease;
}

.v-list-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

/* Espaçamento entre botões */
.gap-2 {
  gap: 8px;
}
</style>