<script setup lang="ts">
import DataTableHeader from "@/components/orders/DataTableHeader.vue";
import DataTableBody from "@/components/orders/DataTableBody.vue";
import DataTablePagination from "@/components/products/DataTablePagination.vue";
import DataTableProductInfo from "@/components/products/DataTableProductInfo.vue";

</script>

<template>
  <div class="space-y-4">
    <DataTableHeader />
    <DataTableBody />
    <DataTablePagination />
    <DataTableProductInfo />
  </div>
</template>
