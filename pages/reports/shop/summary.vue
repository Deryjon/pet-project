<script setup lang="ts">
import { useHead, useRouter } from "#imports";
import ReportChartCard from "~/components/reports/ReportChartCard.vue";
import ReportDataTable from "~/components/reports/ReportDataTable.vue";
import ReportKpiCard from "~/components/reports/ReportKpiCard.vue";
import ProductStatsTable from "~/components/reports/ProductStatsTable.vue";
import SellerStatsTable from "~/components/reports/SellerStatsTable.vue";
import ShopStatsTable from "~/components/reports/ShopStatsTable.vue";
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
const selectedSalesField = ref("gross_sales");
const selectedProductField = ref("sold_with_discount");
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

const kpiCards = computed(() => {
  const summary = summaryData.value?.summary;
  if (!summary) return [];

  return [
    { key: "gross_sales", title: "Валовая выручка", value: formatMoney(summary.gross_sales), tone: "primary" as const },
    { key: "net_gross_sales", title: "Чистая выручка", value: formatMoney(summary.net_gross_sales), tone: "neutral" as const },
    { key: "gross_profit", title: "Валовая прибыль", value: formatMoney(summary.gross_profit), tone: "success" as const },
    { key: "discount_sum", title: "Скидки", value: formatMoney(summary.discount_sum), tone: "warning" as const },
    { key: "average_cheque", title: "Средний чек", value: formatMoney(summary.average_cheque), tone: "neutral" as const },
    { key: "transactions_count", title: "Количество продаж", value: formatCount(summary.transactions_count), tone: "neutral" as const },
    { key: "products_sold", title: "Количество товаров", value: formatCount(summary.products_sold), tone: "neutral" as const },
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

function formatSalesShopMetric(shop: Record<string, unknown>) {
  const value = toNumber(shop?.[selectedSalesField.value]);
  return selectedSalesField.value.includes("count") || selectedSalesField.value === "products_sold"
    ? formatCount(value)
    : formatMoney(value);
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

      <div class="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div class="space-y-4">
          <section class="rounded-[28px] border border-white/10 bg-[#202020] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.18)]">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 class="text-[20px] font-semibold">График продаж</h3>
                <p class="mt-2 text-sm text-[#a3a3a3]">Метрика: {{ currentSalesMetricLabel }}</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="option in salesMetricOptions"
                  :key="option.value"
                  type="button"
                  class="rounded-2xl px-3 py-2 text-sm font-semibold transition"
                  :class="selectedSalesField === option.value ? 'bg-[#1f78ff] text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'"
                  @click="selectedSalesField = option.value; applyFilters()"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <div class="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <ReportChartCard
                title="Продажи по магазинам"
                description="Динамика выбранной метрики по выбранным магазинам."
                :points="salesData?.shop_plot || []"
                :value-suffix="selectedSalesField.includes('count') || selectedSalesField === 'products_sold' ? '' : ' UZS'"
              />

              <section class="rounded-[28px] border border-white/10 bg-[#181818] p-5">
                <p class="text-sm text-slate-400">Итог по метрике</p>
                <div class="mt-2 text-[28px] font-bold text-[#1f78ff]">
                  {{ selectedSalesField.includes("count") || selectedSalesField === "products_sold" ? formatCount(salesData?.value || 0) : formatMoney(salesData?.value || 0) }}
                </div>
                <div class="mt-5 space-y-3">
                  <div class="grid grid-cols-[1fr_auto] text-xs uppercase tracking-[0.12em] text-slate-500">
                    <span>Магазин</span>
                    <span>Значение</span>
                  </div>
                  <div v-for="shop in salesData?.shop_stats || []" :key="shop.id" class="grid grid-cols-[1fr_auto] gap-4 rounded-[18px] bg-white/[0.04] px-4 py-3">
                    <span class="font-semibold">{{ shop.name }}</span>
                    <span>{{ formatSalesShopMetric(shop) }}</span>
                  </div>
                </div>
              </section>
            </div>
          </section>

          <ShopStatsTable :rows="summaryData?.shop_stats || []" :loading="loading" />
        </div>

        <section class="rounded-[28px] border border-white/10 bg-[#202020] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.18)]">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-[20px] font-semibold">Товарный блок</h3>
              <p class="mt-2 text-sm text-[#a3a3a3]">{{ currentProductMetricLabel }}</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="option in productMetricOptions"
                :key="option.value"
                type="button"
                class="rounded-2xl px-3 py-2 text-sm font-semibold transition"
                :class="selectedProductField === option.value ? 'bg-[#1f78ff] text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'"
                @click="selectedProductField = option.value; applyFilters()"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="mt-5">
            <ReportChartCard
              title="Товарная динамика"
              description="График по магазинам для выбранной товарной метрики."
              :points="productData?.shop_plot || []"
            />
          </div>

          <div class="mt-5 rounded-[22px] border border-white/10 bg-[#181818] p-4">
            <p class="text-sm text-slate-400">Значение метрики</p>
            <div class="mt-2 text-[26px] font-bold text-emerald-300">
              {{ formatCount(productData?.value || 0) }}
            </div>
          </div>

          <div class="mt-5 grid gap-4 md:grid-cols-2">
            <label class="space-y-2">
              <span class="text-sm font-medium text-[#d3d3d3]">Топ товаров</span>
              <select v-model="selectedTopProductField" class="w-full rounded-2xl border border-white/10 bg-[#2a2a2a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6]" @change="applyFilters">
                <option v-for="option in topMetricOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>
            <label class="space-y-2">
              <span class="text-sm font-medium text-[#d3d3d3]">Топ категорий</span>
              <select v-model="selectedTopCategoryField" class="w-full rounded-2xl border border-white/10 bg-[#2a2a2a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6]" @change="applyFilters">
                <option v-for="option in topMetricOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>
          </div>
        </section>
      </div>

      <div class="grid gap-4 xl:grid-cols-2">
        <ProductStatsTable :rows="productData?.top_products || []" :loading="loading" />
        <ReportDataTable
          title="Топ категорий"
          description="Категории по выбранной метрике."
          :columns="categoryColumns"
          :rows="productData?.top_categories || []"
          :loading="loading"
          empty-text="Категории не найдены"
        />
      </div>

      <div class="grid gap-4 xl:grid-cols-2">
        <SellerStatsTable :rows="sellerTableRows" :loading="loading" />

        <section class="rounded-[28px] border border-white/10 bg-[#202020] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.18)]">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 class="text-[20px] font-semibold">Клиенты</h3>
              <p class="mt-2 text-sm text-[#a3a3a3]">Частично зависит от приближенного backend-расчета.</p>
            </div>
            <div class="flex gap-3 text-sm">
              <div class="rounded-2xl bg-white/5 px-4 py-3">
                <div class="text-slate-400">Новые</div>
                <div class="mt-1 font-semibold">{{ formatCount(customerData?.new_count || 0) }}</div>
              </div>
              <div class="rounded-2xl bg-white/5 px-4 py-3">
                <div class="text-slate-400">Повторные</div>
                <div class="mt-1 font-semibold">{{ formatCount(customerData?.returned_count || 0) }}</div>
              </div>
            </div>
          </div>

          <div class="mt-5 grid gap-4 lg:grid-cols-2">
            <ReportChartCard
              title="Клиентская динамика"
              description="График по выбранным магазинам."
              :points="customerData?.shop_plot || []"
            />

            <div class="space-y-4">
              <div class="rounded-[22px] border border-white/10 bg-[#181818] p-4">
                <div class="text-sm text-slate-400">Топ клиент</div>
                <div v-if="customerData?.top_client" class="mt-3">
                  <div class="text-lg font-semibold">{{ customerData.top_client.name }}</div>
                  <div class="mt-1 text-sm text-slate-400">{{ customerData.top_client.subtitle || "Без доп. данных" }}</div>
                  <div class="mt-3 text-[22px] font-bold text-[#1f78ff]">{{ formatMoney(customerData.top_client.value) }}</div>
                </div>
                <div v-else class="mt-3 text-sm text-slate-400">Нет данных</div>
              </div>

              <div class="rounded-[22px] border border-white/10 bg-[#181818] p-4">
                <div class="text-sm text-slate-400">Топ транзакция</div>
                <div v-if="customerData?.top_transaction" class="mt-3">
                  <div class="text-lg font-semibold">{{ customerData.top_transaction.name }}</div>
                  <div class="mt-1 text-sm text-slate-400">{{ customerData.top_transaction.subtitle || "Без доп. данных" }}</div>
                  <div class="mt-3 text-[22px] font-bold text-[#1f78ff]">{{ formatMoney(customerData.top_transaction.value) }}</div>
                </div>
                <div v-else class="mt-3 text-sm text-slate-400">Нет данных</div>
              </div>
            </div>
          </div>

          <div class="mt-5">
            <ReportDataTable
              title="Статистика по магазинам"
              description="Новые и повторные клиенты по выбранным магазинам."
              :columns="customerColumns"
              :rows="customerData?.shop_stats || []"
              :loading="loading"
              empty-text="Нет данных по клиентам"
            />
          </div>
        </section>
      </div>

      <section v-if="sellerData?.count_others" class="rounded-[28px] border border-white/10 bg-[#202020] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.18)]">
        <h3 class="text-[20px] font-semibold">Остальные продавцы</h3>
        <p class="mt-2 text-sm text-[#a3a3a3]">Количество вне топа: {{ formatCount(sellerData.count_others) }}</p>
        <div class="mt-4 grid gap-3 md:grid-cols-2">
          <div v-for="seller in sellerData.other_sellers" :key="seller.id" class="rounded-[18px] bg-white/[0.04] px-4 py-3">
            <div class="font-semibold">{{ seller.name }}</div>
            <div class="mt-2 text-sm text-slate-400">Чистая выручка: {{ formatMoney(seller.net_sales) }}</div>
            <div class="mt-1 text-sm text-slate-400">Прибыль: {{ formatMoney(seller.net_profit) }}</div>
          </div>
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
