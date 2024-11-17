//StockWise-Front\src\utils\navigationGuard.js
/**
 * Verifica se o utilizador está autenticado para acesso a rotas protegidas
 * @param {Object} store - Store do Pinia para gestão de estado do utilizador
 * @returns {Function} Função de guarda de navegação
 */
export function requireAuth(store) {
    return (to, from, next) => {
      const isAuthenticated = store.isAuthenticated
      
      // Rotas que requerem autenticação
      if (to.meta.requiresAuth && !isAuthenticated) {
        // Redirecionar para login, guardando a rota pretendida
        next({ 
          name: 'login',
          query: { redirect: to.fullPath }
        })
        return
      }
      
      // Rotas de autenticação (login/registo)
      if (to.meta.isAuthRoute && isAuthenticated) {
        // Redirecionar utilizador autenticado para a dashboard
        next({ name: 'houses' })
        return
      }
      
      // Permitir navegação para outras rotas
      next()
    }
  }