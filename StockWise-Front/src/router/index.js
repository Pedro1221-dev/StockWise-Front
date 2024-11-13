// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import UserHousesListView from '../views/UserHousesListView.vue'
import ErrorPage from '../views/ErrorPage.vue'

const routes = [
  {
    path: '/',
    redirect: '/houses'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { 
      isAuthRoute: true,
      title: 'Login'
    }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { 
      isAuthRoute: true,
      title: 'Registo'
    }
  },
  {
    path: '/houses',
    name: 'houses',
    component: UserHousesListView,
    meta: { 
      requiresAuth: true,
      title: 'Minhas Casas'
    }
  },
  {
    path: '/error',
    name: 'error',
    component: ErrorPage,
    props: true
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: ErrorPage,
    props: {
      title: 'Página Não Encontrada',
      message: 'A página que procura não existe.',
      redirectPath: '/houses',
      redirectButtonText: 'Voltar à Página Principal'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Função para inicializar autenticação
async function initializeAuth() {
  const userStore = useUserStore()
  if (!userStore.initialized) {
    await userStore.init()
  }
  return userStore.checkAuth()
}

// Guarda de navegação
router.beforeEach(async (to, from, next) => {
  const isAuthenticated = await initializeAuth()

  // Atualizar título da página
  document.title = `${to.meta.title || 'Erro'} | StockWise`

  // Se está a tentar aceder à rota inicial '/'
  if (to.path === '/') {
    return next(isAuthenticated ? '/houses' : '/login')
  }

  // Redirecionar utilizador autenticado que tenta aceder a rotas de auth
  if (to.meta.isAuthRoute && isAuthenticated) {
    return next('/houses')
  }

  // Redirecionar utilizador não autenticado que tenta aceder a rotas protegidas
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({
      name: 'login',
      query: { redirect: to.fullPath }
    })
  }

  // Permitir navegação para outras rotas
  next()
})

export default router