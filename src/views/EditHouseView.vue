<template>
  <v-container>
    <v-form ref="form">
      <v-text-field
        v-model="house.name"
        label="Name"
        required
      ></v-text-field>
      <v-text-field
        v-model="house.minTemp"
        label="Min Temperature"
        required
      ></v-text-field>
      <v-text-field
        v-model="house.maxTemp"
        label="Max Temperature"
        required
      ></v-text-field>
      <v-btn color="primary" @click="saveHouse">Save</v-btn>
    </v-form>
  </v-container>
</template>

<script>
import { useHouseStore } from '../stores/house'; // Importe a store

export default {
  name: 'EditHouse',
  data() {
    return {
      house: {
        id: this.$route.params.id, // Obtenha o ID da casa dos parâmetros da rota
        name: '',
        minTemp: '',
        maxTemp: ''
      }
    };
  },
  methods: {
    async saveHouse() {
      if (this.$refs.form.validate()) {
        const houseStore = useHouseStore();
        try {
          await houseStore.updateHouse(this.house); // Envie os dados atualizados da casa para a store
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