<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import BaseDataTableHeader from "@/components/BaseDataTableHeader.vue";
import { useEmployeesDataTableStore } from "@/store/DataTables/employeesDataTableStore";

const emit = defineEmits<{
  (e: "create"): void;
}>();

const store = useEmployeesDataTableStore();
const globalFilterInput = ref(store.globalFilter);
const selectedFilter = ref("all");
const showFilters = ref(false);
const router = useRouter();

watch(globalFilterInput, (val) => {
  store.globalFilter = val;
});

function handleCreateOrEdit() {
  if (!store.canCreateEmployees && !store.canEditEmployees) {
    return;
  }

  const selected = store.table?.getSelectedRowModel?.().rows ?? [];
  if (selected.length > 0) {
    const row = selected[0];
    const rid = row?.original?.id ?? row?.original?._original?.id ?? row?.id;
    if (rid) {
      if (!store.canEditEmployees) return;
      router.push(`/management/employees/${encodeURIComponent(String(rid))}`);
      return;
    }
  }

  emit("create");
}
</script>

<template>
  <BaseDataTableHeader
    v-model="globalFilterInput"
    v-model:activeFilter="selectedFilter"
    :showSearch="true"
    searchPlaceholder="Поиск сотрудников..."
    :showFilters="false"
    :createButton="
      store.canCreateEmployees || store.canEditEmployees
        ? { label: 'Новый сотрудник', onClick: handleCreateOrEdit }
        : undefined
    "
    @toggleFilters="showFilters = !showFilters"
  />
</template>
