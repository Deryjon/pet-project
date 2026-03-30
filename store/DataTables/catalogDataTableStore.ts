import { defineStore } from "pinia";
import { ref, computed, watch, h } from "vue";
import {
  getCoreRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import { useProducts, type ProductDTO } from "~/composables/useProducts";

export const useCatalogDataTableStore = defineStore("catalogDataTableStore", () => {
  const rawData = ref<any[]>([]);
  const globalFilter = ref("");
  const loading = ref(false);
  const totalItems = ref(0);
  const count = ref(0);
  const fields = ref<unknown[]>([]);
  const statistics = ref<Record<string, unknown> | null>(null);
  const statisticsByStatus = ref<Record<string, unknown> | null>(null);
  const activeStatusFilter = ref("all");

  const pagination = ref({ pageSize: 10, pageIndex: 0 });
  const sorting = ref<any[]>([]);

  const showProductSidebar = ref(false);
  const selectedProduct = ref<any | null>(null);

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
        search: params?.search || globalFilter.value || undefined,
        page: params?.page ?? pagination.value.pageIndex + 1,
        pageSize: params?.pageSize ?? pagination.value.pageSize,
        statistics: true,
        status: params?.status ?? activeStatusFilter.value,
      });

      pagination.value = {
        pageIndex: Math.max(0, (params?.page ?? pagination.value.pageIndex + 1) - 1),
        pageSize: params?.pageSize ?? pagination.value.pageSize,
      };
      totalItems.value = result.total;
      count.value = result.count;
      fields.value = result.fields;
      statistics.value = result.statistics;
      statisticsByStatus.value = result.statisticsByStatus;

      rawData.value = result.products.map((p: ProductDTO) => ({
        id: p.id,
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
        discount_price: (p as any).discount_price ?? null,
        brand:
          typeof (p as any).brand?.name === "string" ? (p as any).brand.name : "",
        _original: p,
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

  fetchData();

  watch(globalFilter, async (val) => {
    pagination.value.pageIndex = 0;
    await fetchData({ search: val });
  });

  watch(activeStatusFilter, async (status) => {
    pagination.value.pageIndex = 0;
    await fetchData({ status, page: 1 });
  });

  const filteredData = computed(() => rawData.value);

  const paginatedProducts = computed(() => rawData.value);

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(totalItems.value / pagination.value.pageSize))
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
          getStatisticValue(source, ["product_count", "products_count", "count"]) ?? totalItems.value,
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
    import.meta.url
  ).href;

  const formatUZS = (value: unknown) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "-";
    return `${new Intl.NumberFormat("ru-RU").format(num)} UZS`;
  };

  const columns: any[] = [
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
    {
      accessorKey: "photo",
      header: "\u0424\u043e\u0442\u043e",
      meta: {
        tdClass: "align-middle",
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
              alt: "\u0424\u043e\u0442\u043e \u0442\u043e\u0432\u0430\u0440\u0430",
              class: "w-full h-full object-cover rounded-[10px]",
            }),
          ]
        );
      },
    },
    { accessorKey: "name", header: "\u041d\u0430\u0438\u043c\u0435\u043d\u043e\u0432\u0430\u043d\u0438\u0435" },
    { accessorKey: "sku", header: "\u0410\u0440\u0442\u0438\u043a\u0443\u043b" },
    { accessorKey: "barcode", header: "\u0411\u0430\u0440\u043a\u043e\u0434" },
    { accessorKey: "category", header: "\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f" },
    { accessorKey: "shop_name", header: "\u041c\u0430\u0433\u0430\u0437\u0438\u043d" },
    { accessorKey: "suppliers", header: "\u041f\u043e\u0441\u0442\u0430\u0432\u0449\u0438\u043a\u0438" },
    {
      accessorKey: "quantity",
      header: "\u041a\u043e\u043b-\u0432\u043e",
      cell: ({ getValue }: any) => `${getValue()} \u0448\u0442`,
    },
    {
      accessorKey: "purchase_price",
      header: "\u0426\u0435\u043d\u0430 \u043f\u043e\u0441\u0442\u0430\u0432\u043a\u0438",
      cell: ({ getValue }: any) => formatUZS(getValue()),
    },
    {
      accessorKey: "sale_price",
      header: "\u0426\u0435\u043d\u0430 \u043f\u0440\u043e\u0434\u0430\u0436\u0438",
      cell: ({ getValue }: any) => formatUZS(getValue()),
    },
    {
      accessorKey: "discount_price",
      header: "\u0421\u043a\u0438\u0434\u043e\u0447\u043d\u0430\u044f \u0446\u0435\u043d\u0430",
      cell: ({ getValue }: any) => formatUZS(getValue()),
    },
    { accessorKey: "brand", header: "\u0411\u0440\u0435\u043d\u0434" },
  ];

  const table = useVueTable({
    data: filteredData,
    columns,
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
    table.getSelectedRowModel().rows.map((row: any) => row.original.id)
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
    previousPage,
    nextPage,
  };
});

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
