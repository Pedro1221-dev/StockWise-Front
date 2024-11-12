import CreateHouse from '@/views/CreateHouse.vue'
import { createRouter, createWebHistory } from 'vue-router'
import EditHouse from '../views/EditHouse.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import UserHousesListView from '../views/UserHousesListView.vue'


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
    },
    {
      path: '/edit-house',
      name: 'EditHouse',
      component: EditHouse,
      props: true
    },
    {
      path: '/create-house',
      name: 'CreateHouse',
      component: CreateHouse
    }

  ],
})

export default router
