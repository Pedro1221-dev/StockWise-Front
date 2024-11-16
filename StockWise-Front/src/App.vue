//App.vue
<template>
  <v-app>
    <Header />
    <v-main>
      <v-container>
        <RouterView />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useHousesStore } from '@/stores/houses';
import Header from '@/components/Header.vue';

const userStore = useUserStore();
const housesStore = useHousesStore();

onMounted(async () => {
    await userStore.init();
    if (userStore.isAuthenticated) {
        await housesStore.fetchUserHouses(true);
    }
});
</script>