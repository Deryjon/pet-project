import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import {
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useVueTable,
} from "@tanstack/vue-table";

interface WriteOffRow {
  id: number;          // ID
  name: string;        // Наименование
  store: string;       // Магазин
  qty: number;         // Кол-во
  amount: number;      // Сумма
  type: string;        // Тип списания
  user: string;        // Пользователь
  status: string;      // Статус
  createdAt: string;   // Дата создания
  closedAt: string;    // Дата завершения
}

export const useWriteOffDataTableStore = defineStore(
  "writeOffDataTableStore",
  () => {
    const rawData = ref<WriteOffRow[]>([
      {
        id: 2001,
        name: "Списание №1",
        store: "Samarqand Darvoza",
        qty: 15,
        amount: 450000,
        type: "Брак",
        user: "Islomjon",
        status: "Завершено",
        createdAt: "02.09.2023 11:30:00",
        closedAt: "03.09.2023 15:45:00",
      },
      {
        id: 2002,
        name: "Списание №2",
        store: "Globus Mall",
        qty: 7,
        amount: 210000,
        type: "Порча",
        user: "Iskandar",
        status: "В обработке",
        createdAt: "07.09.2023 09:15:00",
        closedAt: "-",
      },
    ]);

    const loading = ref(false);
    const globalFilter = ref("");
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

    // пагинация
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
      { accessorKey: "amount", header: "Сумма" },
      { accessorKey: "type", header: "Тип списания" },
      { accessorKey: "user", header: "Пользователь" },
      { accessorKey: "status", header: "Статус" },
      { accessorKey: "createdAt", header: "Дата создания" },
      { accessorKey: "closedAt", header: "Дата завершения" },
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
      await new Promise((r) => setTimeout(r, 200));
      loading.value = false;
    }

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
