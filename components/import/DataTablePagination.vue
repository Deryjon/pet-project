<script setup lang="ts">
import StoreDataTablePagination from "@/components/StoreDataTablePagination.vue";
import { useImportDataTableStore } from "@/store/DataTables/importDataTableStore";

const store = useImportDataTableStore();
</script>

<template>
  <StoreDataTablePagination :store="store" />
</template>
