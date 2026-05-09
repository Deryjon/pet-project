<script setup lang="ts">
import { useHead } from "#imports";
import ReportKpiCard from "~/components/reports/ReportKpiCard.vue";
import ReportChartCard from "~/components/reports/ReportChartCard.vue";
import ProductStatsTable from "~/components/reports/ProductStatsTable.vue";
import SellerStatsTable from "~/components/reports/SellerStatsTable.vue";
import { useReportsApi } from "~/composables/useReportsApi";

const route = useRoute();
const reportsApi = useReportsApi();
const loading = ref(false);
const details = ref<any | null>(null);
const shopId = computed(() => String(route.params.id || ""));

useHead(() => ({ title: `${details.value?.name || "Магазин"} | Отчеты | Konkurent` }));

async function loadPage() {
  if (!shopId.value) return;
  loading.value = true;
  try {
    details.value = await reportsApi.getShopDetails(shopId.value);
  } finally {
    loading.value = false;
  }
}

onMounted(loadPage);
watch(shopId, loadPage);
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="rounded-[30px] border border-white/10 bg-[linear-gradient(160deg,rgba(31,120,255,0.18),rgba(15,23,42,0.95))] p-6 shadow-[0_28px_70px_rgba(2,6,23,0.32)]">
      <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#8ec8ff]">Shop Report</p>
      <h1 class="mt-3 text-[32px] font-bold tracking-[-0.05em]">{{ details?.name || "Магазин" }}</h1>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ReportKpiCard
        v-for="kpi in details?.summary?.kpis || []"
        :key="kpi.key"
        :title="kpi.label"
        :value="kpi.formattedValue"
        :tone="kpi.tone"
      />
    </div>

    <div class="grid gap-4 xl:grid-cols-2">
      <ReportChartCard title="Продажи по дням" :points="details?.sales_by_day || []" value-suffix=" UZS" />
      <ReportChartCard title="Прибыль по дням" :points="details?.profit_by_day || []" value-suffix=" UZS" />
    </div>

    <ProductStatsTable :rows="details?.top_products || []" :loading="loading" />
    <SellerStatsTable :rows="details?.sellers || []" :loading="loading" />
    <ProductStatsTable :rows="details?.stock_items || []" :loading="loading" />
  </section>
</template>
