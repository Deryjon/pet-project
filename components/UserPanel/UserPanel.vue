<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { usePanelStore } from "../../store/usePanelStore";
import { useUserStore } from "../../store/useUserStore";
import { useLocationStore } from "../../store/useLocationStore";
import UserTrigger from "./UserTrigger.vue";
import UserPanelMain from "./UserPanelMain.vue";

const panel = usePanelStore();
const userStore = useUserStore();
const locationStore = useLocationStore();

watch(
  () => locationStore.selectedLocation,
  (newLocation) => {
    if (newLocation) {
      // Обработка смены локации (если нужно)
    }
  }
);

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
  () => panel.isOpen,
  (isOpen) => {
    if (isOpen) {
      document.body.classList.add("no-scroll");
    } else {
      setTimeout(() => {
        document.body.classList.remove("no-scroll");
      }, 300);
    }
  }
);

const handleSettings = () => {
  console.log("Settings pressed");
};
</script>

<template>
  <div>
    <UserTrigger :user="userStore.user" @click="panel.toggle" />
    <transition name="slide-main">
      <div v-if="panel.isOpen" ref="panelRef" class="panel-container">
        <UserPanelMain
          :user="userStore.user"
          @settings="handleSettings"
          @close="panel.toggle"
        />
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* slide-main выезд слева */
.slide-main-enter-active,
.slide-main-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-main-enter-from,
.slide-main-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
.slide-main-enter-to,
.slide-main-leave-from {
  transform: translateX(0%);
  opacity: 1;
}

/* Блокировка скролла, если нужно */
.no-scroll {
  overflow: hidden;
}

.panel-container {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 100%;
  max-width: 460px;
  background-color: #2b2b2b;
  color: white;
  padding: 3.5rem 2rem;
  z-index: 50;
  overflow-y: auto;
  border-top-right-radius: 56px;
  border-bottom-right-radius: 56px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
}
</style>
