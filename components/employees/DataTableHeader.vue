<script setup lang="ts">
import { ref, watch } from "vue";
import BaseDataTableHeader from "@/components/BaseDataTableHeader.vue";
import { useEmployeesDataTableStore } from "@/store/DataTables/employeesDataTableStore";

const store = useEmployeesDataTableStore();
const globalFilterInput = ref(store.globalFilter);
const selectedFilter = ref("all");
const showFilters = ref(false);

watch(globalFilterInput, (val) => {
  store.globalFilter = val;
});
</script>

<template>
  <BaseDataTableHeader
    v-model="globalFilterInput"
    v-model:activeFilter="selectedFilter"
    :showSearch="true"
    searchPlaceholder="Поиск сотрудника..."
    :showFilters="false"
    :createButton="{ label: 'Новый сотрудник', to: '/management/create-employees' }"
    @toggleFilters="showFilters = !showFilters"
  />
</template>

