import { useState } from "#imports";
import { useApi } from "~/composables/useApi";
import type { CreateProductApiPayload } from "~/types/product-create";

export interface ProductStockPayload {
  branch_code: string;
  quantity: number;
  purchase_price: number;
  sale_price: number;
}

export interface ProductSupplier {
  id: number | string;
  name: string;
}

export interface ProductCategoryOrBrand {
  id: number | string;
  name: string;
}

export interface ProductDTO {
  id: number | string;
  name: string;
  sku: string;
  barcode: string;
  photo?: string | null;
  product_type: string;
  variant_type: string;
  unit: string;
  markup_percent: number;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  branch_code?: string;
  category?: ProductCategoryOrBrand | null;
  brand?: ProductCategoryOrBrand | null;
  suppliers?: ProductSupplier[];
  shop_name?: string;
}

export function normalizeApiError(error: any) {
  const message = error?.data?.message ?? error?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return "Произошла ошибка";
}

export interface ProductSearchPayload {
  page?: number;
  limit?: number;
  search?: string;
  field_search_key?: string;
  statistics?: boolean;
  brand_ids?: Array<number | string>;
  supplier_ids?: Array<number | string>;
  shop_ids?: Array<number | string>;
  category_ids?: Array<number | string>;
  status?: string;
  order?: string[];
  archived_list?: boolean;
  sku?: string;
  measurement_type?: string;
  supply_price_from?: number;
  supply_price_to?: number;
  retail_price_from?: number;
  retail_price_to?: number;
  wholesale_price?: number;
  free_price?: boolean;
}

export interface ProductListResult {
  products: ProductDTO[];
  count: number;
  total: number;
  fields: unknown[];
  statistics: Record<string, unknown> | null;
  statisticsByStatus: Record<string, unknown> | null;
}

function seedProducts(): ProductDTO[] {
  return [
    {
      id: 1,
      name: "Case for iPhone 15 Pro",
      sku: "CASE-IP15PRO",
      barcode: "1234567890123",
      product_type: "goods",
      variant_type: "simple",
      unit: "piece",
      markup_percent: 35,
      quantity: 34,
      purchase_price: 45000,
      sale_price: 65000,
      category: { id: 1, name: "Accessories" },
      brand: { id: 1, name: "No Brand" },
      suppliers: [{ id: 1, name: "Mobile Trade" }],
    },
    {
      id: 2,
      name: "Glass Samsung S24",
      sku: "GLASS-S24",
      barcode: "2234567890123",
      product_type: "goods",
      variant_type: "simple",
      unit: "piece",
      markup_percent: 40,
      quantity: 51,
      purchase_price: 30000,
      sale_price: 50000,
      category: { id: 1, name: "Accessories" },
      brand: { id: 2, name: "GlassPro" },
      suppliers: [{ id: 2, name: "Tech Import" }],
    },
  ];
}

export function useProducts() {
  const products = useState<ProductDTO[]>("mock-products", seedProducts);
  const { apiFetch } = useApi();

  async function createProduct(payload: CreateProductApiPayload) {
    try {
      const res = await apiFetch<any>("/v2/product/create", {
        method: "POST",
        body: payload,
      });

      const createdRaw =
        res?.data?.products?.[0] ??
        res?.data?.product ??
        res?.product ??
        res?.item ??
        res?.data ??
        res;
      const created = normalizeCatalogProduct(createdRaw);
      products.value = [created, ...products.value.filter((item) => item.id !== created.id)];
      return { success: true, item: created };
    } catch (error: any) {
      throw new Error(normalizeApiError(error));
    }
  }

  async function listProducts(
    params?: {
      search?: string;
      page?: number;
      pageSize?: number;
      statistics?: boolean;
      status?: string;
      brandIds?: Array<number | string>;
      supplierIds?: Array<number | string>;
      shopIds?: Array<number | string>;
      categoryIds?: Array<number | string>;
      sku?: string;
      measurementType?: string;
      supplyPriceFrom?: number;
      supplyPriceTo?: number;
      retailPriceFrom?: number;
      retailPriceTo?: number;
      wholesalePrice?: number;
      freePrice?: boolean;
      order?: string[];
    },
  ): Promise<ProductListResult> {
    const search = (params?.search || "").trim();
    const page = Math.max(1, Number(params?.page || 1));
    const pageSize = Math.max(1, Number(params?.pageSize || 10));
    const statistics = params?.statistics ?? true;
    const payload: ProductSearchPayload = {
      page,
      limit: pageSize,
      search: search || undefined,
      field_search_key: search,
      statistics,
      status: params?.status || undefined,
      order: params?.order ?? undefined,
      brand_ids: params?.brandIds ?? [],
      supplier_ids: params?.supplierIds ?? [],
      shop_ids: params?.shopIds ?? [],
      category_ids: params?.categoryIds ?? [],
      sku: params?.sku ?? undefined,
      measurement_type: params?.measurementType ?? undefined,
      supply_price_from: params?.supplyPriceFrom,
      supply_price_to: params?.supplyPriceTo,
      retail_price_from: params?.retailPriceFrom,
      retail_price_to: params?.retailPriceTo,
      wholesale_price: params?.wholesalePrice,
      free_price: params?.freePrice,
    };

    try {
      const shouldUsePostFallback = hasHeavyFilters(payload);
      const [productsResponse, statsResponse] = shouldUsePostFallback
        ? await Promise.all([
            apiFetch<any>("/v2/product-search-with-filters", {
              method: "POST",
              body: payload,
            }),
            statistics
              ? apiFetch<any>("/v2/product-search-stats-with-filters", {
                  method: "POST",
                  body: payload,
                })
              : Promise.resolve(null),
          ])
        : await Promise.all([
            apiFetch<any>(buildCatalogGetPath("/v2/product", payload)),
            statistics
              ? apiFetch<any>(buildCatalogGetPath("/v2/product-stats", payload))
              : Promise.resolve(null),
          ]);

      const items = Array.isArray(productsResponse?.products) ? productsResponse.products : [];
      const normalized = items.map(normalizeCatalogProduct);
      products.value = normalized;
      return {
        products: normalized,
        count: Number(productsResponse?.count ?? normalized.length ?? 0),
        total: Number(productsResponse?.total ?? normalized.length ?? 0),
        fields: Array.isArray(productsResponse?.fields) ? productsResponse.fields : [],
        statistics: extractStatistics(statsResponse, productsResponse),
        statisticsByStatus: extractStatisticsByStatus(statsResponse, productsResponse)
          ?? null,
      };
    } catch {
      try {
        const res = await apiFetch<any>("/v2/product-search-with-filters", {
          method: "POST",
          body: payload,
        });

        const statsRes = statistics
          ? await apiFetch<any>("/v2/product-search-stats-with-filters", {
              method: "POST",
              body: payload,
            })
          : null;

        const items = Array.isArray(res?.products) ? res.products : [];
        const normalized = items.map(normalizeCatalogProduct);
        products.value = normalized;
        return {
          products: normalized,
          count: Number(res?.count ?? normalized.length ?? 0),
          total: Number(res?.total ?? normalized.length ?? 0),
          fields: Array.isArray(res?.fields) ? res.fields : [],
          statistics: extractStatistics(statsRes, res),
          statisticsByStatus: extractStatisticsByStatus(statsRes, res) ?? null,
        };
      } catch {
        const loweredSearch = search.toLowerCase();
        const filtered = loweredSearch
          ? products.value.filter((p) => {
              const text = `${p.name} ${p.sku} ${p.barcode}`.toLowerCase();
              return text.includes(loweredSearch);
            })
          : products.value;

        const start = (page - 1) * pageSize;
        const paginated = filtered.slice(start, start + pageSize);
        return {
          products: paginated,
          count: paginated.length,
          total: filtered.length,
          fields: [],
          statistics: null,
          statisticsByStatus: null,
        };
      }
    }
  }

  async function generateSku(input?: { name?: string; prefix?: string }) {
    const res = await apiFetch<any>("/v2/product/generate-sku", {
      method: "POST",
      body: {
        ...(input?.name ? { name: input.name } : {}),
        ...(input?.prefix ? { prefix: input.prefix } : {}),
      },
    });

    return String(res?.sku || "");
  }

  async function generateBarcode() {
    const res = await apiFetch<any>("/v2/product/generate-barcode", {
      method: "POST",
    });

    return String(res?.barcode || "");
  }

  return { createProduct, listProducts, generateSku, generateBarcode };
}

function buildCatalogGetPath(basePath: string, payload: ProductSearchPayload) {
  const params = new URLSearchParams();

  appendQueryValue(params, "page", payload.page);
  appendQueryValue(params, "limit", payload.limit);
  appendQueryValue(params, "search", payload.search);
  appendQueryValue(params, "field_search_key", payload.field_search_key);
  appendQueryValue(params, "statistics", payload.statistics);
  appendQueryValue(params, "status", payload.status);
  appendQueryValue(params, "sku", payload.sku);
  appendQueryValue(params, "measurement_type", payload.measurement_type);
  appendQueryValue(params, "supply_price_from", payload.supply_price_from);
  appendQueryValue(params, "supply_price_to", payload.supply_price_to);
  appendQueryValue(params, "retail_price_from", payload.retail_price_from);
  appendQueryValue(params, "retail_price_to", payload.retail_price_to);
  appendQueryValue(params, "wholesale_price", payload.wholesale_price);
  appendQueryValue(params, "free_price", payload.free_price);
  appendArrayQueryValue(params, "brand_ids", payload.brand_ids);
  appendArrayQueryValue(params, "supplier_ids", payload.supplier_ids);
  appendArrayQueryValue(params, "shop_ids", payload.shop_ids);
  appendArrayQueryValue(params, "category_ids", payload.category_ids);
  appendArrayQueryValue(params, "order", payload.order);

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function hasHeavyFilters(payload: ProductSearchPayload) {
  const arraySize =
    (payload.brand_ids?.length ?? 0) +
    (payload.supplier_ids?.length ?? 0) +
    (payload.shop_ids?.length ?? 0) +
    (payload.category_ids?.length ?? 0) +
    (payload.order?.length ?? 0);

  if (arraySize > 12) {
    return true;
  }

  return buildCatalogGetPath("/v2/product", payload).length > 1500;
}

function appendQueryValue(params: URLSearchParams, key: string, value: unknown) {
  if (value == null || value === "") {
    return;
  }

  params.append(key, String(value));
}

function appendArrayQueryValue(
  params: URLSearchParams,
  key: string,
  values?: Array<number | string>,
) {
  if (!Array.isArray(values)) {
    return;
  }

  for (const value of values) {
    if (value == null || value === "") {
      continue;
    }

    params.append(key, String(value));
  }
}

function extractStatistics(
  statsResponse: any,
  productsResponse: any,
): Record<string, unknown> | null {
  if (isRecord(statsResponse?.statistics)) {
    return statsResponse.statistics;
  }

  if (isRecord(statsResponse)) {
    return statsResponse;
  }

  if (isRecord(productsResponse?.statistics)) {
    return productsResponse.statistics;
  }

  return null;
}

function extractStatisticsByStatus(
  statsResponse: any,
  productsResponse: any,
): Record<string, unknown> | null {
  if (isRecord(statsResponse?.statistics_by_status)) {
    return statsResponse.statistics_by_status;
  }

  if (isRecord(statsResponse?.by_status)) {
    return statsResponse.by_status;
  }

  if (isRecord(productsResponse?.statistics_by_status)) {
    return productsResponse.statistics_by_status;
  }

  return null;
}

function normalizeProduct(raw: any): ProductDTO {
  return {
    id: Number(raw?.id ?? 0),
    name: String(raw?.name ?? raw?.title ?? ""),
    sku: String(raw?.sku ?? raw?.article ?? ""),
    barcode: String(raw?.barcode ?? ""),
    photo: raw?.photo ?? raw?.image ?? null,
    product_type: String(raw?.product_type ?? "goods"),
    variant_type: String(raw?.variant_type ?? "simple"),
    unit: String(raw?.unit ?? "piece"),
    markup_percent: Number(raw?.markup_percent ?? 0),
    quantity: Number(raw?.quantity ?? raw?.stock_quantity ?? 0),
    purchase_price: Number(raw?.purchase_price ?? 0),
    sale_price: Number(raw?.sale_price ?? raw?.price ?? 0),
    branch_code: raw?.branch_code ?? undefined,
    category: normalizeNamedEntity(raw?.category),
    brand: normalizeNamedEntity(raw?.brand),
    suppliers: Array.isArray(raw?.suppliers)
      ? raw.suppliers
          .map(normalizeNamedEntity)
          .filter((item: ProductCategoryOrBrand | null): item is ProductSupplier => Boolean(item))
      : [],
    shop_name: typeof raw?.shop_name === "string" ? raw.shop_name : undefined,
  };
}

function normalizeBillzProduct(raw: any): ProductDTO {
  const primaryShopPrice = Array.isArray(raw?.shop_prices) ? raw.shop_prices[0] : null;
  const primarySupplier = Array.isArray(raw?.suppliers) ? raw.suppliers[0] : null;
  const primaryStock = Array.isArray(raw?.product_supply_stock) ? raw.product_supply_stock[0] : null;

  return {
    id: raw?.id ?? "",
    name: String(raw?.name ?? raw?.base_name ?? ""),
    sku: String(raw?.sku ?? ""),
    barcode: String(raw?.barcode ?? ""),
    photo: raw?.photo ?? null,
    product_type: String(raw?.product_type_id ?? "goods"),
    variant_type: "simple",
    unit: String(raw?.measurement_unit?.short_name ?? raw?.measurement_unit?.name ?? "piece"),
    markup_percent: 0,
    quantity: Number(raw?.measurement_values?.total_measurement_value ?? 0),
    purchase_price: Number(primaryShopPrice?.supply_price ?? 0),
    sale_price: Number(primaryShopPrice?.retail_price ?? 0),
    branch_code: primaryStock?.shop_id ?? undefined,
    category: normalizeNamedEntity(raw?.category_name),
    brand: normalizeNamedEntity(raw?.brand_name),
    suppliers: primarySupplier ? [normalizeNamedEntity(primarySupplier)].filter((item): item is ProductSupplier => Boolean(item)) : [],
    shop_name: typeof primaryStock?.shop_name === "string" ? primaryStock.shop_name : undefined,
  };
}

function normalizeCatalogProduct(raw: any): ProductDTO {
  if (raw && (raw.shop_prices || raw.product_supply_stock || raw.measurement_values)) {
    return normalizeBillzProduct(raw);
  }

  const supplierList = Array.isArray(raw?.suppliers)
    ? raw.suppliers
        .map(normalizeNamedEntity)
        .filter((item: ProductCategoryOrBrand | null): item is ProductSupplier => Boolean(item))
    : [];

  const firstFieldValue = Array.isArray(raw?.fields)
    ? raw.fields.find((field: any) => field?.value != null)?.value
    : undefined;

  return {
    id: raw?.id ?? raw?.product_id ?? "",
    name: String(raw?.name ?? raw?.base_name ?? raw?.title ?? ""),
    sku: String(raw?.sku ?? raw?.article ?? raw?.vendor_code ?? ""),
    barcode: String(raw?.barcode ?? raw?.plu_code ?? ""),
    photo: raw?.photo ?? raw?.image ?? null,
    product_type: String(raw?.product_type ?? raw?.product_type_id ?? "goods"),
    variant_type: String(raw?.variant_type ?? "simple"),
    unit: String(
      raw?.measurement_unit?.short_name ??
        raw?.measurement_unit?.name ??
        raw?.unit ??
        "piece",
    ),
    markup_percent: Number(raw?.markup_percent ?? 0),
    quantity: Number(
      raw?.quantity ??
        raw?.stock_quantity ??
        raw?.measurement_values?.total_measurement_value ??
        raw?.total_quantity ??
        0,
    ),
    purchase_price: Number(
      raw?.purchase_price ??
        raw?.supply_price ??
        raw?.shop_prices?.[0]?.supply_price ??
        0,
    ),
    sale_price: Number(
      raw?.sale_price ??
        raw?.retail_price ??
        raw?.price ??
        raw?.shop_prices?.[0]?.retail_price ??
        firstFieldValue ??
        0,
    ),
    branch_code: raw?.branch_code ?? raw?.shop_id ?? undefined,
    category: normalizeNamedEntity(raw?.category ?? raw?.category_name),
    brand: normalizeNamedEntity(raw?.brand ?? raw?.brand_name),
    suppliers: supplierList,
    shop_name: typeof raw?.shop_name === "string" ? raw.shop_name : undefined,
  };
}

function normalizeNamedEntity(raw: any): ProductCategoryOrBrand | null {
  if (!raw) return null;

  if (typeof raw === "string") {
    return { id: 0, name: raw };
  }

  const name = String(raw?.name ?? raw?.title ?? "").trim();
  if (!name) return null;

  return {
    id: Number(raw?.id ?? 0),
    name,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
