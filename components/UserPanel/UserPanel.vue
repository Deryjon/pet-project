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

    <!-- Общая панель (выезжает слева) -->
    <transition name="slide">
      <div
        v-if="panel.isOpen || panel.isQuitConfirm"
        ref="panelRef"
        class="panel-container"
      >
        <transition name="slide-quit" mode="out-in">
          <component
            :is="panel.isQuitConfirm ? ConfirmLogout : UserPanelMain"
            :user="user"
            @logout="panel.openQuit"
            @settings="emit('settings')"
            @close="panel.toggle"
            @confirm="handleLogout"
            @cancel="panel.closeQuit"
          />
        </transition>
      </div>
    </transition>
  </div>
</template>



<style scoped>
/* Вся панель выезжает слева */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
.slide-enter-to,
.slide-leave-from {
  transform: translateX(0%);
}

/* Внутренний контент также въезжает слева */
.slide-quit-enter-active,
.slide-quit-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
  position: absolute;
  width: 100%;
}
.slide-quit-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}
.slide-quit-enter-to {
  transform: translateX(0%);
  opacity: 1;
}
.slide-quit-leave-from {
  transform: translateX(0%);
  opacity: 1;
}
.slide-quit-leave-to {
  transform: translateX(-100%);
  opacity: 0;
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
  overflow-x: hidden;
}


</style>
