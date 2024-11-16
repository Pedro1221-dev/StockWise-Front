<template>
  <v-card class="mx-auto my-4" max-width="400">
    <v-row no-gutters>
      <v-col>
        <v-card-title>{{ name }}</v-card-title>
      </v-col>
    </v-row>
    <v-card-subtitle>Min Temp: {{ min_temperature }}°C</v-card-subtitle>
    <v-card-subtitle>Max Temp: {{ max_temperature }}°C</v-card-subtitle>
    <v-card-subtitle>Role: Member</v-card-subtitle>
  </v-card>
</template>

<script>
export default {
  name: "userHouseCard",
  props: {
    name: {
      type: String,
      required: true,
    },
    min_temperature: {
      type: Number,
      required: true,
    },
    max_temperature: {
      type: Number,
      required: true,
    },
    id: {
      type: Number,
      required: true,
    },
  },
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
.d-flex {
  display: flex;
}
.align-center {
  align-items: center;
}
.mr-2 {
  margin-right: 8px;
}
.copy-icon,
.edit-icon {
  width: 24px;
  height: 24px;
}
</style>
