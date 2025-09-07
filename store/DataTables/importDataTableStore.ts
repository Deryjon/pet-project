import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useVueTable,
} from "@tanstack/vue-table";

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

export const useImportDataTableStore = defineStore(
  "importDataTableStore",
  () => {
    // данные всегда сразу есть
    const rawData = ref<ImportRow[]>([
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
    const loading = ref(false);
    const globalFilter = ref("");
    const data = rawData.value;
    const pagination = ref({ pageSize: 10, pageIndex: 0 });
    const sorting = ref<any[]>([]);

    // фильтрация
    const filteredData = computed(() => {
      if (!globalFilter.value) return rawData.value;
      const q = globalFilter.value.toLowerCase();
      return rawData.value.filter((row) =>
        Object.values(row).join(" ").toLowerCase().includes(q)
      );
    });

    // постраничные данные
    const paginatedData = computed(() => {
      const start = pagination.value.pageIndex * pagination.value.pageSize;
      return filteredData.value.slice(start, start + pagination.value.pageSize);
    });

    const totalPages = computed(() =>
      Math.ceil(filteredData.value.length / pagination.value.pageSize)
    );

    // колонки
    const columns = [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "name", header: "Наименование" },
      { accessorKey: "store", header: "Магазин" },
      { accessorKey: "qty", header: "Кол-во" },
      {
        accessorKey: "total",
        header: "Сумма",
        cell: ({ getValue }: any) => getValue().toLocaleString() + " UZS",
      },
      { accessorKey: "status", header: "Статус" },
      { accessorKey: "createdAt", header: "Дата" },
      { accessorKey: "createdBy", header: "Создатель" },
    ];

    // таблица
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
      rawData.value = [];
      await new Promise((r) => setTimeout(r, 200));
      rawData.value = data; // берем из /data.ts
      loading.value = false;
    }

    fetchData();

    watch(globalFilter, async () => {
      pagination.value.pageIndex = 0;
      await fetchData();
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
      fetchData,
    };
  }
);
