import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import {
  getCoreRowModel,
  getPaginationRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import { useProducts } from "~/composables/useProducts";
import type { StockMovementListItem } from "~/types/product-detail";

function formatDateTimeWithSeconds(value: string) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return value || "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function formatQuantity(value: number) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("ru-RU").format(value);
}

export const MOVEMENT_TYPE_OPTIONS = [
  { label: "Все источники", value: "" },
  { label: "Импорт", value: "PURCHASE" },
  { label: "Ручное изменение", value: "ADJUSTMENT" },
  { label: "Продажа", value: "SALE" },
  { label: "Возврат", value: "RETURN" },
  { label: "Трансфер", value: "TRANSFER" },
  { label: "Списание", value: "WRITE_OFF" },
];

export const useStockMovementsDataTableStore = defineStore(
  "stockMovementsDataTableStore",
  () => {
    const { listStockMovements } = useProducts();

    const rawData = ref<StockMovementListItem[]>([]);
    const loading = ref(false);
    const globalFilter = ref("");
    const movementType = ref("");
    const pagination = ref({ pageSize: 20, pageIndex: 0 });
    const sorting = ref<any[]>([]);
    const totalItems = ref(0);

    const totalPages = computed(() =>
      Math.max(1, Math.ceil(totalItems.value / pagination.value.pageSize)),
    );

    const columns: any[] = [
      {
        accessorKey: "created_at",
        header: "Дата",
        cell: ({ row }: any) => formatDateTimeWithSeconds(row.original.created_at),
      },
      {
        accessorKey: "product_name",
        header: "Товар",
        cell: ({ row }: any) => row.original.product_name || "—",
        meta: { tdClass: "whitespace-normal min-w-[220px]" },
      },
      {
        accessorKey: "shop_name",
        header: "Магазин",
        cell: ({ row }: any) => row.original.shop_name || "—",
      },
      {
        accessorKey: "before_quantity",
        header: "Было",
        cell: ({ row }: any) => formatQuantity(row.original.before_quantity),
      },
      {
        accessorKey: "after_quantity",
        header: "Стало",
        cell: ({ row }: any) => formatQuantity(row.original.after_quantity),
      },
      {
        accessorKey: "quantity",
        header: "Изменение",
        cell: ({ row }: any) => {
          const value = Number(row.original.quantity ?? 0);
          const sign = value > 0 ? "+" : "";
          return `${sign}${formatQuantity(value)}`;
        },
      },
      {
        accessorKey: "type_label",
        header: "Источник",
        cell: ({ row }: any) => row.original.type_label || "—",
      },
      {
        accessorKey: "user_name",
        header: "Кто изменил",
        cell: ({ row }: any) => row.original.user_name || "—",
      },
    ];

    const table = useVueTable({
      get data() {
        return rawData.value;
      },
      columns,
      getCoreRowModel: getCoreRowModel(),
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

    async function fetchData(params?: { page?: number; pageSize?: number }) {
      loading.value = true;

      try {
        const page = params?.page ?? pagination.value.pageIndex + 1;
        const limit = params?.pageSize ?? pagination.value.pageSize;
        const search = globalFilter.value.trim().replace(/\s+/g, " ");
        const result = await listStockMovements({
          page,
          limit,
          movement_type: movementType.value || undefined,
        });

        const items = result?.items ?? [];
        rawData.value = search
          ? items.filter((item) =>
              [item.product_name, item.shop_name, item.user_name, item.type_label]
                .join(" ")
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
          : items;
        totalItems.value = result?.count ?? items.length;
        pagination.value = {
          pageIndex: Math.max(0, page - 1),
          pageSize: limit,
        };
      } catch {
        rawData.value = [];
        totalItems.value = 0;
      } finally {
        loading.value = false;
      }
    }

    function previousPage() {
      if (pagination.value.pageIndex <= 0 || loading.value) return;
      fetchData({ page: pagination.value.pageIndex, pageSize: pagination.value.pageSize });
    }

    function nextPage() {
      if (pagination.value.pageIndex + 1 >= totalPages.value || loading.value) return;
      fetchData({ page: pagination.value.pageIndex + 2, pageSize: pagination.value.pageSize });
    }

    function setPageSize(pageSize: number) {
      fetchData({ page: 1, pageSize });
    }

    let searchTimer: ReturnType<typeof setTimeout> | null = null;
    watch(globalFilter, () => {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => fetchData({ page: 1 }), 350);
    });

    watch(movementType, () => {
      fetchData({ page: 1 });
    });

    return {
      rawData,
      loading,
      globalFilter,
      movementType,
      pagination,
      sorting,
      totalPages,
      table,
      fetchData,
      previousPage,
      nextPage,
      setPageSize,
    };
  },
);
