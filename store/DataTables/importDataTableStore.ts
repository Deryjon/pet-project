import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";

export interface ImportRow {
  id: number;
  name: string;
  store: string;
  qty: number;
  total: number;
  status: string;
  createdAt: string;
  createdBy: string;
}

const initialData: ImportRow[] = [
  {
    id: 268645,
    name: "Product Import 268645",
    store: "Globus Mall",
    qty: 1,
    total: 315000,
    status: "Завершен",
    createdAt: "01.09.2025 22:50:07",
    createdBy: "Iskandarjon Yusupov",
  },
  {
    id: 879991,
    name: "Product Import 879991",
    store: "Globus Mall",
    qty: 1,
    total: 250000,
    status: "Завершен",
    createdAt: "01.09.2025 22:49:34",
    createdBy: "Iskandarjon Yusupov",
  },
  {
    id: 359296,
    name: "Product Import 359296",
    store: "Samarqand Darvoza",
    qty: 1,
    total: 165000,
    status: "Завершен",
    createdAt: "01.09.2025 22:49:00",
    createdBy: "Iskandarjon Yusupov",
  },
];

export const useImportDataTableStore = defineStore("importDataTableStore", () => {
  const rawData = ref<ImportRow[]>([...initialData]);
  const loading = ref(false);
  const globalFilter = ref("");
  const pagination = ref({ pageSize: 10, pageIndex: 0 });
  const sorting = ref<any[]>([]);

  const filteredData = computed(() => {
    if (!globalFilter.value) return rawData.value;
    const q = globalFilter.value.toLowerCase();
    return rawData.value.filter((row) =>
      Object.values(row).join(" ").toLowerCase().includes(q)
    );
  });

  const paginatedData = computed(() => {
    const start = pagination.value.pageIndex * pagination.value.pageSize;
    return filteredData.value.slice(start, start + pagination.value.pageSize);
  });

  const totalPages = computed(() =>
    Math.ceil(filteredData.value.length / pagination.value.pageSize)
  );

  const columns = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Наименование" },
    { accessorKey: "store", header: "Магазин" },
    { accessorKey: "qty", header: "Кол-во" },
    {
      accessorKey: "total",
      header: "Сумма",
      cell: ({ getValue }: any) => `${getValue().toLocaleString()} UZS`,
    },
    { accessorKey: "status", header: "Статус" },
    { accessorKey: "createdAt", header: "Дата" },
    { accessorKey: "createdBy", header: "Создатель" },
  ];

  const table = useVueTable({
    data: filteredData,
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
      pagination.value =
        typeof updater === "function" ? updater(pagination.value) : updater;
    },
    onSortingChange: (updater: any) => {
      sorting.value =
        typeof updater === "function" ? updater(sorting.value) : updater;
    },
  });

  async function fetchData() {
    loading.value = true;
    await new Promise((resolve) => setTimeout(resolve, 100));
    loading.value = false;
  }

  function addImport(importRow: Omit<ImportRow, "id">) {
    const nextId =
      rawData.value.reduce((maxId, row) => Math.max(maxId, row.id), 100000) + 1;

    rawData.value = [
      {
        id: nextId,
        ...importRow,
      },
      ...rawData.value,
    ];
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
    filteredData,
    paginatedData,
    totalPages,
    table,
    addImport,
    fetchData,
  };
});
