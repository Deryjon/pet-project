<script setup lang="ts">
import DataTableHeader from "@/components/employees/DataTableHeader.vue";
import DataTableBody from "@/components/employees/DataTableBody.vue";
import DataTablePagination from "@/components/employees/DataTablePagination.vue";

const emit = defineEmits<{
  (e: "create"): void;
}>();
</script>

<template>
  <div class="space-y-4">
    <DataTableHeader @create="emit('create')" />
    <DataTableBody />
    <DataTablePagination />
  </div>
</template>
