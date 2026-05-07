<script setup lang="ts">
import DataTableHeader from "@/components/orders/DataTableHeader.vue";
import DataTableBody from "@/components/orders/DataTableBody.vue";
import StoreDataTablePagination from "@/components/StoreDataTablePagination.vue";
import DataTableProductInfo from "@/components/products/DataTableProductInfo.vue";
import { useOrdersDataTableStore } from "@/store/DataTables/ordersDataTableStore";

const store = useOrdersDataTableStore();
</script>

<template>
  <div class="space-y-4">
    <DataTableHeader />
    <DataTableBody />
    <StoreDataTablePagination :store="store" />
    <DataTableProductInfo />
  </div>
</template>
