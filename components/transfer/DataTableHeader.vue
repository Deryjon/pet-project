<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useTransferDataTableStore } from "@/store/DataTables/transferDataTableStore";
import BaseDataTableHeader from "../BaseDataTableHeader.vue";
import TableFilter from "./TableFilter.vue";

const store = useTransferDataTableStore();
const router = useRouter();

// локальный инпут
const globalFilterInput = ref(store.globalFilter);
const showFilters = ref(false);

// синхронизация с стором
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
    :createButton="{ label: 'Новый трансфер', to: '/inventory/create' }"
    @toggleFilters="showFilters = !showFilters"
  />

  <!-- Фильтры блок -->
  <TableFilter v-if="showFilters" />
</template>~/store/DataTables/inventoryDataTableStore
