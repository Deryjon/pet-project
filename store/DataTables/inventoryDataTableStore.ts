import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import {
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useVueTable,
} from "@tanstack/vue-table";

interface InventoryRow {
  id: number;
  name: string;         // Наименование
  store: string;        // Магазин
  qty: number;          // Кол-во
  difference: number;   // Разница
  differenceSum: number;// Сумма разницы
  type: string;         // Тип
  status: string;       // Статус
  createdAt: string;    // Создание
  createdBy: string;    // Создал
  closedBy: string;     // Завершил
}

export const useInventoryDataTableStore = defineStore(
  "inventoryDataTableStore",
  () => {
    // тестовые данные
    const rawData = ref<InventoryRow[]>([
      {
        id: 1,
        name: "Заказ 2023.09.18 16:35",
        store: "Samarqand Darvoza",
        qty: 10,
        difference: 2,
        differenceSum: 50000,
        type: "Инвентаризация",
        status: "В обработке",
        createdAt: "18.09.2023 16:35:57",
        createdBy: "Islomjon Yusupov",
        closedBy: "Oybek Ganiev",
      },
      {
        id: 2,
        name: "Заказ 2023.09.20 12:10",
        store: "Globus Mall",
        qty: 5,
        difference: -1,
        differenceSum: -20000,
        type: "Приёмка",
        status: "Завершен",
        createdAt: "20.09.2023 12:10:45",
        createdBy: "Iskandarjon Yusupov",
        closedBy: "Dilshod Karimov",
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
      { accessorKey: "name", header: "Наименование" },
      { accessorKey: "store", header: "Магазин" },
      { accessorKey: "qty", header: "Кол-во" },
      { accessorKey: "difference", header: "Разница" },
      { accessorKey: "differenceSum", header: "Сумма разницы" },
      { accessorKey: "type", header: "Тип" },
      { accessorKey: "status", header: "Статус" },
      { accessorKey: "createdAt", header: "Создание" },
      { accessorKey: "createdBy", header: "Создал" },
      { accessorKey: "closedBy", header: "Завершил" },
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
      rawData.value = data; // пока данные локальные
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
