<template>
  <div>
    <v-card
      class="mx-auto pa-12 pb-8 custom-margin-top"
      elevation="8"
      max-width="448"
      rounded="lg"
    >

      <div class="text-subtitle-1 text-medium-emphasis">Email</div>

      <v-text-field
        density="compact"
        placeholder="Email"
        prepend-inner-icon="mdi-email-outline"
        variant="outlined"
        v-model="form.email"
        :rules="emailRules"
        aria-required="true"
      ></v-text-field>

      <div class="text-subtitle-1 text-medium-emphasis d-flex align-center justify-space-between">
        Password
      </div>

      <v-text-field
        :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
        :type="visible ? 'text' : 'password'"
        density="compact"
        placeholder="Enter your password"
        prepend-inner-icon="mdi-lock-outline"
        variant="outlined"
        @click:append-inner="visible = !visible"
        v-model="form.password"
        :rules="passwordRules" 
        aria-required="true"
      ></v-text-field>


      <v-btn
        class="mb-8"
        color="blue"
        size="large"
        variant="tonal"
        block
        @click="validateForm"      
      >
        Log In
      </v-btn>

      <v-card-text class="text-center">
        <a
          class="text-blue text-decoration-none"
          href="#"
          rel="noopener noreferrer"
          target="_blank"
        >
          <RouterLink to="/register">Sign up now <v-icon icon="mdi-chevron-right"></v-icon></RouterLink>
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
      email: '',
      password: ''
    },
    visible: false,
    emailRules: [
      v => !!v || 'Email is required',
      v => /.+@.+\..+/.test(v) || 'Email must be valid'
    ],
    passwordRules: [
      v => !!v || 'Password is required',
      v => v.length >= 8 || 'Password must be at least 8 characters',
      v => /[!@#$%^&*(),.?":{}|<>]/.test(v) || 'Password must contain at least one special character'
    ]
  }),
  methods: {
    validateForm() {
      if (this.$refs.form.validate()) {
        this.login();
      }
    },
    async login() {
      try {
        await useUserStore().login(this.form);
        this.$router.push({ name: 'Houses' });
      } catch (error) {
        console.error('Login failed:', error);
        // Handle login error (e.g., show a notification)
      }
    }
  }
}
</script>

<style scoped>
.custom-margin-top {
  margin-top: 12%;
}
</style>