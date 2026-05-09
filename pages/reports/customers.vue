<script setup lang="ts">
import { useHead } from "#imports";
import ReportFilterBar from "~/components/reports/ReportFilterBar.vue";
import ReportDataTable from "~/components/reports/ReportDataTable.vue";
import { useReportsApi, type ReportFilterQuery } from "~/composables/useReportsApi";

useHead({ title: "Отчет по клиентам | Konkurent" });

const reportsApi = useReportsApi();
const loading = ref(false);
const filters = ref<ReportFilterQuery>({});
const rows = ref<any[]>([]);

const columns = [
  { key: "name", label: "Клиент" },
  { key: "phone", label: "Телефон" },
  { key: "purchases_count", label: "Количество покупок", align: "right" },
  { key: "total_spent", label: "Общая сумма покупок", align: "right", formatter: (value: unknown) => `${Intl.NumberFormat("ru-RU").format(Math.round(Number(value || 0)))} UZS` },
  { key: "average_cheque", label: "Средний чек", align: "right", formatter: (value: unknown) => `${Intl.NumberFormat("ru-RU").format(Math.round(Number(value || 0)))} UZS` },
  { key: "last_purchase_at", label: "Последняя покупка", formatter: (value: unknown) => value ? new Date(String(value)).toLocaleString("ru-RU") : "—" },
  { key: "status", label: "Статус" },
];

async function loadPage() {
  loading.value = true;
  try {
    rows.value = await reportsApi.getCustomers(filters.value);
  } finally {
    loading.value = false;
  }
}

onMounted(loadPage);
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="rounded-[30px] border border-white/10 bg-[linear-gradient(160deg,rgba(31,120,255,0.18),rgba(15,23,42,0.95))] p-6 shadow-[0_28px_70px_rgba(2,6,23,0.32)]">
      <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#8ec8ff]">Reports</p>
      <h1 class="mt-3 text-[32px] font-bold tracking-[-0.05em]">Клиенты</h1>
    </div>

    <ReportFilterBar v-model="filters" :loading="loading" @apply="loadPage" @reset="loadPage" />
    <ReportDataTable
      title="Отчет по клиентам"
      description="Покупки, средний чек и статус клиентской базы."
      :columns="columns"
      :rows="rows"
      :loading="loading"
      empty-text="Клиенты не найдены"
    >
      <template #cell-purchased_products="{ row }">
        <div class="max-w-[320px] truncate">{{ row.purchased_products?.join(", ") || "—" }}</div>
      </template>
    </ReportDataTable>
  </section>
</template>
