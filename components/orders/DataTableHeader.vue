<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useOrdersDataTableStore } from "@/store/ordersDataTableStore";
import BaseDataTableHeader from "../BaseDataTableHeader.vue";
import TableFilter from "./TableFilter.vue"; // поправь путь если не совпадает

const store = useOrdersDataTableStore();
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
    searchPlaceholder="ID, наименование поставщика"
    :showFilters="true"
    :createButton="{ label: 'Новый заказ', to: '/orders/create' }"
    @toggleFilters="showFilters = !showFilters"
    :statFilters="[
      { key: 'all', label: 'Все', count: 0 },
      { key: 'notPaid', label: 'Неоплаченные', count: 1 },
      { key: 'partiallyPaid', label: 'Частично оплаченные', count: 0 },
      { key: 'paid', label: 'Оплаченные', count: 0 },
    ]"
  />

  <!-- Фильтры блок -->
  <TableFilter v-if="showFilters" />
</template>
