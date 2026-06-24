import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import { useApi } from "~/composables/useApi";

interface RevaluationRow {
  id: number;
  name: string;
  store: string;
  type: string;
  qty: number;
  status: string;
  createdBy: string;
  closedBy: string;
  revaluatedAt: string;
}

export const useRevaluationDataTableStore = defineStore("revaluationDataTableStore", () => {
  const rawData = ref<RevaluationRow[]>([]);
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
    { accessorKey: "name", header: "Наименование" },
    { accessorKey: "store", header: "Магазин" },
    { accessorKey: "type", header: "Тип" },
    { accessorKey: "qty", header: "Кол-во" },
    { accessorKey: "status", header: "Статус" },
    { accessorKey: "createdBy", header: "Создал" },
    { accessorKey: "closedBy", header: "Завершил" },
    { accessorKey: "revaluatedAt", header: "Дата переоценки" },
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
      const res: any = await apiFetch('/v1/revaluation', {
        method: 'GET',
        query: {
          page: pagination.value.pageIndex + 1,
          limit: pagination.value.pageSize,
          search: globalFilter.value || undefined,
        },
      });
      const items = Array.isArray(res?.items) ? res.items : [];
      rawData.value = items.map((item: any) => ({
        id: item.id ?? 0,
        name: item.name ?? '',
        store: item.store ?? '',
        type: item.type ?? '',
        qty: Number(item.qty ?? 0),
        status: item.status ?? '',
        createdBy: item.user ?? '',
        closedBy: '',
        revaluatedAt: item.revaluatedAt ? new Date(item.revaluatedAt).toLocaleDateString('ru-RU') : '',
      }));
    } catch {
      rawData.value = [];
    } finally {
      loading.value = false;
    }
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
});
