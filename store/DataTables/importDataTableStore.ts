import { useRouter } from "#app";
import { defineStore } from "pinia";
import { computed, h, ref, watch } from "vue";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import { useApi } from "~/composables/useApi";

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
  description?: string;
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

export type DraftMappingAction = "map" | "skip" | "new";
export type UploadMode = "with_validation" | "without_validation";

export interface ParsedImportRow {
  name: string;
  article: string;
  barcode: string;
  quantity: number;
  supplyPrice: number;
  retailPrice: number;
  category: string;
  brand: string;
  unit: string;
  supplier: string;
  description: string;
}

export interface ImportDraftFieldMapping {
  key: keyof ParsedImportRow;
  label: string;
  sample: string;
  action: DraftMappingAction;
  targetField: string;
}

export interface ImportDraftSettings {
  name: string;
  store: string;
  importType: string;
  generateBarcodes: boolean;
  generateArticles: boolean;
}

export interface ImportDraft {
  detailId: string;
  fileName: string;
  createdBy: string;
  settings: ImportDraftSettings;
  rows: ParsedImportRow[];
  mappings: ImportDraftFieldMapping[];
  uploadMode: UploadMode | null;
  progress: number;
  status: "draft" | "uploading";
}

const TARGET_FIELD_OPTIONS = [
  "name",
  "article",
  "barcode",
  "quantity",
  "supplyPrice",
  "retailPrice",
  "category",
  "brand",
  "unit",
  "supplier",
  "description",
];

const TARGET_FIELD_LABELS: Record<string, string> = {
  name: "Наименование",
  article: "Артикул",
  barcode: "Баркод",
  quantity: "Кол-во",
  supplyPrice: "Цена поставки",
  retailPrice: "Цена продажи",
  category: "Категория",
  brand: "Бренд",
  unit: "Единица измерения",
  supplier: "Поставщик",
  description: "Описание",
};

const FIELD_LABELS: Record<keyof ParsedImportRow, string> = {
  name: "НАИМЕНОВАНИЕ",
  article: "АРТИКУЛ",
  barcode: "БАРКОД",
  quantity: "КОЛ-ВО",
  supplyPrice: "ЦЕНА ПОСТАВКИ (UZS)",
  retailPrice: "РОЗНИЧНАЯ ЦЕНА (UZS)",
  category: "КАТЕГОРИЯ",
  brand: "БРЕНД",
  unit: "ЕДИНИЦА ИЗМЕРЕНИЯ",
  supplier: "ПОСТАВЩИК",
  description: "ОПИСАНИЕ",
};

type ProductCharacteristicResponse = {
  active_count?: number;
  deleted_count?: number;
  product_characteristics?: unknown[];
};

type ImportTargetFieldOption = {
  value: string;
  label: string;
  source: "base" | "characteristic";
};

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
  if (Number.isNaN(parsed)) return 0;
  return Math.min(100, Math.max(0, parsed));
};

const formatMoney = (value: number) =>
  `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value)} UZS`;

const formatDateTime = (date = new Date()) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);

const createDraftMappings = (rows: ParsedImportRow[]): ImportDraftFieldMapping[] => {
  const firstRow = rows[0];

  return (Object.keys(FIELD_LABELS) as (keyof ParsedImportRow)[]).map((key) => ({
    key,
    label: FIELD_LABELS[key],
    sample: firstRow?.[key] != null && String(firstRow[key]).trim() ? String(firstRow[key]) : "",
    action: "map",
    targetField: key,
  }));
};

const createItemFromDraftRow = (
  row: ParsedImportRow,
  settings: ImportDraftSettings,
): ImportLineItem => {
  const generatedArticle = settings.generateArticles
    ? row.article || `ART-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    : row.article;
  const generatedBarcode = settings.generateBarcodes
    ? row.barcode || `${Date.now()}${Math.floor(Math.random() * 1000)}`
    : row.barcode;

  return {
    name: row.name || "Без названия",
    article: generatedArticle || "-",
    barcode: generatedBarcode || "-",
    quantity: row.quantity,
    supplyPrice: row.supplyPrice,
    retailPrice: row.retailPrice,
    category: row.category || "Отсутствует",
    brand: row.brand || "Отсутствует",
    unit: row.unit || "Штука",
    wholesalePrice: null,
    supplier: row.supplier || "Отсутствует",
    description: row.description || "",
  };
};

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
        description: "",
      },
    ],
  },
];

export const useImportDataTableStore = defineStore("importDataTableStore", () => {
  const router = useRouter();
  const { apiFetch } = useApi();
  const rawData = ref<ImportRow[]>([...initialData]);
  const drafts = ref<Record<string, ImportDraft>>({});
  const loading = ref(false);
  const characteristicsLoading = ref(false);
  const characteristicsLoaded = ref(false);
  const characteristicsError = ref("");
  const characteristicFieldOptions = ref<ImportTargetFieldOption[]>([]);
  const globalFilter = ref("");
  const pagination = ref({ pageSize: 10, pageIndex: 0 });
  const sorting = ref<any[]>([]);

  const targetFieldOptions = computed(() => [
    ...TARGET_FIELD_OPTIONS,
    ...characteristicFieldOptions.value.map((option) => option.value),
  ]);

  const targetFieldLabels = computed<Record<string, string>>(() => ({
    ...TARGET_FIELD_LABELS,
    ...Object.fromEntries(
      characteristicFieldOptions.value.map((option) => [option.value, option.label]),
    ),
  }));

  const filteredData = computed(() => {
    if (!globalFilter.value) return rawData.value;
    const q = globalFilter.value.toLowerCase();
    return rawData.value.filter((row) =>
      Object.values({
        ...row,
        items: row.items.map((item) => Object.values(item).join(" ")).join(" "),
      })
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
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
    {
      accessorKey: "qty",
      header: "Кол-во",
      cell: ({ row }: any) =>
        h("div", { class: "space-y-1.5" }, [
          h("div", { class: "text-[14px] font-bold text-white" }, `${row.original.qty}`),
          h("div", { class: "text-[13px] text-[#bdbdbd]" }, `${row.original.confirmedQty}`),
        ]),
    },
    {
      accessorKey: "total",
      header: "Сумма",
      cell: ({ row }: any) =>
        h("div", { class: "space-y-1.5" }, [
          h("div", { class: "text-[14px] font-bold text-white" }, formatMoney(row.original.purchaseTotal)),
          h("div", { class: "text-[13px] text-[#bdbdbd]" }, formatMoney(row.original.total)),
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
              String(getValue()),
            )}`,
          },
          String(getValue()),
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
      sorting.value = typeof updater === "function" ? updater(sorting.value) : updater;
    },
  });

  async function fetchData() {
    loading.value = true;
    await new Promise((resolve) => setTimeout(resolve, 100));
    loading.value = false;
  }

  function normalizeCharacteristicOption(raw: any): ImportTargetFieldOption | null {
    const name = String(
      raw?.name ??
        raw?.title ??
        raw?.label ??
        raw?.characteristic_name ??
        raw?.value ??
        "",
    ).trim();

    if (!name) return null;

    const value = String(raw?.slug ?? raw?.code ?? raw?.key ?? raw?.id ?? name).trim();
    if (!value) return null;

    return {
      value: `characteristic:${value}`,
      label: name,
      source: "characteristic",
    };
  }

  async function fetchProductCharacteristics(force = false) {
    if (characteristicsLoading.value) return;
    if (characteristicsLoaded.value && !force) return;

    characteristicsLoading.value = true;
    characteristicsError.value = "";

    try {
      const response = await apiFetch<ProductCharacteristicResponse>(
        "/v2/product-characteristic",
        {
          method: "GET",
          query: { limit: 1000 },
        },
      );

      const items = Array.isArray(response?.product_characteristics)
        ? response.product_characteristics
        : [];

      const seen = new Set<string>();
      characteristicFieldOptions.value = items
        .map(normalizeCharacteristicOption)
        .filter((item): item is ImportTargetFieldOption => Boolean(item))
        .filter((item) => {
          if (seen.has(item.value)) return false;
          seen.add(item.value);
          return true;
        });
      characteristicsLoaded.value = true;
    } catch (error: any) {
      characteristicFieldOptions.value = [];
      characteristicsLoaded.value = false;
      characteristicsError.value =
        error?.data?.message || error?.message || "Failed to load product characteristics";
    } finally {
      characteristicsLoading.value = false;
    }
  }

  function getImportByDetailId(detailId: string) {
    return rawData.value.find((row) => row.detailId === detailId) ?? null;
  }

  function getDraftByDetailId(detailId: string) {
    return drafts.value[detailId] ?? null;
  }

  function openProduct(importRow: ImportRow) {
    return router.push({
      path: `/products/import/list/${importRow.detailId}`,
      query: { limit: "5", page: "1" },
    });
  }

  function openDraft(detailId: string) {
    return router.push({
      path: `/products/import/edit/${detailId}`,
      query: { page: "1" },
    });
  }

  function addImport(importRow: Omit<ImportRow, "id" | "detailId"> & { detailId?: string }) {
    const nextId = rawData.value.reduce((maxId, row) => Math.max(maxId, row.id), 100000) + 1;

    rawData.value = [
      {
        id: nextId,
        detailId: importRow.detailId ?? crypto.randomUUID(),
        ...importRow,
      },
      ...rawData.value,
    ];
  }

  function createDraft(payload: {
    fileName: string;
    rows: ParsedImportRow[];
    settings: ImportDraftSettings;
    createdBy: string;
  }) {
    const detailId = crypto.randomUUID();

    drafts.value[detailId] = {
      detailId,
      fileName: payload.fileName,
      createdBy: payload.createdBy,
      settings: payload.settings,
      rows: payload.rows,
      mappings: createDraftMappings(payload.rows),
      uploadMode: null,
      progress: 0,
      status: "draft",
    };

    return detailId;
  }

  function updateDraftSettings(detailId: string, settings: Partial<ImportDraftSettings>) {
    const draft = drafts.value[detailId];
    if (!draft) return;
    draft.settings = { ...draft.settings, ...settings };
  }

  function updateDraftMapping(
    detailId: string,
    key: keyof ParsedImportRow,
    patch: Partial<Pick<ImportDraftFieldMapping, "action" | "targetField">>,
  ) {
    const draft = drafts.value[detailId];
    if (!draft) return;
    draft.mappings = draft.mappings.map((mapping) =>
      mapping.key === key ? { ...mapping, ...patch } : mapping,
    );
  }

  function removeDraft(detailId: string) {
    if (!drafts.value[detailId]) return;
    const nextDrafts = { ...drafts.value };
    delete nextDrafts[detailId];
    drafts.value = nextDrafts;
  }

  async function startDraftUpload(detailId: string, mode: UploadMode) {
    const draft = drafts.value[detailId];
    if (!draft) return null;

    draft.uploadMode = mode;
    draft.status = "uploading";
    draft.progress = 0;

    const checkpoints = [12, 28, 46, 61, 79, 92, 100];
    for (const checkpoint of checkpoints) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      draft.progress = checkpoint;
    }

    const items = draft.rows.map((row) => createItemFromDraftRow(row, draft.settings));
    const qty = items.reduce((sum, item) => sum + item.quantity, 0);
    const purchaseTotal = items.reduce((sum, item) => sum + item.quantity * item.supplyPrice, 0);
    const total = items.reduce((sum, item) => sum + item.quantity * item.retailPrice, 0);

    addImport({
      detailId: draft.detailId,
      name: draft.settings.name,
      store: draft.settings.store,
      qty,
      confirmedQty: qty,
      total,
      purchaseTotal,
      status: mode === "with_validation" ? "Завершен" : "Завершен",
      createdAt: formatDateTime(),
      createdBy: draft.createdBy || "Current User",
      finishedBy: draft.createdBy || "Current User",
      importType: draft.settings.importType,
      salesProgress: "0%",
      items,
    });

    removeDraft(detailId);
    return detailId;
  }

  watch(globalFilter, () => {
    pagination.value.pageIndex = 0;
  });

  return {
    rawData,
    drafts,
    loading,
    globalFilter,
    pagination,
    sorting,
    filteredData,
    paginatedData,
    totalPages,
    table,
    characteristicsLoading,
    characteristicsLoaded,
    characteristicsError,
    targetFieldOptions,
    targetFieldLabels,
    addImport,
    createDraft,
    fetchData,
    fetchProductCharacteristics,
    getDraftByDetailId,
    getImportByDetailId,
    openDraft,
    openProduct,
    removeDraft,
    startDraftUpload,
    updateDraftMapping,
    updateDraftSettings,
    formatMoney,
  };
});
