<script setup lang="ts">
import { computed } from "vue";
import { useUserStore } from "@/store/useUserStore";
import UserPanel from "./UserPanel/UserPanel.vue";

const userStore = useUserStore();

const user = computed(() => ({
  name: userStore.user.name,
  avatarUrl: userStore.user.avatarUrl,
  location: userStore.location?.name,
}));

const handleLogout = () => {
  userStore.logout();
};

const openSettings = () => {
  console.log("Settings opened");
};
</script>

<template>
  <UserPanel
    :user="user"
    @logout="handleLogout"
    @settings="openSettings"
  />
</template>
