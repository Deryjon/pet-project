<script setup lang="ts">
import { useHead, useRouter } from "#imports";
import { computed, ref, watch } from "vue";
import ReportDataTable from "~/components/reports/ReportDataTable.vue";
import ReportKpiCard from "~/components/reports/ReportKpiCard.vue";
import { useReportsApi, type ReportFilterQuery, type ReportPoint } from "~/composables/useReportsApi";
import { useUserStore } from "~/store/useUserStore";

useHead({ title: "Отчет Продажи по товарам | Konkurent" });

type ProductValueRow = {
  id: string;
  name: string;
  value: number;
  percent: number;
};

const router = useRouter();
const reportsApi = useReportsApi();
const userStore = useUserStore();

const loading = ref(false);
const activeTab = ref<"dashboard" | "table">("dashboard");
const selectedDate = ref(formatDateInput(new Date()));
const selectedShopId = ref("all");
const chartPoints = ref<ReportPoint[]>([]);
const productValues = ref<ProductValueRow[]>([]);
const rows = ref<Record<string, any>[]>([]);
const topProducts = ref<Record<string, any>[]>([]);
const summary = ref({
  sold: 0,
  returned: 0,
  netSales: 0,
  grossProfit: 0,
});

const shopOptions = computed(() => {
  const shops = userStore.userState.shops || [];
  const normalized = shops.length
    ? shops.map((shop) => ({
        value: String(shop.id),
        label: shop.name,
      }))
    : userStore.userState.currentShopId
      ? [{
          value: String(userStore.userState.currentShopId),
          label: userStore.userState.currentShopName || "Магазин",
        }]
      : [];

  return [{ value: "all", label: "Все магазины" }, ...normalized];
});

const currentShopLabel = computed(
  () => shopOptions.value.find((shop) => shop.value === selectedShopId.value)?.label || "Все магазины",
);

const summaryCards = computed(() => [
  { title: "Продано товаров", value: quantity(summary.value.sold), tone: "primary" as const },
  { title: "Возвращено товаров", value: quantity(summary.value.returned), tone: "warning" as const },
  { title: "Чистая выручка", value: money(summary.value.netSales), tone: "neutral" as const },
  { title: "Валовая прибыль", value: money(summary.value.grossProfit), tone: "success" as const },
]);

const totalProductValue = computed(() => summary.value.netSales);

const topProductsRows = computed(() => topProducts.value.slice(0, 10));

const chartTicks = computed(() => {
  const max = Math.max(280000, ...chartPoints.value.map((point) => point.value), summary.value.netSales);
  const step = Math.max(70000, Math.ceil(max / 4 / 1000) * 1000);
  return [0, step, step * 2, step * 3, step * 4];
});

const topProductColumns = [
  { key: "product_name", label: "Наименование" },
  { key: "net_sales", label: "Чистая выручка", align: "right", formatter: money },
  { key: "net_profit", label: "Валовая прибыль", align: "right", formatter: money },
  { key: "sold_measurement_value", label: "Количество", align: "right", formatter: quantity },
];

const salesColumns = [
  { key: "date", label: "Дата" },
  { key: "shop_name", label: "Магазин" },
  { key: "product_name", label: "Товар" },
  { key: "product_sku", label: "SKU" },
  { key: "product_barcode", label: "Штрихкод" },
  { key: "product_brand_name", label: "Бренд" },
  { key: "sold_measurement_value", label: "Продано", align: "right", formatter: quantity },
  { key: "returned_measurement_value", label: "Возвращено", align: "right", formatter: quantity },
  { key: "net_sales", label: "Чистая выручка", align: "right", formatter: money },
  { key: "net_profit", label: "Валовая прибыль", align: "right", formatter: money },
];

watch(
  shopOptions,
  (options) => {
    if (selectedShopId.value !== "all" && !options.some((option) => option.value === selectedShopId.value)) {
      selectedShopId.value = "all";
    }
  },
  { immediate: true },
);

watch(
  [selectedDate, selectedShopId],
  () => {
    void loadPage();
  },
  { immediate: true },
);

function goBack() {
  router.back();
}

function formatDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function humanDate(value: string) {
  if (!value) return "Не выбрано";
  const [year, month, day] = value.split("-");
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

function money(value: unknown) {
  return `${Intl.NumberFormat("ru-RU").format(Math.round(Number(value || 0)))} UZS`;
}

function quantity(value: unknown) {
  return `${Intl.NumberFormat("ru-RU").format(Math.round(Number(value || 0)))} шт`;
}

function compactMoney(value: number) {
  if (value === 0) return "0";
  if (Math.abs(value) >= 1000) {
    return `${Math.round(value / 1000)} K`;
  }
  return Intl.NumberFormat("ru-RU").format(Math.round(value));
}

function normalizeChartPoints(points: any[]) {
  return points
    .map((point, index) => {
      if (typeof point === "number") {
        return { label: String(index + 1), value: point };
      }

      const rawLabel = String(point?.label ?? point?.name ?? point?.date ?? point?.x ?? index + 1);
      const label = rawLabel.includes(" ") ? rawLabel.slice(0, 10) : rawLabel;
      const value = Number(point?.value ?? point?.net_sales ?? point?.y ?? 0);
      return { label, value };
    })
    .filter((point) => point.label && Number.isFinite(point.value));
}

function baseQuery(): ReportFilterQuery {
  return {
    from: selectedDate.value,
    to: selectedDate.value,
    dateFrom: selectedDate.value,
    dateTo: selectedDate.value,
    startDate: selectedDate.value,
    endDate: selectedDate.value,
    reportDate: selectedDate.value,
    page: 1,
    limit: 100,
    perPage: 100,
    currency: "UZS",
    detalization: "day",
    shopId: selectedShopId.value === "all" ? undefined : selectedShopId.value,
    priceType: 1,
  };
}

async function loadPage() {
  loading.value = true;
  try {
    const query = baseQuery();
    const [summaryData, salesData, salesChart] = await Promise.all([
      reportsApi.getV1ProductsSummaryResolved(query),
      reportsApi.getV1ProductsSalesResolved(query),
      reportsApi.getV1ProductSalesReportResolved({
        ...query,
        field: "net_sales",
        groupBy: "name",
      }),
    ]);

    summary.value = {
      sold: Number(salesData.summary?.products_sold || 0),
      returned: Number(salesData.summary?.returns_count || 0),
      netSales: Number(salesData.summary?.net_gross_sales || 0),
      grossProfit: Number(salesData.summary?.gross_profit || 0),
    };

    rows.value = salesData.rows || [];
    topProducts.value = summaryData.top_selling_products?.length
      ? summaryData.top_selling_products
      : salesData.top_selling_products || [];
    chartPoints.value = normalizeChartPoints(salesChart.product_plot || []);

    const total = Number(salesData.summary?.net_gross_sales || 0);
    productValues.value = (salesData.rows || []).map((row: any, index: number) => ({
      id: String(row.id ?? row.product_id ?? index),
      name: String(row.product_name ?? row.name ?? "Товар"),
      value: Number(row.net_sales || 0),
      percent: total ? Math.round((Number(row.net_sales || 0) / total) * 100) : 0,
    }));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="space-y-6 text-white">
    <header class="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(41,121,255,0.28),transparent_34%),linear-gradient(145deg,#1f1f1f_0%,#111111_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-7">
      <div class="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.03)_45%,transparent_100%)]" />
      <div class="relative space-y-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <button
                type="button"
                aria-label="Назад"
                class="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur transition hover:border-white/20 hover:bg-white/10"
                @click="goBack"
              >
                <Icon name="heroicons:arrow-left" class="h-5 w-5" />
              </button>

              <div class="space-y-1">
                <div class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#89b9ff]">Product Sales Report</div>
                <h1 class="text-[30px] font-bold tracking-[-0.05em] text-white sm:text-[36px]">
                  Отчет Продажи по товарам
                </h1>
              </div>
            </div>

            <p class="max-w-2xl text-sm leading-6 text-slate-300">
              Аналитика по выручке, прибыли и структуре продаж за выбранный день с разрезом по магазинам и товарам.
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur">
              <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Период</div>
              <div class="mt-2 text-lg font-semibold text-white">{{ humanDate(selectedDate) }}</div>
            </div>
            <div class="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur">
              <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Магазины</div>
              <div class="mt-2 text-lg font-semibold text-white">{{ currentShopLabel }}</div>
            </div>
          </div>
        </div>

        <div class="grid gap-3 lg:grid-cols-[220px_minmax(260px,320px)] lg:justify-between">
          <AppDatePicker
            v-model="selectedDate"
            placeholder="Выберите дату"
            class="w-full"
          />

          <label class="relative">
            <select
              v-model="selectedShopId"
              class="h-[56px] w-full appearance-none rounded-[20px] border border-white/10 bg-white/[0.06] px-4 pr-11 text-[15px] font-semibold text-white outline-none backdrop-blur transition hover:bg-white/[0.1] focus:border-[#4ea5ff]"
            >
              <option
                v-for="shop in shopOptions"
                :key="shop.value"
                :value="shop.value"
                class="bg-[#202020] text-white"
              >
                {{ shop.label }}
              </option>
            </select>
            <Icon
              name="heroicons:building-storefront"
              class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8ec8ff]"
            />
          </label>
        </div>
      </div>
    </header>

    <div class="flex w-full items-center gap-2 rounded-[22px] border border-white/10 bg-[#181818] p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
      <button
        type="button"
        class="flex h-12 flex-1 items-center justify-center gap-2 rounded-[16px] px-4 text-[15px] font-semibold transition"
        :class="activeTab === 'dashboard' ? 'bg-[linear-gradient(135deg,#4ea5ff_0%,#1f78ff_100%)] text-white shadow-[0_10px_24px_rgba(31,120,255,0.35)]' : 'text-slate-300 hover:bg-white/10 hover:text-white'"
        @click="activeTab = 'dashboard'"
      >
        <Icon name="heroicons:squares-2x2" class="h-4 w-4" />
        Дашборд
      </button>
      <button
        type="button"
        class="flex h-12 flex-1 items-center justify-center gap-2 rounded-[16px] px-4 text-[15px] font-semibold transition"
        :class="activeTab === 'table' ? 'bg-[linear-gradient(135deg,#4ea5ff_0%,#1f78ff_100%)] text-white shadow-[0_10px_24px_rgba(31,120,255,0.35)]' : 'text-slate-300 hover:bg-white/10 hover:text-white'"
        @click="activeTab = 'table'"
      >
        <Icon name="heroicons:table-cells" class="h-4 w-4" />
        Таблица
      </button>
    </div>

    <template v-if="activeTab === 'dashboard'">
      <section class="space-y-6">
        <div class="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,#1d1d1d_0%,#151515_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7fb0ff]">Общая статистика</p>
              <h2 class="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">Ключевые показатели дня</h2>
            </div>
            <div class="text-sm text-slate-400">{{ humanDate(selectedDate) }} • {{ currentShopLabel }}</div>
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ReportKpiCard
              v-for="kpi in summaryCards"
              :key="kpi.title"
              :title="kpi.title"
              :value="kpi.value"
              :tone="kpi.tone"
            />
          </div>
        </div>

        <section class="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,#191919_0%,#131313_100%)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.26)]">
          <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7fb0ff]">Продажи по продуктам</div>
              <h3 class="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white">Структура чистой выручки</h3>
              <p class="mt-2 text-sm text-slate-400">{{ humanDate(selectedDate) }} • {{ currentShopLabel }}</p>
            </div>

            <div class="grid gap-2 sm:grid-cols-3">
              <div class="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3">
                <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Метрика</div>
                <div class="mt-2 text-sm font-semibold text-white">Чистая выручка</div>
              </div>
              <div class="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3">
                <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Детализация</div>
                <div class="mt-2 text-sm font-semibold text-white">По дням</div>
              </div>
              <div class="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3">
                <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Группировка</div>
                <div class="mt-2 text-sm font-semibold text-white">Наименование</div>
              </div>
            </div>
          </div>

          <div class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
            <div class="rounded-[26px] border border-white/10 bg-[#111111] p-5">
              <div class="grid gap-4 xl:grid-cols-[72px_minmax(0,1fr)]">
                <div class="flex h-[280px] flex-col justify-between pt-2 text-right text-xs font-semibold text-slate-500">
                  <span v-for="tick in [...chartTicks].reverse()" :key="tick">{{ compactMoney(tick) }}</span>
                </div>

                <div class="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,#161616_0%,#0f0f0f_100%)] p-4">
                  <div class="mb-3 flex items-center justify-between">
                    <div class="text-sm font-semibold text-white">Наименование</div>
                    <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Динамика</div>
                  </div>

                  <div v-if="chartPoints.length" class="flex h-[228px] items-end gap-3 overflow-hidden">
                    <div
                      v-for="point in chartPoints"
                      :key="`${point.label}-${point.value}`"
                      class="flex min-w-0 flex-1 flex-col items-center gap-3"
                    >
                      <div class="relative flex w-full flex-1 items-end">
                        <div class="absolute inset-x-0 bottom-0 h-px bg-white/10" />
                        <div
                          class="relative w-full rounded-t-[18px] border border-[#79bfff]/20 bg-[linear-gradient(180deg,#79c1ff_0%,#2d8cff_55%,#1367ef_100%)] shadow-[0_14px_30px_rgba(19,103,239,0.28)]"
                          :style="{ height: `${Math.max(16, (point.value / Math.max(...chartTicks)) * 190)}px` }"
                        />
                      </div>
                      <div class="text-center text-[11px] tracking-[0.08em] text-[#8b8b8b]">
                        <div class="uppercase">{{ shortWeekday(point.label) || "дн" }}</div>
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

            <section class="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,#151515_0%,#101010_100%)] p-5">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="text-[22px] font-semibold tracking-[-0.03em] text-white">Наименование</h3>
                  <div class="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Выбранный период</div>
                  <div class="mt-1 text-sm text-white">{{ humanDate(selectedDate) }}</div>
                </div>
                <div class="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  {{ productValues.length }} поз.
                </div>
              </div>

              <div class="mt-5 max-h-[420px] space-y-3 overflow-auto pr-1">
                <div
                  v-for="(row, index) in productValues"
                  :key="row.id"
                  class="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
                >
                  <div class="flex items-start gap-3">
                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#78c1ff_0%,#1f78ff_100%)] text-sm font-bold text-white">
                      {{ index + 1 }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="truncate font-semibold text-white">{{ row.name }}</div>
                      <div class="mt-2 flex items-center justify-between gap-3 text-sm text-slate-300">
                        <span>{{ money(row.value) }}</span>
                        <span class="rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold text-[#8ec8ff]">
                          {{ row.percent }}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-5 rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(42,127,255,0.18),rgba(255,255,255,0.02))] p-5">
                <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Общее кол-во</div>
                <div class="mt-2 text-[30px] font-bold tracking-[-0.04em] text-[#9bd2ff]">{{ money(totalProductValue) }}</div>
              </div>
            </section>
          </div>
        </section>

        <div class="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,#171717_0%,#121212_100%)] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
          <ReportDataTable
            title="Перформанс продуктов"
            :description="`${humanDate(selectedDate)} • ${currentShopLabel}`"
            :columns="topProductColumns"
            :rows="topProductsRows"
            :loading="loading"
            empty-text="Нет данных по топ-10 продуктам"
          />
        </div>
      </section>
    </template>

    <div
      v-else
      class="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,#171717_0%,#121212_100%)] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.24)]"
    >
      <ReportDataTable
        title="Продажи по товарам"
        :description="`${humanDate(selectedDate)} • ${currentShopLabel}`"
        :columns="salesColumns"
        :rows="rows"
        :loading="loading"
        empty-text="Продажи по товарам не найдены"
      />
    </div>
  </section>
</template>
