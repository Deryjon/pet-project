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

watch(globalFilterInput, (value) => {
  store.globalFilter = value;
  store.fetchData();
});
</script>

<template>
  <BaseDataTableHeader
    v-model="globalFilterInput"
    :showSearch="true"
    searchPlaceholder="ID, наименование, магазин"
    :showFilters="true"
    :filtersOpen="showFilters"
    :createButton="{ label: 'Новый импорт', onClick: () => emit('create') }"
    @toggleFilters="showFilters = !showFilters"
  />

  <TableFilter v-if="showFilters" />
</template>
