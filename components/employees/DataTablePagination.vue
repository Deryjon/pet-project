<script setup lang="ts">
import { computed } from "vue";
import BaseDataTablePagination from "@/components/BaseDataTablePagination.vue";
import { useEmployeesDataTableStore } from "@/store/DataTables/employeesDataTableStore";

const store = useEmployeesDataTableStore();

const currentPage = computed(() => store.pagination.pageIndex + 1);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(store.filteredData.length / store.pagination.pageSize)),
);
</script>

<template>
  <BaseDataTablePagination
    :currentPage="currentPage"
    :totalPages="totalPages"
    @previous="store.previousPage()"
    @next="store.nextPage()"
  />
</template>
