<template>
  <v-container>
    <v-card class="mx-auto my-4" max-width="400">
      <v-card-title>Edit House</v-card-title>
      <v-card-text>
        <v-form ref="form">
          <v-text-field
            v-model="house.name"
            label="House Name"
            :rules="[v => !!v || 'House name is required']"
          ></v-text-field>
          <v-text-field
            v-model="house.minTemp"
            label="Min Temp"
            type="number"
            :rules="[v => !!v || 'Min temp is required']"
          ></v-text-field>
          <v-text-field
            v-model="house.maxTemp"
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
export default {
  name: 'EditHouse',
  data() {
    return {
      house: {
        name: '',
        minTemp: '',
        maxTemp: ''
      }
    };
  },
  created() {
    // Load house data from route params or API
    const { name, minTemp, maxTemp } = this.$route.params;
    this.house = { name, minTemp, maxTemp };
  },
  methods: {
    saveHouse() {
      if (this.$refs.form.validate()) {
        // Save house data (e.g., send to API)
        console.log('House data saved:', this.house);
        this.$router.push({ name: 'Houses' });
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