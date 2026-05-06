<script setup lang="ts">
import { computed } from "vue";
import { useUserStore } from "@/store/useUserStore";
import { useLocationStore } from "@/store/useLocationStore";
import UserPanel from "./UserPanel/UserPanel.vue";

const userStore = useUserStore();
const locationStore = useLocationStore();

const user = computed(() => ({
  name: userStore.user.name,
  avatarUrl: userStore.user.avatarUrl,
  location: locationStore.selectedLocation?.name,
}));

const handleLogout = () => {
  userStore.logout();
};

const openSettings = () => {
  console.log("Настройки открыты");
};
</script>

<template>
  <UserPanel
    :user="user"
    @logout="handleLogout"
    @settings="openSettings"
  />
</template>
