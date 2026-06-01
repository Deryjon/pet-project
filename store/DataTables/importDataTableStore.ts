import { useRouter } from "#app";
import { defineStore } from "pinia";
import { computed, h, ref, watch } from "vue";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import {
  useProductImport,
  type ImportSessionListItem,
} from "~/composables/useProductImport";

function formatDateTimeWithSeconds(value: string) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return value || "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function formatNumber(value?: number) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("ru-RU").format(value);
}

function formatCurrency(value?: number) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${new Intl.NumberFormat("ru-RU").format(value)} UZS`;
}

function getStatusLabel(status: string) {
  switch (status) {
    case "draft":
      return "Черновик";
    case "validating":
      return "Проверяется";
    case "preview_ready":
      return "Готов к проверке";
    case "importing":
      return "Импортируется";
    case "completed":
      return "Завершен";
    case "cancelled":
      return "Отменен";
    case "failed":
      return "Ошибка";
    default:
      return status || "—";
  }
}

function getStatusClasses(status: string) {
  switch (status) {
    case "completed":
      return "bg-[#1f5f3a] text-[#d8ffe7]";
    case "cancelled":
    case "failed":
      return "bg-[#6b2d31] text-[#ffd9dc]";
    case "preview_ready":
      return "bg-[#37516f] text-[#d9ebff]";
    case "validating":
    case "importing":
      return "bg-[#5b4a1f] text-[#ffe9bf]";
    default:
      return "bg-[#4b4b4b] text-white";
  }
}

export const useImportDataTableStore = defineStore("importDataTableStore", () => {
  const router = useRouter();
  const { listImportSessions } = useProductImport();

  const rawData = ref<ImportSessionListItem[]>([]);
  const loading = ref(false);
  const globalFilter = ref("");
  const pagination = ref({ pageSize: 10, pageIndex: 0 });
  const sorting = ref<any[]>([]);
  const totalItems = ref(0);

  const filteredData = computed(() => {
    const q = globalFilter.value.trim().toLowerCase();
    if (!q) return rawData.value;

    return rawData.value.filter((row) =>
      [
        row.id,
        row.int_id,
        row.name,
        row.status,
        row.shop_id,
        row.shop_name,
        row.created_at,
        row.finished_at,
        row.created_by,
        row.finished_by,
        row.import_type,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  });

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(totalItems.value / pagination.value.pageSize)),
  );

  const columns: any[] = [
    {
      accessorKey: "int_id",
      header: "ID",
      cell: ({ row }: any) => row.original.int_id || row.original.id || "—",
    },
    {
      accessorKey: "name",
      header: "Наименование",
      cell: ({ row }: any) => row.original.name || "—",
    },
    {
      accessorKey: "shop_name",
      header: "Магазин",
      cell: ({ row }: any) => row.original.shop_name || row.original.shop_id || "—",
    },
    {
      id: "quantity_info",
      accessorKey: "quantity_info",
      header: "Кол-во",
      accessorFn: (row: ImportSessionListItem) => ({
        loaded: row.total_loaded_measurement_value,
        arrived: row.total_arrived_measurement_value,
      }),
      cell: ({ getValue }: any) => {
        const value = getValue();
        return h("div", { class: "flex flex-col gap-2 whitespace-normal" }, [
          h(
            "div",
            {
              class:
                "inline-flex w-fit items-center gap-2 rounded-full bg-[#4993dd]/12 px-2.5 py-1 text-[12px] font-semibold text-[#4993dd]",
            },
            [
              h(
                "span",
                {
                  class:
                    "inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#4993dd]/18 text-[12px] leading-none text-[#4993dd]",
                },
                "↓",
              ),
              h("span", {}, formatNumber(value?.loaded)),
            ],
          ),
          h(
            "div",
            {
              class:
                "inline-flex w-fit items-center gap-2 rounded-full bg-[#32b67a]/12 px-2.5 py-1 text-[12px] font-semibold text-[#32b67a]",
            },
            [
              h(
                "span",
                {
                  class:
                    "inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#32b67a]/18 text-[12px] leading-none text-[#32b67a]",
                },
                "✓",
              ),
              h("span", {}, formatNumber(value?.arrived)),
            ],
          ),
        ]);
      },
      meta: {
        tdClass: "whitespace-normal min-w-[170px]",
      },
    },
    {
      id: "amount_info",
      accessorKey: "amount_info",
      header: "Сумма",
      accessorFn: (row: ImportSessionListItem) => ({
        supply: row.total_supply_price,
        retail: row.total_retail_price,
      }),
      cell: ({ getValue }: any) => {
        const value = getValue();
        return h("div", { class: "flex flex-col gap-2 whitespace-normal" }, [
          h(
            "div",
            {
              class:
                "inline-flex w-fit items-center gap-2 rounded-full bg-[#d4a62a]/12 px-2.5 py-1 text-[12px] font-semibold text-[#d4a62a]",
            },
            [
              h(
                "span",
                {
                  class:
                    "inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#d4a62a]/18 text-[12px] leading-none text-[#d4a62a]",
                },
                "↓",
              ),
              h("span", {}, formatCurrency(value?.supply)),
            ],
          ),
          h(
            "div",
            {
              class:
                "inline-flex w-fit items-center gap-2 rounded-full bg-[#9b6dff]/12 px-2.5 py-1 text-[12px] font-semibold text-[#9b6dff]",
            },
            [
              h(
                "span",
                {
                  class:
                    "inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#9b6dff]/18 text-[12px] leading-none text-[#9b6dff]",
                },
                "↑",
              ),
              h("span", {}, formatCurrency(value?.retail)),
            ],
          ),
        ]);
      },
      meta: {
        tdClass: "whitespace-normal min-w-[220px]",
      },
    },
    {
      accessorKey: "status",
      header: "Статус",
      cell: ({ getValue }: any) =>
        h(
          "span",
          {
            class: `inline-flex rounded-[12px] px-3 py-2 text-[14px] font-bold ${getStatusClasses(String(getValue()))}`,
          },
          getStatusLabel(String(getValue())),
        ),
    },
    {
      id: "date_display",
      accessorKey: "date_display",
      header: "Дата",
      accessorFn: (row: ImportSessionListItem) => row.finished_at || row.created_at || "",
      cell: ({ getValue }: any) => formatDateTimeWithSeconds(String(getValue() || "")),
    },
    {
      accessorKey: "created_by",
      header: "Создал",
      cell: ({ row }: any) => row.original.created_by || "—",
      meta: {
        tdClass: "whitespace-normal min-w-[170px]",
      },
    },
    {
      accessorKey: "finished_by",
      header: "Завершил",
      cell: ({ row }: any) => row.original.finished_by || "—",
      meta: {
        tdClass: "whitespace-normal min-w-[170px]",
      },
    },
    {
      accessorKey: "import_type",
      header: "Тип импорта",
      cell: ({ row }: any) => row.original.import_type || "Поступление",
      meta: {
        tdClass: "whitespace-normal min-w-[160px]",
      },
    },
  ];

  const table = useVueTable({
    get data() {
      return filteredData.value;
    },
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      get pagination() {
        return pagination.value;
      },
      get sorting() {
        return sorting.value;
      },
    },
    onPaginationChange: (updater: any) => {
      pagination.value = typeof updater === "function" ? updater(pagination.value) : updater;
    },
    onSortingChange: (updater: any) => {
      sorting.value = typeof updater === "function" ? updater(sorting.value) : updater;
    },
  });

  async function fetchData(params?: { page?: number; pageSize?: number }) {
    loading.value = true;

    try {
      const page = params?.page ?? pagination.value.pageIndex + 1;
      const limit = params?.pageSize ?? pagination.value.pageSize;
      const result = await listImportSessions({ page, limit });

      rawData.value = result.items;
      totalItems.value = result.count || result.items.length;
      pagination.value = {
        pageIndex: Math.max(0, page - 1),
        pageSize: limit,
      };
    } catch {
      rawData.value = [];
      totalItems.value = 0;
    } finally {
      loading.value = false;
    }
  }

  function openProduct(importRow: ImportSessionListItem) {
    if (!importRow?.id) {
      return router.push("/products/import");
    }

    if (importRow.status === "draft" || importRow.status === "validating") {
      return router.push({
        path: `/products/import/edit/${importRow.id}`,
        query: { page: "1" },
      });
    }

    return router.push({
      path: `/products/import/list/${importRow.id}`,
      query: { limit: "5", page: "1" },
    });
  }

  function openDraft(id: string) {
    if (!String(id || "").trim()) {
      return router.push("/products/import");
    }

    return router.push({
      path: `/products/import/edit/${id}`,
      query: { page: "1" },
    });
  }

  function previousPage() {
    if (pagination.value.pageIndex <= 0 || loading.value) return;
    fetchData({ page: pagination.value.pageIndex, pageSize: pagination.value.pageSize });
  }

  function nextPage() {
    if (pagination.value.pageIndex + 1 >= totalPages.value || loading.value) return;
    fetchData({ page: pagination.value.pageIndex + 2, pageSize: pagination.value.pageSize });
  }

  function setPageSize(pageSize: number) {
    fetchData({ page: 1, pageSize });
  }

  watch(globalFilter, () => {
    pagination.value.pageIndex = 0;
  });

  return {
    rawData,
    filteredData,
    loading,
    globalFilter,
    pagination,
    sorting,
    totalPages,
    table,
    fetchData,
    openProduct,
    openDraft,
    previousPage,
    nextPage,
    setPageSize,
  };
});
