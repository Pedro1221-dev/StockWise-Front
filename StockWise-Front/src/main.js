// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import { useUserStore } from './stores/user'
import { mqttService } from './services/mqtt.service'

const vuetify = createVuetify({
    components,
    directives,
})

// Criar aplicação e pinia
const app = createApp(App)
const pinia = createPinia()

// Configurar plugins
app.use(pinia)
app.use(router)
app.use(vuetify)

// Função de inicialização
async function initializeApp() {
    // Inicializar autenticação
    const userStore = useUserStore(pinia)
    await userStore.init()

    // Conectar ao broker MQTT se autenticado
    if (userStore.isAuthenticated) {
        try {
            await mqttService.connect()
        } catch (error) {
            console.error('Erro ao conectar ao broker MQTT:', error)
        }
    }

    // Montar a aplicação
    app.mount('#app')
}

// Inicializar aplicação
initializeApp().catch(error => {
    console.error('Erro ao inicializar aplicação:', error)
})