<script setup lang="ts">
import ReportDataTable from "~/components/reports/ReportDataTable.vue";
import type { SellerReportRow } from "~/composables/useReportsApi";

defineProps<{
  rows: SellerReportRow[];
  loading?: boolean;
}>();

function money(value: unknown) {
  return `${Intl.NumberFormat("ru-RU").format(Math.round(Number(value || 0)))} UZS`;
}

const columns = [
  { key: "name", label: "Продавец" },
  { key: "shop_name", label: "Магазин" },
  { key: "gross_sales", label: "Общие продажи", align: "right", formatter: money },
  { key: "net_gross_sales", label: "Чистая выручка", align: "right", formatter: money },
  { key: "gross_profit", label: "Валовая прибыль", align: "right", formatter: money },
  { key: "products_sold", label: "Продано товаров", align: "right" },
  { key: "transactions_count", label: "Кол-во чеков", align: "right" },
  { key: "average_cheque", label: "Средний чек", align: "right", formatter: money },
  { key: "discount_sum", label: "Сумма скидок", align: "right", formatter: money },
  { key: "discount_percent", label: "% скидки", align: "right", formatter: (value: unknown) => `${Number(value || 0).toFixed(1)}%` },
  { key: "returns_count", label: "Возвраты", align: "right" },
  { key: "average_extra_charge", label: "Средняя наценка", align: "right", formatter: (value: unknown) => `${Number(value || 0).toFixed(1)}%` },
  { key: "kpi_score", label: "KPI score", align: "right", formatter: (value: unknown) => `${Math.round(Number(value || 0))}` },
  { key: "fixed_salary", label: "Фикс", align: "right", formatter: money },
  { key: "salary_percent", label: "Процент", align: "right", formatter: (value: unknown) => `${Number(value || 0).toFixed(1)}%` },
  { key: "bonus_amount", label: "Бонус", align: "right", formatter: money },
  { key: "salary_total", label: "Итоговая зарплата", align: "right", formatter: money },
];
</script>

<template>
  <ReportDataTable
    title="Отчет по продавцам"
    description="KPI, продажи, прибыль и зарплата продавцов."
    :columns="columns"
    :rows="rows"
    :loading="loading"
    row-link-base="/reports/sellers"
    empty-text="Продавцы не найдены"
  />
</template>
