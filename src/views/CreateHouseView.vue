<template>
  <v-container>
    <v-btn color="secondary" @click="goBack">Back</v-btn>
    <v-card class="mx-auto my-4" max-width="400">
      <v-card-title>Create House</v-card-title>
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
import { useHouseStore } from '../stores/house'; // Importe a store

export default {
  data() {
    return {
      house: {
        name: '',
        min_temperature: '',
        max_temperature: ''
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
          await houseStore.createHouse(this.house); // Envie os dados da casa para a store
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

<style scoped>
.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
.my-4 {
  margin-top: 16px;
  margin-bottom: 16px;
}
</style>