<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useWriteOffDataTableStore } from "@/store/DataTables/writeoffDataTableStore";
import BaseDataTableHeader from "../BaseDataTableHeader.vue";
import TableFilter from "./TableFilter.vue"; // поправь путь если не совпадает

const store = useWriteOffDataTableStore();
const router = useRouter();

// локальный инпут
const globalFilterInput = ref(store.globalFilter);
const showFilters = ref(false);

// синхронизация с стором
watch(globalFilterInput, (val) => {
  store.globalFilter = val;
  store.fetchData({ search: val });
});
</script>

<template>
  <BaseDataTableHeader
    v-model="globalFilterInput"
    :showSearch="true"
    searchPlaceholder="ID, наименование, магазин"
    :showFilters="true"
    :createButton="{ label: 'Новое списание', to: '/inventory/create' }"
    @toggleFilters="showFilters = !showFilters"
  />

  <!-- Фильтры блок -->
  <TableFilter v-if="showFilters" />
</template>~/store/DataTables/inventoryDataTableStore