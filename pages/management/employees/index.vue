<script setup lang="ts">
import { ref } from "vue";
import { useHead } from "#imports";
import EmployeesDataTable from "@/components/EmployeesDataTable.vue";
import EmployeeCreateForm from "@/components/employees/EmployeeCreateForm.vue";
import { useEmployeesDataTableStore } from "@/store/DataTables/employeesDataTableStore";
import { useUserStore } from "@/store/useUserStore";

useHead({ title: "Сотрудники | Konkurent.cases" });

const store = useEmployeesDataTableStore();
const userStore = useUserStore();
const showCreateForm = ref(false);

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

    <EmployeeCreateForm
      v-if="showCreateForm && userStore.isAdmin"
      :showCancel="true"
      @cancel="showCreateForm = false"
      @created="handleCreated"
    />

    <EmployeesDataTable class="mt-4" @create="showCreateForm = true" />
  </section>
</template>
