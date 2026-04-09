import { defineStore } from "pinia";
import { ref, computed, watch, h } from "vue";
import {
  getCoreRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import { useProducts, type ProductDTO } from "~/composables/useProducts";
import { useLocationStore } from "@/store/useLocationStore";

type CatalogFilterState = {
  store: string;
  category: string;
  article: string;
  brand: string;
  supplier: string;
  unit: string;
};

type CatalogPriceFilters = {
  supply: { min: string; max: string };
  sale: { min: string; max: string };
  wholesale: { min: string; max: string };
};

type CatalogFilterOption = {
  label: string;
  value: string;
};

type CatalogField = {
  id?: string;
  name?: string;
  sequence_number?: number;
  is_active?: boolean;
};

export const useCatalogDataTableStore = defineStore("catalogDataTableStore", () => {
  const rawData = ref<any[]>([]);
  const globalFilter = ref("");
  const loading = ref(false);
  const totalItems = ref(0);
  const count = ref(0);
  const fields = ref<CatalogField[]>([]);
  const statistics = ref<Record<string, unknown> | null>(null);
  const statisticsByStatus = ref<Record<string, unknown> | null>(null);
  const activeStatusFilter = ref("all");

  const pagination = ref({ pageSize: 10, pageIndex: 0 });
  const sorting = ref<any[]>([]);

  const showProductSidebar = ref(false);
  const selectedProduct = ref<any | null>(null);

  const filters = ref<CatalogFilterState>({
    store: "",
    category: "",
    article: "",
    brand: "",
    supplier: "",
    unit: "",
  });

  const prices = ref<CatalogPriceFilters>({
    supply: { min: "", max: "" },
    sale: { min: "", max: "" },
    wholesale: { min: "", max: "" },
  });

  const freePrice = ref(false);

  const locationStore = useLocationStore();

  const shopOptions = computed<CatalogFilterOption[]>(() => {
    const fromLocations = locationStore.locations.map((location) => ({
      label: location.name,
      value: location.id,
    }));

    const fromProducts = getUniqueOptions(
      rawData.value.flatMap((item) => {
        const original = item?._original;
        const byPrices = Array.isArray(original?.shop_prices)
          ? original.shop_prices
              .map((shop: any) =>
                normalizeOption(shop?.shop?.name ?? shop?.shop_name, shop?.shop_id),
              )
              .filter((option: CatalogFilterOption | null): option is CatalogFilterOption => Boolean(option))
          : [];

        const direct = normalizeOption(
          original?.current_shop?.shop?.name ?? item?.shop_name,
          original?.current_shop?.shop_id ?? original?.shop_id ?? item?.branch_code,
        );

        return direct ? [...byPrices, direct] : byPrices;
      }),
    );

    return getUniqueOptions([...fromLocations, ...fromProducts]);
  });

  const categoryOptions = computed<CatalogFilterOption[]>(() =>
    getUniqueOptions(
      rawData.value
        .map((item) =>
          normalizeOption(item?.category, item?._original?.category?.id ?? item?.category),
        )
        .filter((option: CatalogFilterOption | null): option is CatalogFilterOption => Boolean(option)),
    ),
  );

  const articleOptions = computed<CatalogFilterOption[]>(() =>
    getUniqueOptions(
      rawData.value
        .map((item) => normalizeOption(item?.sku, item?.sku))
        .filter((option: CatalogFilterOption | null): option is CatalogFilterOption => Boolean(option)),
    ),
  );

  const brandOptions = computed<CatalogFilterOption[]>(() =>
    getUniqueOptions(
      rawData.value
        .map((item) =>
          normalizeOption(
            item?.brand,
            item?._original?.brand?.id ?? item?._original?.brand_name ?? item?.brand,
          ),
        )
        .filter((option: CatalogFilterOption | null): option is CatalogFilterOption => Boolean(option)),
    ),
  );

  const supplierOptions = computed<CatalogFilterOption[]>(() =>
    getUniqueOptions(
      rawData.value.flatMap((item) => {
        const originalSuppliers = Array.isArray(item?._original?.suppliers)
          ? item._original.suppliers
          : [];

        if (originalSuppliers.length) {
          return originalSuppliers
            .map((supplier: any) =>
              normalizeOption(
                supplier?.name,
                supplier?.id ?? supplier?.supplier_id ?? supplier?.name,
              ),
            )
            .filter((option: CatalogFilterOption | null): option is CatalogFilterOption => Boolean(option));
        }

        if (!item?.suppliers) {
          return [];
        }

        return item.suppliers
          .split(",")
          .map((name: string) => normalizeOption(name.trim(), name.trim()))
          .filter((option: CatalogFilterOption | null): option is CatalogFilterOption => Boolean(option));
      }),
    ),
  );

  const unitOptions = computed<CatalogFilterOption[]>(() =>
    getUniqueOptions(
      rawData.value
        .map((item) =>
          normalizeOption(
            item?._original?.measurement_type ?? item?._original?.unit ?? item?.unit,
            item?._original?.measurement_type ?? item?._original?.unit ?? item?.unit,
          ),
        )
        .filter((option: CatalogFilterOption | null): option is CatalogFilterOption => Boolean(option)),
    ),
  );

  const filterOptions = computed(() => ({
    store: shopOptions.value.map((option: CatalogFilterOption) => option.label),
    category: categoryOptions.value.map((option: CatalogFilterOption) => option.label),
    article: articleOptions.value.map((option: CatalogFilterOption) => option.label),
    brand: brandOptions.value.map((option: CatalogFilterOption) => option.label),
    supplier: supplierOptions.value.map((option: CatalogFilterOption) => option.label),
    unit: unitOptions.value.map((option: CatalogFilterOption) => option.label),
  }));

  async function fetchData(params?: {
    search?: string;
    page?: number;
    pageSize?: number;
    status?: string;
  }) {
    loading.value = true;
    try {
      const { listProducts } = useProducts();
      const result = await listProducts({
        search: params?.search ?? (globalFilter.value || undefined),
        page: params?.page ?? pagination.value.pageIndex + 1,
        pageSize: params?.pageSize ?? pagination.value.pageSize,
        statistics: true,
        status: params?.status ?? activeStatusFilter.value,
        shopIds: resolveSelectedValues(filters.value.store, shopOptions.value),
        categoryIds: resolveSelectedValues(filters.value.category, categoryOptions.value),
        brandIds: resolveSelectedValues(filters.value.brand, brandOptions.value),
        supplierIds: resolveSelectedValues(filters.value.supplier, supplierOptions.value),
        sku: filters.value.article || undefined,
        measurementType: resolveSingleValue(filters.value.unit, unitOptions.value),
        supplyPriceFrom: parseNumber(prices.value.supply.min),
        supplyPriceTo: parseNumber(prices.value.supply.max),
        retailPriceFrom: parseNumber(prices.value.sale.min),
        retailPriceTo: parseNumber(prices.value.sale.max),
        wholesalePrice: parseNumber(prices.value.wholesale.min),
        freePrice: freePrice.value || undefined,
      });

      pagination.value = {
        pageIndex: Math.max(0, (params?.page ?? pagination.value.pageIndex + 1) - 1),
        pageSize: params?.pageSize ?? pagination.value.pageSize,
      };
      totalItems.value = result.total;
      count.value = result.count;
      fields.value = Array.isArray(result.fields) ? (result.fields as CatalogField[]) : [];
      statistics.value = result.statistics;
      statisticsByStatus.value = result.statisticsByStatus;

      rawData.value = result.products.map((p: ProductDTO) => ({
        id: p.id,
        variation_id: (p as any).variation_id ?? p.id,
        photo: p.photo || undefined,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        category: p.category?.name || "",
        shop_name: p.shop_name || "",
        suppliers:
          Array.isArray(p.suppliers) && p.suppliers.length
            ? p.suppliers.map((s) => s.name).join(", ")
            : "",
        quantity: p.quantity,
        purchase_price: p.purchase_price,
        sale_price: p.sale_price,
        wholesale_price: Number(
          (p as any)?.shop_prices?.[0]?.wholesale_price ??
            (p as any)?._original?.shop_prices?.[0]?.wholesale_price ??
            0,
        ),
        discount_price: (p as any).discount_price ?? null,
        brand:
          typeof (p as any).brand?.name === "string" ? (p as any).brand.name : "",
        unit: p.unit || "",
        _original: (p as any)._original ?? p,
      }));
    } catch (e) {
      console.error("Failed to load products", e);
      rawData.value = [];
      totalItems.value = 0;
      count.value = 0;
      fields.value = [];
      statistics.value = null;
      statisticsByStatus.value = null;
    } finally {
      loading.value = false;
    }
  }

  function applyFilters() {
    pagination.value.pageIndex = 0;
    return fetchData({ page: 1 });
  }

  function resetFilters() {
    filters.value = {
      store: "",
      category: "",
      article: "",
      brand: "",
      supplier: "",
      unit: "",
    };
    prices.value = {
      supply: { min: "", max: "" },
      sale: { min: "", max: "" },
      wholesale: { min: "", max: "" },
    };
    freePrice.value = false;
    pagination.value.pageIndex = 0;
    return fetchData({ page: 1 });
  }

  fetchData();

  watch(globalFilter, async (val) => {
    pagination.value.pageIndex = 0;
    await fetchData({ search: val, page: 1 });
  });

  watch(activeStatusFilter, async (status) => {
    pagination.value.pageIndex = 0;
    await fetchData({ status, page: 1 });
  });

  const filteredData = computed(() => rawData.value);
  const paginatedProducts = computed(() => rawData.value);

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(totalItems.value / pagination.value.pageSize)),
  );

  const statusFilters = computed(() => {
    const source = statisticsByStatus.value ?? {};
    return [
      { key: "all", label: "Все", count: totalItems.value || count.value || rawData.value.length },
      { key: "active", label: "Активные", count: getStatusCount(source, "active") },
      { key: "inactive", label: "Неактивные", count: getStatusCount(source, "inactive") },
      { key: "low", label: "Малый остаток", count: getStatusCount(source, "low") },
      { key: "zero", label: "Нулевой остаток", count: getStatusCount(source, "zero") },
    ];
  });

  const statsCards = computed(() => {
    const source = statistics.value ?? {};
    return [
      {
        label: "Наименований",
        value: formatStatNumber(
          getStatisticValue(source, ["product_count", "products_count", "count"]) ??
            totalItems.value,
        ),
      },
      {
        label: "Товарных единиц",
        value: formatQuantityStat(
          getStatisticValue(source, [
            "total_quantity",
            "quantity",
            "total_measurement_value",
            "items_count",
          ]),
        ),
      },
      {
        label: "Сумма по цене поставки",
        value: formatMoneyStat(
          getStatisticValue(source, [
            "total_supply_price",
            "purchase_price_total",
            "supply_price_total",
            "total_purchase_price",
          ]),
        ),
      },
      {
        label: "Сумма по цене продажи",
        value: formatMoneyStat(
          getStatisticValue(source, [
            "sale_price_total",
            "retail_price_total",
            "total_sale_price",
            "total_retail_price",
          ]),
        ),
      },
    ];
  });

  const placeholderImgUrl = new URL(
    "../../assets/images/placeholder_img.svg",
    import.meta.url,
  ).href;

  const formatUZS = (value: unknown) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "-";
    return `${new Intl.NumberFormat("ru-RU").format(num)} UZS`;
  };

  const columns = computed<any[]>(() => [
    {
      id: "select",
      header: () =>
        h("input", {
          type: "checkbox",
          class: "w-3.5 h-3.5 accent-[#4993dd] cursor-pointer",
          onChange: (e: Event) => {
            const checked = (e.target as HTMLInputElement).checked;
            table.getRowModel().rows.forEach((row) => row.toggleSelected(checked));
          },
        }),
      cell: ({ row }: any) =>
        h("input", {
          type: "checkbox",
          class: "w-3.5 h-3.5 accent-[#4993dd] cursor-pointer",
          checked: row.getIsSelected?.(),
          onChange: (e: Event) =>
            row.toggleSelected?.((e.target as HTMLInputElement).checked),
        }),
      enableSorting: false,
      enableColumnFilter: false,
      size: 40,
    },
  ]);

  const table = useVueTable({
    get data() {
      return filteredData.value;
    },
    get columns() {
      return [columns.value[0], ...buildCatalogColumns(fields.value, placeholderImgUrl, formatUZS)];
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    state: {
      get sorting() {
        return sorting.value;
      },
    },
    onSortingChange: (updater: any) => {
      sorting.value = typeof updater === "function" ? updater(sorting.value) : updater;
    },
  });

  const selectedProducts = computed(() =>
    table.getSelectedRowModel().rows.map((row: any) => row.original.id),
  );

  function openProduct(product: any) {
    selectedProduct.value = product;
    showProductSidebar.value = true;
  }

  function closeProductSidebar() {
    selectedProduct.value = null;
    showProductSidebar.value = false;
  }

  function previousPage() {
    if (pagination.value.pageIndex <= 0 || loading.value) return;
    fetchData({ page: pagination.value.pageIndex });
  }

  function nextPage() {
    if (pagination.value.pageIndex + 1 >= totalPages.value || loading.value) return;
    fetchData({ page: pagination.value.pageIndex + 2 });
  }

  return {
    rawData,
    globalFilter,
    loading,
    totalItems,
    count,
    fields,
    statistics,
    statisticsByStatus,
    activeStatusFilter,
    pagination,
    sorting,
    filters,
    prices,
    freePrice,
    filterOptions,
    filteredData,
    paginatedProducts,
    totalPages,
    statusFilters,
    statsCards,
    table,
    selectedProduct,
    showProductSidebar,
    selectedProducts,
    openProduct,
    closeProductSidebar,
    fetchData,
    applyFilters,
    resetFilters,
    previousPage,
    nextPage,
  };
});

function normalizeOption(label: unknown, value: unknown): CatalogFilterOption | null {
  const normalizedLabel = String(label ?? "").trim();
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedLabel) {
    return null;
  }

  return {
    label: normalizedLabel,
    value: normalizedValue || normalizedLabel,
  };
}

function getUniqueOptions(options: CatalogFilterOption[]) {
  const seen = new Set<string>();
  const unique: CatalogFilterOption[] = [];

  for (const option of options) {
    const key = `${option.label}::${option.value}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(option);
  }

  return unique.sort((a, b) => a.label.localeCompare(b.label, "ru"));
}

function resolveSelectedValues(selectedLabel: string, options: CatalogFilterOption[]) {
  const label = String(selectedLabel || "").trim();
  if (!label) {
    return undefined;
  }

  const matched = options.find((option) => option.label === label);
  return [matched?.value ?? label];
}

function resolveSingleValue(selectedLabel: string, options: CatalogFilterOption[]) {
  const label = String(selectedLabel || "").trim();
  if (!label) {
    return undefined;
  }

  return options.find((option) => option.label === label)?.value ?? label;
}

function parseNumber(value: string) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildCatalogColumns(
  serverFields: CatalogField[],
  placeholderImgUrl: string,
  formatUZS: (value: unknown) => string,
) {
  const activeFields = serverFields
    .filter((field) => field?.name && field?.is_active !== false)
    .sort((a, b) => Number(a.sequence_number ?? 0) - Number(b.sequence_number ?? 0));

  const mapped = activeFields
    .map((field) => createCatalogColumn(field, placeholderImgUrl, formatUZS))
    .filter(Boolean);

  if (mapped.length) {
    return mapped;
  }

  return [
    createTextColumn("name", "Наименование"),
    createTextColumn("sku", "Артикул"),
    createTextColumn("barcode", "Баркод"),
    createTextColumn("category", "Категория"),
    createTextColumn("brand", "Бренд"),
    createQuantityColumn("quantity", "Кол-во"),
    createMoneyColumn("purchase_price", "Цена поставки", formatUZS),
    createMoneyColumn("sale_price", "Цена продажи", formatUZS),
  ].filter(Boolean);
}

function createCatalogColumn(
  field: CatalogField,
  placeholderImgUrl: string,
  formatUZS: (value: unknown) => string,
) {
  const fieldName = String(field.name ?? "").trim();

  switch (fieldName) {
    case "variation_id":
      return createTextColumn("variation_id", fieldName);
    case "Кол-во":
      return createQuantityColumn("quantity", fieldName);
    case "Фото":
      return createPhotoColumn("photo", fieldName, placeholderImgUrl);
    case "Бренд":
      return createTextColumn("brand", fieldName);
    case "Категория":
      return createTextColumn("category", fieldName);
    case "Оптовая цена":
      return createMoneyColumn("wholesale_price", fieldName, formatUZS);
    case "Цена поставки":
      return createMoneyColumn("purchase_price", fieldName, formatUZS);
    case "Цена продажи":
      return createMoneyColumn("sale_price", fieldName, formatUZS);
    case "Артикул":
      return createTextColumn("sku", fieldName);
    case "Баркод":
      return createTextColumn("barcode", fieldName);
    case "Наименование":
      return createTextColumn("name", fieldName);
    default:
      return {
        id: fieldName,
        accessorFn: (row: any) => readOriginalFieldValue(row, fieldName),
        header: fieldName,
        meta: {
          tdStyle: getCatalogColumnStyle(fieldName),
        },
        cell: ({ getValue }: any) => formatUnknownFieldValue(getValue(), formatUZS),
      };
  }
}

function createTextColumn(accessorKey: string, header: string) {
  return {
    accessorKey,
    header,
    meta: {
      tdStyle: getCatalogColumnStyle(header),
    },
  };
}

function createQuantityColumn(accessorKey: string, header: string) {
  return {
    accessorKey,
    header,
    meta: {
      tdStyle: getCatalogColumnStyle(header),
    },
    cell: ({ getValue }: any) => `${getValue() ?? 0} шт`,
  };
}

function createMoneyColumn(
  accessorKey: string,
  header: string,
  formatUZS: (value: unknown) => string,
) {
  return {
    accessorKey,
    header,
    meta: {
      tdStyle: getCatalogColumnStyle(header),
    },
    cell: ({ getValue }: any) => formatUZS(getValue()),
  };
}

function createPhotoColumn(accessorKey: string, header: string, placeholderImgUrl: string) {
  return {
    accessorKey,
    header,
    meta: {
      tdClass: "align-middle",
      tdStyle: getCatalogColumnStyle(header),
    },
    cell: ({ getValue }: any) => {
      const url = getValue();
      const imageUrl = url ? url : placeholderImgUrl;
      return h(
        "div",
        {
          class: "w-12 h-12 min-w-12 min-h-12",
        },
        [
          h("img", {
            src: imageUrl,
            alt: "Фото товара",
            class: "w-full h-full object-cover rounded-[10px]",
          }),
        ],
      );
    },
  };
}

function readOriginalFieldValue(row: any, fieldName: string) {
  const originalFields = Array.isArray(row?._original?.fields) ? row._original.fields : [];
  const matched = originalFields.find(
    (field: any) => String(field?.name ?? "").trim() === fieldName,
  );
  return matched?.value ?? row?.[fieldName] ?? "";
}

function formatUnknownFieldValue(
  value: unknown,
  formatUZS: (value: unknown) => string,
) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "-";
  }

  if (typeof value === "boolean") {
    return value ? "Да" : "Нет";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value && typeof value === "object") {
    const maybePrice = (value as Record<string, unknown>).price;
    if (maybePrice != null) {
      return formatUZS(maybePrice);
    }

    return JSON.stringify(value);
  }

  return String(value ?? "-");
}

function getCatalogColumnStyle(header: string) {
  switch (header) {
    case "variation_id":
      return { minWidth: "180px", width: "180px" };
    case "Кол-во":
      return { minWidth: "140px", width: "140px" };
    case "Фото":
      return { minWidth: "120px", width: "120px" };
    case "Бренд":
      return { minWidth: "180px", width: "180px" };
    case "Категория":
      return { minWidth: "180px", width: "180px" };
    case "Оптовая цена":
      return { minWidth: "180px", width: "180px" };
    case "Цена поставки":
      return { minWidth: "180px", width: "180px" };
    case "Цена продажи":
      return { minWidth: "180px", width: "180px" };
    case "Артикул":
      return { minWidth: "170px", width: "170px" };
    case "Баркод":
      return { minWidth: "190px", width: "190px" };
    case "Наименование":
      return { minWidth: "260px", width: "260px" };
    default:
      return { minWidth: "170px", width: "170px" };
  }
}

function getStatusCount(source: Record<string, unknown>, key: string) {
  const value = source[key];
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  if (value && typeof value === "object") {
    const nested = value as Record<string, unknown>;
    const direct = nested.count ?? nested.total ?? nested.value;
    if (typeof direct === "number") return direct;
    if (typeof direct === "string") return Number(direct) || 0;
  }
  return 0;
}

function getStatisticValue(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (value != null) return value;
  }
  return null;
}

function formatStatNumber(value: unknown) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "-";
  return `${new Intl.NumberFormat("ru-RU").format(num)} шт`;
}

function formatQuantityStat(value: unknown) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "-";
  return `${new Intl.NumberFormat("ru-RU").format(num)} ед.`;
}

function formatMoneyStat(value: unknown) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "-";
  return `${new Intl.NumberFormat("ru-RU").format(num)} UZS`;
}


