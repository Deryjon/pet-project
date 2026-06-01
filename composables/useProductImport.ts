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

export type ImportMatchPolicy = "keep_store" | "from_file";

export interface ImportOnMatchPolicy {
  name: ImportMatchPolicy;
  brand: ImportMatchPolicy;
  category: ImportMatchPolicy;
  description: ImportMatchPolicy;
  measurement_unit: ImportMatchPolicy;
  supplier: ImportMatchPolicy;
  supply_price: ImportMatchPolicy;
  retail_price: ImportMatchPolicy;
}

export interface ImportValidationIssue {
  code: string;
  field: string;
  message: string;
}

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
  job_id?: string;
  message?: string;
  total?: number;
  current?: number;
  percent?: number;
  is_finished?: boolean;
}

export interface ImportPreviewItem {
  id: string;
  import_id: string;
  row_number: number;
  product_id: string | null;
  product_name: string;
  product_base_name: string;
  product_sku: string;
  product_barcode: string;
  description: string;
  measurement_value: number;
  supply_price: number;
  retail_price: number;
  supply_currency: string;
  retail_currency: string;
  measurement_type: string;
  product_info: Record<string, unknown> | null;
  free_price: boolean;
  action: "create" | "update" | "error";
  difference: boolean;
  different_fields: string[];
  old_product: Record<string, unknown> | null;
  validation_issues: ImportValidationIssue[];
  error?: string;
  raw: {
    name: string;
    sku?: string;
    barcode?: string;
    quantity: number;
    supplyPrice: number;
    retailPrice: number;
    categoryName?: string;
    brandName?: string;
    measurementUnit?: string;
    supplier?: string;
    description?: string;
  };
}

export interface ImportDryRunSummary {
  create_count: number;
  update_count: number;
  error_count: number;
  blocking_error_count: number;
  conflicted_count: number;
  conflict_fields: Record<string, number>;
}

export interface ImportPreviewResult {
  items: ImportPreviewItem[];
  count: number;
  total_measurement_value: number;
  total_supply_price: number;
  total_retail_price: number;
  fields: unknown[];
  dry_run_summary: ImportDryRunSummary | null;
}

export interface ImportAuditChangeField {
  field: string;
  reason: string;
}

export interface ImportAuditRow {
  row?: number;
  action: string;
  reason: string;
  product_id?: string;
  changed_fields: string[];
}

export interface ImportCommitError {
  row?: number;
  message: string;
}

export interface ImportCommitResult {
  created_count: number;
  updated_count: number;
  error_count: number;
  errors: ImportCommitError[];
  audit_rows: ImportAuditRow[];
  committed_at?: string;
  committed_by?: string;
  idempotent?: boolean;
}

export interface ImportSessionListItem {
  id: string;
  name: string;
  status: ImportStatus;
  mode: ImportMode;
  shop_id: string;
  shop_name?: string;
  created_at: string;
  finished_at?: string;
  created_by?: string;
  finished_by?: string;
  import_type?: string;
  int_id?: string;
  total_loaded_measurement_value?: number;
  total_arrived_measurement_value?: number;
  total_supply_price?: number;
  total_retail_price?: number;
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
  on_match: ImportOnMatchPolicy;
  dry_run_summary: ImportDryRunSummary | null;
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
  onMatch?: Partial<ImportOnMatchPolicy>;
  companyId?: string;
}

export interface ValidateImportPayload extends CreateImportPayload {
  autoCommit?: boolean;
}

export interface ImportSessionActionResult {
  id: string;
  status: ImportStatus;
  result: ImportCommitResult | null;
}

const DEFAULT_ON_MATCH_POLICY: ImportOnMatchPolicy = {
  name: "keep_store",
  brand: "keep_store",
  category: "keep_store",
  description: "from_file",
  measurement_unit: "keep_store",
  supplier: "keep_store",
  supply_price: "keep_store",
  retail_price: "keep_store",
};

function unwrapPayload<T = any>(response: any): T {
  return response?.data ?? response?.result ?? response?.item ?? response;
}

function resolveImportPayload(raw: any) {
  const payload = unwrapPayload(raw);

  return payload?.import ?? payload?.session ?? payload?.import_session ?? payload?.importSession ?? payload;
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

function isImportStatus(value: string): value is ImportStatus {
  return [
    "draft",
    "validating",
    "preview_ready",
    "importing",
    "completed",
    "cancelled",
    "failed",
  ].includes(value);
}

function normalizeImportStatus(raw: any, fallback: ImportStatus = "draft"): ImportStatus {
  const directCandidates = [
    raw?.status,
    raw?.status_name,
    raw?.status_code,
    raw?.import_status,
    raw?.importStatus,
    raw?.import_status_name,
    raw?.import_status_code,
    raw?.import_status?.status,
    raw?.import_status?.code,
    raw?.import_status?.system_name,
    raw?.import_status?.name,
  ];

  for (const candidate of directCandidates) {
    const normalized = String(candidate ?? "").trim().toLowerCase();
    if (!normalized) continue;

    if (isImportStatus(normalized)) {
      return normalized;
    }

    if (["done", "finished", "success", "successful"].includes(normalized)) {
      return "completed";
    }

    if (["canceled", "cancelled", "abort", "aborted"].includes(normalized)) {
      return "cancelled";
    }

    if (["error", "errored"].includes(normalized)) {
      return "failed";
    }

    if (["processing", "in_progress", "running"].includes(normalized)) {
      return "importing";
    }

    if (["pending", "created", "new"].includes(normalized)) {
      return "draft";
    }
  }

  if (raw?.finished_at) {
    return "completed";
  }

  const processPercentage = toNumber(raw?.process_percentage, -1);
  if (processPercentage >= 100) {
    return "completed";
  }
  if (processPercentage > 0) {
    return "importing";
  }

  const previewItemsCount = toArray(raw?.preview_items ?? raw?.items_preview, [
    "preview_items",
    "items_preview",
    "previewItems",
  ]).length;
  if (previewItemsCount > 0) {
    return "preview_ready";
  }

  return fallback;
}

function ensureImportId(value: unknown) {
  const id = String(value ?? "").trim();
  if (!id) {
    throw new Error("ID импорта обязателен");
  }

  return id;
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

function normalizeOnMatchPolicy(raw: any): ImportOnMatchPolicy {
  return {
    name: raw?.name === "from_file" ? "from_file" : "keep_store",
    brand: raw?.brand === "from_file" ? "from_file" : "keep_store",
    category: raw?.category === "from_file" ? "from_file" : "keep_store",
    description: raw?.description === "keep_store" ? "keep_store" : "from_file",
    measurement_unit:
      raw?.measurementUnit === "from_file" || raw?.measurement_unit === "from_file"
        ? "from_file"
        : "keep_store",
    supplier: raw?.supplier === "from_file" ? "from_file" : "keep_store",
    supply_price:
      raw?.supply_price === "from_file" || raw?.supplyPrice === "from_file"
        ? "from_file"
        : "keep_store",
    retail_price:
      raw?.retail_price === "from_file" || raw?.retailPrice === "from_file"
        ? "from_file"
        : "keep_store",
  };
}

function buildOnMatchPayload(policy?: Partial<ImportOnMatchPolicy>) {
  const resolved = normalizeOnMatchPolicy({
    ...DEFAULT_ON_MATCH_POLICY,
    ...(policy ?? {}),
  });

  return {
    name: resolved.name,
    brand: resolved.brand,
    category: resolved.category,
    description: resolved.description,
    measurementUnit: resolved.measurement_unit,
    supplier: resolved.supplier,
    supplyPrice: resolved.supply_price,
    retailPrice: resolved.retail_price,
  };
}

function normalizeValidationIssues(raw: any): ImportValidationIssue[] {
  const parsed = Array.isArray(raw) ? raw : parseJsonIfNeeded<any[]>(raw);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((issue: any) => ({
      code: String(issue?.code ?? "").trim(),
      field: String(issue?.field ?? "").trim(),
      message: String(issue?.message ?? issue?.error ?? "").trim(),
    }))
    .filter((issue) => issue.code || issue.field || issue.message);
}

function normalizeDryRunSummary(raw: any): ImportDryRunSummary | null {
  const payload = raw && typeof raw === "object" ? raw : parseJsonIfNeeded(raw);
  if (!payload || typeof payload !== "object") return null;

  const sourceFields = payload?.conflict_fields && typeof payload.conflict_fields === "object"
    ? payload.conflict_fields
    : {};

  return {
    create_count: toNumber(payload?.create_count),
    update_count: toNumber(payload?.update_count),
    error_count: toNumber(payload?.error_count),
    blocking_error_count: toNumber(payload?.blocking_error_count),
    conflicted_count: toNumber(payload?.conflicted_count),
    conflict_fields: Object.fromEntries(
      Object.entries(sourceFields).map(([field, count]) => [field, toNumber(count)]),
    ),
  };
}

function normalizeAuditRows(raw: any): ImportAuditRow[] {
  const parsed = Array.isArray(raw) ? raw : parseJsonIfNeeded<any[]>(raw);
  if (!Array.isArray(parsed)) return [];

  return parsed.map((item: any) => ({
    row: item?.row != null ? toNumber(item.row) : undefined,
    action: String(item?.action ?? ""),
    reason: String(item?.reason ?? ""),
    product_id: item?.product_id != null ? String(item.product_id) : undefined,
    changed_fields: Array.isArray(item?.changed_fields)
      ? item.changed_fields.map((field: any) =>
          typeof field === "string"
            ? field
            : field?.field
              ? field?.reason
                ? `${String(field.field)}: ${String(field.reason)}`
                : String(field.field)
              : "",
        ).filter(Boolean)
      : [],
  }));
}

function normalizeCommitResult(raw: any): ImportCommitResult {
  const payload = resolveImportPayload(raw);
  const parsedErrors = parseJsonIfNeeded<any[]>(payload?.errors);
  const committedBy =
    typeof payload?.committed_by === "object" && payload?.committed_by
      ? String(payload.committed_by.full_name ?? payload.committed_by.name ?? payload.committed_by.user_id ?? "").trim()
      : payload?.committed_by
        ? String(payload.committed_by).trim()
        : "";

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
    audit_rows: normalizeAuditRows(payload?.audit_rows),
    committed_at: payload?.committed_at ? String(payload.committed_at) : undefined,
    committed_by: committedBy || undefined,
    idempotent: payload?.idempotent === true,
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
  const rawPayload =
    raw?.raw && typeof raw.raw === "object"
      ? raw.raw
      : raw?.product_info && typeof raw.product_info === "object"
        ? raw.product_info
        : {};
  const action =
    raw?.action === "error" || raw?.action === "update" || raw?.action === "create"
      ? raw.action
      : raw?.error
        ? "error"
        : raw?.product_id
          ? "update"
          : "create";

  return {
    id: String(raw?.id ?? crypto.randomUUID()),
    import_id: String(raw?.import_id ?? importId),
    row_number: toNumber(raw?.row_number ?? raw?.rowNumber),
    product_id: raw?.product_id ? String(raw.product_id) : null,
    product_name: String(raw?.product_name ?? raw?.name ?? rawPayload?.name ?? ""),
    product_base_name: String(raw?.product_base_name ?? rawPayload?.name ?? ""),
    product_sku: String(raw?.product_sku ?? raw?.sku ?? ""),
    product_barcode: String(raw?.product_barcode ?? raw?.barcode ?? ""),
    description: String(raw?.description ?? rawPayload?.description ?? ""),
    measurement_value: toNumber(raw?.measurement_value ?? raw?.quantity),
    supply_price: toNumber(raw?.supply_price),
    retail_price: toNumber(raw?.retail_price),
    supply_currency: String(raw?.supply_currency ?? ""),
    retail_currency: String(raw?.retail_currency ?? ""),
    measurement_type: String(
      raw?.measurement_type ??
      raw?.measurement_unit?.short_name ??
      raw?.measurement_unit?.name ??
      "",
    ),
    product_info:
      raw?.product_info && typeof raw.product_info === "object" ? raw.product_info : null,
    free_price: Boolean(raw?.free_price),
    action,
    difference: Boolean(raw?.difference),
    different_fields: Array.isArray(raw?.different_fields)
      ? raw.different_fields.map((field: unknown) => String(field))
      : [],
    old_product:
      raw?.old_product && typeof raw.old_product === "object" ? raw.old_product : null,
    validation_issues: normalizeValidationIssues(raw?.validation_issues),
    error: raw?.error ? String(raw.error) : undefined,
    raw: {
      name: String(rawPayload?.name ?? raw?.product_name ?? ""),
      sku: rawPayload?.sku ? String(rawPayload.sku) : undefined,
      barcode: rawPayload?.barcode ? String(rawPayload.barcode) : undefined,
      quantity: toNumber(rawPayload?.quantity ?? raw?.measurement_value ?? raw?.quantity),
      supplyPrice: toNumber(rawPayload?.supplyPrice ?? rawPayload?.supply_price ?? raw?.supply_price),
      retailPrice: toNumber(rawPayload?.retailPrice ?? rawPayload?.retail_price ?? raw?.retail_price),
      categoryName: rawPayload?.categoryName
        ? String(rawPayload.categoryName)
        : rawPayload?.category_name
          ? String(rawPayload.category_name)
          : undefined,
      brandName: rawPayload?.brandName
        ? String(rawPayload.brandName)
        : rawPayload?.brand_name
          ? String(rawPayload.brand_name)
          : undefined,
      measurementUnit: rawPayload?.measurementUnit
        ? String(rawPayload.measurementUnit)
        : rawPayload?.measurement_unit
          ? String(rawPayload.measurement_unit)
          : raw?.measurement_unit?.short_name
            ? String(raw.measurement_unit.short_name)
            : raw?.measurement_unit?.name
              ? String(raw.measurement_unit.name)
          : undefined,
      supplier: rawPayload?.supplier ? String(rawPayload.supplier) : undefined,
      description: rawPayload?.description ? String(rawPayload.description) : undefined,
    },
  };
}

function normalizePreviewResult(raw: any, importId: string): ImportPreviewResult {
  const payload = unwrapPayload(raw);
  const items = toArray<any>(
    payload?.items ?? payload?.import_items ?? payload?.preview_items ?? payload?.rows,
    ["items", "import_items", "preview_items", "rows", "data"],
  ).map((item) => normalizePreviewItem(item, importId));

  const totalMeasurementValue =
    payload?.total_measurement_value != null
      ? toNumber(payload.total_measurement_value)
      : items.reduce((sum, item) => sum + item.measurement_value, 0);
  const totalSupplyPrice =
    payload?.total_supply_price != null
      ? toNumber(payload.total_supply_price)
      : items.reduce((sum, item) => sum + item.supply_price * item.measurement_value, 0);
  const totalRetailPrice =
    payload?.total_retail_price != null
      ? toNumber(payload.total_retail_price)
      : items.reduce((sum, item) => sum + item.retail_price * item.measurement_value, 0);

  return {
    items,
    count: toNumber(payload?.count, items.length),
    total_measurement_value: totalMeasurementValue,
    total_supply_price: totalSupplyPrice,
    total_retail_price: totalRetailPrice,
    fields: toArray(payload?.fields),
    dry_run_summary: normalizeDryRunSummary(payload?.dry_run_summary),
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
  const resultPayload =
    payload?.result && typeof payload.result === "object"
      ? payload.result
      : parsedResult && typeof parsedResult === "object"
        ? parsedResult
        : null;

  return {
    id,
    job_id: payload?.job_id ? String(payload.job_id) : undefined,
    company_id: payload?.company_id ? String(payload.company_id) : undefined,
    shop_id: String(payload?.shop_id ?? nestedShop?.id ?? nestedShop?.shop_id ?? ""),
    branch_code: payload?.branch_code ? String(payload.branch_code) : undefined,
    name: String(payload?.name ?? payload?.import_name ?? ""),
    mode: payload?.mode === "without_check" ? "without_check" : "with_check",
    status: normalizeImportStatus(payload),
    rows_count: fallbackRowsCount,
    fields: toArray(payload?.fields),
    rows: normalizedRows,
    preview_items: previewItemsSource.map((item) => normalizePreviewItem(item, id)),
    result: resultPayload ? normalizeCommitResult(resultPayload) : null,
    on_match: normalizeOnMatchPolicy(payload?.on_match),
    dry_run_summary: normalizeDryRunSummary(payload?.dry_run_summary),
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
    shop_name: String(payload?.shop_name ?? nestedShop?.name ?? nestedShop?.shop_name ?? "").trim() || undefined,
  };
}

function buildCreateBody(payload: CreateImportPayload) {
  return {
    name: payload.name,
    shop_id: payload.shopId,
    rows: payload.rows.map(buildImportRow),
    mode: payload.mode,
    generate_barcode: payload.generateBarcodes,
    generate_sku: payload.generateArticles,
    properties: buildPropertiesPayload(payload.mappings, payload.availableProperties),
    on_match: buildOnMatchPayload(payload.onMatch),
    ...(payload.companyId ? { company_id: payload.companyId } : {}),
  };
}

function buildValidateBody(payload: ValidateImportPayload) {
  return {
    name: payload.name,
    shop_id: payload.shopId,
    rows: payload.rows.map(buildImportRow),
    mode: payload.mode,
    generate_barcode: payload.generateBarcodes,
    generate_sku: payload.generateArticles,
    properties: buildPropertiesPayload(payload.mappings, payload.availableProperties),
    on_match: buildOnMatchPayload(payload.onMatch),
    auto_commit: payload.autoCommit === true,
    ...(payload.companyId ? { company_id: payload.companyId } : {}),
  };
}

function normalizeActionResult(raw: any, fallbackId = ""): ImportSessionActionResult {
  const payload = resolveImportPayload(raw);
  const id = String(
    payload?.id ??
      payload?.import_id ??
      payload?.uuid ??
      payload?.import?.id ??
      payload?.import?.import_id ??
      payload?.session?.id ??
      payload?.session?.import_id ??
      fallbackId,
  ).trim();

  return {
    id,
    status: normalizeImportStatus(payload, "completed"),
    result: normalizeCommitResult(payload),
  };
}

function normalizeImportSessionListItem(raw: any): ImportSessionListItem {
  const shopName = String(raw?.shop_name ?? raw?.shop?.name ?? "").trim();
  const createdByName = String(
    raw?.created_by?.name ?? raw?.created_by_name ?? raw?.created_by ?? "",
  ).trim();
  const finishedByName = String(
    raw?.finished_by?.name ?? raw?.finished_by_name ?? raw?.finished_by ?? "",
  ).trim();
  const importTypeName = String(
    raw?.import_type?.name ?? raw?.import_type_name ?? raw?.type_name ?? "",
  ).trim();

  return {
    id: String(raw?.id ?? raw?.import_id ?? raw?.uuid ?? ""),
    name: String(raw?.name ?? raw?.import_name ?? ""),
    status: normalizeImportStatus(raw),
    mode: raw?.mode === "without_check" ? "without_check" : "with_check",
    shop_id: String(raw?.shop_id ?? shopName ?? ""),
    shop_name: shopName || undefined,
    created_at: String(raw?.created_at ?? raw?.createdAt ?? ""),
    finished_at: raw?.finished_at ? String(raw.finished_at) : undefined,
    created_by: createdByName || undefined,
    finished_by: finishedByName || undefined,
    import_type: importTypeName || (raw?.import_type_id ? "Поступление" : undefined),
    int_id: raw?.int_id != null ? String(raw.int_id) : undefined,
    total_loaded_measurement_value:
      raw?.total_loaded_measurement_value != null
        ? toNumber(raw.total_loaded_measurement_value)
        : undefined,
    total_arrived_measurement_value:
      raw?.total_arrived_measurement_value != null
        ? toNumber(raw.total_arrived_measurement_value)
        : undefined,
    total_supply_price:
      raw?.total_supply_price != null ? toNumber(raw.total_supply_price) : undefined,
    total_retail_price:
      raw?.total_retail_price != null ? toNumber(raw.total_retail_price) : undefined,
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
        body: buildCreateBody(payload),
      });

      const created = normalizeActionResult(response);
      if (!created.id) {
        throw new Error("Сервер не вернул ID импорта");
      }

      return created;
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
      const items = toArray<any>(payload, ["items", "imports", "sessions", "data"])
        .map(normalizeImportSessionListItem) satisfies ImportSessionListItem[];

      return {
        count: toNumber(payload?.count),
        items,
      };
    } catch (error: any) {
      throw new Error(normalizeApiError(error));
    }
  }

  async function getImportSession(id: string) {
    try {
      const importId = ensureImportId(id);
      const response = await apiFetch<any>(`/v2/imports/${encodeURIComponent(importId)}`, {
        method: "GET",
      });

      const session = normalizeImportSession(response);
      return {
        ...session,
        id: session.id || importId,
      };
    } catch (error: any) {
      throw new Error(normalizeApiError(error));
    }
  }

  async function validateImportSession(id: string, payload: ValidateImportPayload) {
    try {
      const importId = ensureImportId(id);
      const response = await apiFetch<any>(`/v2/imports/${encodeURIComponent(importId)}/validate`, {
        method: "POST",
        body: buildValidateBody({
          ...payload,
          autoCommit: false,
        }),
      });

      const resolved = unwrapPayload(response);
      const resolvedJobId = String(
        resolved?.job_id ??
          resolved?.correlation_id ??
          resolved?.message ??
          resolved?.import_id ??
          "",
      ).trim();

      return {
        jobId: resolvedJobId,
        importId: String(resolved?.import_id ?? resolved?.correlation_id ?? importId).trim(),
        correlationId: String(resolved?.correlation_id ?? resolved?.import_id ?? importId).trim(),
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
          importId: String(progress.import_id ?? progress.correlation_id ?? jobId).trim() || jobId,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    throw new Error("Истекло время проверки импорта");
  }

  async function getImportPreview(importId: string, options?: { difference?: boolean; page?: number; limit?: number }) {
    try {
      const resolvedImportId = ensureImportId(importId);
      const response = await apiFetch<any>(`/v2/import-search/${encodeURIComponent(resolvedImportId)}`, {
        method: "GET",
        query: {
          page: options?.page ?? 1,
          limit: options?.limit ?? 20,
          ...(options?.difference ? { difference: true } : {}),
        },
      });

      return normalizePreviewResult(response, resolvedImportId);
    } catch (error: any) {
      throw new Error(normalizeApiError(error));
    }
  }

  async function getImportItems(importId: string, options?: { page?: number; limit?: number }) {
    try {
      const resolvedImportId = ensureImportId(importId);
      const response = await apiFetch<any>(`/v2/import-items-dp/${encodeURIComponent(resolvedImportId)}`, {
        method: "GET",
        query: {
          page: options?.page ?? 1,
          limit: options?.limit ?? 10000,
        },
      });

      return normalizePreviewResult(response, resolvedImportId);
    } catch (error: any) {
      throw new Error(normalizeApiError(error));
    }
  }

  async function commitImportSession(id: string, options?: { onMatch?: Partial<ImportOnMatchPolicy> }) {
    try {
      const importId = ensureImportId(id);
      const response = await apiFetch<any>(`/v2/imports/${encodeURIComponent(importId)}/commit`, {
        method: "POST",
        body: options?.onMatch ? { on_match: buildOnMatchPayload(options.onMatch) } : undefined,
      });

      return normalizeCommitResult(response);
    } catch (error: any) {
      throw new Error(normalizeApiError(error));
    }
  }

  async function cancelImportSession(id: string) {
    try {
      const importId = ensureImportId(id);
      const response = await apiFetch<any>(`/v2/imports/${encodeURIComponent(importId)}/cancel`, {
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
          rows: payload.rows.map(buildImportRow),
          on_match: buildOnMatchPayload(payload.onMatch),
          ...(payload.companyId ? { company_id: payload.companyId } : {}),
        },
      });

      return normalizeActionResult(response);
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
    getImportItems,
    commitImportSession,
    cancelImportSession,
    importWithoutCheck,
    defaultOnMatchPolicy: DEFAULT_ON_MATCH_POLICY,
  };
}
