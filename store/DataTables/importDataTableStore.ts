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

function formatDateTime(value: string) {
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
  }).format(date);
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
        row.name,
        row.status,
        row.mode,
        row.shop_id,
        row.created_at,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  });

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(totalItems.value / pagination.value.pageSize)),
  );

  const columns = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Импорт" },
    {
      accessorKey: "mode",
      header: "Режим",
      cell: ({ getValue }: any) =>
        getValue() === "without_check" ? "Без проверки" : "С проверкой",
    },
    { accessorKey: "shop_id", header: "Магазин" },
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
      accessorKey: "created_at",
      header: "Дата",
      cell: ({ getValue }: any) => formatDateTime(String(getValue())),
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
    return router.push({
      path: `/products/import/list/${importRow.id}`,
      query: { limit: "20", page: "1" },
    });
  }

  function openDraft(id: string) {
    return router.push({
      path: `/products/import/list/${id}`,
      query: { limit: "20", page: "1" },
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

  watch(globalFilter, () => {
    pagination.value.pageIndex = 0;
  });

  return {
    rawData,
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
  };
});
