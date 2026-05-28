<script setup lang="ts">
import { useHead, useRouter } from "#imports";
import ReportDataTable from "~/components/reports/ReportDataTable.vue";
import ReportKpiCard from "~/components/reports/ReportKpiCard.vue";
import {
  useReportsApi,
  type GeneralCustomerReportResult,
  type GeneralProductReportResult,
  type GeneralReportTableResult,
  type GeneralSalesReportResult,
  type GeneralSellerReportResult,
  type ReportFilterQuery,
} from "~/composables/useReportsApi";
import { useUserStore } from "~/store/useUserStore";

useHead({ title: "Сводный отчет | Konkurent" });

const router = useRouter();
const reportsApi = useReportsApi();
const userStore = useUserStore();

const activeTab = ref<"dashboard" | "table">("dashboard");
const selectedDate = ref(formatDateInput(new Date()));
const selectedBranch = ref("all");
const selectedSalesField = ref("net_gross_sales");
const selectedProductField = ref("sold_qty");
const selectedTopProductField = ref("sold_qty");
const selectedTopCategoryField = ref("sold_qty");
const page = ref(1);
const limit = ref(20);

const loading = ref(false);
const tableLoading = ref(false);
const initialized = ref(false);
const errorMessage = ref("");

const summaryData = ref<{ summary: any; shop_stats: any[] } | null>(null);
const salesData = ref<GeneralSalesReportResult | null>(null);
const productData = ref<GeneralProductReportResult | null>(null);
const sellerData = ref<GeneralSellerReportResult | null>(null);
const customerData = ref<GeneralCustomerReportResult | null>(null);
const reportTable = ref<GeneralReportTableResult>({ rows: [], count: 0 });

const salesMetricOptions = [
  { value: "gross_sales", label: "Валовая выручка" },
  { value: "net_gross_sales", label: "Чистая выручка" },
  { value: "gross_profit", label: "Прибыль" },
  { value: "discount_sum", label: "Скидки" },
  { value: "transactions_count", label: "Транзакции" },
  { value: "products_sold", label: "Товары" },
] as const;

const productMetricOptions = [
  { value: "sold_with_discount", label: "Продано со скидкой" },
  { value: "sold_qty", label: "Продано товаров" },
] as const;

const topMetricOptions = [
  { value: "sold_qty", label: "Количество" },
  { value: "net_gross_sales", label: "Чистая выручка" },
  { value: "gross_profit", label: "Прибыль" },
] as const;

const tableColumns = [
  { key: "date", label: "Дата" },
  { key: "shop_name", label: "Магазин" },
  { key: "gross_sales", label: "Валовая выручка", align: "right", formatter: (value: unknown) => formatMoney(value) },
  { key: "discount_sum", label: "Скидки", align: "right", formatter: (value: unknown) => formatMoney(value) },
  { key: "discount_percent", label: "Скидка %", align: "right", formatter: (value: unknown) => formatPercent(value) },
  { key: "sales_supply_price", label: "Себестоимость", align: "right", formatter: (value: unknown) => formatMoney(value) },
  { key: "net_gross_sales", label: "Чистая выручка", align: "right", formatter: (value: unknown) => formatMoney(value) },
  { key: "gross_profit", label: "Прибыль", align: "right", formatter: (value: unknown) => formatMoney(value) },
  { key: "average_cheque", label: "Средний чек", align: "right", formatter: (value: unknown) => formatMoney(value) },
  { key: "average_price", label: "Средняя цена", align: "right", formatter: (value: unknown) => formatMoney(value) },
  { key: "products_sold", label: "Товаров", align: "right", formatter: (value: unknown) => formatCount(value) },
  { key: "transactions_count", label: "Транзакции", align: "right", formatter: (value: unknown) => formatCount(value) },
  { key: "orders_count", label: "Чеки", align: "right", formatter: (value: unknown) => formatCount(value) },
  { key: "returns_count", label: "Возвраты", align: "right", formatter: (value: unknown) => formatCount(value) },
  { key: "exchanges_count", label: "Обмены", align: "right", formatter: (value: unknown) => formatCount(value) },
] as const;

const categoryColumns = [
  { key: "name", label: "Категория" },
  { key: "sold_quantity", label: "Продано", align: "right", formatter: (value: unknown) => formatCount(value) },
  { key: "net_revenue", label: "Чистая выручка", align: "right", formatter: (value: unknown) => formatMoney(value) },
  { key: "gross_profit", label: "Прибыль", align: "right", formatter: (value: unknown) => formatMoney(value) },
] as const;

const customerColumns = [
  { key: "name", label: "Магазин" },
  { key: "new_count", label: "Новые", align: "right", formatter: (value: unknown) => formatCount(value) },
  { key: "returned_count", label: "Повторные", align: "right", formatter: (value: unknown) => formatCount(value) },
] as const;

const shopOptions = computed(() =>
  (userStore.userState.shops || []).length
    ? (userStore.userState.shops || []).map((shop) => ({
        value: String(shop.id),
        label: shop.name,
      }))
    : userStore.userState.currentShopId
      ? [{ value: String(userStore.userState.currentShopId), label: userStore.userState.currentShopName || userStore.userState.currentShopId }]
      : [],
);

const branches = computed(() => [
  { value: "all", label: "Все магазины" },
  ...shopOptions.value,
]);
const selectedShopIds = computed(() =>
  selectedBranch.value === "all"
    ? shopOptions.value.map((shop) => shop.value)
    : selectedBranch.value
      ? [selectedBranch.value]
      : [],
);
const selectedBranchLabel = computed(
  () => branches.value.find((branch) => branch.value === selectedBranch.value)?.label || "Все магазины",
);

const currentSalesMetricLabel = computed(
  () => salesMetricOptions.find((item) => item.value === selectedSalesField.value)?.label || salesMetricOptions[0].label,
);
const currentProductMetricLabel = computed(
  () => productMetricOptions.find((item) => item.value === selectedProductField.value)?.label || productMetricOptions[0].label,
);
const salesChartPoints = computed(() =>
  (salesData.value?.shop_plot || []).map((point) => ({
    label: String(point.label ?? ""),
    value: toNumber(point.value),
  })),
);
const salesChartTicks = computed(() => {
  const max = Math.max(1000000, ...salesChartPoints.value.map((point) => point.value), toNumber(salesData.value?.value));
  const step = Math.max(250000, Math.ceil(max / 4 / 1000) * 1000);
  return [0, step, step * 2, step * 3, step * 4];
});
const productChartPoints = computed(() =>
  (productData.value?.shop_plot || []).map((point) => ({
    label: String(point.label ?? ""),
    value: toNumber(point.value),
  })),
);
const productChartTicks = computed(() => {
  const max = Math.max(16, ...productChartPoints.value.map((point) => point.value), toNumber(productData.value?.value));
  const step = Math.max(4, Math.ceil(max / 4));
  return [0, step, step * 2, step * 3, step * 4];
});
const customerChartPoints = computed(() =>
  (customerData.value?.shop_plot || []).map((point) => ({
    label: String(point.label ?? ""),
    value: toNumber(point.value),
  })),
);
const customerChartTicks = computed(() => {
  const max = Math.max(4, ...customerChartPoints.value.map((point) => point.value), toNumber(customerData.value?.new_count));
  const step = Math.max(1, Math.ceil(max / 4));
  return [0, step, step * 2, step * 3, step * 4];
});

const kpiCards = computed(() => {
  const summary = summaryData.value?.summary;
  if (!summary) return [];

  return [
    { key: "net_gross_sales", title: "Чистая выручка", value: formatMoney(summary.net_gross_sales), tone: "neutral" as const },
    { key: "gross_profit", title: "Валовая прибыль", value: formatMoney(summary.gross_profit), tone: "success" as const },
    { key: "average_cheque", title: "Средний чек", value: formatMoney(summary.average_cheque), tone: "neutral" as const },
    {
      key: "average_products",
      title: "Ср. кол-во продуктов",
      value: `${summary.transactions_count ? (toNumber(summary.products_sold) / toNumber(summary.transactions_count)).toFixed(2) : "0.00"} ед.`,
      tone: "neutral" as const,
    },
    { key: "discount_percent", title: "Средняя скидка", value: `${toNumber(summary.discount_percent).toFixed(1)} %`, tone: "warning" as const },
    { key: "average_extra_charge", title: "Средняя наценка", value: `${toNumber(summary.average_extra_charge).toFixed(2)} x`, tone: "primary" as const },
    { key: "products_sold", title: "Продано продуктов", value: `${formatCount(summary.products_sold)} ед.`, tone: "primary" as const },
    { key: "returns_count", title: "Возвращено продуктов", value: `${formatCount(summary.returns_count)} ед.`, tone: "warning" as const },
  ];
});

const tablePageCount = computed(() => Math.max(1, Math.ceil((reportTable.value.count || 0) / Number(limit.value || 20))));
const hasAnyData = computed(() =>
  Boolean(
    summaryData.value ||
    salesData.value ||
    productData.value ||
    sellerData.value ||
    customerData.value ||
    reportTable.value.rows.length,
  ),
);
const sellerTableRows = computed(() =>
  (sellerData.value?.top_sellers || []).map((seller) => ({
    id: seller.id,
    name: seller.name,
    shop_name: "",
    gross_sales: seller.net_sales,
    net_gross_sales: seller.net_sales,
    gross_profit: seller.net_profit,
    products_sold: seller.total_sold_measurement_value,
    transactions_count: 0,
    average_cheque: seller.average_cheque,
    discount_sum: 0,
    discount_percent: 0,
    returns_count: 0,
    average_extra_charge: 0,
    kpi_score: 0,
    fixed_salary: 0,
    salary_percent: 0,
    bonus_amount: 0,
    salary_total: 0,
    calculation_type: "",
  })),
);
const salesIndicatorRows = computed(() => summaryData.value?.shop_stats || []);
const productShopRows = computed(() => productData.value?.shop_stats || []);
const topProductsRows = computed(() => (productData.value?.top_products || []).slice(0, 10));
const topCategoryRows = computed(() => (productData.value?.top_categories || []).slice(0, 10));
const customerRows = computed(() => customerData.value?.shop_stats || []);

watch(
  shopOptions,
  (options) => {
    const availableIds = new Set(options.map((shop) => shop.value));
    if (selectedBranch.value !== "all" && selectedBranch.value && !availableIds.has(selectedBranch.value)) {
      selectedBranch.value = "all";
    }

    if (!initialized.value && selectedShopIds.value.length) {
      initialized.value = true;
      void loadDashboard();
    }
  },
  { immediate: true },
);

watch([page, limit], () => {
  if (!initialized.value) return;
  void loadTable();
});

watch([selectedDate, selectedBranch], () => {
  if (!initialized.value) return;
  applyFilters();
});

function goBack() {
  router.back();
}

function formatDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function toNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatMoney(value: unknown) {
  return `${Intl.NumberFormat("ru-RU").format(Math.round(toNumber(value)))} UZS`;
}

function formatCount(value: unknown) {
  return Intl.NumberFormat("ru-RU").format(Math.round(toNumber(value)));
}

function formatPercent(value: unknown) {
  return `${toNumber(value).toFixed(2)}%`;
}

function compactMoney(value: unknown) {
  const amount = toNumber(value);
  if (amount === 0) return "0";
  if (Math.abs(amount) >= 1000000) {
    return `${Math.round((amount / 1000000) * 10) / 10} M`;
  }
  if (Math.abs(amount) >= 1000) {
    return `${Math.round(amount / 1000)} K`;
  }
  return Intl.NumberFormat("ru-RU").format(Math.round(amount));
}

function humanDate(value: string) {
  if (!value) return "Не выбрано";
  const normalized = value.slice(0, 10);
  const [year, month, day] = normalized.split("-");
  return `${day}.${month}.${year}`;
}

function shortDate(value: string) {
  if (!value) return "";
  const normalized = value.slice(0, 10);
  const [year, month, day] = normalized.split("-");
  if (!year || !month || !day) return normalized;
  return `${day}.${month}`;
}

function shortWeekday(value: string) {
  if (!value) return "";
  const normalized = value.slice(0, 10);
  const date = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(date).replace(".", "");
}

function formatSalesShopMetric(shop: Record<string, unknown>) {
  const value = toNumber(shop?.[selectedSalesField.value]);
  return selectedSalesField.value.includes("count") || selectedSalesField.value === "products_sold"
    ? formatCount(value)
    : formatMoney(value);
}

function formatProductShopMetric(shop: Record<string, unknown>) {
  return `${formatCount(shop?.products_sold || 0)} шт`;
}

function formatCustomerMetric(value: unknown, total: unknown) {
  const numericValue = toNumber(value);
  const numericTotal = toNumber(total);
  const percentValue = numericTotal ? (numericValue / numericTotal) * 100 : 0;
  return `${formatCount(numericValue)} шт | ${percentValue.toFixed(0)}%`;
}

function buildBaseQuery(overrides: Partial<ReportFilterQuery> = {}): ReportFilterQuery {
  return {
    startDate: selectedDate.value,
    shopIds: [...selectedShopIds.value],
    plotShopIds: [...selectedShopIds.value],
    page: page.value,
    limit: limit.value,
    currency: "UZS",
    groupBy: "day",
    detalization: "day",
    priceType: 0,
    ...overrides,
  };
}

async function loadDashboard() {
  if (!selectedShopIds.value.length) {
    errorMessage.value = "Выберите хотя бы один магазин.";
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    const [
      summary,
      sales,
      products,
      sellers,
      customers,
      table,
    ] = await Promise.all([
      reportsApi.getGeneralReport(buildBaseQuery()),
      reportsApi.getGeneralSalesReport(buildBaseQuery({ field: selectedSalesField.value })),
      reportsApi.getGeneralProductReport(
        buildBaseQuery({
          field: selectedProductField.value,
          topProductField: selectedTopProductField.value,
          topCategoryField: selectedTopCategoryField.value,
        }),
      ),
      reportsApi.getGeneralSellerReport(buildBaseQuery()),
      reportsApi.getGeneralCustomerReport(buildBaseQuery({ field: "new" })),
      reportsApi.getGeneralReportTable(buildBaseQuery()),
    ]);

    summaryData.value = summary;
    salesData.value = sales;
    productData.value = products;
    sellerData.value = sellers;
    customerData.value = customers;
    reportTable.value = table;
  } catch {
    errorMessage.value = "Не удалось загрузить сводный отчет.";
  } finally {
    loading.value = false;
  }
}

async function loadTable() {
  if (!selectedShopIds.value.length) return;

  tableLoading.value = true;
  try {
    reportTable.value = await reportsApi.getGeneralReportTable(buildBaseQuery());
  } catch {
    errorMessage.value = errorMessage.value || "Не удалось загрузить таблицу отчета.";
  } finally {
    tableLoading.value = false;
  }
}

function applyFilters() {
  if (!selectedShopIds.value.length) {
    errorMessage.value = "Нет доступных магазинов для отчета.";
    return;
  }
  page.value = 1;
  void loadDashboard();
}

function resetFilters() {
  selectedDate.value = formatDateInput(new Date());
  selectedBranch.value = "all";
  selectedSalesField.value = "gross_sales";
  selectedProductField.value = "sold_with_discount";
  selectedTopProductField.value = "sold_qty";
  selectedTopCategoryField.value = "sold_qty";
  page.value = 1;
  limit.value = 20;
  void loadDashboard();
}
</script>

<template>
  <section class="space-y-6 text-white">
    <header class="space-y-4">
      <div class="flex gap-2 items-center">
        <button
          type="button"
          aria-label="Назад"
          class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#232323] text-white transition hover:border-white/20 hover:bg-[#2d2d2d]"
          @click="goBack"
        >
          <Icon name="heroicons:arrow-left" class="h-5 w-5" />
        </button>

        <h1 class="text-[32px] font-bold tracking-[-0.04em] flex gap-2">
          <span class="text-[#bdbdbd]">Отчет</span>Сводный
        </h1>
      </div>

      <div class="flex justify-between gap-3 flex-wrap">
        <AppDatePicker
          v-model="selectedDate"
          placeholder="Выберите дату"
          class="w-[200px]"
        />

        <label class="relative">
          <span class="sr-only">Филиал</span>
          <select
            v-model="selectedBranch"
            class="h-[54px] appearance-none rounded-[18px] border border-white/10 bg-white/5 px-4 pr-11 text-[15px] font-semibold text-white outline-none transition hover:bg-white/10 focus:border-[#1f78ff]"
          >
            <option
              v-for="branch in branches"
              :key="branch.value"
              :value="branch.value"
              class="bg-[#202020] text-white"
            >
              {{ branch.label }}
            </option>
          </select>
          <Icon
            name="heroicons:building-storefront"
            class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-300"
          />
        </label>
      </div>
    </header>

    <div class="flex w-full items-center gap-2 rounded-[18px] border border-white/10 bg-[#202020] p-1">
      <button
        type="button"
        class="flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] px-4 text-[16px] font-semibold transition"
        :class="activeTab === 'dashboard' ? 'bg-[#1f78ff] text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'"
        @click="activeTab = 'dashboard'"
      >
        <Icon name="heroicons:squares-2x2" class="h-4 w-4" />
        Дашборд
      </button>
      <button
        type="button"
        class="flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] px-4 text-[16px] font-semibold transition"
        :class="activeTab === 'table' ? 'bg-[#1f78ff] text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'"
        @click="activeTab = 'table'"
      >
        <Icon name="heroicons:table-cells" class="h-4 w-4" />
        Таблица
      </button>
    </div>

    <section v-if="errorMessage" class="rounded-[24px] border border-rose-400/20 bg-rose-500/10 p-5 text-rose-100">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <span>{{ errorMessage }}</span>
        <button type="button" class="rounded-2xl bg-rose-500/20 px-4 py-2 text-sm font-semibold transition hover:bg-rose-500/30" @click="applyFilters">
          Повторить
        </button>
      </div>
    </section>

    <div v-if="activeTab === 'dashboard'" class="space-y-6">
      <div v-if="loading && !hasAnyData" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div v-for="item in 8" :key="item" class="h-[148px] animate-pulse rounded-[24px] border border-white/10 bg-white/5" />
      </div>

      <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportKpiCard
          v-for="card in kpiCards"
          :key="card.key"
          :title="card.title"
          :value="card.value"
          :tone="card.tone"
        />
      </div>

        <div class="space-y-4">
          <section class="rounded-[28px] border border-white/10 bg-[#202020] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.18)]">
            <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h3 class="text-[22px] font-semibold">Статистика продаж</h3>
                <p class="mt-2 text-sm text-[#a3a3a3]">{{ humanDate(selectedDate) }} • {{ selectedBranchLabel }}</p>
              </div>
              <div class="grid gap-2 sm:grid-cols-2">
                <div class="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Метрика</div>
                  <div class="mt-2 text-sm font-semibold text-white">Выручка</div>
                </div>
                <div class="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Детализация</div>
                  <div class="mt-2 text-sm font-semibold text-white">По дням</div>
                </div>
              </div>
            </div>

            <div class="mt-6 flex flex-col gap-4">
              <div class="rounded-[24px] border border-white/10 bg-[#181818] p-5">
                <div class="grid gap-4 xl:grid-cols-[72px_minmax(0,1fr)]">
                  <div class="flex h-[280px] flex-col justify-between pt-2 text-right text-xs font-semibold text-slate-500">
                    <span v-for="tick in [...salesChartTicks].reverse()" :key="tick">{{ compactMoney(tick) }}</span>
                  </div>

                  <div class="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,#161616_0%,#101010_100%)] p-4">
                    <div class="mb-3 flex items-center justify-between">
                      <div class="text-sm font-semibold text-white">Выручка</div>
                      <div class="text-xs uppercase tracking-[0.18em] text-slate-500">по дням</div>
                    </div>

                    <div v-if="salesChartPoints.length" class="flex h-[228px] items-end gap-3 overflow-hidden">
                      <div
                        v-for="point in salesChartPoints"
                        :key="`${point.label}-${point.value}`"
                        class="flex min-w-0 flex-1 flex-col items-center gap-3"
                      >
                        <div class="relative flex w-full flex-1 items-end">
                          <div class="absolute inset-x-0 bottom-0 h-px bg-white/10" />
                          <div
                            class="relative w-full rounded-t-[18px] border border-[#79bfff]/20 bg-[linear-gradient(180deg,#79c1ff_0%,#2d8cff_55%,#1367ef_100%)] shadow-[0_14px_30px_rgba(19,103,239,0.28)]"
                            :style="{ height: `${Math.max(16, (point.value / Math.max(...salesChartTicks)) * 190)}px` }"
                          />
                        </div>
                        <div class="text-center text-[11px] tracking-[0.08em] text-[#8b8b8b]">
                          <div class="uppercase">{{ shortWeekday(point.label) || 'дн' }}</div>
                          <div class="mt-1">{{ shortDate(point.label) || point.label }}</div>
                        </div>
                      </div>
                    </div>
                    <div v-else class="flex h-[228px] items-center justify-center text-sm text-slate-500">
                      Нет данных для графика
                    </div>
                  </div>
                </div>
              </div>

              <section class="rounded-[24px] border border-white/10 bg-[#181818] p-5">
                <div class="flex items-center justify-between">

                  <h3 class="text-[20px] font-semibold">Магазин</h3>
                  <div class="flex flex-col justify-between">

                    <div class="mt-2 text-sm text-[#a3a3a3]">Выбранный период</div>
                    <div class=" text-sm text-white">{{ humanDate(selectedDate) }}</div>
                  </div>
                </div>

                <div class="mt-5 space-y-3">
                  <div
                    v-for="shop in summaryData?.shop_stats || []"
                    :key="shop.id"
                    class="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div class="font-semibold text-white">{{ shop.name || shop.shop_name }}</div>
                    <div class="mt-2 text-sm text-slate-300">{{ formatMoney(shop.net_gross_sales || 0) }}</div>
                  </div>
                </div>

                <div class="mt-5 rounded-[22px] border border-white/10 bg-[#141414] p-4 flex items-center justify-between">
                  <div class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">ОБЩЕЕ КОЛ-ВО</div>
                  <div class="mt-2 text-[26px] font-bold text-[#8ec8ff]">{{ formatMoney(summaryData?.summary?.net_gross_sales || 0) }}</div>
                </div>
              </section>
            </div>
          </section>

          <section class="rounded-[28px] border border-white/10 bg-[#202020] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.18)]">
            <div>
              <h3 class="text-[20px] font-semibold">Показатели продаж</h3>
              <p class="mt-2 text-sm text-[#a3a3a3]">{{ humanDate(selectedDate) }} • {{ selectedBranchLabel }}</p>
            </div>

            <div class="mt-5 overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead>
                  <tr class="border-b border-white/10 bg-white/5">
                    <th class="px-4 py-3 text-left font-semibold text-[#bdbdbd]">Магазин</th>
                    <th class="px-4 py-3 text-right font-semibold text-[#bdbdbd]">Чистая выручка</th>
                    <th class="px-4 py-3 text-right font-semibold text-[#bdbdbd]">Валовая прибыль</th>
                    <th class="px-4 py-3 text-right font-semibold text-[#bdbdbd]">Средняя скидка</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="shop in salesIndicatorRows"
                    :key="shop.id || shop.shop_id || shop.name"
                    class="border-b border-white/5"
                  >
                    <td class="px-4 py-3 text-white">{{ shop.name || shop.shop_name }}</td>
                    <td class="px-4 py-3 text-right text-white">{{ formatMoney(shop.net_gross_sales) }}</td>
                    <td class="px-4 py-3 text-right text-white">{{ formatMoney(shop.gross_profit) }}</td>
                    <td class="px-4 py-3 text-right text-white">{{ `${toNumber(shop.discount_percent).toFixed(2)} %` }}</td>
                  </tr>
                  <tr class="bg-white/[0.03] font-semibold">
                    <td class="px-4 py-3 text-white">Всего</td>
                    <td class="px-4 py-3 text-right text-white">{{ formatMoney(summaryData?.summary?.net_gross_sales || 0) }}</td>
                    <td class="px-4 py-3 text-right text-white">{{ formatMoney(summaryData?.summary?.gross_profit || 0) }}</td>
                    <td class="px-4 py-3 text-right text-white">{{ `${toNumber(summaryData?.summary?.discount_percent || 0).toFixed(1)} %` }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

      <section class="rounded-[28px] border border-white/10 bg-[#202020] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.18)]">
        <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h3 class="text-[22px] font-semibold">Статистика продуктов</h3>
            <p class="mt-2 text-sm text-[#a3a3a3]">{{ humanDate(selectedDate) }} • Все магазины</p>
          </div>
          <div class="grid gap-2 sm:grid-cols-2">
            <div class="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3">
              <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Метрика</div>
              <div class="mt-2 text-sm font-semibold text-white">Продано со скидкой</div>
            </div>
            <div class="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3">
              <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Детализация</div>
              <div class="mt-2 text-sm font-semibold text-white">По дням</div>
            </div>
          </div>
        </div>

        <div class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_340px]">
          <div class="rounded-[24px] border border-white/10 bg-[#181818] p-5">
            <div class="grid gap-4 xl:grid-cols-[72px_minmax(0,1fr)]">
              <div class="flex h-[280px] flex-col justify-between pt-2 text-right text-xs font-semibold text-slate-500">
                <span v-for="tick in [...productChartTicks].reverse()" :key="tick">{{ tick }}</span>
              </div>

              <div class="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,#161616_0%,#101010_100%)] p-4">
                <div class="mb-3 flex items-center justify-between">
                  <div class="text-sm font-semibold text-white">Продано со скидкой</div>
                  <div class="text-xs uppercase tracking-[0.18em] text-slate-500">по дням</div>
                </div>

                <div v-if="productChartPoints.length" class="flex h-[228px] items-end gap-3 overflow-hidden">
                  <div
                    v-for="point in productChartPoints"
                    :key="`${point.label}-${point.value}`"
                    class="flex min-w-0 flex-1 flex-col items-center gap-3"
                  >
                    <div class="relative flex w-full flex-1 items-end">
                      <div class="absolute inset-x-0 bottom-0 h-px bg-white/10" />
                      <div
                        class="relative w-full rounded-t-[18px] border border-emerald-400/20 bg-[linear-gradient(180deg,#86efac_0%,#22c55e_55%,#15803d_100%)] shadow-[0_14px_30px_rgba(22,163,74,0.22)]"
                        :style="{ height: `${Math.max(16, (point.value / Math.max(...productChartTicks)) * 190)}px` }"
                      />
                    </div>
                    <div class="text-center text-[11px] tracking-[0.08em] text-[#8b8b8b]">
                      <div class="uppercase">{{ shortWeekday(point.label) || 'дн' }}</div>
                      <div class="mt-1">{{ shortDate(point.label) || point.label }}</div>
                    </div>
                  </div>
                </div>
                <div v-else class="flex h-[228px] items-center justify-center text-sm text-slate-500">
                  Нет данных для графика
                </div>
              </div>
            </div>
          </div>

          <section class="rounded-[24px] border border-white/10 bg-[#181818] p-5">
            <h3 class="text-[20px] font-semibold">Магазин</h3>
            <div class="mt-2 text-sm text-[#a3a3a3]">Выбранный период</div>
            <div class="mt-1 text-sm text-white">{{ humanDate(selectedDate) }}</div>

            <div class="mt-5 space-y-3">
              <div
                v-for="shop in productShopRows"
                :key="shop.id || shop.shop_id || shop.name"
                class="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
              >
                <div class="font-semibold text-white">{{ shop.name || shop.shop_name }}</div>
                <div class="mt-2 text-sm text-slate-300">{{ formatProductShopMetric(shop) }}</div>
              </div>
            </div>

            <div class="mt-5 rounded-[22px] border border-white/10 bg-[#141414] p-4">
              <div class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">ОБЩЕЕ КОЛ-ВО</div>
              <div class="mt-2 text-[26px] font-bold text-emerald-300">{{ formatCount(productData?.value || 0) }} шт</div>
            </div>
          </section>
        </div>
      </section>

      <div class="grid gap-4 xl:grid-cols-2">
        <section class="rounded-[28px] border border-white/10 bg-[#202020] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.18)]">
          <div>
            <h3 class="text-[20px] font-semibold">Топ-10 продуктов</h3>
            <p class="mt-2 text-sm text-[#a3a3a3]">{{ humanDate(selectedDate) }} • {{ selectedBranchLabel }}</p>
          </div>

          <div class="mt-5 space-y-3">
            <div class="grid grid-cols-[1fr_auto] text-xs uppercase tracking-[0.12em] text-slate-500">
              <span>Наименование</span>
              <span>Продажи</span>
            </div>
            <div
              v-for="product in topProductsRows"
              :key="product.id"
              class="rounded-[20px] border border-white/10 bg-white/[0.03] p-4"
            >
              <div class="text-xs uppercase tracking-[0.12em] text-slate-500">product</div>
              <div class="mt-2 flex items-end justify-between gap-4">
                <div class="font-semibold text-white">{{ product.name }}</div>
                <div class="text-sm text-slate-300">{{ formatCount(product.sold_quantity) }} шт</div>
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-[28px] border border-white/10 bg-[#202020] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.18)]">
          <div>
            <h3 class="text-[20px] font-semibold">Топ-10 категорий</h3>
            <p class="mt-2 text-sm text-[#a3a3a3]">{{ humanDate(selectedDate) }} • {{ selectedBranchLabel }}</p>
          </div>

          <div class="mt-5 space-y-3">
            <div class="grid grid-cols-[1fr_auto] text-xs uppercase tracking-[0.12em] text-slate-500">
              <span>name</span>
              <span>Продажи</span>
            </div>
            <div
              v-for="category in topCategoryRows"
              :key="category.id"
              class="rounded-[20px] border border-white/10 bg-white/[0.03] p-4"
            >
              <div class="mt-1 flex items-end justify-between gap-4">
                <div class="font-semibold text-white">{{ category.name }}</div>
                <div class="text-sm text-slate-300">{{ formatCount(category.sold_quantity) }} шт</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section class="rounded-[28px] border border-white/10 bg-[#202020] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.18)]">
        <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h3 class="text-[22px] font-semibold">Статистика клиентов</h3>
            <p class="mt-2 text-sm text-[#a3a3a3]">{{ humanDate(selectedDate) }} • Все магазины</p>
          </div>
          <div class="grid gap-2 sm:grid-cols-2">
            <div class="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3">
              <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Метрика</div>
              <div class="mt-2 text-sm font-semibold text-white">Новые клиенты</div>
            </div>
            <div class="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3">
              <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Детализация</div>
              <div class="mt-2 text-sm font-semibold text-white">По дням</div>
            </div>
          </div>
        </div>

        <div class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_340px]">
          <div class="rounded-[24px] border border-white/10 bg-[#181818] p-5">
            <div class="grid gap-4 xl:grid-cols-[72px_minmax(0,1fr)]">
              <div class="flex h-[280px] flex-col justify-between pt-2 text-right text-xs font-semibold text-slate-500">
                <span v-for="tick in [...customerChartTicks].reverse()" :key="tick">{{ tick }}</span>
              </div>

              <div class="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,#161616_0%,#101010_100%)] p-4">
                <div class="mb-3 flex items-center justify-between">
                  <div class="text-sm font-semibold text-white">Новые клиенты</div>
                  <div class="text-xs uppercase tracking-[0.18em] text-slate-500">по дням</div>
                </div>

                <div v-if="customerChartPoints.length" class="flex h-[228px] items-end gap-3 overflow-hidden">
                  <div
                    v-for="point in customerChartPoints"
                    :key="`${point.label}-${point.value}`"
                    class="flex min-w-0 flex-1 flex-col items-center gap-3"
                  >
                    <div class="relative flex w-full flex-1 items-end">
                      <div class="absolute inset-x-0 bottom-0 h-px bg-white/10" />
                      <div
                        class="relative w-full rounded-t-[18px] border border-violet-400/20 bg-[linear-gradient(180deg,#c4b5fd_0%,#8b5cf6_55%,#6d28d9_100%)] shadow-[0_14px_30px_rgba(124,58,237,0.22)]"
                        :style="{ height: `${Math.max(16, (point.value / Math.max(...customerChartTicks)) * 190)}px` }"
                      />
                    </div>
                    <div class="text-center text-[11px] tracking-[0.08em] text-[#8b8b8b]">
                      <div class="uppercase">{{ shortWeekday(point.label) || 'дн' }}</div>
                      <div class="mt-1">{{ shortDate(point.label) || point.label }}</div>
                    </div>
                  </div>
                </div>
                <div v-else class="flex h-[228px] items-center justify-center text-sm text-slate-500">
                  Нет данных для графика
                </div>
              </div>
            </div>
          </div>

          <section class="rounded-[24px] border border-white/10 bg-[#181818] p-5">
            <h3 class="text-[20px] font-semibold">Магазин</h3>
            <div class="mt-2 text-sm text-[#a3a3a3]">Выбранный период</div>
            <div class="mt-1 text-sm text-white">{{ humanDate(selectedDate) }}</div>

            <div class="mt-5 space-y-3">
              <div
                v-for="shop in customerRows"
                :key="shop.id || shop.name"
                class="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
              >
                <div class="font-semibold text-white">{{ shop.name }}</div>
                <div class="mt-2 text-sm text-slate-300">{{ formatCustomerMetric(shop.new_count, customerData?.new_count || 0) }}</div>
              </div>
            </div>

            <div class="mt-5 rounded-[22px] border border-white/10 bg-[#141414] p-4">
              <div class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">ОБЩЕЕ КОЛ-ВО</div>
              <div class="mt-2 text-[26px] font-bold text-violet-300">{{ formatCount(customerData?.new_count || 0) }} шт</div>
            </div>
          </section>
        </div>

        <div class="mt-6 overflow-x-auto">
          <div class="mb-4">
            <h3 class="text-[20px] font-semibold">Новые и возвращающиеся клиенты</h3>
            <p class="mt-2 text-sm text-[#a3a3a3]">{{ humanDate(selectedDate) }} • {{ selectedBranchLabel }}</p>
          </div>
          <table class="min-w-full text-sm">
            <thead>
              <tr class="border-b border-white/10 bg-white/5">
                <th class="px-4 py-3 text-left font-semibold text-[#bdbdbd]">Магазин</th>
                <th class="px-4 py-3 text-left font-semibold text-[#bdbdbd]">Новые</th>
                <th class="px-4 py-3 text-left font-semibold text-[#bdbdbd]">Возвращающиеся</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="shop in customerRows"
                :key="shop.id || shop.name"
                class="border-b border-white/5"
              >
                <td class="px-4 py-3 text-white">{{ shop.name }}</td>
                <td class="px-4 py-3 text-white">{{ formatCustomerMetric(shop.new_count, customerData?.new_count || 0) }}</td>
                <td class="px-4 py-3 text-white">{{ formatCustomerMetric(shop.returned_count, customerData?.returned_count || 0) }}</td>
              </tr>
              <tr class="bg-white/[0.03] font-semibold">
                <td class="px-4 py-3 text-white">Всего</td>
                <td class="px-4 py-3 text-white">{{ formatCustomerMetric(customerData?.new_count || 0, customerData?.new_count || 0) }}</td>
                <td class="px-4 py-3 text-white">{{ formatCustomerMetric(customerData?.returned_count || 0, customerData?.returned_count || 0) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <section v-else class="space-y-4">
      <ReportDataTable
        title="Детальная таблица"
        description="Данные /general-report-table по дням и магазинам."
        :columns="tableColumns"
        :rows="reportTable.rows"
        :loading="tableLoading"
        empty-text="Нет строк для выбранного периода"
      />

      <div class="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-[#202020] p-4">
        <div class="text-sm text-slate-400">
          Всего строк: <span class="font-semibold text-white">{{ formatCount(reportTable.count) }}</span>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <label class="flex items-center gap-2 text-sm text-slate-300">
            <span>Показывать</span>
            <select v-model="limit" class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none">
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </label>
          <div class="flex items-center gap-2">
            <button type="button" class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-50" :disabled="page <= 1 || tableLoading" @click="page -= 1">
              Назад
            </button>
            <span class="text-sm text-slate-300">Страница {{ page }} / {{ tablePageCount }}</span>
            <button type="button" class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-50" :disabled="page >= tablePageCount || tableLoading" @click="page += 1">
              Вперед
            </button>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>
