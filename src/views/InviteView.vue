<template>
  <div class="invite-view">
    <h1>You have been invited to join StockWise!</h1>
    <p>
      Please click the link below to accept the invitation and join our
      platform.
    </p>
    <v-btn
      class="mt-4"
      color="blue"
      size="large"
      variant="tonal"
      @click="acceptInvite"
      >Accept Invitation</v-btn
    >
  </div>
</template>

<script>
import router from "@/router";
import { useHouseStore } from "@/stores/house";
import { useToast } from "vue-toastification";

export default {
  setup() {
    const toast = useToast();
    const houseStore = useHouseStore();

    return {
      toast,
      houseStore,
    };
  },
  data() {
    return {
      invite_id: this.$route.params.id,
    };
  },
  methods: {
    async acceptInvite() {
      try {
        const response = await this.houseStore.acceptInvite(1, this.invite_id);
        setTimeout(() => {
          router.push("/houses");
        }, 2000);
      } catch (error) {
        console.error("Error accepting invitation:", error);
        this.toast.error("Failed to accept invitation");
      }
    },
  },
  mounted() {
    console.log(this.invite_id);
  },
};
</script>

<style scoped>
.invite-view {
  text-align: center;
  margin-top: 50px;
}

.invite-link {
  display: inline-block;
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 5px;
}

.invite-link:hover {
  background-color: #0056b3;
}
</style>
