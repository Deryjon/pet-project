<script setup lang="ts">
import { onMounted } from "vue";
import LayoutSidebar from "../components/Sidebar.vue";
import { useUserStore } from "../store/useUserStore";

onMounted(() => {
  const userStore = useUserStore();
  userStore.init();
});
</script>

<template>
  <section class="flex bg-white dark:bg-[#404040]">
    <!-- Sidebar -->
    <div
      class="fixed left-0 top-0 h-screen w-[256px] min-w-[256px] max-w-[256px] border-r bg-white dark:bg-[#404040] py-5"
    >
      <LayoutSidebar class="h-full" />
    </div>

    <!-- Main content -->
    <div
      class="bg-white dark:bg-[#262626] w-full min-h-screen py-[20px] px-[15px] md:p-[40px] ml-[256px]"
    >
      <slot />
    </div>
  </section>
</template>
