import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import {
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useVueTable,
} from "@tanstack/vue-table";

interface SupplierRow {
  id: number;          // Айди
  name: string;        // Наименование
  debtAmount: number;  // Сумма долга
  ordersAmount: number;// Сумма заказов
  paymentsAmount: number; // Сумма оплат
  productCount: number;   // Кол-во товаров
  phone: string;       // Телефон
}

export const useSuppliersDataTableStore = defineStore(
  "suppliersDataTableStore",
  () => {
    const rawData = ref<SupplierRow[]>([
      {
        id: 1,
        name: "AliExpress",
        debtAmount: 5000000,
        ordersAmount: 12000000,
        paymentsAmount: 7000000,
        productCount: 320,
        phone: "+998901234567",
      },
      {
        id: 2,
        name: "Taobao",
        debtAmount: 2500000,
        ordersAmount: 8000000,
        paymentsAmount: 5500000,
        productCount: 210,
        phone: "+998909876543",
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
      { accessorKey: "id", header: "Айди" },
      { accessorKey: "name", header: "Наименование" },
      { accessorKey: "debtAmount", header: "Сумма долга" },
      { accessorKey: "ordersAmount", header: "Сумма заказов" },
      { accessorKey: "paymentsAmount", header: "Сумма оплат" },
      { accessorKey: "productCount", header: "Кол-во товаров" },
      { accessorKey: "phone", header: "Телефон" },
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
