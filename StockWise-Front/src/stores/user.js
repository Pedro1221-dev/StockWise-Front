import { defineStore } from 'pinia';
import { post } from '../api/api.js';
import * as api from '../api/api.js';

export const useUserStore = defineStore('users', {
  state: () => ({
    users: [],
    user: null,
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
        this.user = response.data;
        return response.data;
      } catch (error) {
        console.error('Error in store login:', error);
        throw error; 
        // Handle error gracefully
      }
    }
  },
});