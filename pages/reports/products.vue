<script setup lang="ts">
import { useHead } from "#imports";
import ReportFilterBar from "~/components/reports/ReportFilterBar.vue";
import ReportKpiCard from "~/components/reports/ReportKpiCard.vue";
import ProductStatsTable from "~/components/reports/ProductStatsTable.vue";
import { useReportsApi, type ReportFilterQuery, type SelectOption } from "~/composables/useReportsApi";

useHead({ title: "Отчет по товарам | Konkurent" });

const reportsApi = useReportsApi();
const loading = ref(false);
const filters = ref<ReportFilterQuery>({});
const rows = ref<any[]>([]);

const productOptions = computed<SelectOption[]>(() => rows.value.map((product: any) => ({ label: product.name, value: product.id })));

const topSelling = computed(() => [...rows.value].sort((a, b) => b.sold_quantity - a.sold_quantity).slice(0, 5));
const topProfit = computed(() => [...rows.value].sort((a, b) => b.gross_profit - a.gross_profit).slice(0, 5));
const lowMargin = computed(() => [...rows.value].sort((a, b) => a.margin_percent - b.margin_percent).slice(0, 5));
const highDiscount = computed(() => [...rows.value].sort((a, b) => b.average_discount - a.average_discount).slice(0, 5));
const lowStock = computed(() => [...rows.value].sort((a, b) => a.stock_left - b.stock_left).slice(0, 5));

async function loadPage() {
  loading.value = true;
  try {
    rows.value = await reportsApi.getProducts(filters.value);
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
      <h1 class="mt-3 text-[32px] font-bold tracking-[-0.05em]">Товары</h1>
    </div>

    <ReportFilterBar v-model="filters" :products="productOptions" :loading="loading" @apply="loadPage" @reset="loadPage" />

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <ReportKpiCard title="Топ продаваемые" :value="topSelling[0]?.name || '—'" :hint="`Количество: ${topSelling[0]?.sold_quantity || 0}`" tone="primary" />
      <ReportKpiCard title="Самые прибыльные" :value="topProfit[0]?.name || '—'" :hint="`Прибыль: ${Intl.NumberFormat('ru-RU').format(Math.round(topProfit[0]?.gross_profit || 0))} UZS`" tone="success" />
      <ReportKpiCard title="Низкая маржа" :value="lowMargin[0]?.name || '—'" :hint="`${Number(lowMargin[0]?.margin_percent || 0).toFixed(1)}%`" tone="warning" />
      <ReportKpiCard title="Большие скидки" :value="highDiscount[0]?.name || '—'" :hint="`${Number(highDiscount[0]?.average_discount || 0).toFixed(1)}%`" tone="warning" />
      <ReportKpiCard title="Низкий остаток" :value="lowStock[0]?.name || '—'" :hint="`Остаток: ${lowStock[0]?.stock_left || 0}`" tone="danger" />
    </div>

    <ProductStatsTable :rows="rows" :loading="loading" />
  </section>
</template>
