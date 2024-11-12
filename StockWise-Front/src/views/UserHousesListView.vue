<template>
  <v-container>
    <v-btn color="primary" @click="createHouse">Create House</v-btn>
    <v-row>
      <v-col v-for="house in houses" :key="house.id" cols="12" md="6">
        <userHouseCard
          :name="house.name"
          :minTemp="house.minTemp"
          :maxTemp="house.maxTemp"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import UserHouseCard from '../components/UserHouseCard.vue';

export default {
  components: {
    UserHouseCard
  },
  data() {
    return {
      houses: [
        { id: 1, name: 'House 1', minTemp: 18, maxTemp: 25 },
        { id: 2, name: 'House 2', minTemp: 20, maxTemp: 28 },
        // Add more houses as needed
      ]
    };
  },
  methods: {
    createHouse() {
      this.$router.push({ name: 'CreateHouse' });
    }
  }
};
</script>