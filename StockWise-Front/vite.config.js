import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173
  },
  define: {
    // Definir variáveis globais
    'process.env': {
      VITE_MQTT_BROKER_URL: JSON.stringify(process.env.VITE_MQTT_BROKER_URL),
      VITE_MQTT_USERNAME: JSON.stringify(process.env.VITE_MQTT_USERNAME),
      VITE_MQTT_PASSWORD: JSON.stringify(process.env.VITE_MQTT_PASSWORD)
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
