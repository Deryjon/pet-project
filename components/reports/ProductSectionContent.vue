<script setup lang="ts">
import { useHead, useRouter } from "#imports";
import { computed, ref, watch } from "vue";
import ReportChartCard from "~/components/reports/ReportChartCard.vue";
import ReportDataTable from "~/components/reports/ReportDataTable.vue";
import ReportKpiCard from "~/components/reports/ReportKpiCard.vue";
import { useReportsApi, type ReportFilterQuery, type ReportPoint } from "~/composables/useReportsApi";
import { productReportSections, type ProductSectionKey } from "~/constants/reports/productSections";
import { useUserStore } from "~/store/useUserStore";

type KpiItem = {
  title: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "primary";
};

type ProductValueRow = {
  id: string;
  name: string;
  value: number;
};

const props = defineProps<{
  section: ProductSectionKey;
}>();

const router = useRouter();
const reportsApi = useReportsApi();
const userStore = useUserStore();

const loading = ref(false);
const activeTab = ref<"dashboard" | "table">("dashboard");
const selectedDate = ref(formatDateInput(new Date()));
const selectedShopId = ref("all");
const selectedSupplier = ref("all");
const selectedImportType = ref("all");
const selectedDetailization = ref("day");
const selectedPriceType = ref("all");
const selectedGrouping = ref("all");
const rows = ref<Record<string, any>[]>([]);
const sectionKpis = ref<KpiItem[]>([]);
const tableTitle = ref("");
const tableDescription = ref("");
const emptyText = ref("Данные не найдены");
const chartPoints = ref<ReportPoint[]>([]);
const productValues = ref<ProductValueRow[]>([]);

const sectionMeta = computed(() =>
  productReportSections.find((item) => item.key === props.section),
);

const isSales = computed(() => props.section === "sales-by-products");
const isEfficiency = computed(() => props.section === "product-efficiency");
const isImports = computed(() => props.section === "imports");
const isSupplier = computed(() => props.section === "sales-by-suppliers");
const isLeftover = computed(() => props.section === "stock-balance");

useHead(() => ({
  title: `Отчет ${sectionMeta.value?.title || "по товарам"} | Konkurent`,
}));

const shopOptions = computed(() => {
  const userShops = userStore.userState.shops || [];
  const normalized = userShops.length
    ? userShops.map((shop) => ({
        value: String(shop.id),
        label: shop.name,
      }))
    : userStore.userState.currentShopId
      ? [{ value: String(userStore.userState.currentShopId), label: userStore.userState.currentShopName || "Магазин" }]
      : [];

  return [{ value: "all", label: "Все магазины" }, ...normalized];
});

const currentShopLabel = computed(
  () => shopOptions.value.find((shop) => shop.value === selectedShopId.value)?.label || "Все магазины",
);

const supplierOptions = computed(() => {
  const map = new Map<string, string>();
  rows.value.forEach((row) => {
    const value = String(row.supplier_name ?? row.product_suppliers ?? "").trim();
    if (value) map.set(value, value);
  });
  return [{ value: "all", label: "Все поставщики" }, ...Array.from(map.values()).map((value) => ({ value, label: value }))];
});

const importTypeOptions = computed(() => {
  const map = new Map<string, string>();
  rows.value.forEach((row) => {
    const value = String(row.import_type ?? "").trim();
    if (value) map.set(value, value);
  });
  return [
    { value: "all", label: "Импорт и Заказ" },
    ...Array.from(map.values()).map((value) => ({ value, label: value })),
  ];
});

const displayedRows = computed(() => {
  return rows.value.filter((row) => {
    if (selectedSupplier.value !== "all") {
      const rowSupplier = String(row.supplier_name ?? row.product_suppliers ?? "").trim();
      if (rowSupplier !== selectedSupplier.value) return false;
    }

    if (selectedImportType.value !== "all") {
      const rowImportType = String(row.import_type ?? "").trim();
      if (rowImportType !== selectedImportType.value) return false;
    }

    return true;
  });
});

const salesSummaryCards = computed(() => [
  {
    title: "Продано товаров",
    value: sectionKpis.value[0]?.value || "0 шт",
    tone: "primary" as const,
  },
  {
    title: "Возвращено товаров",
    value: sectionKpis.value[1]?.value || "0 шт",
    tone: "warning" as const,
  },
  {
    title: "Чистая выручка",
    value: sectionKpis.value[2]?.value || "0 UZS",
    tone: "neutral" as const,
  },
  {
    title: "Валовая прибыль",
    value: sectionKpis.value[3]?.value || "0 UZS",
    tone: "success" as const,
  },
]);

const topProductsRows = computed(() =>
  [...displayedRows.value]
    .sort((a, b) => Number(b.net_sales || 0) - Number(a.net_sales || 0))
    .slice(0, 10),
);

const salesProductValueRows = computed(() => {
  const total = productValues.value.reduce((sum, row) => sum + row.value, 0);
  return productValues.value.slice(0, 5).map((row) => ({
    ...row,
    percent: total ? Math.round((row.value / total) * 100) : 0,
  }));
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

const performanceColumns = [
  { key: "shop_name", label: "Магазин" },
  { key: "name", label: "Наименование" },
  { key: "sku", label: "SKU" },
  { key: "bar_code", label: "Штрихкод" },
  { key: "brand_name", label: "Бренд" },
  { key: "supplier_name", label: "Поставщик" },
  { key: "stock_amount_begin", label: "Остаток на начало", align: "right", formatter: quantity },
  { key: "import_amount", label: "Импорт", align: "right", formatter: quantity },
  { key: "sold_amount", label: "Продано", align: "right", formatter: quantity },
  { key: "returned_amount", label: "Возврат", align: "right", formatter: quantity },
  { key: "write_off_amount", label: "Списание", align: "right", formatter: quantity },
  { key: "stock_amount_end", label: "Остаток на конец", align: "right", formatter: quantity },
  { key: "sellout_by_days", label: "Оборачиваемость, дни", align: "right", formatter: decimal },
];

const importColumns = [
  { key: "date", label: "Дата" },
  { key: "shop_name", label: "Магазин" },
  { key: "import_name", label: "Импорт" },
  { key: "product_name", label: "Наименование" },
  { key: "product_barcode", label: "Штрихкод" },
  { key: "product_sku", label: "SKU" },
  { key: "import_type", label: "Тип" },
  { key: "imported_qty", label: "Импортировано", align: "right", formatter: quantity },
  { key: "imported_supply_sum", label: "Сумма закупки", align: "right", formatter: money },
  { key: "sold_qty", label: "Продано", align: "right", formatter: quantity },
  { key: "sold_sale_sum", label: "Сумма продаж", align: "right", formatter: money },
  { key: "left_qty", label: "Остаток", align: "right", formatter: quantity },
];

const supplierColumns = [
  { key: "shop_name", label: "Магазин" },
  { key: "date", label: "Дата" },
  { key: "product_suppliers", label: "Поставщик" },
  { key: "product_name", label: "Наименование" },
  { key: "product_sku", label: "SKU" },
  { key: "product_barcode", label: "Штрихкод" },
  { key: "sold_measurement_value", label: "Продано", align: "right", formatter: quantity },
  { key: "returned_measurement_value", label: "Возврат", align: "right", formatter: quantity },
  { key: "net_sold_measurement_value", label: "Итого", align: "right", formatter: quantity },
  { key: "net_sales", label: "Чистая выручка", align: "right", formatter: money },
];

const stockColumns = [
  { key: "shop_name", label: "Магазин" },
  { key: "product_name", label: "Наименование" },
  { key: "product_sku", label: "SKU" },
  { key: "product_barcode", label: "Штрихкод" },
  { key: "supplier_name", label: "Поставщик" },
  { key: "supply_price", label: "Закупка", align: "right", formatter: money },
  { key: "retail_price", label: "Продажа", align: "right", formatter: money },
  { key: "measurement_value", label: "Количество", align: "right", formatter: quantity },
  { key: "estimated_margin", label: "Маржа", align: "right", formatter: percent },
  { key: "last_import", label: "Последний импорт" },
  { key: "estimated_income", label: "Потенциальный доход", align: "right", formatter: money },
];

const tableColumns = computed(() => {
  switch (props.section) {
    case "product-efficiency":
      return performanceColumns;
    case "imports":
      return importColumns;
    case "sales-by-suppliers":
      return supplierColumns;
    case "stock-balance":
      return stockColumns;
    default:
      return salesColumns;
  }
});

watch(shopOptions, (options) => {
  if (selectedShopId.value !== "all" && !options.some((option) => option.value === selectedShopId.value)) {
    selectedShopId.value = "all";
  }
}, { immediate: true });

watch(() => props.section, () => {
  activeTab.value = "dashboard";
  selectedSupplier.value = "all";
  selectedImportType.value = "all";
  void loadPage();
}, { immediate: true });

watch([selectedDate, selectedShopId], () => {
  void loadPage();
});

watch([selectedDetailization, selectedPriceType, selectedGrouping], () => {
  if (isSupplier.value || isEfficiency.value) {
    void loadPage();
  }
});

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

function money(value: unknown) {
  return `${Intl.NumberFormat("ru-RU").format(Math.round(Number(value || 0)))} UZS`;
}

function quantity(value: unknown) {
  return `${Intl.NumberFormat("ru-RU").format(Math.round(Number(value || 0)))} шт`;
}

function count(value: unknown) {
  return Intl.NumberFormat("ru-RU").format(Math.round(Number(value || 0)));
}

function decimal(value: unknown) {
  return Number(value || 0).toFixed(2);
}

function percent(value: unknown) {
  return `${Number(value || 0).toFixed(0)} %`;
}

function normalizeChartPoints(points: any[]) {
  return points
    .map((point, index) => {
      if (typeof point === "number") {
        return { label: String(index + 1), value: point };
      }

      const label = String(point?.label ?? point?.name ?? point?.date ?? point?.x ?? index + 1);
      const value = Number(point?.value ?? point?.net_sales ?? point?.y ?? 0);
      return { label, value };
    })
    .filter((point) => point.label && Number.isFinite(point.value));
}

function baseQuery(): ReportFilterQuery {
  return {
    from: selectedDate.value,
    to: selectedDate.value,
    startDate: selectedDate.value,
    endDate: selectedDate.value,
    reportDate: selectedDate.value,
    page: 1,
    limit: 100,
    currency: "UZS",
    detalization: selectedDetailization.value,
    shopId: selectedShopId.value === "all" ? undefined : selectedShopId.value,
    priceType: selectedPriceType.value === "all" ? undefined : selectedPriceType.value,
  };
}

async function loadSalesByProducts() {
  const query = baseQuery();
  const [summary, table, sales] = await Promise.all([
    reportsApi.getProductGeneralReport(query),
    reportsApi.getProductGeneralTable(query),
    reportsApi.getProductSales(query),
  ]);

  rows.value = table.rows;
  sectionKpis.value = [
    { title: "Продано товаров", value: quantity(summary.product_sold), tone: "primary" },
    { title: "Возвращено товаров", value: quantity(summary.product_returned), tone: "warning" },
    { title: "Чистая выручка", value: money(summary.net_gross_sales), tone: "neutral" },
    { title: "Валовая прибыль", value: money(summary.net_gross_profit), tone: "success" },
  ];
  chartPoints.value = normalizeChartPoints(sales.product_plot || []);
  productValues.value = sales.product_values || [];
  tableTitle.value = "Продажи по товарам";
  tableDescription.value = "Таблица продаж по товарам за выбранный период.";
  emptyText.value = "Продажи по товарам не найдены";
}

async function loadProductEfficiency() {
  const query = baseQuery();
  const [table, totals] = await Promise.all([
    reportsApi.getProductPerformanceTable({
      ...query,
      groupWithoutShop: selectedGrouping.value !== "all",
      groupWithSupplier: true,
    }),
    reportsApi.getProductPerformanceTotals({
      ...query,
      groupWithoutShop: selectedGrouping.value !== "all",
      groupWithSupplier: true,
    }),
  ]);

  rows.value = table.rows;
  sectionKpis.value = [
    { title: "Остаток на начало", value: quantity(totals.totals?.stock_amount_begin), tone: "neutral" },
    { title: "Остаток на конец", value: quantity(totals.totals?.stock_amount_end), tone: "primary" },
    { title: "Импорт", value: quantity(totals.totals?.import_amount), tone: "warning" },
    { title: "Продано", value: quantity(totals.totals?.sold_amount), tone: "success" },
    { title: "Возврат", value: quantity(totals.totals?.returned_amount), tone: "danger" },
  ];
  chartPoints.value = [];
  productValues.value = [];
  tableTitle.value = "Эффективность товаров";
  tableDescription.value = "Движение товаров по складу и продажам за выбранную дату.";
  emptyText.value = "Данные по эффективности товаров не найдены";
}

async function loadImports() {
  const query = baseQuery();
  const [table, totals] = await Promise.all([
    reportsApi.getImportReportTable(query),
    reportsApi.getImportReportTotals(query),
  ]);

  rows.value = table.rows.map((row) => ({
    ...row,
    product_barcode: row.product_barcode ?? row.bar_code ?? "",
  }));
  sectionKpis.value = [
    { title: "Импортировано", value: quantity(totals?.imported), tone: "primary" },
    { title: "Сумма закупки", value: money(totals?.imported_supply_sum), tone: "neutral" },
    { title: "Продано", value: quantity(totals?.sold), tone: "success" },
    { title: "Сумма продаж", value: money(totals?.sold_sale_sum), tone: "success" },
    { title: "Остаток", value: quantity(totals?.left), tone: "warning" },
  ];
  chartPoints.value = [];
  productValues.value = [];
  tableTitle.value = "Импорты";
  tableDescription.value = "Список импортов и заказов за выбранный день.";
  emptyText.value = "Импорты не найдены";
}

async function loadSalesBySuppliers() {
  const query = baseQuery();
  const table = await reportsApi.getProductSuppliersTable({
    ...query,
    groupWithoutShops: selectedGrouping.value !== "all",
    allSuppliers: true,
  });

  rows.value = table.rows.map((row) => ({
    ...row,
    product_barcode: row.product_barcode ?? row.bar_code ?? "",
  }));
  sectionKpis.value = [
    { title: "Продано", value: quantity(table.totals?.sold_measurement_value), tone: "primary" },
    { title: "Возвращено", value: quantity(table.totals?.returned_measurement_value), tone: "warning" },
    { title: "Итого", value: quantity(table.totals?.net_sold_measurement_value), tone: "neutral" },
    { title: "Чистая выручка", value: money(table.totals?.net_sales), tone: "success" },
  ];
  chartPoints.value = [];
  productValues.value = [];
  tableTitle.value = "Продажи по поставщикам";
  tableDescription.value = "Продажи товаров в разрезе поставщиков и магазинов.";
  emptyText.value = "Продажи по поставщикам не найдены";
}

async function loadStockBalance() {
  const query = baseQuery();
  const table = await reportsApi.getProductStocks(query);

  rows.value = table.rows;
  const totalQty = table.rows.reduce((sum, row) => sum + Number(row.measurement_value || 0), 0);
  const totalSupply = table.rows.reduce((sum, row) => sum + Number(row.supply_price || 0) * Number(row.measurement_value || 0), 0);
  const totalRetail = table.rows.reduce((sum, row) => sum + Number(row.retail_price || 0) * Number(row.measurement_value || 0), 0);

  sectionKpis.value = [
    { title: "Позиций", value: count(table.count), tone: "primary" },
    { title: "Количество", value: quantity(totalQty), tone: "neutral" },
    { title: "Сумма закупки", value: money(totalSupply), tone: "warning" },
    { title: "Сумма продажи", value: money(totalRetail), tone: "success" },
    { title: "Потенциальный доход", value: money(totalRetail - totalSupply), tone: "danger" },
  ];
  chartPoints.value = [];
  productValues.value = [];
  tableTitle.value = "Отчет по остаткам";
  tableDescription.value = "Текущие остатки товара по филиалам.";
  emptyText.value = "Остатки не найдены";
}

async function loadPage() {
  loading.value = true;
  try {
    switch (props.section) {
      case "product-efficiency":
        await loadProductEfficiency();
        break;
      case "imports":
        await loadImports();
        break;
      case "sales-by-suppliers":
        await loadSalesBySuppliers();
        break;
      case "stock-balance":
        await loadStockBalance();
        break;
      default:
        await loadSalesByProducts();
        break;
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="space-y-6 text-white">
    <header class="space-y-4">
      <div class="flex items-center gap-3">
        <button
          type="button"
          aria-label="Назад"
          class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#232323] text-white transition hover:border-white/20 hover:bg-[#2d2d2d]"
          @click="goBack"
        >
          <Icon name="heroicons:arrow-left" class="h-5 w-5" />
        </button>

        <h1 class="flex items-center gap-2 text-[32px] font-bold tracking-[-0.04em]">
          <span class="text-[#bdbdbd]">Отчет</span>
          <span>{{ sectionMeta?.title }}</span>
        </h1>
      </div>

      <div class="flex flex-wrap gap-3">
        <AppDatePicker
          v-model="selectedDate"
          placeholder="Выберите дату"
          class="w-[220px]"
        />

        <template v-if="isSales || isLeftover">
          <label class="relative">
            <select
              v-model="selectedShopId"
              class="h-[54px] min-w-[220px] appearance-none rounded-[18px] border border-white/10 bg-white/5 px-4 pr-11 text-[15px] font-semibold text-white outline-none transition hover:bg-white/10 focus:border-[#1f78ff]"
            >
              <option v-for="shop in shopOptions" :key="shop.value" :value="shop.value" class="bg-[#202020] text-white">
                {{ shop.label }}
              </option>
            </select>
            <Icon name="heroicons:building-storefront" class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-300" />
          </label>
        </template>

        <template v-if="isEfficiency">
          <label class="relative">
            <select
              v-model="selectedSupplier"
              class="h-[54px] min-w-[220px] appearance-none rounded-[18px] border border-white/10 bg-white/5 px-4 pr-11 text-[15px] font-semibold text-white outline-none transition hover:bg-white/10 focus:border-[#1f78ff]"
            >
              <option v-for="supplier in supplierOptions" :key="supplier.value" :value="supplier.value" class="bg-[#202020] text-white">
                {{ supplier.label }}
              </option>
            </select>
            <Icon name="heroicons:truck" class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-300" />
          </label>

          <label class="relative">
            <select
              v-model="selectedShopId"
              class="h-[54px] min-w-[220px] appearance-none rounded-[18px] border border-white/10 bg-white/5 px-4 pr-11 text-[15px] font-semibold text-white outline-none transition hover:bg-white/10 focus:border-[#1f78ff]"
            >
              <option v-for="shop in shopOptions" :key="shop.value" :value="shop.value" class="bg-[#202020] text-white">
                {{ shop.label }}
              </option>
            </select>
            <Icon name="heroicons:building-storefront" class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-300" />
          </label>

          <label class="relative">
            <select
              v-model="selectedGrouping"
              class="h-[54px] min-w-[220px] appearance-none rounded-[18px] border border-white/10 bg-white/5 px-4 pr-11 text-[15px] font-semibold text-white outline-none transition hover:bg-white/10 focus:border-[#1f78ff]"
            >
              <option value="all" class="bg-[#202020] text-white">Все магазины</option>
              <option value="split" class="bg-[#202020] text-white">Не объединять</option>
            </select>
            <Icon name="heroicons:rectangle-group" class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-300" />
          </label>
        </template>

        <template v-if="isImports">
          <label class="relative">
            <select
              v-model="selectedImportType"
              class="h-[54px] min-w-[220px] appearance-none rounded-[18px] border border-white/10 bg-white/5 px-4 pr-11 text-[15px] font-semibold text-white outline-none transition hover:bg-white/10 focus:border-[#1f78ff]"
            >
              <option v-for="option in importTypeOptions" :key="option.value" :value="option.value" class="bg-[#202020] text-white">
                {{ option.label }}
              </option>
            </select>
            <Icon name="heroicons:inbox-stack" class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-300" />
          </label>

          <label class="relative">
            <select
              v-model="selectedShopId"
              class="h-[54px] min-w-[220px] appearance-none rounded-[18px] border border-white/10 bg-white/5 px-4 pr-11 text-[15px] font-semibold text-white outline-none transition hover:bg-white/10 focus:border-[#1f78ff]"
            >
              <option v-for="shop in shopOptions" :key="shop.value" :value="shop.value" class="bg-[#202020] text-white">
                {{ shop.label }}
              </option>
            </select>
            <Icon name="heroicons:building-storefront" class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-300" />
          </label>
        </template>

        <template v-if="isSupplier">
          <label class="relative">
            <select
              v-model="selectedSupplier"
              class="h-[54px] min-w-[220px] appearance-none rounded-[18px] border border-white/10 bg-white/5 px-4 pr-11 text-[15px] font-semibold text-white outline-none transition hover:bg-white/10 focus:border-[#1f78ff]"
            >
              <option v-for="supplier in supplierOptions" :key="supplier.value" :value="supplier.value" class="bg-[#202020] text-white">
                {{ supplier.label }}
              </option>
            </select>
            <Icon name="heroicons:truck" class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-300" />
          </label>

          <label class="relative">
            <select
              v-model="selectedDetailization"
              class="h-[54px] min-w-[220px] appearance-none rounded-[18px] border border-white/10 bg-white/5 px-4 pr-11 text-[15px] font-semibold text-white outline-none transition hover:bg-white/10 focus:border-[#1f78ff]"
            >
              <option value="day" class="bg-[#202020] text-white">по дням</option>
              <option value="month" class="bg-[#202020] text-white">по месяцам</option>
            </select>
            <Icon name="heroicons:calendar-days" class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-300" />
          </label>

          <label class="relative">
            <select
              v-model="selectedGrouping"
              class="h-[54px] min-w-[220px] appearance-none rounded-[18px] border border-white/10 bg-white/5 px-4 pr-11 text-[15px] font-semibold text-white outline-none transition hover:bg-white/10 focus:border-[#1f78ff]"
            >
              <option value="all" class="bg-[#202020] text-white">Не объединять</option>
              <option value="split" class="bg-[#202020] text-white">Объединять</option>
            </select>
            <Icon name="heroicons:squares-2x2" class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-300" />
          </label>

          <label class="relative">
            <select
              v-model="selectedPriceType"
              class="h-[54px] min-w-[220px] appearance-none rounded-[18px] border border-white/10 bg-white/5 px-4 pr-11 text-[15px] font-semibold text-white outline-none transition hover:bg-white/10 focus:border-[#1f78ff]"
            >
              <option value="all" class="bg-[#202020] text-white">Все типы</option>
              <option value="0" class="bg-[#202020] text-white">Розничная цена</option>
              <option value="1" class="bg-[#202020] text-white">Другая цена</option>
            </select>
            <Icon name="heroicons:banknotes" class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-300" />
          </label>

          <label class="relative">
            <select
              v-model="selectedShopId"
              class="h-[54px] min-w-[220px] appearance-none rounded-[18px] border border-white/10 bg-white/5 px-4 pr-11 text-[15px] font-semibold text-white outline-none transition hover:bg-white/10 focus:border-[#1f78ff]"
            >
              <option v-for="shop in shopOptions" :key="shop.value" :value="shop.value" class="bg-[#202020] text-white">
                {{ shop.label }}
              </option>
            </select>
            <Icon name="heroicons:building-storefront" class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-300" />
          </label>
        </template>
      </div>
    </header>

    <div v-if="isSales" class="flex w-full items-center gap-2 rounded-[18px] border border-white/10 bg-[#202020] p-1">
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

    <template v-if="isSales && activeTab === 'dashboard'">
      <section class="space-y-4">
        <div class="rounded-[28px] border border-white/10 bg-[#202020] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.18)]">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7fb0ff]">Общая статистика</p>
              <h3 class="mt-2 text-[20px] font-semibold text-white">Продажи по товарам</h3>
            </div>
            <p class="text-sm text-slate-400">{{ humanDate(selectedDate) }} • {{ currentShopLabel }}</p>
          </div>

          <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ReportKpiCard
              v-for="kpi in salesSummaryCards"
              :key="kpi.title"
              :title="kpi.title"
              :value="kpi.value"
              :tone="kpi.tone"
            />
          </div>
        </div>

        <div class="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_420px]">
          <ReportChartCard
            title="Продажи по продуктам"
            :description="`${humanDate(selectedDate)} • ${currentShopLabel}`"
            :points="chartPoints"
            value-suffix=" UZS"
          />

          <section class="rounded-[28px] border border-white/10 bg-[#202020] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.18)]">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-[20px] font-semibold">Наименование</h3>
                <p class="mt-2 text-sm text-[#a3a3a3]">Выбранный период {{ humanDate(selectedDate) }}</p>
              </div>
              <div class="text-right">
                <div class="text-xs uppercase tracking-[0.14em] text-slate-500">Общее кол-во</div>
                <div class="mt-2 text-[24px] font-bold text-[#8ec8ff]">
                  {{ money(productValues.reduce((sum, row) => sum + row.value, 0)) }}
                </div>
              </div>
            </div>

            <div class="mt-5 space-y-3">
              <div
                v-for="row in salesProductValueRows"
                :key="row.id"
                class="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
              >
                <div class="font-semibold text-white">{{ row.name }}</div>
                <div class="mt-2 text-sm text-slate-300">{{ money(row.value) }} | {{ row.percent }}%</div>
              </div>
            </div>
          </section>
        </div>

        <ReportDataTable
          title="Перформанс продуктов"
          :description="`${humanDate(selectedDate)} • ${currentShopLabel}`"
          :columns="topProductColumns"
          :rows="topProductsRows"
          :loading="loading"
          empty-text="Нет данных по топ-продуктам"
        />
      </section>
    </template>

    <template v-else>
      <div v-if="!isSales" class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <ReportKpiCard
          v-for="kpi in sectionKpis"
          :key="kpi.title"
          :title="kpi.title"
          :value="kpi.value"
          :hint="kpi.hint"
          :tone="kpi.tone"
        />
      </div>

      <ReportDataTable
        :title="tableTitle"
        :description="tableDescription"
        :columns="tableColumns"
        :rows="displayedRows"
        :loading="loading"
        :empty-text="emptyText"
      />
    </template>
  </section>
</template>
