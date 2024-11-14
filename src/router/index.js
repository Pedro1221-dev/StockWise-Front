import CreateHouseView from '@/views/CreateHouseView.vue'
import { createRouter, createWebHistory } from 'vue-router'
import EditHouseView from '../views/EditHouseView.vue'
import HouseDetailsView from '../views/HouseDetailsView.vue'
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
      path: '/house/edit',
      name: 'EditHouse',
      component: EditHouseView,
      props: true
    },
    {
      path: '/house/create',
      name: 'CreateHouse',
      component: CreateHouseView,
    },
    {
      path: '/houses/:id',
      name: 'HouseDetails',
      component: HouseDetailsView,
    }

  ],
})

export default router
