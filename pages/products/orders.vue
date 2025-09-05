<template>
    <section class="catalog">
      <div class="top flex justify-between">
        <h2 class="text-[36px] font-bold text-white">Заказы</h2>
      </div>
      <DataTable class="mt-[40px]" />
    </section>
  </template>
  
  <script setup lang="ts">
  import { useHead } from "#imports";
  import DataTable from "../../components/OrderDataTable.vue";
  useHead({
    title: "Заказы | Konkurent.cases",
  });
  </script>
  
  <style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  </style>