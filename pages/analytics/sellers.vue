<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useHead } from "#imports";
import ReportKpiCard from "~/components/reports/ReportKpiCard.vue";
import ReportDataTable from "~/components/reports/ReportDataTable.vue";
import {
  useReportsApi,
  type ReportFilterQuery,
  type GeneralSellerReportResult,
} from "~/composables/useReportsApi";
import { useUserStore } from "~/store/useUserStore";

useHead({ title: "Аналитика продавцов | Konkurent" });

const reportsApi = useReportsApi();
const userStore = useUserStore();

const loading = ref(false);
const initialized = ref(false);
const errorMessage = ref("");

const dateRange = ref({ from: formatDateInput(new Date()), to: formatDateInput(new Date()) });
const selectedBranch = ref("all");

const sellerData = ref<GeneralSellerReportResult | null>(null);

const shopOptions = computed(() =>
  (userStore.userState.shops || []).length
    ? (userStore.userState.shops || []).map((shop: any) => ({
        value: String(shop.id),
        label: shop.name,
      }))
    : userStore.userState.currentShopId
      ? [{ value: String(userStore.userState.currentShopId), label: userStore.userState.currentShopName || userStore.userState.currentShopId }]
      : [],
);

const selectedShopIds = computed(() =>
  selectedBranch.value === "all"
    ? shopOptions.value.map((s) => s.value)
    : [selectedBranch.value],
);

const allSellers = computed(() => sellerData.value?.top_sellers || []);

const kpiCards = computed(() => {
  const sellers = allSellers.value;
  if (!sellers.length) return [];
  const totalSales = sellers.reduce((sum, s) => sum + toNumber(s.net_sales), 0);
  const totalCheque = sellers.reduce((sum, s) => sum + toNumber(s.average_cheque), 0);
  const avgCheque = sellers.length ? totalCheque / sellers.length : 0;
  const topSeller = sellers.reduce((best, s) => (toNumber(s.net_sales) > toNumber(best.net_sales) ? s : best), sellers[0]);
  return [
    { title: "Всего продавцов", value: formatCount(sellers.length), tone: "primary" as const },
    { title: "Лучший продавец", value: topSeller?.name || "-", hint: formatMoney(topSeller?.net_sales), tone: "success" as const },
    { title: "Общие продажи", value: formatMoney(totalSales), tone: "neutral" as const },
    { title: "Средний чек", value: formatMoney(avgCheque), tone: "neutral" as const },
  ];
});

const chartSellers = computed(() => allSellers.value.slice(0, 10));
const chartMax = computed(() => Math.max(1, ...chartSellers.value.map((s) => toNumber(s.net_sales))));

const tableColumns = [
  { key: "name", label: "Продавец" },
  { key: "net_sales", label: "Чистые продажи", align: "right", formatter: (v: unknown) => formatMoney(v) },
  { key: "net_profit", label: "Чистая прибыль", align: "right", formatter: (v: unknown) => formatMoney(v) },
  { key: "total_sold_measurement_value", label: "Продано (ед.)", align: "right", formatter: (v: unknown) => formatCount(v) },
  { key: "average_cheque", label: "Средний чек", align: "right", formatter: (v: unknown) => formatMoney(v) },
] as const;

const tableRows = computed(() => allSellers.value);

watch(
  shopOptions,
  (opts) => {
    if (!initialized.value && opts.length) {
      initialized.value = true;
      void loadData();
    }
  },
  { immediate: true },
);

function buildBaseQuery(): ReportFilterQuery {
  return {
    startDate: dateRange.value.from,
    endDate: dateRange.value.to,
    shopIds: selectedShopIds.value,
    plotShopIds: selectedShopIds.value,
    currency: "UZS",
    groupBy: "day",
    detalization: "day",
    priceType: 0,
  };
}

async function loadData() {
  if (!selectedShopIds.value.length) {
    errorMessage.value = "Выберите хотя бы один магазин.";
    return;
  }
  loading.value = true;
  errorMessage.value = "";
  try {
    sellerData.value = await reportsApi.getGeneralSellerReport(buildBaseQuery());
  } catch {
    errorMessage.value = "Не удалось загрузить данные.";
  } finally {
    loading.value = false;
  }
}

function toNumber(v: unknown) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function formatMoney(v: unknown) { return `${Intl.NumberFormat("ru-RU").format(Math.round(toNumber(v)))} UZS`; }
function formatCount(v: unknown) { return Intl.NumberFormat("ru-RU").format(Math.round(toNumber(v))); }
function formatPercent(v: unknown) { return `${toNumber(v).toFixed(1)}%`; }
function formatDateInput(d: Date) { return d.toISOString().slice(0, 10); }
</script>

<template>
  <section class="space-y-6 text-white">
    <!-- Header -->
    <div class="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88))] p-6 shadow-[0_24px_60px_rgba(2,6,23,0.28)]">
      <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-violet-300">Аналитика</p>
      <h1 class="mt-3 text-[30px] font-bold tracking-[-0.04em] text-white">Продавцы</h1>
      <p class="mt-3 max-w-3xl text-[15px] leading-7 text-slate-300">
        Аналитика эффективности продавцов: рейтинг, продажи и персональные результаты.
      </p>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2">
        <input type="date" v-model="dateRange.from" class="rounded-[14px] bg-[#303030] border border-white/10 text-white px-4 py-3 text-[14px]" />
        <span class="text-[#9a9a9a]">&mdash;</span>
        <input type="date" v-model="dateRange.to" class="rounded-[14px] bg-[#303030] border border-white/10 text-white px-4 py-3 text-[14px]" />
      </div>
      <select v-model="selectedBranch" class="rounded-[14px] bg-[#303030] border border-white/10 text-white px-4 py-3 text-[14px]">
        <option value="all">Все магазины</option>
        <option v-for="s in shopOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <button @click="loadData" class="rounded-[14px] bg-[#1f78ff] px-5 py-3 text-[14px] font-semibold text-white hover:bg-[#4993dd]">Обновить</button>
    </div>

    <!-- Error -->
    <div v-if="errorMessage" class="rounded-[24px] border border-rose-400/20 bg-rose-500/10 p-5 text-rose-100">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <span>{{ errorMessage }}</span>
        <button @click="loadData" class="rounded-2xl bg-rose-500/20 px-4 py-2 text-sm font-semibold transition hover:bg-rose-500/30">Повторить</button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading && !sellerData" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div v-for="i in 4" :key="i" class="h-[148px] animate-pulse rounded-[24px] border border-white/10 bg-white/5" />
    </div>

    <!-- KPI cards -->
    <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ReportKpiCard
        v-for="(card, idx) in kpiCards"
        :key="idx"
        :title="card.title"
        :value="card.value"
        :hint="card.hint"
        :tone="card.tone"
      />
    </div>

    <!-- Bar chart: Top 10 sellers -->
    <section v-if="chartSellers.length" class="rounded-[28px] border border-white/10 bg-[#202020] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.18)]">
      <h3 class="text-[22px] font-semibold">Топ-10 продавцов</h3>
      <p class="mt-2 text-sm text-[#a3a3a3]">По чистым продажам за выбранный период</p>

      <div class="mt-5 space-y-3">
        <div
          v-for="seller in chartSellers"
          :key="seller.id"
          class="flex items-center gap-4"
        >
          <div class="w-[140px] shrink-0 truncate text-right text-sm text-slate-400">{{ seller.name }}</div>
          <div class="flex-1">
            <div
              class="h-8 rounded-[10px] bg-[linear-gradient(90deg,#6d28d9,#c4b5fd)]"
              :style="{ width: `${Math.max(2, (toNumber(seller.net_sales) / chartMax) * 100)}%` }"
            />
          </div>
          <div class="w-[140px] shrink-0 text-sm font-semibold text-white">{{ formatMoney(seller.net_sales) }}</div>
        </div>
      </div>
    </section>

    <!-- Data table -->
    <ReportDataTable
      title="Все продавцы"
      description="Детальные показатели по каждому продавцу"
      :columns="tableColumns"
      :rows="tableRows"
      :loading="loading"
      empty-text="Нет данных для выбранного периода"
    />
  </section>
</template>
