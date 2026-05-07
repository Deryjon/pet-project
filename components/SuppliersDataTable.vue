<script setup lang="ts">
import DataTableHeader from "@/components/suppliers/DataTableHeader.vue";
import DataTableBody from "@/components/suppliers/DataTableBody.vue";
import StoreDataTablePagination from "@/components/StoreDataTablePagination.vue";
import DataTableProductInfo from "@/components/products/DataTableProductInfo.vue";
import { useSuppliersDataTableStore } from "@/store/DataTables/suppliersDataTableStore";

const store = useSuppliersDataTableStore();
</script>

<template>
  <div class="space-y-4">
    <DataTableHeader />
    <DataTableBody />
    <StoreDataTablePagination :store="store" />
    <DataTableProductInfo />
  </div>
</template>
