<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useCatalogDataTableStore } from "@/store/DataTables/catalogDataTableStore";
import BaseDataTableHeader from "../BaseDataTableHeader.vue";

const store = useCatalogDataTableStore();
const router = useRouter();

const globalFilterInput = ref(store.globalFilter);
const selectedFilter = computed({
  get: () => store.activeStatusFilter,
  set: (value: string) => {
    store.activeStatusFilter = value;
  },
});
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

watch(globalFilterInput, (val) => {
  store.globalFilter = val;
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
    :statFilters="store.statusFilters"
  />

  <TableFilter v-if="showFilters" />
</template>
