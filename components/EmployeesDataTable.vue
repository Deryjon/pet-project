<script setup lang="ts">
import { computed } from "vue";
import DataTable from "@/components/DataTable.vue";
import DataTableHeader from "@/components/employees/DataTableHeader.vue";
import DataTableBody from "@/components/employees/DataTableBody.vue";
import DataTablePagination from "@/components/employees/DataTablePagination.vue";
import { useEmployeesDataTableStore } from "@/store/DataTables/employeesDataTableStore";

const emit = defineEmits<{
  (e: "create"): void;
}>();

const store = useEmployeesDataTableStore();

const actionConfirmOpen = computed({
  get: () => Boolean(store.employeeActionConfirm),
  set: (open: boolean) => {
    if (!open) {
      store.closeEmployeeActionConfirm();
    }
  },
});

const confirmButtonClass = computed(() => {
  if (store.employeeActionConfirm?.tone === "danger") {
    return "rounded-[16px] bg-red-600 px-5 py-3 text-white hover:bg-red-700";
  }

  if (store.employeeActionConfirm?.tone === "warning") {
    return "rounded-[16px] bg-amber-500 px-5 py-3 text-black hover:bg-amber-400";
  }

  return "rounded-[16px] bg-emerald-600 px-5 py-3 text-white hover:bg-emerald-500";
});
</script>

<template>
  <div>
    <DataTable>
      <template #header>
        <DataTableHeader @create="emit('create')" />
      </template>

      <DataTableBody />

      <template #pagination>
        <DataTablePagination />
      </template>
    </DataTable>

    <UModal
      v-model:open="actionConfirmOpen"
      :ui="{
        overlay: 'bg-black/50 backdrop-blur-sm',
        content: 'mx-4 max-w-[520px] rounded-[28px] border border-white/10 bg-[#262626] p-0 text-white shadow-2xl ring-0 sm:mx-0',
      }"
    >
      <template #content>
        <div class="p-6 sm:p-8">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-[22px] font-bold sm:text-[24px]">
                {{ store.employeeActionConfirm?.title }}
              </h3>
              <p class="mt-3 text-[15px] leading-6 text-[#d1d5db] sm:text-[16px]">
                {{ store.employeeActionConfirm?.description }}
              </p>
            </div>

            <UButton
              color="neutral"
              variant="ghost"
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#404040] p-0 text-white hover:bg-[#505050]"
              :disabled="store.employeeActionSubmitting"
              @click="store.closeEmployeeActionConfirm"
            >
              <Icon name="heroicons:x-mark" class="h-5 w-5" />
            </UButton>
          </div>

          <div class="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <UButton
              color="neutral"
              variant="soft"
              class="justify-center rounded-[16px] bg-[#404040] px-5 py-3 text-white hover:bg-[#505050]"
              :disabled="store.employeeActionSubmitting"
              @click="store.closeEmployeeActionConfirm"
            >
              Отмена
            </UButton>
            <UButton
              color="primary"
              variant="solid"
              class="justify-center"
              :class="confirmButtonClass"
              :loading="store.employeeActionSubmitting"
              @click="store.confirmEmployeeAction"
            >
              {{ store.employeeActionConfirm?.confirmLabel || "Подтвердить" }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
