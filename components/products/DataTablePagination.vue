<script setup lang="ts">
import { computed } from "vue";
import BaseDataTablePagination from "@/components/BaseDataTablePagination.vue";
import { useCatalogDataTableStore } from "@/store/DataTables/catalogDataTableStore";

const store = useCatalogDataTableStore();
const currentPage = computed(() => store.pagination.pageIndex + 1);
const totalPages = computed(() => store.totalPages);
</script>

<template>
  <BaseDataTablePagination
    :currentPage="currentPage"
    :totalPages="totalPages"
    :loading="store.loading"
    @previous="store.previousPage()"
    @next="store.nextPage()"
  />
</template>
