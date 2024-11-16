<!-- components/MqttTest.vue -->
<template>
    <v-card class="mx-auto mt-4" max-width="500">
      <v-card-title>Teste MQTT</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="message"
          label="Mensagem de teste"
          append-icon="mdi-send"
          @click:append="sendMessage"
        ></v-text-field>
        
        <v-list v-if="messages.length">
          <v-list-item
            v-for="(msg, index) in messages"
            :key="index"
          >
            {{ msg }}
          </v-list-item>
        </v-list>
        
        <v-alert
          v-else
          type="info"
          variant="tonal"
        >
          Aguardando mensagens...
        </v-alert>
      </v-card-text>
    </v-card>
  </template>
  
  <script setup>
  import { ref, onMounted, onBeforeUnmount } from 'vue'
  import { mqttService } from '@/services/mqtt.service'
  
  const message = ref('')
  const messages = ref([])
  
  const TEST_TOPIC = 'stockwise/test'
  
  onMounted(async () => {
    try {
      await mqttService.connect()
      
      mqttService.subscribe(TEST_TOPIC, (msg) => {
        messages.value.push(msg)
      })
    } catch (error) {
      console.error('Erro ao inicializar MQTT:', error)
    }
  })
  
  const sendMessage = () => {
    if (message.value) {
      mqttService.publish(TEST_TOPIC, message.value)
      message.value = ''
    }
  }
  
  onBeforeUnmount(() => {
    mqttService.cleanup()
  })
  </script>