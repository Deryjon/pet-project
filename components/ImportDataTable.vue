<script setup lang="ts">
import DataTableHeader from "@/components/products/DataTableHeader.vue"
import DataTableBody from "@/components/import/DataTableBody.vue"
import DataTablePagination from "@/components/products/DataTablePagination.vue"
import DataTableProductInfo from "@/components/products/DataTableProductInfo.vue"
import { useCatalogDataTableStore } from "@/store/catalogDataTableStore"

const store = useCatalogDataTableStore()
</script>

<template>
  <div class="space-y-4">
    <DataTableHeader />
    <DataTableBody />
    <DataTablePagination />
    <DataTableProductInfo />
  </div>
</template>
