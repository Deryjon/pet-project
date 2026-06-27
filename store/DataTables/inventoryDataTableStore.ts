import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import { useApi } from "~/composables/useApi";

interface InventoryRow {
  id: string;
  name: string;
  store: string;
  shopId: string;
  itemsCount: number;
  status: string;
  comment: string;
  createdAt: string;
  createdBy: string;
  closedBy: string;
  closedAt: string | null;
}

export const useInventoryDataTableStore = defineStore("inventoryDataTableStore", () => {
  const rawData = ref<InventoryRow[]>([]);
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
    { accessorKey: "name", header: "Наименование" },
    { accessorKey: "store", header: "Магазин" },
    { accessorKey: "itemsCount", header: "Кол-во товаров" },
    { accessorKey: "status", header: "Статус" },
    { accessorKey: "createdAt", header: "Создание" },
    { accessorKey: "createdBy", header: "Создал" },
    { accessorKey: "closedBy", header: "Завершил" },
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
    try {
      const { apiFetch } = useApi();
      const res: any = await apiFetch('/v1/inventory-sessions', {
        method: 'GET',
        query: {
          page: pagination.value.pageIndex + 1,
          limit: pagination.value.pageSize,
          search: globalFilter.value || undefined,
        },
      });
      const items = Array.isArray(res?.items) ? res.items : [];
      rawData.value = items.map((item: any) => ({
        id: item.id ?? '',
        name: item.name ?? '',
        store: item.store ?? '',
        shopId: item.shopId ?? '',
        itemsCount: Number(item.itemsCount ?? 0),
        status: item.status === 'completed' ? 'Завершена' : 'Черновик',
        comment: item.comment ?? '',
        createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString('ru-RU') : '',
        createdBy: item.createdBy ?? '',
        closedBy: item.closedBy ?? '',
        closedAt: item.closedAt ? new Date(item.closedAt).toLocaleDateString('ru-RU') : null,
      }));
    } catch {
      rawData.value = [];
    } finally {
      loading.value = false;
    }
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
