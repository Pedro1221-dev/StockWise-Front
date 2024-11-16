<!-- components/AlertsNotification.vue -->
<template>
    <div class="alerts-notification">
      <v-badge
        :content="unreadCount"
        :value="unreadCount"
        color="error"
        overlap
      >
        <v-btn icon @click="showMenu = !showMenu">
          <v-icon>mdi-bell</v-icon>
        </v-btn>
      </v-badge>
  
      <v-menu
        v-model="showMenu"
        :close-on-content-click="false"
        location="bottom end"
        max-width="400"
      >
        <v-card>
          <v-card-title class="d-flex align-center">
            Alertas
            <v-spacer></v-spacer>
            <v-btn
              v-if="hasUnreadAlerts"
              variant="text"
              size="small"
              @click="markAllAsRead"
            >
              Marcar todos como lidos
            </v-btn>
          </v-card-title>
  
          <v-divider></v-divider>
  
          <v-list v-if="allAlerts.length">
            <v-list-item
              v-for="alert in allAlerts"
              :key="alert.id"
              :class="{ 'unread': !alert.read }"
              @click="markAsRead(alert.id)"
            >
              <template v-slot:prepend>
                <v-icon :color="getAlertColor(alert)">
                  {{ getAlertIcon(alert) }}
                </v-icon>
              </template>
  
              <v-list-item-title>{{ alert.message }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ formatTimestamp(alert.timestamp) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
  
          <v-card-text v-else class="text-center py-4">
            Sem alertas para mostrar
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
  
  const unreadCount = computed(() => alertsStore.unreadCount);
  const hasUnreadAlerts = computed(() => alertsStore.hasUnreadAlerts);
  const allAlerts = computed(() => {
    const alerts = [];
    alertsStore.alerts.forEach(houseAlerts => {
      alerts.push(...houseAlerts);
    });
    return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  });
  
  const getAlertColor = (alert) => {
    switch (alert.severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'info': return 'info';
      default: return 'grey';
    }
  };
  
  const getAlertIcon = (alert) => {
    if (alert.type === 'temperature') {
      return alert.severity === 'high' ? 'mdi-thermometer-alert' : 'mdi-thermometer-check';
    }
    return 'mdi-alert';
  };
  
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };
  
  const markAsRead = (alertId) => {
    alertsStore.markAsRead(alertId);
  };
  
  const markAllAsRead = () => {
    alertsStore.markAllAsRead();
  };
  </script>
  
  <style scoped>
  .alerts-notification {
    position: relative;
  }
  
  .unread {
    background-color: rgba(var(--v-theme-primary), 0.05);
  }
  </style>