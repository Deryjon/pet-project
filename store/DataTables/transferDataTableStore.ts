import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import {
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useVueTable,
} from "@tanstack/vue-table";

interface TransferRow {
  id: number;           // ID
  name: string;         // Наименование
  fromStore: string;    // Из магазина
  toStore: string;      // В магазин
  qty: number;          // Кол-во
  status: string;       // Статус
  createdBy: string;    // Создал
  acceptedBy: string;   // Принял
  sum: number;          // Сумма
  sentAt: string;       // Дата отправки
  receivedAt: string;   // Дата принятия
}

export const useTransferDataTableStore = defineStore(
  "transferDataTableStore",
  () => {
    // тестовые данные
    const rawData = ref<TransferRow[]>([
      {
        id: 1,
        name: "Перемещение №1",
        fromStore: "Samarqand Darvoza",
        toStore: "Globus Mall",
        qty: 12,
        status: "В пути",
        createdBy: "Islomjon",
        acceptedBy: "Oybek",
        sum: 250000,
        sentAt: "01.09.2023 10:00:00",
        receivedAt: "-",
      },
      {
        id: 2,
        name: "Перемещение №2",
        fromStore: "Globus Mall",
        toStore: "Mega Planet",
        qty: 7,
        status: "Принято",
        createdBy: "Iskandar",
        acceptedBy: "Dilshod",
        sum: 175000,
        sentAt: "03.09.2023 14:20:00",
        receivedAt: "04.09.2023 09:45:00",
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
      { accessorKey: "fromStore", header: "Из магазина" },
      { accessorKey: "toStore", header: "В магазин" },
      { accessorKey: "qty", header: "Кол-во" },
      { accessorKey: "status", header: "Статус" },
      { accessorKey: "createdBy", header: "Создал" },
      { accessorKey: "acceptedBy", header: "Принял" },
      { accessorKey: "sum", header: "Сумма" },
      { accessorKey: "sentAt", header: "Дата отправки" },
      { accessorKey: "receivedAt", header: "Дата принятия" },
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

    // обновление данных
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
