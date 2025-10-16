<script setup lang="ts">
import { useHead } from "#imports";
import EmployeesDataTable from "@/components/EmployeesDataTable.vue";

useHead({ title: "Сотрудники | Konkurent.cases" });
</script>

<template>
  <section class="text-white">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-[28px] font-bold">Сотрудники</h2>
    
    </div>

    <EmployeesDataTable class="mt-4" />
  </section>
</template>

