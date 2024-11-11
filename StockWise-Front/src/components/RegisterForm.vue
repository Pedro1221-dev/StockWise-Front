<template>
  <div>
    <v-card>
      <v-card-text>
        <v-form @submit.prevent="register">
          <v-text-field
            v-model="form.name"
            label="Name"
            required
          ></v-text-field>
          <v-text-field
            v-model="form.email"
            label="Email"
            required
          ></v-text-field>
          <v-text-field
            v-model="form.password"
            label="Password"
            type="password"
            required
          ></v-text-field>
          <v-btn type="submit" color="primary">Register</v-btn>
        </v-form>
        <a
          href="#"
          rel="noopener noreferrer"
          target="_blank"
        >
          <RouterLink to="/">Log in now <v-icon icon="mdi-chevron-right"></v-icon></RouterLink>
        </a>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { useUserStore } from "@/stores/user";

export default {
  data: () => ({
    form: {
      name: '',
      email: '',
      password: ''
    },
    visible: false,
  }),
  methods: {

    async register() {
      await useUserStore().createUser(this.form);
    }
  }
}
</script>