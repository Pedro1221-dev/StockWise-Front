import { defineStore } from "pinia";
import { get, post, patch } from "../api/api.js";

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error parsing JWT token:", error);
    return null;
  }
}

export const useHouseStore = defineStore("houses", {
  state: () => ({
    houses: [],
    memberHouses: [],
  }),
  actions: {
    async fetchHouses() {
      try {
        const token = sessionStorage.getItem("accessToken");
        const payload = parseJwt(token);
        const userId = payload ? payload.user_id : null;

        if (!userId) {
          throw new Error("User ID not found in token");
        }

        const response = await get(`/users/${userId}/houses`, token);
        this.houses = response.data.houses;
        this.memberHouses = response.data.memberHouses;
      } catch (error) {
        console.error("Error fetching houses:", error);
      }
    },
    async createHouse(house) {
      try {
        const token = sessionStorage.getItem("accessToken");
        const response = await post("/houses", house, token);
        this.houses.push(response.data);
      } catch (error) {
        console.error("Error creating house:", error);
      }
    },
    async updateHouse(house, houseId) {
      try {
        const token = sessionStorage.getItem("accessToken");
        const response = await patch(`/houses/${houseId}`, house, token);
        this.houses = this.houses.map((h) =>
          h.id === houseId ? response.data : h
        );
      } catch (error) {
        console.error("Error editing house:", error);
      }
    },
    async generateInviteLink(houseId) {
      try {
        const token = sessionStorage.getItem("accessToken");
        const response = await post(`/houses/${houseId}/invites`, {}, token);
        return response.data;
      } catch (error) {
        console.error("Error generating invite link:", error);
      }
    },
    async acceptInvite(house_id, invite_id) {
      try {
        const token = sessionStorage.getItem("accessToken");
        const response = await post(
          `/houses/${house_id}/invites/${invite_id}/accept`,
          {},
          token
        );
        return response;
      } catch (error) {
        console.error("Error accepting invite:", error);
      }
    },
  },
});
