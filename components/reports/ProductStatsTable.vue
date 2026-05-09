<script setup lang="ts">
import ReportDataTable from "~/components/reports/ReportDataTable.vue";
import type { ProductReportRow } from "~/composables/useReportsApi";

defineProps<{
  rows: ProductReportRow[];
  loading?: boolean;
}>();

function money(value: unknown) {
  return `${Intl.NumberFormat("ru-RU").format(Math.round(Number(value || 0)))} UZS`;
}

const columns = [
  { key: "name", label: "Товар" },
  { key: "sku", label: "Артикул / SKU" },
  { key: "category", label: "Категория" },
  { key: "brand", label: "Бренд" },
  { key: "sold_quantity", label: "Продано количество", align: "right" },
  { key: "gross_revenue", label: "Общая выручка", align: "right", formatter: money },
  { key: "net_revenue", label: "Чистая выручка", align: "right", formatter: money },
  { key: "sold_cost", label: "Себестоимость", align: "right", formatter: money },
  { key: "gross_profit", label: "Валовая прибыль", align: "right", formatter: money },
  { key: "margin_percent", label: "Маржинальность", align: "right", formatter: (value: unknown) => `${Number(value || 0).toFixed(1)}%` },
  { key: "average_discount", label: "Средняя скидка", align: "right", formatter: (value: unknown) => `${Number(value || 0).toFixed(1)}%` },
  { key: "stock_left", label: "Остаток", align: "right" },
  { key: "returns_count", label: "Возвраты", align: "right" },
];
</script>

<template>
  <ReportDataTable
    title="Отчет по товарам"
    description="Продажи, прибыль, скидки и остатки по каждому товару."
    :columns="columns"
    :rows="rows"
    :loading="loading"
    empty-text="Товары не найдены"
  />
</template>
