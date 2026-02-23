import { defineStore } from "pinia";
import { ref, computed, watch, h } from "vue";
import {
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import { useProducts, type ProductDTO } from "~/composables/useProducts";

export const useCatalogDataTableStore = defineStore("catalogDataTableStore", () => {
  const rawData = ref<any[]>([]);
  const globalFilter = ref("");
  const loading = ref(false);

  const pagination = ref({ pageSize: 10, pageIndex: 0 });
  const sorting = ref<any[]>([]);

  const showProductSidebar = ref(false);
  const selectedProduct = ref<any | null>(null);

  async function fetchData(params?: { search?: string; page?: number; pageSize?: number }) {
    loading.value = true;
    rawData.value = [];
    try {
      const { listProducts } = useProducts();
      const items = await listProducts({
        search: params?.search || globalFilter.value || undefined,
        page: params?.page ?? pagination.value.pageIndex + 1,
        pageSize: params?.pageSize ?? pagination.value.pageSize,
      });

      rawData.value = (items as ProductDTO[]).map((p) => ({
        id: p.id,
        photo: p.photo || undefined,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        category: p.category?.name || "",
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
    } finally {
      loading.value = false;
    }
  }

  fetchData();

  watch(globalFilter, async (val) => {
    pagination.value.pageIndex = 0;
    await fetchData({ search: val });
  });

  const filteredData = computed(() => {
    if (!globalFilter.value) return rawData.value;
    const q = globalFilter.value.toLowerCase();
    return rawData.value.filter((item) =>
      Object.values(item).join(" ").toLowerCase().includes(q)
    );
  });

  const paginatedProducts = computed(() => {
    const start = pagination.value.pageIndex * pagination.value.pageSize;
    return filteredData.value.slice(start, start + pagination.value.pageSize);
  });

  const totalPages = computed(() =>
    Math.ceil(filteredData.value.length / pagination.value.pageSize)
  );

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
      cell: ({ getValue }: any) => {
        const url = getValue();
        const imageUrl = url ? url : placeholderImgUrl;
        return h("img", {
          src: imageUrl,
          alt: "\u0424\u043e\u0442\u043e \u0442\u043e\u0432\u0430\u0440\u0430",
          class: "w-12 h-12 object-cover rounded-full",
        });
      },
    },
    { accessorKey: "name", header: "\u041d\u0430\u0438\u043c\u0435\u043d\u043e\u0432\u0430\u043d\u0438\u0435" },
    { accessorKey: "sku", header: "\u0410\u0440\u0442\u0438\u043a\u0443\u043b" },
    { accessorKey: "barcode", header: "\u0411\u0430\u0440\u043a\u043e\u0434" },
    { accessorKey: "category", header: "\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f" },
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
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    state: {
      get pagination() {
        return pagination.value;
      },
      get sorting() {
        return sorting.value;
      },
    },
    onPaginationChange: (updater: any) => {
      pagination.value =
        typeof updater === "function" ? updater(pagination.value) : updater;
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
    table.previousPage();
  }

  function nextPage() {
    table.nextPage();
  }

  return {
    rawData,
    globalFilter,
    loading,
    pagination,
    sorting,
    filteredData,
    paginatedProducts,
    totalPages,
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
