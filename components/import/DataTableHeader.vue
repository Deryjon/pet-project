<script setup lang="ts">
import { ref, watch } from "vue";
import { useImportDataTableStore } from "@/store/DataTables/importDataTableStore";
import BaseDataTableHeader from "../BaseDataTableHeader.vue";
import TableFilter from "./TableFilter.vue";

const emit = defineEmits<{
  (e: "create"): void;
}>();

const store = useImportDataTableStore();
const globalFilterInput = ref(store.globalFilter);
const showFilters = ref(false);

watch(globalFilterInput, (val) => {
  store.globalFilter = val;
  store.fetchData();
});
</script>

<template>
  <BaseDataTableHeader
    v-model="globalFilterInput"
    :showSearch="true"
    searchPlaceholder="ID, наименование, магазин"
    :showFilters="true"
    :createButton="{ label: 'Новый импорт', onClick: () => emit('create') }"
    @toggleFilters="showFilters = !showFilters"
  />

  <TableFilter v-if="showFilters" />
</template>
