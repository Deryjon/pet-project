<script setup lang="ts">
import { onMounted } from "vue";
import LayoutSidebar from "../components/Sidebar.vue";
import { useUserStore } from "../store/useUserStore";
import { useSidebarStore } from "../store/useSidebar";

const userStore = useUserStore();
const sidebar = useSidebarStore();

onMounted(() => {
  userStore.init();
});
</script>

<template>
  <section class="app-shell flex">
    <!-- Sidebar -->
    <div
      :class="[
        'fixed left-0 top-0 h-screen app-sidebar pt-5 transition-all duration-400 ease-in-out',
        sidebar.collapsed
          ? 'w-[95px] min-w-[95px] max-w-[95px]'
          : 'w-[256px] min-w-[256px] max-w-[256px]',
      ]"
    >
      <!-- Sidebar content -->
      <LayoutSidebar class="h-full " :collapsed="sidebar.collapsed" />
    </div>

    <!-- Main content -->
    <div
      :class="[
        'app-main-content w-full min-h-screen pt-[30px] px-[35px] transition-all duration-400 ease-in-out text-white',
        sidebar.collapsed ? 'ml-[80px]' : 'ml-[256px]',
      ]"
      style="max-width: 100vw; overflow-x: hidden"
    >
      <slot />
    </div>

    <div
      v-if="userStore.initializing"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div class="h-14 w-14 rounded-full border-4 border-white/30  animate-spin"></div>
    </div>
  </section>
</template>
