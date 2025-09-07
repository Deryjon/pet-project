<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useSuppliersDataTableStore } from "@/store/DataTables/suppliersDataTableStore";
import BaseDataTableHeader from "../BaseDataTableHeader.vue";
import TableFilter from "./TableFilter.vue"; // поправь путь если не совпадает

const store = useSuppliersDataTableStore();
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
    searchPlaceholder="ID, имя, телефон"
    :showFilters="true"
    :createButton="{ label: 'Новый поставщик', to: '/inventory/create' }"
    @toggleFilters="showFilters = !showFilters"
  />

  <!-- Фильтры блок -->
  <TableFilter v-if="showFilters" />
</template>~/store/DataTables/inventoryDataTableStore