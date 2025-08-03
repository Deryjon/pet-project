<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { usePanelStore } from "../../store/usePanelStore";
import UserTrigger from "./UserTrigger.vue";
import UserPanelMain from "./UserPanelMain.vue";
import ConfirmLogout from "./ConfirmLogout.vue";

defineProps<{
  user: {
    name: string;
    location: string;
    avatarUrl: string;
  };
}>();

const emit = defineEmits<{
  (e: "logout"): void;
  (e: "settings"): void;
}>();

const panel = usePanelStore();

const panelRef = ref<HTMLElement | null>(null);

const handleClickOutside = (event: MouseEvent) => {
  if (
    panel.isOpen &&
    panelRef.value &&
    !panelRef.value.contains(event.target as Node)
  ) {
    panel.closeAll();
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
watch(
  () => panel.isOpen || panel.isQuitConfirm,
  (isAnyOpen) => {
    if (isAnyOpen) {
      document.body.classList.add("no-scroll");
    } else {
      setTimeout(() => {
        document.body.classList.remove("no-scroll");
      }, 300);
    }
  }
);

const handleLogout = () => {
  emit("logout");
  panel.closeAll();
};
</script>
<template>
  <div>
    <UserTrigger :user="user" @click="panel.toggle" />

    <transition name="slide">
      <div
        v-if="panel.isOpen || panel.isQuitConfirm"
        ref="panelRef"
        class="panel-container"
      >
        <UserPanelMain
          v-if="panel.isOpen"
          :user="user"
          @logout="panel.openQuit"
          @settings="emit('settings')"
          @close="panel.toggle"
        />

        <ConfirmLogout
          v-if="panel.isQuitConfirm"
          @confirm="handleLogout"
          @cancel="panel.closeQuit"
        />
      </div>
    </transition>
    <transition name="slide-quit">
      <div
        v-if="panel.isQuitConfirm"
        ref="panelRef"
        class="panel-container"
      >
        <ConfirmLogout
          v-if="panel.isQuitConfirm"
          @confirm="handleLogout"
          @cancel="panel.closeQuit"
        />
      </div>
    </transition>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
  will-change: transform;
}

.slide-enter-from {
  transform: translateX(-100%);
}
.slide-enter-to {
  transform: translateX(0);
}
.slide-leave-from {
  transform: translateX(0);
}
.slide-leave-to {
  transform: translateX(-100%);
}

.panel-container {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 100%;
  max-width: 460px;
  background-color: #2b2b2b;
  z-index: 50;
  padding: 56px 32px;
  overflow-y: auto;
  border-top-right-radius: 56px;
  border-bottom-right-radius: 56px;
}
</style>
