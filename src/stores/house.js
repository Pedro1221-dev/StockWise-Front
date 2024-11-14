import { defineStore } from 'pinia';
import { get,post } from '../api/api.js';

export const useHouseStore = defineStore('houses', {
  state: () => ({
    houses: [],
  }),
  actions: {
    async fetchHouses(userId) {
      try {
        const token = sessionStorage.getItem('accessToken');
        const response = await get(`/users/${userId}/houses`,token);
        this.houses = response.data;
      } catch (error) {
        console.error('Error fetching houses:', error);
      }
    },
    async createHouse(house) {
      try {
        const token = sessionStorage.getItem('accessToken');
        const response = await post('/houses', house, token);
        this.houses.push(response.data);
      } catch (error) {
        console.error('Error creating house:', error);
      }
    },
  },
});