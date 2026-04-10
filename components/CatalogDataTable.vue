<script setup lang="ts">
import UniversalDataTable from "@/components/UniversalDataTable.vue";
import DataTableHeader from "@/components/products/DataTableHeader.vue";
import DataTableBody from "@/components/products/DataTableBody.vue";
import DataTablePagination from "@/components/products/DataTablePagination.vue";
import DataTableProductInfo from "@/components/products/DataTableProductInfo.vue";
</script>

<template>
  <UniversalDataTable>
    <template #header>
      <DataTableHeader />
    </template>

    <DataTableBody />

    <template #pagination>
      <DataTablePagination />
    </template>

    <template #details>
      <DataTableProductInfo />
    </template>
  </UniversalDataTable>
</template>
