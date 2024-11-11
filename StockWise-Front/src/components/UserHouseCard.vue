<template>
  <v-card class="mx-auto my-4" max-width="400">
    <v-card-title>{{ name }}</v-card-title>
    <v-card-subtitle>Min Temp: {{ minTemp }}°C</v-card-subtitle>
    <v-card-subtitle>Max Temp: {{ maxTemp }}°C</v-card-subtitle>
    <v-card-actions>
      <v-btn color="primary" @click="invitePeople">Invite People</v-btn>
    </v-card-actions>
    <v-card-text v-if="inviteLink">
      <div class="d-flex align-center">
        <v-text-field
          v-model="inviteLink"
          label="Invite Link"
          readonly
          class="mr-2"
        ></v-text-field>
        <v-btn icon @click="copyInviteLink">
          <img :src="copyIcon" alt="Copy" class="copy-icon">
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import copyIcon from '@/assets/copyIcon.svg';

export default {
  name: 'userHouseCard',
  props: {
    name: {
      type: String,
      required: true
    },
    minTemp: {
      type: Number,
      required: true
    },
    maxTemp: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      inviteLink: '',
      copyIcon
    };
  },
  methods: {
    invitePeople() {
      // Generate the invite link
      this.inviteLink = `${window.location.origin}/invite?houseName=${encodeURIComponent(this.name)}`;
    },
    copyInviteLink() {
      // Copy the invite link to the clipboard
      navigator.clipboard.writeText(this.inviteLink).then(() => {
        this.$emit('link-copied', this.inviteLink);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    }
  }
}
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
.copy-icon {
  width: 24px;
  height: 24px;
}
</style>