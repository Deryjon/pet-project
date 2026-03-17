import { useRouter } from "#app";
import { defineStore } from "pinia";
import { computed, h, ref, watch } from "vue";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";

export interface ImportLineItem {
  name: string;
  article: string;
  barcode: string;
  quantity: number;
  supplyPrice: number;
  retailPrice: number;
  category: string;
  brand: string;
  unit: string;
  wholesalePrice: number | null;
  supplier: string;
}

export interface ImportRow {
  id: number;
  detailId: string;
  name: string;
  store: string;
  qty: number;
  confirmedQty: number;
  total: number;
  purchaseTotal: number;
  status: string;
  createdAt: string;
  createdBy: string;
  finishedBy: string;
  importType: string;
  salesProgress: string;
  items: ImportLineItem[];
}

const getStatusClasses = (status: string) => {
  const normalizedStatus = status.trim().toLowerCase();

  if (normalizedStatus === "завершен") {
    return "bg-[#1f5f3a] text-[#d8ffe7]";
  }

  if (normalizedStatus === "отменен") {
    return "bg-[#6b2d31] text-[#ffd9dc]";
  }

  return "bg-[#4b4b4b] text-white";
};

const parseProgress = (value: string) => {
  const parsed = Number.parseInt(String(value).replace(/[^\d]/g, ""), 10);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return Math.min(100, Math.max(0, parsed));
};

const formatMoney = (value: number) =>
  `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value)} UZS`;

const initialData: ImportRow[] = [
  {
    id: 268645,
    detailId: "db1ada86-e6a2-4034-aab4-4d6665c553a0",
    name: "Import db1ada86",
    store: "Globus Mall",
    qty: 1,
    confirmedQty: 1,
    total: 365000,
    purchaseTotal: 100000,
    status: "Завершен",
    createdAt: "01.09.2025 22:50:07",
    createdBy: "Iskandarjon Yusupov",
    finishedBy: "Iskandarjon Yusupov",
    importType: "Поступление",
    salesProgress: "27%",
    items: [
      {
        name: "Naushnik 15 Original",
        article: "EHX-69829",
        barcode: "2000000011783",
        quantity: 1,
        supplyPrice: 100000,
        retailPrice: 365000,
        category: "Наушник > Проводные",
        brand: "Отсутствует",
        unit: "Штука",
        wholesalePrice: null,
        supplier: "Отсутствует",
      },
    ],
  },
  {
    id: 879991,
    detailId: "a31a6506-89fb-4ac1-bd95-4df47a312100",
    name: "Import a31a6506",
    store: "Globus Mall",
    qty: 4,
    confirmedQty: 4,
    total: 250000,
    purchaseTotal: 180000,
    status: "Завершен",
    createdAt: "01.09.2025 22:49:34",
    createdBy: "Iskandarjon Yusupov",
    finishedBy: "Iskandarjon Yusupov",
    importType: "Приход остатков",
    salesProgress: "100%",
    items: [
      {
        name: "Mouse X2",
        article: "MSX-10001",
        barcode: "2000000011001",
        quantity: 2,
        supplyPrice: 40000,
        retailPrice: 65000,
        category: "Аксессуары > Мышки",
        brand: "X-Brand",
        unit: "Штука",
        wholesalePrice: 55000,
        supplier: "Tech Import",
      },
      {
        name: "Keyboard TKL",
        article: "KBD-2200",
        barcode: "2000000011002",
        quantity: 2,
        supplyPrice: 50000,
        retailPrice: 60000,
        category: "Аксессуары > Клавиатуры",
        brand: "KeyLab",
        unit: "Штука",
        wholesalePrice: null,
        supplier: "Tech Import",
      },
    ],
  },
  {
    id: 359296,
    detailId: "d6fbf0d6-3f4c-4636-a76f-663eeef30f12",
    name: "Import d6fbf0d6",
    store: "Samarqand Darvoza",
    qty: 2,
    confirmedQty: 2,
    total: 165000,
    purchaseTotal: 120000,
    status: "Завершен",
    createdAt: "01.09.2025 22:49:00",
    createdBy: "Iskandarjon Yusupov",
    finishedBy: "Iskandarjon Yusupov",
    importType: "Корректировка",
    salesProgress: "100%",
    items: [
      {
        name: "Cable USB-C",
        article: "CBL-9090",
        barcode: "2000000011003",
        quantity: 2,
        supplyPrice: 60000,
        retailPrice: 82500,
        category: "Аксессуары > Кабели",
        brand: "Отсутствует",
        unit: "Штука",
        wholesalePrice: null,
        supplier: "Отсутствует",
      },
    ],
  },
];

export const useImportDataTableStore = defineStore("importDataTableStore", () => {
  const router = useRouter();
  const rawData = ref<ImportRow[]>([...initialData]);
  const loading = ref(false);
  const globalFilter = ref("");
  const pagination = ref({ pageSize: 10, pageIndex: 0 });
  const sorting = ref<any[]>([]);

  const filteredData = computed(() => {
    if (!globalFilter.value) return rawData.value;
    const q = globalFilter.value.toLowerCase();
    return rawData.value.filter((row) =>
      Object.values({ ...row, items: row.items.map((item) => Object.values(item).join(" ")).join(" ") })
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  });

  const paginatedData = computed(() => {
    const start = pagination.value.pageIndex * pagination.value.pageSize;
    return filteredData.value.slice(start, start + pagination.value.pageSize);
  });

  const totalPages = computed(() =>
    Math.ceil(filteredData.value.length / pagination.value.pageSize)
  );

  const columns = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Наименование" },
    { accessorKey: "store", header: "Магазин" },
    {
      accessorKey: "qty",
      header: "Кол-во",
      cell: ({ row }: any) =>
        h("div", { class: "space-y-1.5" }, [
          h("div", { class: "text-[14px] font-bold text-white" }, `${row.original.qty} `),
          h("div", { class: "text-[13px] text-[#bdbdbd]" }, `${row.original.confirmedQty} `),
        ]),
    },
    {
      accessorKey: "total",
      header: "Сумма",
      cell: ({ row }: any) =>
        h("div", { class: "space-y-1.5" }, [
          h("div", { class: "text-[14px] font-bold text-white" }, `${formatMoney(row.original.purchaseTotal)} `),
          h("div", { class: "text-[13px] text-[#bdbdbd]" }, `${formatMoney(row.original.total)} `),
        ]),
    },
    {
      accessorKey: "status",
      header: "Статус",
      cell: ({ getValue }: any) =>
        h(
          "span",
          {
            class: `inline-flex rounded-[12px] px-3 py-2 text-[14px] font-bold ${getStatusClasses(
              String(getValue())
            )}`,
          },
          String(getValue())
        ),
    },
    { accessorKey: "createdAt", header: "Дата" },
    { accessorKey: "createdBy", header: "Создал" },
    { accessorKey: "finishedBy", header: "Завершил" },
    { accessorKey: "importType", header: "Тип импорта" },
    {
      accessorKey: "salesProgress",
      header: "Прогресс продаж",
      cell: ({ getValue }: any) => {
        const progress = parseProgress(String(getValue()));

        return h("div", { class: "flex min-w-[170px] items-center gap-3" }, [
          h("span", { class: "w-[44px] text-[14px] font-bold text-white" }, `${progress}%`),
          h("div", { class: "h-2.5 flex-1 overflow-hidden rounded-full bg-[#565656]" }, [
            h("div", {
              class: "h-full rounded-full bg-[#4993dd] transition-all duration-300",
              style: { width: `${progress}%` },
            }),
          ]),
        ]);
      },
    },
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
    await new Promise((resolve) => setTimeout(resolve, 100));
    loading.value = false;
  }

  function getImportByDetailId(detailId: string) {
    return rawData.value.find((row) => row.detailId === detailId) ?? null;
  }

  function openProduct(importRow: ImportRow) {
    return router.push({
      path: `/products/import/list/${importRow.detailId}`,
      query: { limit: "5", page: "1" },
    });
  }

  function addImport(importRow: Omit<ImportRow, "id" | "detailId"> & { detailId?: string }) {
    const nextId =
      rawData.value.reduce((maxId, row) => Math.max(maxId, row.id), 100000) + 1;

    rawData.value = [
      {
        id: nextId,
        detailId: importRow.detailId ?? crypto.randomUUID(),
        ...importRow,
      },
      ...rawData.value,
    ];
  }

  watch(globalFilter, () => {
    pagination.value.pageIndex = 0;
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
    addImport,
    fetchData,
    openProduct,
    getImportByDetailId,
    formatMoney,
  };
});
