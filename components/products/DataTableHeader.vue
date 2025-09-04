<script setup lang="ts">
import { useRouter } from "vue-router";
import { useCatalogDataTableStore } from "@/store/catalogDataTableStore";
import BaseDataTableHeader from "../BaseDataTableHeader.vue";
const store = useCatalogDataTableStore();
const router = useRouter();

// локальный инпут
const globalFilterInput = ref(store.globalFilter);
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

function goToCreate() {
  router.push("/products/create?page=1");
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
    :showSearch="true"
    searchPlaceholder="Артикул, баркод, наименование"
    :showFilters="true"
    :createButton="{ label: 'Создать', to: '/import/create' }"
    @toggleFilters="showFilters = !showFilters"
  />
  <!-- Фильтры блок -->
  <TableFilter v-if="showFilters" />
</template>
