<template>
  <div>
    <userHouseCard
      v-for="house in houses"
      :key="house.id"
      :name="house.name"
      :minTemp="house.minTemp"
      :maxTemp="house.maxTemp"
    />
  </div>
</template>

<script>
import UserHouseCard from '../components/userHouseCard.vue';

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
  }
}
</script>