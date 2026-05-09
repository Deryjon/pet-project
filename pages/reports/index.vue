<script setup lang="ts">
import { useHead } from "#imports";
import ReportFilterBar from "~/components/reports/ReportFilterBar.vue";
import ReportKpiCard from "~/components/reports/ReportKpiCard.vue";
import ReportChartCard from "~/components/reports/ReportChartCard.vue";
import SellerStatsTable from "~/components/reports/SellerStatsTable.vue";
import ProductStatsTable from "~/components/reports/ProductStatsTable.vue";
import { useReportsApi, type ReportFilterQuery, type ReportSummary, type SelectOption } from "~/composables/useReportsApi";

useHead({ title: "Отчеты | Konkurent" });

const reportsApi = useReportsApi();
const loading = ref(false);
const filters = ref<ReportFilterQuery>({});
const summary = ref<ReportSummary | null>(null);
const sellers = ref<any[]>([]);
const products = ref<any[]>([]);
const shops = ref<any[]>([]);

const shopOptions = computed<SelectOption[]>(() => shops.value.map((shop: any) => ({ label: shop.name, value: shop.id })));
const sellerOptions = computed<SelectOption[]>(() => sellers.value.map((seller: any) => ({ label: seller.name, value: seller.id })));
const productOptions = computed<SelectOption[]>(() => products.value.map((product: any) => ({ label: product.name, value: product.id })));

function withCurrency(value: number) {
  return `${Intl.NumberFormat("ru-RU").format(Math.round(value || 0))} UZS`;
}

async function loadPage() {
  loading.value = true;
  try {
    const [summaryData, shopsData, sellersData, productsData] = await Promise.all([
      reportsApi.getSummary(filters.value),
      reportsApi.getShops(filters.value),
      reportsApi.getSellers(filters.value),
      reportsApi.getProducts(filters.value),
    ]);
    summary.value = summaryData;
    shops.value = shopsData;
    sellers.value = sellersData;
    products.value = productsData;
  } finally {
    loading.value = false;
  }
}

onMounted(loadPage);
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(91,180,255,0.18),transparent_36%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.82))] p-6 shadow-[0_28px_70px_rgba(2,6,23,0.35)]">
      <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#8ec8ff]">Reports</p>
      <h1 class="mt-3 text-[32px] font-bold tracking-[-0.05em]">Панель отчетов</h1>
      <p class="mt-3 max-w-3xl text-[15px] leading-7 text-slate-300">
        Общий дашборд бизнеса: продажи, прибыль, скидки, возвраты, товары и KPI продавцов.
      </p>
    </div>

    <ReportFilterBar
      v-model="filters"
      :shops="shopOptions"
      :sellers="sellerOptions"
      :products="productOptions"
      :loading="loading"
      @apply="loadPage"
      @reset="loadPage"
    />

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ReportKpiCard
        v-for="kpi in summary?.kpis || []"
        :key="kpi.key"
        :title="kpi.label"
        :value="kpi.formattedValue"
        :tone="kpi.tone"
      />
    </div>

    <div class="grid gap-4 xl:grid-cols-2">
      <ReportChartCard title="Продажи по дням" description="Динамика выручки за выбранный период." :points="summary?.chart_sales || []" value-suffix=" UZS" />
      <ReportChartCard title="Прибыль по дням" description="Динамика валовой прибыли." :points="summary?.chart_profit || []" value-suffix=" UZS" />
    </div>

    <div class="grid gap-4 xl:grid-cols-2">
      <SellerStatsTable :rows="sellers.slice(0, 8)" :loading="loading" />
      <ProductStatsTable :rows="products.slice(0, 8)" :loading="loading" />
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ReportKpiCard title="Магазинов в выборке" :value="String(shops.length)" hint="Активные филиалы в текущем фильтре" />
      <ReportKpiCard title="Товаров в выборке" :value="String(products.length)" hint="Строки товарного отчета" />
      <ReportKpiCard title="Продавцов в выборке" :value="String(sellers.length)" hint="Строки отчета по продавцам" />
      <ReportKpiCard title="Чистая выручка" :value="withCurrency(summary?.net_gross_sales || 0)" hint="После скидок и корректировок" tone="primary" />
    </div>
  </section>
</template>
