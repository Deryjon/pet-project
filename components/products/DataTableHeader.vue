<script setup lang="ts">
import { useRouter } from "vue-router";
import { useCatalogDataTableStore } from "@/store/catalogDataTableStore";
import BaseDataTableHeader from "../BaseDataTableHeader.vue";
const store = useCatalogDataTableStore();
const router = useRouter();

// локальный инпут
const globalFilterInput = ref(store.globalFilter);
const selectedFilter = ref("all");
const showFilters = ref(false);

function goToActions() {
  if (store.selectedProducts.length === 0) {
    alert("Выберите хотя бы один товар");
    return;
  }

  router.push({
    path: "/products/settings",
    query: { ids: store.selectedProducts.join(",") },
  });
}

// синхронизация с стором
watch(globalFilterInput, (val) => {
  store.globalFilter = val;
  store.fetchData({ search: val }); // если хочешь передавать параметр поиска
});
</script>

<template>
<BaseDataTableHeader
  v-model="globalFilterInput"
  v-model:activeFilter="selectedFilter"
  :showSearch="true"
  searchPlaceholder="Артикул, баркод, наименование"
  :showFilters="true"
  :createButton="{ label: 'Создать', to: '/products/create?page=1' }"
  @toggleFilters="showFilters = !showFilters"
  :actionButtons="[{ label: 'Действия', onClick: goToActions }]"
  :statFilters="[
    { key: 'all', label: 'Все', count: 126 },
    { key: 'active', label: 'Активные', count: 87 },
    { key: 'inactive', label: 'Неактивные', count: 12 },
    { key: 'low', label: 'Малый остаток', count: 18 },
    { key: 'zero', label: 'Нулевой остаток', count: 8 }
  ]"
/>

<TableFilter v-if="showFilters" />

</template>
