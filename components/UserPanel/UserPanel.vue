<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";
import { usePanelStore } from "../../store/usePanelStore";
import { useUserStore } from "../../store/useUserStore";
import UserTrigger from "./UserTrigger.vue";
import UserPanelMain from "./UserPanelMain.vue";

const panel = usePanelStore();
const userStore = useUserStore();

let unlockTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => panel.isOpen,
  (isOpen) => {
    if (unlockTimer) {
      clearTimeout(unlockTimer);
      unlockTimer = null;
    }

    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      unlockTimer = setTimeout(() => {
        document.body.style.overflow = "";
      }, 300);
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (unlockTimer) {
    clearTimeout(unlockTimer);
  }
  document.body.style.overflow = "";
});
</script>

<template>
  <div>
    <UserTrigger :user="userStore.user" @click="panel.toggle" />
    <UserPanelMain :open="panel.isOpen" />
  </div>
</template>
