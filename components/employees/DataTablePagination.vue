<script setup lang="ts">
import StoreDataTablePagination from "@/components/StoreDataTablePagination.vue";
import { useEmployeesDataTableStore } from "@/store/DataTables/employeesDataTableStore";

const store = useEmployeesDataTableStore();
</script>

<template>
  <StoreDataTablePagination :store="store" />
</template>
