<script setup lang="ts">
import { ref } from "vue";
import LayoutSidebar from "../components/Sidebar.vue";
</script>

<template>
  <section class="flex bg-white dark:bg-[#404040] text-black">
    <!-- Sidebar wrapper -->
    <div
      class="w-[256px] min-w-[256px] max-w-[256px] border-r transition-all duration-300"
    >
      <LayoutSidebar
        class="sticky top-[20px] py-5 transition-all duration-300"
      />
    </div>
    <!-- Main content -->
    <div
      class="bg-white dark:bg-[#262626] w-full min-h-[100vh] py-[20px] px-[15px] md:p-[40px]"
    >
      <slot />
    </div>
  </section>
</template>
