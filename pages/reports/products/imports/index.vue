<script setup lang="ts">
import { useHead, useRouter } from "#imports";
import { computed, ref, watch } from "vue";
import ReportDataTable from "~/components/reports/ReportDataTable.vue";
import { useReportsApi, type ReportFilterQuery } from "~/composables/useReportsApi";
import { useUserStore } from "~/store/useUserStore";

type TableColumn = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  formatter?: (value: unknown, row: Record<string, any>) => string;
};

const router = useRouter();
const reportsApi = useReportsApi();
const userStore = useUserStore();

const loading = ref(false);
const selectedDate = ref(formatDateInput(new Date()));
const selectedImportType = ref("all");
const selectedShopId = ref("all");
const rows = ref<Record<string, any>[]>([]);

useHead({ title: "Отчет Импорты | Konkurent" });

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

  return [{ value: "all", label: "Все филиалы" }, ...normalized];
});

const importTypeOptions = [
  { value: "all", label: "Импорт и заказ" },
  { value: "import", label: "Импорт" },
  { value: "order", label: "Заказ" },
];

const displayedRows = computed(() => rows.value);

const hiddenKeys = new Set([
  "id",
  "__v",
  "_id",
  "product_id",
  "import_id",
  "shop_id",
  "supplier_id",
  "category_id",
  "brand_id",
  "created_at",
  "updated_at",
]);

const defaultColumns: TableColumn[] = [
  { key: "date", label: "Дата" },
  { key: "import_number", label: "Номер" },
  { key: "shop_name", label: "Филиал" },
  { key: "product_name", label: "Товар" },
  { key: "product_barcode", label: "Штрихкод" },
  { key: "product_sku", label: "SKU" },
  { key: "category_name", label: "Категория" },
  { key: "brand_name", label: "Бренд" },
  { key: "supplier_name", label: "Поставщик" },
];

const dynamicColumns = computed<TableColumn[]>(() => {
  const firstRow = displayedRows.value[0] ?? rows.value[0];
  if (!firstRow) {
    return defaultColumns;
  }

  const keys = Object.keys(firstRow).filter((key) => !hiddenKeys.has(key));
  const preferredKeys = [
    "date",
    "import_number",
    "shop_name",
    "product_name",
    "product_barcode",
    "product_sku",
    "category_name",
    "brand_name",
    "supplier_name",
  ];

  const orderedKeys = [
    ...preferredKeys.filter((key) => keys.includes(key)),
    ...keys.filter((key) => !preferredKeys.includes(key)),
  ];

  return orderedKeys.map((key) => ({
    key,
    label: columnLabel(key),
    align: columnAlign(key),
    formatter: columnFormatter(key),
  }));
});

watch(
  [selectedDate, selectedImportType, selectedShopId],
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

function money(value: unknown) {
  return `${Intl.NumberFormat("ru-RU").format(Math.round(Number(value || 0)))} UZS`;
}

function quantity(value: unknown) {
  return `${Intl.NumberFormat("ru-RU").format(Math.round(Number(value || 0)))} шт`;
}

function decimal(value: unknown) {
  return Number(value || 0).toFixed(2);
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
    shopId: selectedShopId.value === "all" ? undefined : selectedShopId.value,
    importType: selectedImportType.value === "all" ? undefined : selectedImportType.value,
  };
}

async function loadPage() {
  loading.value = true;
  try {
    const response = await reportsApi.getV1ImportReportTable(baseQuery());
    rows.value = response.rows || [];
  } finally {
    loading.value = false;
  }
}

function columnLabel(key: string) {
  const labels: Record<string, string> = {
    date: "Дата",
    import_number: "Номер",
    import_name: "Импорт",
    import_type: "Тип",
    shop_name: "Филиал",
    product_name: "Товар",
    product_barcode: "Штрихкод",
    product_sku: "SKU",
    category_name: "Категория",
    brand_name: "Бренд",
    supplier_name: "Поставщик",
    imported_qty: "Импорт, шт",
    imported_supply_sum: "Импорт, закупка",
    imported_sale_sum: "Импорт, продажа",
    sold_qty: "Продано, шт",
    sold_supply_sum: "Продано, закупка",
    sold_sale_sum: "Продано, продажа",
    sold_retail_sum: "Продано, продажа",
    returned_qty: "Возврат, шт",
    returned_supply_sum: "Возврат, закупка",
    returned_sale_sum: "Возврат, продажа",
    write_off_qty: "Списание, шт",
    write_off_supply_sum: "Списание, закупка",
    write_off_sale_sum: "Списание, продажа",
    left_qty: "Остаток, шт",
    left_supply_sum: "Остаток, закупка",
    left_sale_sum: "Остаток, продажа",
    barcode: "Штрихкод",
    bar_code: "Штрихкод",
    brand: "Бренд",
    category: "Категория",
    supplier: "Поставщик",
    shop: "Филиал",
  };

  if (labels[key]) {
    return labels[key];
  }

  return key
    .replace(/_/g, " ")
    .replace(/qty/gi, "кол-во")
    .replace(/barcode/gi, "штрихкод")
    .replace(/brand/gi, "бренд")
    .replace(/category/gi, "категория")
    .replace(/supplier/gi, "поставщик")
    .replace(/shop/gi, "филиал")
    .replace(/amount/gi, "кол-во")
    .replace(/supply/gi, "закупка")
    .replace(/retail/gi, "продажа")
    .replace(/returned/gi, "возврат")
    .replace(/write off/gi, "списание")
    .replace(/import/gi, "импорт")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function columnAlign(key: string): "left" | "right" | "center" {
  if (/_sum$/.test(key) || /_price$/.test(key) || /_qty$/.test(key) || key.includes("amount")) {
    return "right";
  }
  return "left";
}

function columnFormatter(key: string) {
  if (/_sum$/.test(key) || /_price$/.test(key) || key.includes("sale_sum") || key.includes("supply_sum")) {
    return money;
  }

  if (/_qty$/.test(key) || key.includes("amount")) {
    return quantity;
  }

  if (key.includes("percent") || key.includes("rate")) {
    return decimal;
  }

  return undefined;
}
</script>

<template>
  <section class="space-y-6 text-white">
    <header class="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_34%),linear-gradient(145deg,#1b1b1b_0%,#101010_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-7">
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
                <div class="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300">Product Imports</div>
                <h1 class="text-[30px] font-bold tracking-[-0.05em] text-white sm:text-[36px]">
                  Отчет Импорты
                </h1>
              </div>
            </div>

            <p class="max-w-3xl text-sm leading-6 text-slate-300">
              Полная таблица импортов и заказов за выбранную дату с детализацией по филиалам, товарам и движению остатков.
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur">
              <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Период</div>
              <div class="mt-2 text-lg font-semibold text-white">{{ humanDate(selectedDate) }}</div>
            </div>
            <div class="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur">
              <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Строк</div>
              <div class="mt-2 text-lg font-semibold text-white">{{ displayedRows.length }}</div>
            </div>
          </div>
        </div>

        <div class="grid gap-3 lg:grid-cols-3">
          <AppDatePicker
            v-model="selectedDate"
            placeholder="Выберите дату"
            class="w-full"
          />

          <label class="relative">
            <select
              v-model="selectedImportType"
              class="h-[56px] w-full appearance-none rounded-[20px] border border-white/10 bg-white/[0.06] px-4 pr-11 text-[15px] font-semibold text-white outline-none backdrop-blur transition hover:bg-white/[0.1] focus:border-amber-400"
            >
              <option
                v-for="option in importTypeOptions"
                :key="option.value"
                :value="option.value"
                class="bg-[#202020] text-white"
              >
                {{ option.label }}
              </option>
            </select>
            <Icon name="heroicons:inbox-stack" class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-300" />
          </label>

          <label class="relative">
            <select
              v-model="selectedShopId"
              class="h-[56px] w-full appearance-none rounded-[20px] border border-white/10 bg-white/[0.06] px-4 pr-11 text-[15px] font-semibold text-white outline-none backdrop-blur transition hover:bg-white/[0.1] focus:border-amber-400"
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
            <Icon name="heroicons:building-storefront" class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-300" />
          </label>
        </div>
      </div>
    </header>

    <div class="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,#171717_0%,#121212_100%)] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
      <ReportDataTable
        title="Импорты"
        :description="`${humanDate(selectedDate)} • ${shopOptions.find((shop) => shop.value === selectedShopId)?.label || 'Все филиалы'}`"
        :columns="dynamicColumns"
        :rows="displayedRows"
        :loading="loading"
        empty-text="Импорты не найдены"
      />
    </div>
  </section>
</template>
