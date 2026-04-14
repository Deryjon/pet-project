<script setup lang="ts">
import DataTable from "@/components/DataTable.vue";
import DataTableHeader from "@/components/employees/DataTableHeader.vue";
import DataTableBody from "@/components/employees/DataTableBody.vue";
import DataTablePagination from "@/components/employees/DataTablePagination.vue";

const emit = defineEmits<{
  (e: "create"): void;
}>();
</script>

<template>
  <DataTable>
    <template #header>
      <DataTableHeader @create="emit('create')" />
    </template>

    <DataTableBody />

    <template #pagination>
      <DataTablePagination />
    </template>
  </DataTable>
</template>
