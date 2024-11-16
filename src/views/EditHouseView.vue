<template>
  <v-container>
    <v-btn color="secondary" @click="goBack">Back</v-btn>
    <v-card class="mx-auto my-4" max-width="400">
      <v-card-title>Edit House</v-card-title>
      <p>House Id: {{ this.$route.query.id }}</p>
      <v-card-text>
        <v-form ref="form">
          <v-text-field
            v-model="house.name"
            label="House Name"
            :rules="[v => !!v || 'House name is required']"
          ></v-text-field>
          <v-text-field
            v-model="house.min_temperature"
            label="Min Temp"
            type="number"
            :rules="[v => !!v || 'Min temp is required']"
          ></v-text-field>
          <v-text-field
            v-model="house.max_temperature"
            label="Max Temp"
            type="number"
            :rules="[v => !!v || 'Max temp is required']"
          ></v-text-field>
          <v-btn color="primary" @click="saveHouse">Save</v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import { useHouseStore } from '../stores/house';

export default {
  name: 'EditHouse',
  data() {
    return {
      house: {
        name: this.$route.query.name,
        min_temperature: this.$route.query.min_temperature,
        max_temperature: this.$route.query.max_temperature
      }
    };
  },
  methods: {
    goBack() {
      this.$router.push({ name: 'houses' });
    },
    async saveHouse() {
      if (this.$refs.form.validate()) {
        const houseStore = useHouseStore();
        try {
          console.log('House data on edit View:', this.house);
          this.house.min_temperature = Number(this.house.min_temperature);
          this.house.max_temperature = Number(this.house.max_temperature);
          await houseStore.updateHouse(this.house,this.$route.query.id); 
          console.log('House data saved:', this.house);
          this.$router.push({ name: 'Houses' });
        } catch (error) {
          console.error('Error saving house:', error);
        }
      }
    }
  }
};
</script>