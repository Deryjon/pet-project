<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useHead } from "#imports";
import ReportKpiCard from "~/components/reports/ReportKpiCard.vue";
import ReportDataTable from "~/components/reports/ReportDataTable.vue";
import {
  useReportsApi,
  type ReportFilterQuery,
  type GeneralCustomerReportResult,
} from "~/composables/useReportsApi";
import { useUserStore } from "~/store/useUserStore";

useHead({ title: "Аналитика клиентов | Konkurent" });

const reportsApi = useReportsApi();
const userStore = useUserStore();

const loading = ref(false);
const initialized = ref(false);
const errorMessage = ref("");

const dateRange = ref({ from: formatDateInput(new Date()), to: formatDateInput(new Date()) });
const selectedBranch = ref("all");

const customerData = ref<GeneralCustomerReportResult | null>(null);

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

const kpiCards = computed(() => {
  if (!customerData.value) return [];
  const newCount = toNumber(customerData.value.new_count);
  const returnedCount = toNumber(customerData.value.returned_count);
  const total = newCount + returnedCount;
  const returnedPct = total > 0 ? (returnedCount / total) * 100 : 0;
  return [
    { title: "Новые клиенты", value: formatCount(newCount), tone: "primary" as const },
    { title: "Вернувшиеся", value: formatCount(returnedCount), tone: "success" as const },
    { title: "Всего клиентов", value: formatCount(total), tone: "neutral" as const },
    { title: "Доля вернувшихся", value: formatPercent(returnedPct), tone: "neutral" as const },
  ];
});

const chartPoints = computed(() =>
  (customerData.value?.shop_plot || []).map((p) => ({
    label: String(p.label ?? ""),
    value: toNumber(p.value),
  })),
);

const chartMax = computed(() => Math.max(1, ...chartPoints.value.map((p) => p.value)));

const tableColumns = [
  { key: "name", label: "Магазин" },
  { key: "new_count", label: "Новые", align: "right", formatter: (v: unknown) => formatCount(v) },
  { key: "returned_count", label: "Вернувшиеся", align: "right", formatter: (v: unknown) => formatCount(v) },
] as const;

const tableRows = computed(() => customerData.value?.shop_stats || []);

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
    field: "new",
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
    customerData.value = await reportsApi.getGeneralCustomerReport(buildBaseQuery());
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
      <h1 class="mt-3 text-[30px] font-bold tracking-[-0.04em] text-white">Клиенты</h1>
      <p class="mt-3 max-w-3xl text-[15px] leading-7 text-slate-300">
        Аналитика клиентской базы: новые и вернувшиеся клиенты, динамика по магазинам.
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
    <div v-if="loading && !customerData" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div v-for="i in 4" :key="i" class="h-[148px] animate-pulse rounded-[24px] border border-white/10 bg-white/5" />
    </div>

    <!-- KPI cards -->
    <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ReportKpiCard
        v-for="(card, idx) in kpiCards"
        :key="idx"
        :title="card.title"
        :value="card.value"
        :tone="card.tone"
      />
    </div>

    <!-- Bar chart -->
    <section v-if="chartPoints.length" class="rounded-[28px] border border-white/10 bg-[#202020] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.18)]">
      <h3 class="text-[22px] font-semibold">Динамика клиентов</h3>
      <p class="mt-2 text-sm text-[#a3a3a3]">По дням за выбранный период</p>

      <div class="mt-5 space-y-3">
        <div
          v-for="point in chartPoints"
          :key="point.label"
          class="flex items-center gap-4"
        >
          <div class="w-[100px] shrink-0 text-right text-sm text-slate-400">{{ point.label }}</div>
          <div class="flex-1">
            <div
              class="h-8 rounded-[10px] bg-[linear-gradient(90deg,#6d28d9,#c4b5fd)]"
              :style="{ width: `${Math.max(2, (point.value / chartMax) * 100)}%` }"
            />
          </div>
          <div class="w-[80px] shrink-0 text-sm font-semibold text-white">{{ formatCount(point.value) }}</div>
        </div>
      </div>
    </section>

    <!-- Data table -->
    <ReportDataTable
      title="Клиенты по магазинам"
      description="Новые и вернувшиеся клиенты в разбивке по магазинам"
      :columns="tableColumns"
      :rows="tableRows"
      :loading="loading"
      empty-text="Нет данных для выбранного периода"
    />
  </section>
</template>
