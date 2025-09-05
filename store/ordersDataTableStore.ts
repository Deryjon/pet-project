import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import {
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useVueTable,
} from "@tanstack/vue-table";

interface OrdersRow {
  id: number;
  orderName: string;
  supplier: string;
  store: string;
  status: string;
  qty: number;
  createdAt: string;
  receivedAt: string;
  closedAt: string;
  createdBy: string;
  acceptedBy: string;
}

export const useOrdersDataTableStore = defineStore(
  "ordersDataTableStore",
  () => {
    // тестовые данные
    const rawData = ref<OrdersRow[]>([
      {
        id: 963010,
        orderName: "Заказ 2023.09.18 16:35",
        supplier: "islom",
        store: "Samarqand Darvoza",
        status: "В обработке",
        qty: 10,
        createdAt: "18.09.2023 16:35:57",
        receivedAt: "19.09.2023 10:00:00",
        closedAt: "20.09.2023 18:00:00",
        createdBy: "Islomjon Yusupov",
        acceptedBy: "Oybek Ganiev",
      },
      {
        id: 963011,
        orderName: "Заказ 2023.09.20 12:10",
        supplier: "AliExpress",
        store: "Globus Mall",
        status: "Завершен",
        qty: 5,
        createdAt: "20.09.2023 12:10:45",
        receivedAt: "21.09.2023 14:30:00",
        closedAt: "22.09.2023 17:20:00",
        createdBy: "Iskandarjon Yusupov",
        acceptedBy: "Dilshod Karimov",
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
      { accessorKey: "orderName", header: "Наименование" },
      { accessorKey: "supplier", header: "Поставщик" },
      { accessorKey: "store", header: "Магазин" },
      { accessorKey: "status", header: "Статус" },
      { accessorKey: "qty", header: "Кол-во" },
      { accessorKey: "createdAt", header: "Дата создания" },
      { accessorKey: "receivedAt", header: "Дата получения" },
      { accessorKey: "closedAt", header: "Дата погашения" },
      { accessorKey: "createdBy", header: "Создал" },
      { accessorKey: "acceptedBy", header: "Принял" },
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
