<template>
  <v-container>
    <v-btn color="primary" @click="createHouse">Create House</v-btn>
    <v-btn color="secondary" @click="logout">Logout</v-btn>
    <v-row>
      <p v-if="!houses.length" class="center">No Houses Found!</p>
      <v-col v-for="house in houses" :key="house.id" cols="24" md="6">
        <userHouseCard
          :name="house.name"
          :min_temperature="house.min_temperature"
          :max_temperature="house.max_temperature"
          :id="house.house_id"
        />
      </v-col>
      <v-col v-for="house in memberHouses" :key="house.id" cols="6" md="6">
        <UserHouseCardMember
          :name="house.name"
          :min_temperature="house.min_temperature"
          :max_temperature="house.max_temperature"
          :id="house.house_id"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import UserHouseCard from "../components/UserHouseCard.vue";
import UserHouseCardMember from "../components/UserHouseCardMember.vue";
import { useHouseStore } from "../stores/house";
import { useUserStore } from "../stores/user";

export default {
  components: {
    UserHouseCard,
    UserHouseCardMember,
  },
  computed: {
    houses() {
      const houseStore = useHouseStore();
      return houseStore.houses;
    },
    memberHouses() {
      const houseStore = useHouseStore();
      return houseStore.memberHouses;
    },
  },
  methods: {
    async fetchHouses() {
      const houseStore = useHouseStore();
      const userStore = useUserStore();
      const userId = userStore.user_id;
      await houseStore.fetchHouses(userId);
    },
    createHouse() {
      this.$router.push({ name: "CreateHouse" });
    },
    logout() {
      useUserStore().logout();
      this.$router.push({ name: "Login" });
    },
  },
  mounted() {
    this.fetchHouses();
  },
};
</script>
<style>
.center {
  position: absolute;
  top: 20%;
  left: 45%;
}
</style>
