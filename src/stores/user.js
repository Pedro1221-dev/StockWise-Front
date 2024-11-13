import { defineStore } from 'pinia';
import { post } from '../api/api.js';
import * as api from '../api/api.js'
import router from '../router';

export const useUserStore = defineStore('users', {
  state: () => ({
    users: [],
    user: null,
    user_id: null,
  }),
  getters: {
  },
  actions: {
    async createUser(user) {
      try {
        const response = await post('/users', user);
        this.users.push(response.data);
        return response.data;
      } catch (error) {
        console.error('Error in store creating user:', error);
        throw error; 
        // Handle error gracefully
      }
    },
    async login(user) {
      try {
        const response = await post('/users/login', user);
        this.user = response;
        console.log(response.accessToken);
        
        // Armazenar o accessToken no sessionStorage
        if (response.accessToken) {
          sessionStorage.setItem('accessToken', response.accessToken);
          this.user_id = response.user_id;
          
          // Redirecionar para a página /houses após 5 segundos
          setTimeout(() => {
            router.push('/houses');
          }, 5000);
        }
    
        return response.data;
      } catch (error) {
        console.error('Error in store login:', error);
        throw error; 
        // Handle error gracefully
      }
    }
  },
});