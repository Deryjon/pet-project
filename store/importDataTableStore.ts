import { defineStore } from "pinia";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import { ref } from "vue";

// структура строки импорта
interface ImportRow {
  id: number;
  name: string;
  store: string;
  qty: number;
  total: number;
  status: string;
  createdAt: string;
  createdBy: string;
}

export const useImportDataTableStore = defineStore("importDataTable", () => {
  const loading = ref(false);

  const data = ref<ImportRow[]>([
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
  ]);

  // пагинация
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(data.value.length);

  // сортировка
  const sorting = ref<any[]>([]);

  // column helper
  const columnHelper = createColumnHelper<ImportRow>();

  const columns = [
    columnHelper.accessor("id", {
      header: () => "ID",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("name", {
      header: () => "Наименование",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("store", {
      header: () => "Магазин",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("qty", {
      header: () => "Кол-во",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("total", {
      header: () => "Сумма",
      cell: (info) => info.getValue().toLocaleString() + " UZS",
    }),
    columnHelper.accessor("status", {
      header: () => "Статус",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("createdAt", {
      header: () => "Дата",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("createdBy", {
      header: () => "Создатель",
      cell: (info) => info.getValue(),
    }),
  ];

  // таблица
  const table = useVueTable({
    data: data.value,
    columns,
    state: {
      sorting: sorting.value,
      pagination: {
        pageIndex: page.value - 1,
        pageSize: pageSize.value,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: (updater) => {
      sorting.value =
        typeof updater === "function" ? updater(sorting.value) : updater;
    },
  });

  return {
    loading,
    data,
    total,
    page,
    pageSize,
    sorting,
    table,
  };
});
