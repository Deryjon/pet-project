import { useApi } from "~/composables/useApi";
import { normalizeApiError } from "~/composables/useProducts";

export type ImportMode = "with_check" | "without_check";
export type ImportStatus =
  | "draft"
  | "validating"
  | "preview_ready"
  | "importing"
  | "completed"
  | "cancelled"
  | "failed";

export interface ImportProperty {
  id: string;
  name: string;
  system_name: string;
  is_uploadable: boolean;
  is_new: boolean;
  is_attribute: boolean;
  is_characteristics: boolean;
  sequence_number: number;
}

export interface ImportShopOption {
  id: string;
  name: string;
}

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

export interface ImportDraftMappingPayload {
  key: keyof ParsedImportRow;
  targetField: string;
  action: "map" | "skip" | "new";
}

export interface ImportProgressResponse {
  correlation_id?: string;
  import_id?: string;
  message?: string;
  total?: number;
  current?: number;
  percent?: number;
  is_finished?: boolean;
}

export interface ImportPreviewItem {
  id: string;
  import_id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string;
  product_barcode: string;
  measurement_value: number;
  supply_price: number;
  retail_price: number;
  difference: boolean;
  different_fields: string[];
  old_product: Record<string, unknown> | null;
}

export interface ImportPreviewResult {
  items: ImportPreviewItem[];
  count: number;
  total_measurement_value: number;
  total_supply_price: number;
  total_retail_price: number;
  fields: unknown[];
}

export interface ImportCommitResult {
  created_count: number;
  updated_count: number;
  error_count: number;
  errors: Array<{ row?: number; message: string }>;
}

export interface ImportSessionListItem {
  id: string;
  name: string;
  status: ImportStatus;
  mode: ImportMode;
  shop_id: string;
  created_at: string;
}

export interface ImportSession {
  id: string;
  job_id?: string;
  company_id?: string;
  shop_id: string;
  branch_code?: string;
  name: string;
  mode: ImportMode;
  status: ImportStatus;
  rows_count: number;
  fields: unknown[];
  rows: ParsedImportRow[];
  preview_items: ImportPreviewItem[];
  result: ImportCommitResult | null;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  shop_name?: string;
}

export interface CreateImportPayload {
  name: string;
  shopId: string;
  mode: ImportMode;
  generateBarcodes: boolean;
  generateArticles: boolean;
  rows: ParsedImportRow[];
  mappings: ImportDraftMappingPayload[];
  availableProperties?: ImportProperty[];
}

function unwrapPayload<T = any>(response: any): T {
  return response?.data ?? response?.result ?? response?.item ?? response;
}

function resolveImportPayload(raw: any) {
  const payload = unwrapPayload(raw);

  return (
    payload?.import ??
    payload?.session ??
    payload?.import_session ??
    payload?.importSession ??
    payload
  );
}

function parseJsonIfNeeded<T = any>(value: any): T | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (
    !(trimmed.startsWith("{") && trimmed.endsWith("}")) &&
    !(trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    return null;
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return null;
  }
}

function toArray<T = any>(value: any, fallbackKeys: string[] = []): T[] {
  if (Array.isArray(value)) return value as T[];

  const parsed = parseJsonIfNeeded<T[]>(value);
  if (Array.isArray(parsed)) return parsed;

  for (const key of fallbackKeys) {
    if (Array.isArray(value?.[key])) {
      return value[key] as T[];
    }

    const parsedNested = parseJsonIfNeeded<T[]>(value?.[key]);
    if (Array.isArray(parsedNested)) {
      return parsedNested;
    }
  }

  return [];
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeProperty(raw: any, index: number): ImportProperty | null {
  const systemName = String(raw?.system_name ?? raw?.systemName ?? raw?.name ?? "").trim();
  const name = String(raw?.name ?? raw?.title ?? systemName).trim();
  if (!systemName || !name) return null;

  return {
    id: String(raw?.id ?? ""),
    name,
    system_name: systemName,
    is_uploadable: raw?.is_uploadable !== false,
    is_new: Boolean(raw?.is_new),
    is_attribute: Boolean(raw?.is_attribute),
    is_characteristics: Boolean(raw?.is_characteristics),
    sequence_number: toNumber(raw?.sequence_number, index),
  };
}

function normalizeCommitResult(raw: any): ImportCommitResult {
  const payload = resolveImportPayload(raw);
  const parsedErrors = parseJsonIfNeeded<any[]>(payload?.errors);

  return {
    created_count: toNumber(payload?.created_count),
    updated_count: toNumber(payload?.updated_count),
    error_count: toNumber(payload?.error_count),
    errors: Array.isArray(payload?.errors)
      ? payload.errors.map((item: any) => ({
          row: item?.row != null ? toNumber(item.row) : undefined,
          message: String(item?.message ?? item?.error ?? ""),
        }))
      : Array.isArray(parsedErrors)
        ? parsedErrors.map((item: any) => ({
          row: item?.row != null ? toNumber(item.row) : undefined,
          message: String(item?.message ?? item?.error ?? ""),
        }))
        : [],
  };
}

function buildImportRow(row: ParsedImportRow) {
  return {
    name: String(row.name || "").trim(),
    sku: String(row.article || "").trim(),
    barcode: String(row.barcode || "").trim(),
    quantity: toNumber(row.quantity),
    supply_price: toNumber(row.supplyPrice),
    retail_price: toNumber(row.retailPrice),
    category_name: String(row.category || "").trim(),
    brand_name: String(row.brand || "").trim(),
    measurement_unit: String(row.unit || "").trim(),
    supplier: String(row.supplier || "").trim(),
    description: String(row.description || "").trim(),
  };
}

function normalizeImportRow(raw: any): ParsedImportRow {
  return {
    name: String(raw?.name ?? raw?.product_name ?? "").trim(),
    article: String(raw?.sku ?? raw?.article ?? raw?.product_sku ?? "").trim(),
    barcode: String(raw?.barcode ?? raw?.product_barcode ?? "").trim(),
    quantity: toNumber(raw?.quantity ?? raw?.measurement_value),
    supplyPrice: toNumber(raw?.supply_price ?? raw?.supplyPrice),
    retailPrice: toNumber(raw?.retail_price ?? raw?.retailPrice),
    category: String(raw?.category_name ?? raw?.category ?? "").trim(),
    brand: String(raw?.brand_name ?? raw?.brand ?? "").trim(),
    unit: String(raw?.measurement_unit ?? raw?.unit ?? "").trim(),
    supplier: String(raw?.supplier ?? "").trim(),
    description: String(raw?.description ?? "").trim(),
  };
}

function buildPropertiesPayload(
  mappings: ImportDraftMappingPayload[],
  availableProperties: ImportProperty[] = [],
) {
  const items = mappings
    .filter((mapping) => mapping.action !== "skip")
    .map((mapping, index) => {
      const matched = availableProperties.find((property) => property.system_name === mapping.targetField);

      return {
        id: matched?.id ?? "",
        name: matched?.name ?? mapping.targetField,
        system_name: mapping.targetField,
        is_uploadable: matched?.is_uploadable ?? true,
        is_new: mapping.action === "new" ? true : matched?.is_new ?? false,
        is_attribute: matched?.is_attribute ?? false,
        is_characteristics: matched?.is_characteristics ?? false,
        sequence_number: matched?.sequence_number ?? index,
      };
    });

  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.system_name || seen.has(item.system_name)) return false;
    seen.add(item.system_name);
    return true;
  });
}

function normalizePreviewItem(raw: any, importId: string): ImportPreviewItem {
  return {
    id: String(raw?.id ?? crypto.randomUUID()),
    import_id: String(raw?.import_id ?? importId),
    product_id: raw?.product_id ? String(raw.product_id) : null,
    product_name: String(raw?.product_name ?? raw?.name ?? ""),
    product_sku: String(raw?.product_sku ?? raw?.sku ?? ""),
    product_barcode: String(raw?.product_barcode ?? raw?.barcode ?? ""),
    measurement_value: toNumber(raw?.measurement_value ?? raw?.quantity),
    supply_price: toNumber(raw?.supply_price),
    retail_price: toNumber(raw?.retail_price),
    difference: Boolean(raw?.difference),
    different_fields: Array.isArray(raw?.different_fields)
      ? raw.different_fields.map((field: unknown) => String(field))
      : [],
    old_product:
      raw?.old_product && typeof raw.old_product === "object" ? raw.old_product : null,
  };
}

function normalizeImportSession(raw: any): ImportSession {
  const payload = resolveImportPayload(raw);
  const nestedShop = payload?.shop && typeof payload.shop === "object" ? payload.shop : null;
  const parsedResult = parseJsonIfNeeded<any>(payload?.result);
  const id = String(payload?.id ?? payload?.import_id ?? payload?.uuid ?? "");
  const rowsSource = toArray<any>(
    payload?.rows ?? payload?.import_rows ?? payload?.items ?? payload?.import_items,
    ["rows", "items", "import_rows", "import_items", "data"],
  );
  const previewItemsSource = toArray<any>(
    payload?.preview_items ?? payload?.items_preview,
    ["preview_items", "items_preview", "previewItems"],
  );
  const normalizedRows = rowsSource.map(normalizeImportRow);
  const fallbackRowsCount = toNumber(
    payload?.rows_count ??
      payload?.row_count ??
      payload?.count ??
      payload?.total_rows ??
      payload?.rowsCount ??
      normalizedRows.length,
  );

  return {
    id,
    job_id: payload?.job_id ? String(payload.job_id) : undefined,
    company_id: payload?.company_id ? String(payload.company_id) : undefined,
    shop_id: String(payload?.shop_id ?? nestedShop?.id ?? nestedShop?.shop_id ?? ""),
    branch_code: payload?.branch_code ? String(payload.branch_code) : undefined,
    name: String(payload?.name ?? payload?.import_name ?? ""),
    mode: payload?.mode === "without_check" ? "without_check" : "with_check",
    status: String(payload?.status ?? "draft") as ImportStatus,
    rows_count: fallbackRowsCount,
    fields: toArray(payload?.fields),
    rows: normalizedRows,
    preview_items: previewItemsSource.map((item) =>
      normalizePreviewItem(item, id),
    ),
    result:
      payload?.result && typeof payload.result === "object"
        ? normalizeCommitResult(payload.result)
        : parsedResult && typeof parsedResult === "object"
          ? normalizeCommitResult(parsedResult)
          : null,
    created_at: String(payload?.created_at ?? payload?.createdAt ?? ""),
    updated_at: payload?.updated_at
      ? String(payload.updated_at)
      : payload?.updatedAt
        ? String(payload.updatedAt)
        : undefined,
    created_by: payload?.created_by
      ? String(payload.created_by)
      : payload?.createdBy
        ? String(payload.createdBy)
        : undefined,
    shop_name: String(
      payload?.shop_name ??
        nestedShop?.name ??
        nestedShop?.shop_name ??
        "",
    ).trim() || undefined,
  };
}

export function useProductImport() {
  const { apiFetch } = useApi();

  async function getImportProperties() {
    try {
      const response = await apiFetch<any>("/v2/excel/import-properties", {
        method: "GET",
        query: { limit: 1000 },
      });

      return toArray<any>(response, [
        "properties",
        "items",
        "data",
        "import_properties",
        "product_properties",
      ])
        .map(normalizeProperty)
        .filter((item): item is ImportProperty => Boolean(item))
        .sort((a, b) => a.sequence_number - b.sequence_number);
    } catch (error: any) {
      throw new Error(normalizeApiError(error));
    }
  }

  async function getAllowedShops() {
    try {
      const response = await apiFetch<any>("/shop", {
        method: "GET",
        query: { limit: 1000, only_allowed: true },
      });

      return toArray<any>(response, ["shops", "items", "data"])
        .map((raw) => {
          const id = String(raw?.id ?? raw?.shop_id ?? raw?.shop?.id ?? "").trim();
          const name = String(raw?.name ?? raw?.shop_name ?? raw?.shop?.name ?? "").trim();
          return id && name ? { id, name } : null;
        })
        .filter((item): item is ImportShopOption => Boolean(item));
    } catch (error: any) {
      throw new Error(normalizeApiError(error));
    }
  }

  async function createImportSession(payload: CreateImportPayload) {
    try {
      const response = await apiFetch<any>("/v2/imports", {
        method: "POST",
        body: {
          name: payload.name,
          shop_id: payload.shopId,
          mode: payload.mode,
          generate_barcode: payload.generateBarcodes,
          generate_sku: payload.generateArticles,
          properties: buildPropertiesPayload(payload.mappings, payload.availableProperties),
          rows: payload.rows.map(buildImportRow),
        },
      });

      const data = unwrapPayload(response);
      return {
        id: String(data?.id ?? ""),
        status: String(data?.status ?? "draft") as ImportStatus,
      };
    } catch (error: any) {
      throw new Error(normalizeApiError(error));
    }
  }

  async function listImportSessions(params?: { page?: number; limit?: number }) {
    try {
      const response = await apiFetch<any>("/v2/imports", {
        method: "GET",
        query: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
        },
      });

      const payload = unwrapPayload(response);
      return {
        count: toNumber(payload?.count),
        items: toArray<any>(payload, ["items"]).map((item) => ({
          id: String(item?.id ?? ""),
          name: String(item?.name ?? ""),
          status: String(item?.status ?? "draft") as ImportStatus,
          mode: item?.mode === "without_check" ? "without_check" : "with_check",
          shop_id: String(item?.shop_id ?? ""),
          created_at: String(item?.created_at ?? ""),
        })) satisfies ImportSessionListItem[],
      };
    } catch (error: any) {
      throw new Error(normalizeApiError(error));
    }
  }

  async function getImportSession(id: string) {
    try {
      const response = await apiFetch<any>(`/v2/imports/${encodeURIComponent(id)}`, {
        method: "GET",
      });

      return normalizeImportSession(response);
    } catch (error: any) {
      throw new Error(normalizeApiError(error));
    }
  }

  async function validateImportSession(id: string) {
    try {
      const response = await apiFetch<any>(`/v2/imports/${encodeURIComponent(id)}/validate`, {
        method: "POST",
      });

      const payload = unwrapPayload(response);
      return {
        jobId: String(payload?.message ?? payload?.job_id ?? "").trim(),
        importId: String(payload?.import_id ?? payload?.correlation_id ?? id).trim(),
        correlationId: String(payload?.correlation_id ?? payload?.import_id ?? id).trim(),
      };
    } catch (error: any) {
      throw new Error(normalizeApiError(error));
    }
  }

  async function getImportProgress(jobId: string) {
    try {
      const response = await apiFetch<ImportProgressResponse>(
        `/v2/import-progress/${encodeURIComponent(jobId)}`,
        { method: "GET" },
      );

      return unwrapPayload<ImportProgressResponse>(response);
    } catch (error: any) {
      throw new Error(normalizeApiError(error));
    }
  }

  async function waitForImport(jobId: string, onProgress?: (progress: ImportProgressResponse) => void) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < 5 * 60 * 1000) {
      const progress = await getImportProgress(jobId);
      onProgress?.(progress);

      if (progress?.is_finished) {
        return {
          progress,
          importId:
            String(progress.import_id ?? progress.correlation_id ?? jobId).trim() || jobId,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    throw new Error("Import validation timeout");
  }

  async function getImportPreview(importId: string, options?: { difference?: boolean; page?: number; limit?: number }) {
    try {
      const response = await apiFetch<any>(`/v2/import-search/${encodeURIComponent(importId)}`, {
        method: "GET",
        query: {
          page: options?.page ?? 1,
          limit: options?.limit ?? 10000,
          ...(options?.difference ? { difference: true } : {}),
        },
      });

      const payload = unwrapPayload(response);
      return {
        items: toArray<any>(payload, ["items"]).map((item) => normalizePreviewItem(item, importId)),
        count: toNumber(payload?.count),
        total_measurement_value: toNumber(payload?.total_measurement_value),
        total_supply_price: toNumber(payload?.total_supply_price),
        total_retail_price: toNumber(payload?.total_retail_price),
        fields: toArray(payload?.fields),
      } satisfies ImportPreviewResult;
    } catch (error: any) {
      throw new Error(normalizeApiError(error));
    }
  }

  async function commitImportSession(id: string) {
    try {
      const response = await apiFetch<any>(`/v2/imports/${encodeURIComponent(id)}/commit`, {
        method: "POST",
      });

      return normalizeCommitResult(response);
    } catch (error: any) {
      throw new Error(normalizeApiError(error));
    }
  }

  async function cancelImportSession(id: string) {
    try {
      const response = await apiFetch<any>(`/v2/imports/${encodeURIComponent(id)}/cancel`, {
        method: "POST",
      });

      return normalizeImportSession(response);
    } catch (error: any) {
      throw new Error(normalizeApiError(error));
    }
  }

  async function importWithoutCheck(payload: CreateImportPayload) {
    try {
      const response = await apiFetch<any>("/v2/excel/import-without-check", {
        method: "POST",
        body: {
          name: payload.name,
          shop_id: payload.shopId,
          generate_barcode: payload.generateBarcodes,
          generate_sku: payload.generateArticles,
          rows: payload.rows.map(buildImportRow),
        },
      });

      return normalizeCommitResult(response);
    } catch (error: any) {
      throw new Error(normalizeApiError(error));
    }
  }

  return {
    getImportProperties,
    getAllowedShops,
    createImportSession,
    listImportSessions,
    getImportSession,
    validateImportSession,
    getImportProgress,
    waitForImport,
    getImportPreview,
    commitImportSession,
    cancelImportSession,
    importWithoutCheck,
  };
}
