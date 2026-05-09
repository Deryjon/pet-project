<script setup lang="ts">
import ReportDataTable from "~/components/reports/ReportDataTable.vue";
import type { ShopReportRow } from "~/composables/useReportsApi";

defineProps<{
  rows: ShopReportRow[];
  loading?: boolean;
}>();

function money(value: unknown) {
  return `${Intl.NumberFormat("ru-RU").format(Math.round(Number(value || 0)))} UZS`;
}

const columns = [
  { key: "name", label: "Магазин" },
  { key: "gross_sales", label: "Общие продажи", align: "right", formatter: money },
  { key: "net_gross_sales", label: "Чистая выручка", align: "right", formatter: money },
  { key: "gross_profit", label: "Валовая прибыль", align: "right", formatter: money },
  { key: "discount_sum", label: "Сумма скидок", align: "right", formatter: money },
  { key: "discount_percent", label: "% скидки", align: "right", formatter: (value: unknown) => `${Number(value || 0).toFixed(1)}%` },
  { key: "average_cheque", label: "Средний чек", align: "right", formatter: money },
  { key: "products_sold", label: "Продано товаров", align: "right" },
  { key: "transactions_count", label: "Кол-во чеков", align: "right" },
  { key: "returns_count", label: "Возвраты", align: "right" },
  { key: "average_extra_charge", label: "Средняя наценка", align: "right", formatter: (value: unknown) => `${Number(value || 0).toFixed(1)}%` },
];
</script>

<template>
  <ReportDataTable
    title="Отчет по магазинам"
    description="Сводная статистика по филиалам компании."
    :columns="columns"
    :rows="rows"
    :loading="loading"
    row-link-base="/reports/shops"
    empty-text="Магазины не найдены"
  />
</template>
