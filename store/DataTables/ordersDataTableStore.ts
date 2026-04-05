import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
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

export const useOrdersDataTableStore = defineStore("ordersDataTableStore", () => {
  const rawData = ref<OrdersRow[]>([]);
  const loading = ref(false);
  const globalFilter = ref("");
  const pagination = ref({ pageSize: 10, pageIndex: 0 });
  const sorting = ref<any[]>([]);

  const filteredData = computed(() => {
    if (!globalFilter.value) return rawData.value;
    const q = globalFilter.value.toLowerCase();
    return rawData.value.filter((row) => Object.values(row).join(" ").toLowerCase().includes(q));
  });

  const paginatedData = computed(() => {
    const start = pagination.value.pageIndex * pagination.value.pageSize;
    return filteredData.value.slice(start, start + pagination.value.pageSize);
  });

  const totalPages = computed(() =>
    Math.ceil(filteredData.value.length / pagination.value.pageSize),
  );

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
      pagination.value = typeof updater === "function" ? updater(pagination.value) : updater;
    },
    onSortingChange: (updater: any) => {
      sorting.value = typeof updater === "function" ? updater(sorting.value) : updater;
    },
  });

  async function fetchData() {
    loading.value = true;
    rawData.value = [];
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
});
