<script setup lang="ts">
import { computed } from "vue";
import { navigateTo } from "#app";
import { useUserStore } from "@/store/useUserStore";
import { useLocationStore } from "@/store/useLocationStore";
import UserPanel from "./UserPanel/UserPanel.vue";

const userStore = useUserStore();
const locationStore = useLocationStore();
let logoutInFlight: Promise<void> | null = null;

const user = computed(() => ({
  name: userStore.userState.name,
  avatarUrl: userStore.userState.avatarUrl,
  location: locationStore.selectedLocation?.name,
}));

const handleLogout = async () => {
  if (logoutInFlight) {
    await logoutInFlight;
    return;
  }

  logoutInFlight = (async () => {
    try {
      userStore.logout();
      await navigateTo("/auth/login", { replace: true });
    } finally {
      logoutInFlight = null;
    }
  })();

  await logoutInFlight;
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
