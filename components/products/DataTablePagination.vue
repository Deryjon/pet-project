<script setup lang="ts">
import StoreDataTablePagination from "@/components/StoreDataTablePagination.vue";
import { useCatalogDataTableStore } from "@/store/DataTables/catalogDataTableStore";

const store = useCatalogDataTableStore();
</script>

<template>
  <StoreDataTablePagination :store="store" />
</template>
