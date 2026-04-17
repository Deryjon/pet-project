<script setup lang="ts">
import { computed } from "vue";
import BaseDataTablePagination from "@/components/BaseDataTablePagination.vue";
import { useEmployeesDataTableStore } from "@/store/DataTables/employeesDataTableStore";

const store = useEmployeesDataTableStore();

const currentPage = computed(() => store.pagination.pageIndex + 1);
</script>

<template>
  <BaseDataTablePagination
    :currentPage="currentPage"
    :totalPages="store.totalPages"
    :loading="store.loading"
    @previous="store.previousPage()"
    @next="store.nextPage()"
  />
</template>
