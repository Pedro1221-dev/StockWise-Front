import CreateHouseView from '@/views/CreateHouseView.vue'
import { createRouter, createWebHistory } from 'vue-router'
import EditHouseView from '../views/EditHouseView.vue'
import HouseDetailsView from '../views/HouseDetailsView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import UserHousesListView from '../views/UserHousesListView.vue'

const isAuthenticated = () => {
  return !!sessionStorage.getItem('accessToken');
};

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      path: '/houses',
      name: 'houses',
      component: UserHousesListView,
      meta: { requiresAuth: true } 
    },
    {
      path: '/house/edit',
      name: 'EditHouse',
      component: EditHouseView,
      props: true,
      meta: { requiresAuth: true } 
    },
    {
      path: '/house/create',
      name: 'CreateHouse',
      component: CreateHouseView,
      meta: { requiresAuth: true } 
    },
    {
      path: '/houses/:id',
      name: 'HouseDetails',
      component: HouseDetailsView,
      meta: { requiresAuth: true } 
    }
  ],
});

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated()) {
      next({ name: 'login' }); 
    } else {
      next();
    }
  } else {
    next(); 
  }
});

export default router;