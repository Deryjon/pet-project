<script setup lang="ts">
import { computed, ref } from "vue";
import { useHead } from "#imports";
import EmployeesDataTable from "@/components/EmployeesDataTable.vue";
import EmployeeCreateForm from "@/components/employees/EmployeeCreateForm.vue";
import { useEmployeesDataTableStore } from "@/store/DataTables/employeesDataTableStore";

useHead({ title: "Сотрудники | Konkurent" });

const store = useEmployeesDataTableStore();
const { can } = useAccessControl();
const showCreateForm = ref(false);
const activeEmployeeTab = computed({
  get: () => store.employeeStatusFilter,
  set: (value: "current" | "deleted" | "blocked") => {
    store.employeeStatusFilter = value;
  },
});

const employeeTabs: Array<{ value: "current" | "deleted" | "blocked"; label: string }> = [
  { value: "current", label: "Текущие сотрудники" },
  { value: "deleted", label: "Удаленные сотрудники" },
  { value: "blocked", label: "Заблокированные сотрудники" },
];

const employeeTabCounts = computed<Record<string, number>>(() => ({
  current: store.employeeStatusCounts.current,
  deleted: store.employeeStatusCounts.deleted,
  blocked: store.employeeStatusCounts.blocked,
}));

async function handleCreated() {
  showCreateForm.value = false;
  await store.fetchData();
}
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-[28px] font-bold">Сотрудники</h2>
    </div>

    <div class="flex flex-wrap gap-2 rounded-lg bg-[#262626] p-1">
      <button
        v-for="tab in employeeTabs"
        :key="tab.value"
        type="button"
        :class="[
          'rounded-full px-4 py-2 text-md font-medium transition',
          activeEmployeeTab === tab.value
            ? 'bg-[#404040] text-white shadow-sm'
            : 'text-[#bdbdbd] hover:bg-[#333333] hover:text-white',
        ]"
        @click="activeEmployeeTab = tab.value"
      >
        {{ tab.label }}
        <span
          class="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-white/10 px-2 py-0.5 text-xs"
        >
          {{ employeeTabCounts[tab.value] ?? 0 }}
        </span>
      </button>
    </div>

    <EmployeeCreateForm
      v-if="showCreateForm && can('employee-create')"
      :showCancel="true"
      @cancel="showCreateForm = false"
      @created="handleCreated"
    />

    <EmployeesDataTable class="mt-4" @create="showCreateForm = true" />
  </section>
</template>
