<script setup lang="ts">
import DataTableHeader from "@/components/import/DataTableHeader.vue";
import DataTableBody from "@/components/import/DataTableBody.vue";
import DataTablePagination from "@/components/import/DataTablePagination.vue";
import DataTableProductInfo from "@/components/products/DataTableProductInfo.vue";

defineEmits<{
  (e: "create"): void;
}>();
</script>

<template>
  <div class="space-y-4">
    <DataTableHeader @create="$emit('create')" />
    <DataTableBody />
    <DataTablePagination />
    <DataTableProductInfo />
  </div>
</template>
