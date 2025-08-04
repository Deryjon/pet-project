<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { usePanelStore } from "../../store/usePanelStore";
import { useUserStore } from "../../store/useUserStore"; // 👈
import { useLocationStore } from "../../store/useLocationStore"; // 👈
import UserTrigger from "./UserTrigger.vue";
import UserPanelMain from "./UserPanelMain.vue";
import ConfirmLogout from "./ConfirmLogout.vue";

const panel = usePanelStore();
const userStore = useUserStore(); // 👈
const locationStore = useLocationStore(); // 👈

watch(
  () => locationStore.selectedLocation,
  (newLocation) => {
    if (newLocation) {
      // Например:
      // fetchProductsForLocation(newLocation.id);
      // Или переход на нужный маршрут, или обновить список товаров
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
  userStore.logout(); // 👈
  panel.closeAll();
};

const handleSettings = () => {
  // открой панель или переключись на маршрут
  console.log("Settings pressed");
};
</script>

<template>
  <div>
    <UserTrigger :user="userStore.user" @click="panel.toggle" />
    <transition name="slide">
      <div
        v-if="panel.isOpen || panel.isQuitConfirm"
        ref="panelRef"
        class="panel-container"
      >
        <transition name="slide-quit" mode="out-in">
          <component
            :is="panel.isQuitConfirm ? ConfirmLogout : UserPanelMain"
            :user="userStore.user"
            @logout="panel.openQuit"
            @settings="handleSettings"
            @close="panel.toggle"
            @confirm="handleLogout"
            @cancel="panel.closeQuit"
          />
        </transition>
      </div>
    </transition>
  </div>
</template>
