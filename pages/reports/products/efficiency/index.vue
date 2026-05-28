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
const selectedSupplier = ref("all");
const selectedShopId = ref("all");
const selectedGrouping = ref("name");
const selectedShopGrouping = ref("all");
const rows = ref<Record<string, any>[]>([]);

useHead({ title: "Отчет Эффективность товаров | Konkurent" });

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

const supplierOptions = computed(() => {
  const map = new Map<string, string>();
  rows.value.forEach((row) => {
    const value = String(row.supplier_name ?? "").trim();
    if (value) {
      map.set(value, value);
    }
  });

  return [{ value: "all", label: "Все поставщики" }, ...Array.from(map.values()).map((value) => ({
    value,
    label: value,
  }))];
});

const groupingOptions = [
  { value: "name", label: "Наименование" },
  { value: "category", label: "Категория" },
  { value: "brand", label: "Бренд" },
  { value: "supplier", label: "Поставщик" },
];

const shopGroupingOptions = [
  { value: "all", label: "Все магазины" },
  { value: "split", label: "Не объединять" },
];

const displayedRows = computed(() => {
  if (selectedSupplier.value === "all") {
    return rows.value;
  }

  return rows.value.filter((row) => String(row.supplier_name ?? "").trim() === selectedSupplier.value);
});

const dynamicColumns = computed<TableColumn[]>(() => {
  const firstRow = displayedRows.value[0] ?? rows.value[0];
  if (!firstRow) {
    return defaultColumns;
  }

  const keys = Object.keys(firstRow).filter((key) => !hiddenKeys.has(key));
  const preferredKeys = [
    "shop_name",
    "sku",
    "bar_code",
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

const hiddenKeys = new Set([
  "id",
  "__v",
  "_id",
  "product_id",
  "product_name",
  "product_field",
  "name",
  "shop_id",
  "supplier_id",
  "category_id",
  "brand_id",
  "created_at",
  "updated_at",
]);

const defaultColumns: TableColumn[] = [
  { key: "shop_name", label: "Магазин" },
  { key: "sku", label: "SKU" },
  { key: "bar_code", label: "Штрихкод" },
  { key: "category_name", label: "Категория" },
  { key: "brand_name", label: "Бренд" },
  { key: "supplier_name", label: "Поставщик" },
];

watch(
  [selectedDate, selectedShopId, selectedGrouping, selectedShopGrouping],
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

function percent(value: unknown) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function booleanText(value: unknown) {
  if (typeof value === "boolean") {
    return value ? "Да" : "Нет";
  }

  const normalized = String(value ?? "").trim().toLowerCase();
  if (["1", "true", "yes", "да"].includes(normalized)) return "Да";
  if (["0", "false", "no", "нет"].includes(normalized)) return "Нет";
  return String(value ?? "—");
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
    groupBy: selectedGrouping.value,
    groupWithoutShop: selectedShopGrouping.value === "split",
  };
}

async function loadPage() {
  loading.value = true;
  try {
    const response = await reportsApi.getV1ProductEffectiveness(baseQuery());
    rows.value = response.rows || [];
  } finally {
    loading.value = false;
  }
}

function columnLabel(key: string) {
  const labels: Record<string, string> = {
    shop_name: "Магазин",
    sku: "SKU",
    bar_code: "Штрихкод",
    barcode: "Штрихкод",
    category_name: "Категория",
    brand_name: "Бренд",
    supplier_name: "Поставщик",
    is_original: "Оригинал",
    stock_amount_begin: "Остаток на начало",
    stock_supply_sum_begin: "Закупка на начало",
    stock_retail_sum_begin: "Продажа на начало",
    import_amount: "Импорт, шт",
    import_supply_sum: "Импорт, закупка",
    import_retail_sum: "Импорт, продажа",
    sold_amount: "Продано, шт",
    sold_supply_sum: "Продано, закупка",
    sold_sale_sum: "Продано, продажа",
    sold_retail_sum: "Продано, продажа",
    returned_amount: "Возврат, шт",
    returned_supply_sum: "Возврат, закупка",
    returned_retail_sum: "Возврат, продажа",
    write_off_amount: "Списание, шт",
    write_off_supply_sum: "Списание, закупка",
    write_off_retail_sum: "Списание, продажа",
    stock_amount_end: "Остаток на конец",
    stock_supply_sum_end: "Закупка на конец",
    stock_retail_sum_end: "Продажа на конец",
    qty_sellout: "Коэф. оборачиваемости",
    sellout_by_days: "Оборачиваемость, дни",
    margin_percent: "Маржа, %",
    markup_percent: "Наценка, %",
    turnover_rate: "Оборот",
    reserve_amount: "Резерв, шт",
    reserve_supply_sum: "Резерв, закупка",
    reserve_retail_sum: "Резерв, продажа",
    shop: "Магазин",
    brand: "Бренд",
    category: "Категория",
    supplier: "Поставщик",
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
    .replace(/shop/gi, "магазин")
    .replace(/stock/gi, "остаток")
    .replace(/amount/gi, "кол-во")
    .replace(/supply/gi, "закупка")
    .replace(/retail/gi, "продажа")
    .replace(/returned/gi, "возврат")
    .replace(/write off/gi, "списание")
    .replace(/import/gi, "импорт")
    .replace(/sellout/gi, "оборачиваемость")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function columnAlign(key: string): "left" | "right" | "center" {
  if (/_percent$/.test(key) || /_sum$/.test(key) || /_price$/.test(key) || /_amount$/.test(key) || key.includes("qty") || key.includes("stock_")) {
    return "right";
  }
  return "left";
}

function columnFormatter(key: string) {
  if (/(^|_)(is_|has_|with_)/.test(key) || key.startsWith("is_")) {
    return booleanText;
  }

  if (/_percent$/.test(key)) {
    return percent;
  }

  if (/_sum$/.test(key) || /_price$/.test(key) || key.includes("retail") || key.includes("supply")) {
    return money;
  }

  if (/_amount$/.test(key) || key.includes("qty") || key.includes("stock_")) {
    return quantity;
  }

  if (key.includes("days") || key.includes("rate")) {
    return decimal;
  }

  return undefined;
}
</script>

<template>
  <section class="space-y-6 text-white">
    <header class="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_34%),linear-gradient(145deg,#1b1b1b_0%,#101010_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-7">
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
                <div class="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300">Product Efficiency</div>
                <h1 class="text-[30px] font-bold tracking-[-0.05em] text-white sm:text-[36px]">
                  Отчет Эффективность товаров
                </h1>
              </div>
            </div>

            <p class="max-w-3xl text-sm leading-6 text-slate-300">
              Полная таблица движения и эффективности товаров за выбранный день: остатки, импорт, продажи, возвраты и итоговые показатели по магазинам.
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

        <div class="grid gap-3 xl:grid-cols-5">
          <AppDatePicker
            v-model="selectedDate"
            placeholder="Выберите дату"
            class="w-full"
          />

          <label class="relative">
            <select
              v-model="selectedSupplier"
              class="h-[56px] w-full appearance-none rounded-[20px] border border-white/10 bg-white/[0.06] px-4 pr-11 text-[15px] font-semibold text-white outline-none backdrop-blur transition hover:bg-white/[0.1] focus:border-emerald-400"
            >
              <option
                v-for="supplier in supplierOptions"
                :key="supplier.value"
                :value="supplier.value"
                class="bg-[#202020] text-white"
              >
                {{ supplier.label }}
              </option>
            </select>
            <Icon name="heroicons:truck" class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-300" />
          </label>

          <label class="relative">
            <select
              v-model="selectedShopId"
              class="h-[56px] w-full appearance-none rounded-[20px] border border-white/10 bg-white/[0.06] px-4 pr-11 text-[15px] font-semibold text-white outline-none backdrop-blur transition hover:bg-white/[0.1] focus:border-emerald-400"
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
            <Icon name="heroicons:building-storefront" class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-300" />
          </label>

          <label class="relative">
            <select
              v-model="selectedGrouping"
              class="h-[56px] w-full appearance-none rounded-[20px] border border-white/10 bg-white/[0.06] px-4 pr-11 text-[15px] font-semibold text-white outline-none backdrop-blur transition hover:bg-white/[0.1] focus:border-emerald-400"
            >
              <option
                v-for="group in groupingOptions"
                :key="group.value"
                :value="group.value"
                class="bg-[#202020] text-white"
              >
                {{ group.label }}
              </option>
            </select>
            <Icon name="heroicons:rectangle-group" class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-300" />
          </label>

          <label class="relative">
            <select
              v-model="selectedShopGrouping"
              class="h-[56px] w-full appearance-none rounded-[20px] border border-white/10 bg-white/[0.06] px-4 pr-11 text-[15px] font-semibold text-white outline-none backdrop-blur transition hover:bg-white/[0.1] focus:border-emerald-400"
            >
              <option
                v-for="option in shopGroupingOptions"
                :key="option.value"
                :value="option.value"
                class="bg-[#202020] text-white"
              >
                {{ option.label }}
              </option>
            </select>
            <Icon name="heroicons:squares-2x2" class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-300" />
          </label>
        </div>
      </div>
    </header>

    <div class="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,#171717_0%,#121212_100%)] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
      <ReportDataTable
        title="Эффективность товаров"
        :description="`${humanDate(selectedDate)} • ${shopOptions.find((shop) => shop.value === selectedShopId)?.label || 'Все магазины'}`"
        :columns="dynamicColumns"
        :rows="displayedRows"
        :loading="loading"
        empty-text="Данные по эффективности товаров не найдены"
      />
    </div>
  </section>
</template>
