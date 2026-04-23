<script setup lang="ts">
import { computed } from "vue";
import BaseDataTablePagination from "@/components/BaseDataTablePagination.vue";

const props = defineProps<{
  store: any;
}>();

const currentPage = computed(() => props.store.pagination.pageIndex + 1);
const totalPages = computed(() => props.store.totalPages || 1);

function previousPage() {
  if (props.store.previousPage) {
    props.store.previousPage();
    return;
  }

  props.store.table?.previousPage?.();
}

function nextPage() {
  if (props.store.nextPage) {
    props.store.nextPage();
    return;
  }

  props.store.table?.nextPage?.();
}

function updatePageSize(pageSize: number) {
  if (props.store.setPageSize) {
    props.store.setPageSize(pageSize);
    return;
  }

  props.store.pagination = {
    ...props.store.pagination,
    pageIndex: 0,
    pageSize,
  };
}
</script>

<template>
  <BaseDataTablePagination
    :currentPage="currentPage"
    :totalPages="totalPages"
    :loading="store.loading"
    :pageSize="store.pagination.pageSize"
    @previous="previousPage"
    @next="nextPage"
    @update:pageSize="updatePageSize"
  />
</template>
