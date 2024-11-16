<template>
  <v-card class="mx-auto my-4" max-width="400">
    <v-row no-gutters>
      <v-col>
        <v-card-title>{{ name }}</v-card-title>
      </v-col>
      <v-col class="d-flex justify-end align-center">
        <v-btn icon @click="editHouse">
          <img :src="editIcon" alt="Edit" class="edit-icon">
        </v-btn>
      </v-col>
    </v-row>
    <v-card-subtitle>Min Temp: {{ min_temperature }}°C</v-card-subtitle>
    <v-card-subtitle>Max Temp: {{ max_temperature }}°C</v-card-subtitle>
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
import editIcon from '@/assets/editIcon.png';
import { useHouseStore } from '../stores/house';

export default {
  name: 'userHouseCard',
  props: {
    name: {
      type: String,
      required: true
    },
    min_temperature: {
      type: Number,
      required: true
    },
    max_temperature: {
      type: Number,
      required: true
    },
    id:{
      type: Number,
      required: true
    }
  },
  data() {
    return {
      inviteLink: '',
      copyIcon,
      editIcon
    };
  },
  methods: {
    async invitePeople() {
      const houseStore = useHouseStore();
      try {
        this.inviteLink = await houseStore.generateInviteLink(this.id);
      } catch (error) {
        console.error('Error generating invite link:', error);
      }
    },
    copyInviteLink() {
      // Copy the invite link to the clipboard
      navigator.clipboard.writeText(this.inviteLink).then(() => {
        this.$emit('link-copied', this.inviteLink);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    },
    editHouse() {
      this.$router.push({
        name: 'EditHouse',
        query: {
          name: this.name,
          min_temperature: this.min_temperature,
          max_temperature: this.max_temperature,
          id: this.id
        }
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
.copy-icon, .edit-icon {
  width: 24px;
  height: 24px;
}
</style>