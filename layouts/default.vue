<script setup lang="ts">
import { onMounted } from "vue";
import LayoutSidebar from "../components/Sidebar.vue";
import { useUserStore } from "../store/useUserStore";
import { useSidebarStore } from "../store/useSidebar";

const sidebar = useSidebarStore();

onMounted(() => {
  const userStore = useUserStore();
  userStore.init();
});
</script>

<template>
  <section class="flex bg-white dark:bg-[#404040]">
    <!-- Sidebar -->
    <div
      :class="[
        'fixed left-0 top-0 h-screen border-r bg-white dark:bg-[#404040] py-5 transition-all duration-300',
        sidebar.collapsed
          ? 'w-[80px] min-w-[80px] max-w-[80px]'
          : 'w-[256px] min-w-[256px] max-w-[256px]',
      ]"
    >
      <!-- Sidebar content -->
      <LayoutSidebar class="h-full" :collapsed="sidebar.collapsed" />
    </div>

    <!-- Main content -->
    <div
      :class="[
        'bg-white dark:bg-[#262626] w-full min-h-screen pt-[30px] px-[35px]  transition-all duration-300',
        sidebar.collapsed ? 'ml-[80px]' : 'ml-[256px]',
      ]"
      style="max-width: 100vw; overflow-x: hidden"
    >
      <slot />
    </div>
  </section>
</template>
