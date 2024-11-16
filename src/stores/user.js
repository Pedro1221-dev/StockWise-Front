import { defineStore } from "pinia";
import { post } from "../api/api.js";
import * as api from "../api/api.js";
import router from "../router";

export const useUserStore = defineStore("users", {
  state: () => ({
    users: [],
    user: null,
    user_id: null,
  }),
  getters: {},
  actions: {
    async createUser(user) {
      try {
        const response = await post("/users", user);
        this.users.push(response.data);
        setTimeout(() => {
          router.push("/");
        }, 2000);
        return response.data;
      } catch (error) {
        console.error("Error in store creating user:", error);
        throw error;
      }
    },
    async login(user) {
      try {
        const response = await post("/users/login", user);
        this.user = response;
        console.log(response.accessToken);

        if (response.accessToken) {
          sessionStorage.setItem("accessToken", response.accessToken);
          this.user_id = response.user_id;
          setTimeout(() => {
            router.push("/houses");
          }, 2000);
        }

        return response.data;
      } catch (error) {
        console.error("Error in store login:", error);
        throw error;
      }
    },
    async logout() {
      this.user = null;
      this.user_id = null;
      sessionStorage.removeItem("accessToken");
      router.push("/");
    },
  },
});
