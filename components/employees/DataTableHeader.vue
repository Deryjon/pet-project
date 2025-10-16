<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import BaseDataTableHeader from "@/components/BaseDataTableHeader.vue";
import { useEmployeesDataTableStore } from "@/store/DataTables/employeesDataTableStore";

const store = useEmployeesDataTableStore();
const globalFilterInput = ref(store.globalFilter);
const selectedFilter = ref("all");
const showFilters = ref(false);
const router = useRouter();

watch(globalFilterInput, (val) => {
  store.globalFilter = val;
});

function handleCreateOrEdit() {
  const selected = store.table?.getSelectedRowModel?.().rows ?? [];
  if (selected.length > 0) {
    const row = selected[0];
    const rid = row?.original?.id ?? row?.original?._original?.id ?? row?.id;
    if (rid) {
      router.push(`/management/employees/${encodeURIComponent(String(rid))}`);
      return;
    }
  }
  router.push('/management/create-employees');
}
</script>

<template>
  <BaseDataTableHeader
    v-model="globalFilterInput"
    v-model:activeFilter="selectedFilter"
    :showSearch="true"
    searchPlaceholder="Поиск сотрудников..."
    :showFilters="false"
    :createButton="{ label: 'Новый сотрудник', onClick: handleCreateOrEdit }"
    @toggleFilters="showFilters = !showFilters"
  />
</template>
