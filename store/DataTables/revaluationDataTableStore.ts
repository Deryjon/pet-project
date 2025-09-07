import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import {
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useVueTable,
} from "@tanstack/vue-table";

interface RevaluationRow {
  id: number;        // ID
  name: string;      // Наименование
  store: string;     // Магазин
  type: string;      // Тип (например: "Повышение", "Снижение")
  qty: number;       // Кол-во
  status: string;    // Статус
  createdBy: string; // Создал
  closedBy: string;  // Завершил
  revaluatedAt: string; // Дата переоценки
}

export const useRevaluationDataTableStore = defineStore(
  "revaluationDataTableStore",
  () => {
    const rawData = ref<RevaluationRow[]>([
      {
        id: 101,
        name: "Переоценка №1",
        store: "Samarqand Darvoza",
        type: "Повышение",
        qty: 50,
        status: "Завершена",
        createdBy: "Islomjon",
        closedBy: "Oybek",
        revaluatedAt: "01.09.2023 14:30:00",
      },
      {
        id: 102,
        name: "Переоценка №2",
        store: "Globus Mall",
        type: "Снижение",
        qty: 30,
        status: "В обработке",
        createdBy: "Iskandar",
        closedBy: "-",
        revaluatedAt: "05.09.2023 09:15:00",
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
      { accessorKey: "type", header: "Тип" },
      { accessorKey: "qty", header: "Кол-во" },
      { accessorKey: "status", header: "Статус" },
      { accessorKey: "createdBy", header: "Создал" },
      { accessorKey: "closedBy", header: "Завершил" },
      { accessorKey: "revaluatedAt", header: "Дата переоценки" },
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
