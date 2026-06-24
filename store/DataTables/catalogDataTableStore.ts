import { defineStore } from "pinia";
import { ref, computed, watch, h } from "vue";
import {
  getCoreRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import {
  resolveProductImageUrl,
  useProducts,
  type ProductDTO,
} from "~/composables/useProducts";
import type { ProductCardData } from "~/types/product-detail";
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
  const { can } = useAccessControl();
  const rawData = ref<any[]>([]);
  const globalFilter = ref("");
  const loading = ref(false);
  const productDetailsLoading = ref(false);
  const totalItems = ref(0);
  const count = ref(0);
  const fields = ref<CatalogField[]>([]);
  const statistics = ref<Record<string, unknown> | null>(null);
  const statisticsByStatus = ref<Record<string, unknown> | null>(null);
  const activeStatusFilter = ref("all");
  const archivedOnly = ref(false);

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
  const canViewSupplyPrice = computed(() => can("product-supply-price"));

  const shopOptions = computed<CatalogFilterOption[]>(() => {
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

    return fromProducts;
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
    store: shopOptions.value,
    category: categoryOptions.value,
    article: articleOptions.value,
    brand: brandOptions.value,
    supplier: supplierOptions.value,
    unit: unitOptions.value,
  }));

  let _fetchGeneration = 0;

  async function fetchData(params?: {
    search?: string;
    page?: number;
    pageSize?: number;
    status?: string;
    archivedList?: boolean;
  }) {
    const generation = ++_fetchGeneration;
    loading.value = true;
    try {
      const { listProducts } = useProducts();
      const normalizedStatus = normalizeCatalogStatus(
        params?.status ?? activeStatusFilter.value,
      );
      const resolvedArchivedList = params?.archivedList ?? archivedOnly.value;

      const result = await listProducts({
        search: params?.search ?? (globalFilter.value || undefined),
        page: params?.page ?? pagination.value.pageIndex + 1,
        pageSize: params?.pageSize ?? pagination.value.pageSize,
        statistics: true,
        status: normalizedStatus,
        archivedList: normalizedStatus ? undefined : resolvedArchivedList || undefined,
        shopIds: resolveSelectedValues(filters.value.store, shopOptions.value),
        categoryIds: resolveSelectedValues(filters.value.category, categoryOptions.value),
        brandIds: resolveSelectedValues(filters.value.brand, brandOptions.value),
        supplierIds: resolveSelectedValues(filters.value.supplier, supplierOptions.value),
        sku: filters.value.article || undefined,
        measurementType: resolveSingleValue(filters.value.unit, unitOptions.value),
        supplyPriceFrom: canViewSupplyPrice.value ? parseNumber(prices.value.supply.min) : undefined,
        supplyPriceTo: canViewSupplyPrice.value ? parseNumber(prices.value.supply.max) : undefined,
        retailPriceFrom: parseNumber(prices.value.sale.min),
        retailPriceTo: parseNumber(prices.value.sale.max),
        wholesalePriceFrom: parseNumber(prices.value.wholesale.min),
        wholesalePriceTo: parseNumber(prices.value.wholesale.max),
        freePrice: freePrice.value || undefined,
      });

      if (generation !== _fetchGeneration) return;

      pagination.value = {
        pageIndex: Math.max(0, (params?.page ?? pagination.value.pageIndex + 1) - 1),
        pageSize: params?.pageSize ?? pagination.value.pageSize,
      };
      totalItems.value = result.total || result.count;
      count.value = result.count;
      fields.value = Array.isArray(result.fields) ? (result.fields as CatalogField[]) : [];
      statistics.value = result.statistics;
      statisticsByStatus.value = result.statisticsByStatus;

      rawData.value = result.products.map((p: ProductDTO) => ({
        id: p.id,
        public_id: (p as any)?._original?.public_id ?? p.id,
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
        is_service: !!((p as any)._original?.is_service),
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

  const _skipNextRouteRefresh = ref(false);

  watch(globalFilter, async (val) => {
    _skipNextRouteRefresh.value = true;
    await fetchData({ search: val, page: 1 });
  });

  watch(activeStatusFilter, async (status) => {
    if (status !== "all" && archivedOnly.value) {
      archivedOnly.value = false;
      return;
    }

    _skipNextRouteRefresh.value = true;
    await fetchData({ status, page: 1 });
  });

  watch(archivedOnly, async (archivedList) => {
    _skipNextRouteRefresh.value = true;
    await fetchData({ archivedList, page: 1 });
  });

  watch(
    () => locationStore.selectedLocation?.id,
    async (next, prev) => {
      if (next && next !== prev) {
        _skipNextRouteRefresh.value = true;
        await fetchData({ page: 1 });
      }
    },
  );

  const filteredData = computed(() => rawData.value);
  const paginatedProducts = computed(() => rawData.value);

  const totalPages = computed(() =>
    Math.max(1, Math.ceil((totalItems.value || count.value) / pagination.value.pageSize)),
  );

  const statusFilters = computed(() => {
    const source = statisticsByStatus.value ?? {};
    return [
      { key: "all", label: "Все", count: getStatusMeasurementValue(source, "all") },
      { key: "active", label: "Активные", count: getStatusMeasurementValue(source, "active") },
      { key: "inactive", label: "Неактивные", count: getStatusMeasurementValue(source, "inactive") },
      { key: "small_left", label: "Малый остаток", count: getStatusMeasurementValue(source, "small_left") },
      { key: "zero_left", label: "Нулевой остаток", count: getStatusMeasurementValue(source, "zero_left") },
    ];
  });

  const statsCards = computed(() => {
    const source = statistics.value ?? {};
    const statusSource = statisticsByStatus.value ?? {};
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
          getStatisticValue(statusSource, ["measurement_value", "active_measurement_value"]) ??
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
      return [
        columns.value[0],
        ...buildCatalogColumns(
          fields.value,
          placeholderImgUrl,
          formatUZS,
          canViewSupplyPrice.value,
        ),
      ];
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

  async function openProduct(product: any) {
    const publicId = String(
      product?.public_id ??
        product?._original?.public_id ??
        product?.id ??
        product?._original?.id ??
        "",
    ).trim();

    if (!publicId) {
      selectedProduct.value = product;
      showProductSidebar.value = true;
      return;
    }

    productDetailsLoading.value = true;

    try {
      const { loadProductCard } = useProducts();
      const productCard = await loadProductCard(publicId);
      const normalizedDetail = normalizeDetailedProduct(productCard);

      selectedProduct.value = normalizedDetail;
      showProductSidebar.value = true;
    } catch (error) {
      console.error("Failed to load product details", error);
      selectedProduct.value = product;
      showProductSidebar.value = true;
    } finally {
      productDetailsLoading.value = false;
    }
  }

  function closeProductSidebar() {
    selectedProduct.value = null;
    showProductSidebar.value = false;
  }

  function previousPage() {
    if (pagination.value.pageIndex <= 0 || loading.value) return;
    fetchData({
      page: pagination.value.pageIndex,
      pageSize: pagination.value.pageSize,
    });
  }

  function nextPage() {
    if (pagination.value.pageIndex + 1 >= totalPages.value || loading.value) return;
    fetchData({
      page: pagination.value.pageIndex + 2,
      pageSize: pagination.value.pageSize,
    });
  }

  function setPageSize(pageSize: number) {
    if (!Number.isFinite(pageSize) || pageSize <= 0) {
      return;
    }

    fetchData({
      page: 1,
      pageSize,
    });
  }

  return {
    rawData,
    globalFilter,
    loading,
    productDetailsLoading,
    totalItems,
    count,
    fields,
    statistics,
    statisticsByStatus,
    activeStatusFilter,
    archivedOnly,
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
    canViewSupplyPrice,
    table,
    selectedProduct,
    showProductSidebar,
    selectedProducts,
    _skipNextRouteRefresh,
    openProduct,
    closeProductSidebar,
    fetchData,
    applyFilters,
    resetFilters,
    previousPage,
    nextPage,
    setPageSize,
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

function resolveSelectedValues(selectedValue: string, options: CatalogFilterOption[]) {
  const value = String(selectedValue || "").trim();
  if (!value) {
    return undefined;
  }

  const matched = options.find((option) => option.value === value || option.label === value);
  return [matched?.value ?? value];
}

function resolveSingleValue(selectedValue: string, options: CatalogFilterOption[]) {
  const value = String(selectedValue || "").trim();
  if (!value) {
    return undefined;
  }

  return options.find((option) => option.value === value || option.label === value)?.value ?? value;
}

function parseNumber(value: string) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeCatalogStatus(value: string) {
  switch (String(value || "").trim()) {
    case "all":
      return undefined;
    case "low":
    case "low_stock":
    case "small_left":
      return "small_left";
    case "zero":
    case "zero_stock":
    case "zero_left":
      return "zero_left";
    default:
      return String(value || "").trim() || undefined;
  }
}


function normalizeDetailedProduct(productCard: ProductCardData) {
  const { product, measurementUnit, movement, shops, priceTags } = productCard;
  const shopNameById = new Map<string, string>(
    shops.map((shop) => [String(shop.id ?? "").trim(), String(shop.name ?? "").trim()]),
  );

  const shopMeasurementValues = Array.isArray(product?.shop_measurement_values)
    ? product.shop_measurement_values.map((item: any) => ({
        ...item,
        shop_name:
          item?.shop_name ??
          item?.shop?.name ??
          shopNameById.get(String(item?.shop_id ?? "").trim()) ??
          "-",
      }))
    : [];

  const productSupplyStock = Array.isArray(product?.product_supply_stock)
    ? product.product_supply_stock.map((item: any) => ({
        ...item,
        shop_name:
          item?.shop_name ??
          item?.shop?.name ??
          shopNameById.get(String(item?.shop_id ?? "").trim()) ??
          "-",
      }))
    : [];

  const history = Array.isArray(movement?.movements)
    ? movement.movements.map((movementItem: any) => ({
        ...movement,
        shop_name:
          movementItem?.shop_name ??
          shopNameById.get(String(movementItem?.to_shop ?? "").trim()) ??
          shopNameById.get(String(movementItem?.from_shop ?? "").trim()) ??
          shopNameById.get(
            String(
              movementItem?.to_shop ??
                movementItem?.from_shop ??
                "",
            ).trim(),
          ) ??
          "-",
      }))
    : [];

  const firstCategory = Array.isArray(product?.categories) ? product.categories[0] : null;
  const firstSupplier = Array.isArray(product?.suppliers) ? product.suppliers : [];
  const shopPrices = Array.isArray(product?.shop_prices) ? product.shop_prices : [];

  return {
    id: product?.id ?? "",
    photo: resolveProductImageUrl(
      product?.photo ??
      product?.main_image_url ??
      product?.images?.[0]?.url,
    ) || null,
    name: String(product?.name ?? ""),
    sku: String(product?.sku ?? ""),
    barcode: String(product?.barcode ?? ""),
    category:
      typeof firstCategory?.name === "string"
        ? firstCategory.name
        : typeof firstCategory === "string"
          ? firstCategory
          : "",
    shop_name:
      productSupplyStock[0]?.shop_name ??
      shopMeasurementValues[0]?.shop_name ??
      "",
    suppliers: firstSupplier.length
      ? firstSupplier
          .map((supplier: any) => String(supplier?.name ?? supplier ?? "").trim())
          .filter(Boolean)
          .join(", ")
      : "",
    quantity: Number(
      product?.measurement_values?.total_measurement_value ??
        shopMeasurementValues.reduce(
          (sum: number, item: any) => sum + Number(item?.measurement_value ?? 0),
          0,
        ) ??
        0,
    ),
    purchase_price: Number(product?.supply_price ?? shopPrices[0]?.supply_price ?? 0),
    sale_price: Number(product?.retail_price ?? shopPrices[0]?.retail_price ?? 0),
    wholesale_price: Number(shopPrices[0]?.wholesale_price ?? 0),
    discount_price: null,
    brand: String(product?.brand_name ?? ""),
    unit: String(
      measurementUnit?.short_name ??
        measurementUnit?.name ??
        product?.measurement_unit?.short_name ??
        product?.measurement_unit?.name ??
        product?.measurement_type ??
        "",
    ),
    _original: {
      ...product,
      measurement_unit: measurementUnit ?? product?.measurement_unit ?? null,
      product_supply_stock: productSupplyStock,
      shop_measurement_values: shopMeasurementValues,
      history,
      price_tags: priceTags,
      shops,
    },
  };
}

function buildCatalogColumns(
  serverFields: CatalogField[],
  placeholderImgUrl: string,
  formatUZS: (value: unknown) => string,
  canViewSupplyPrice: boolean,
) {
  const activeFields = serverFields
    .filter(
      (field) =>
        field?.name &&
        field?.is_active !== false &&
        (canViewSupplyPrice || !isSupplyPriceFieldName(field.name)),
    )
    .sort((a, b) => Number(a.sequence_number ?? 0) - Number(b.sequence_number ?? 0));

  const mapped = activeFields
    .map((field) => createCatalogColumn(field, placeholderImgUrl, formatUZS, canViewSupplyPrice))
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
    ...(canViewSupplyPrice
      ? [createMoneyColumn("purchase_price", "Цена поставки", formatUZS)]
      : []),
    createMoneyColumn("sale_price", "Цена продажи", formatUZS),
  ].filter(Boolean);
}

function createCatalogColumn(
  field: CatalogField,
  placeholderImgUrl: string,
  formatUZS: (value: unknown) => string,
  canViewSupplyPrice: boolean,
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
      if (!canViewSupplyPrice) return null;
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
    cell: ({ getValue, row }: any) => {
      if (row?.original?.is_service) return "—";
      const unit = String(row?.original?.unit ?? "").trim();
      const value = getValue() ?? 0;
      return unit ? `${value} ${unit}` : String(value);
    },
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

function isSupplyPriceFieldName(value: unknown) {
  return String(value ?? "").trim() === "Цена поставки";
}

function getStatusMeasurementValue(source: Record<string, unknown>, key: string) {
  const directMeasurementKeys: Record<string, string[]> = {
    all: ["total_measurement_value", "measurement_value"],
    active: ["total_active_measurement_value", "active_measurement_value"],
    inactive: ["total_inactive_measurement_value", "inactive_measurement_value"],
    small_left: ["small_left_measurement_value", "low_stock_measurement_value", "low_measurement_value"],
    zero_left: ["zero_left_measurement_value", "zero_stock_measurement_value", "zero_measurement_value"],
  };

  const measurementKeys = directMeasurementKeys[key] ?? [];
  for (const measurementKey of measurementKeys) {
    const value = source[measurementKey];
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return getStatusCount(source, key);
}

function getStatusCount(source: Record<string, unknown>, key: string) {
  if (key === "small_left" && source["low_stock"] != null) {
    return getStatusCount(source, "low_stock");
  }

  if (key === "small_left" && source["low"] != null) {
    return getStatusCount(source, "low");
  }

  if (key === "low" && source["low_stock"] != null) {
    return getStatusCount(source, "low_stock");
  }

  if (key === "low_stock" && source["low"] != null) {
    return getStatusCount(source, "low");
  }

  if (key === "zero_left" && source["zero_stock"] != null) {
    return getStatusCount(source, "zero_stock");
  }

  if (key === "zero_left" && source["zero"] != null) {
    return getStatusCount(source, "zero");
  }

  if (key === "zero" && source["zero_stock"] != null) {
    return getStatusCount(source, "zero_stock");
  }

  if (key === "zero_stock" && source["zero"] != null) {
    return getStatusCount(source, "zero");
  }

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
  return new Intl.NumberFormat("ru-RU").format(num);
}

function formatQuantityStat(value: unknown) {
  if (value && typeof value === "object") {
    const measurementUnits = Array.isArray((value as Record<string, unknown>)?.measurement_units)
      ? ((value as Record<string, unknown>).measurement_units as any[])
      : [];

    const formattedUnits = measurementUnits
      .map((item) => {
        const amount = Number(item?.measurement_value ?? 0);
        if (!Number.isFinite(amount)) return "";

        const unit = String(item?.measurement_unit ?? "").trim();
        const formattedAmount = new Intl.NumberFormat("ru-RU").format(amount);
        return unit ? `${formattedAmount} ${unit}` : formattedAmount;
      })
      .filter(Boolean);

    if (formattedUnits.length) {
      return formattedUnits.join(", ");
    }

    const nestedTotal = Number(
      (value as Record<string, unknown>)?.total ??
        (value as Record<string, unknown>)?.value ??
        0,
    );

    if (Number.isFinite(nestedTotal)) {
      return new Intl.NumberFormat("ru-RU").format(nestedTotal);
    }
  }

  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "-";
  return new Intl.NumberFormat("ru-RU").format(num);
}

function formatMoneyStat(value: unknown) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "-";
  return `${new Intl.NumberFormat("ru-RU").format(num)} UZS`;
}
