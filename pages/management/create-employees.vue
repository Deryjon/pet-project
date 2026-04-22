<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useHead, navigateTo } from "#imports";
import EmployeeCreateForm from "@/components/employees/EmployeeCreateForm.vue";

useHead({ title: "Создать сотрудника | Konkurent" });

const router = useRouter();
const { can } = useAccessControl();

onMounted(async () => {
  if (!can("employee-create")) {
    await navigateTo("/management/employees");
  }
});

function handleCreated() {
  router.push("/management/employees");
}
</script>

<template>
  <section class="w-full max-w-[720px] text-white">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-2xl font-bold">Создать сотрудника</h2>
      <NuxtLink to="/management/employees" class="text-blue-400 hover:underline">
        К списку сотрудников
      </NuxtLink>
    </div>

    <EmployeeCreateForm
      v-if="can('employee-create')"
      :showCancel="true"
      @cancel="router.push('/management/employees')"
      @created="handleCreated"
    />
  </section>
</template>
