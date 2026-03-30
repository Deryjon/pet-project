import { useState } from "#imports";
import { useApi } from "~/composables/useApi";

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

export interface CreateProductPayload {
  id?: string;
  stocktaking_id?: string;
  barcode: string;
  additional_barcodes?: string[];
  brand_id?: string;
  brand_name?: string;
  category_ids?: string[];
  company_id?: string;
  description?: string;
  has_expiration_date?: boolean;
  images?: string[];
  is_auto_delivery?: boolean;
  is_auto_tax?: boolean;
  is_divisible?: boolean;
  is_variative?: boolean;
  max_modificators_count?: number;
  measurement_type?: string;
  measurement_unit_id?: string;
  name: string;
  packages?: unknown[];
  product_custom_fields?: unknown[];
  product_modificators?: unknown[];
  product_type_id?: string;
  profit_margin?: number;
  related_product_ids?: string[];
  required_modificators_count?: number;
  retail_price?: number;
  selected_attributes?: unknown[];
  set_products?: unknown[];
  shipments?: Array<{
    has_trigger?: boolean;
    measurement_value?: number;
    shop_id?: string;
    small_left_measurement_value?: number;
    total_measurement_value?: number;
    supplier_id?: string;
  }>;
  shop_measurement_values?: Array<{
    has_trigger?: boolean;
    measurement_value?: number;
    shop_id?: string;
    small_left_measurement_value?: number;
    total_measurement_value?: number;
    supplier_id?: string;
  }>;
  sku: string;
  supplier_ids?: string[];
  supply_price?: number;
  tax_tariff_id?: string;
  variants?: unknown[];
  is_marked?: boolean;
  scale_plu?: string | null;
  shop_free_prices?: Array<{ shop_id?: string }>;
  shop_prices?: Array<{
    shop_id?: string;
    retail_price?: number;
    supply_price?: number;
    wholesale_price?: number;
    min_price?: number;
    max_price?: number;
  }>;
  metadata?: Record<string, unknown>;
}

export interface ProductSearchPayload {
  status?: string;
  order?: string[];
  group_variations?: boolean;
  product_field_filters?: unknown[];
  field_search_key?: string;
  archived_list?: boolean;
  brand_ids?: Array<number | string>;
  is_free_price?: boolean | null;
  limit?: number;
  measurement_unit_ids?: Array<number | string>;
  page?: number;
  plu_codes?: Array<number | string>;
  statistics?: boolean;
  supplier_ids?: Array<number | string>;
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
  const idCounter = useState<number>(
    "mock-products-id-counter",
    () => Math.max(...products.value.map((p) => p.id), 0) + 1,
  );
  const { apiFetch } = useApi();

  async function createProduct(payload: CreateProductPayload) {
    try {
      const res = await apiFetch<any>("/v2/product", {
        method: "POST",
        query: {
          "Konkurent-Response-Channel": "HTTP",
        },
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
    } catch {
      const nextId = idCounter.value++;
      const created: ProductDTO = {
        id: nextId,
        name: payload.name || `Product ${nextId}`,
        sku: payload.sku || `SKU-${nextId}`,
        barcode: payload.barcode || `${Date.now()}${nextId}`,
        photo: payload.photo ?? null,
        product_type: payload.product_type || "goods",
        variant_type: payload.variant_type || "simple",
        unit: payload.unit || "piece",
        markup_percent: Number(payload.markup_percent || 0),
        quantity: Number(payload.quantity || 0),
        purchase_price: Number(payload.purchase_price || 0),
        sale_price: Number(payload.sale_price || 0),
        branch_code: payload.branch_code,
        category: null,
        brand: null,
        suppliers: [],
      };

      products.value = [created, ...products.value];
      return { success: true, item: created };
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
    },
  ): Promise<ProductListResult> {
    const search = (params?.search || "").trim();
    const page = Math.max(1, Number(params?.page || 1));
    const pageSize = Math.max(1, Number(params?.pageSize || 10));
    const statistics = params?.statistics ?? true;
    const payload: ProductSearchPayload = {
      status: params?.status || "all",
      order: [""],
      group_variations: false,
      product_field_filters: [],
      field_search_key: search,
      archived_list: false,
      brand_ids: params?.brandIds ?? [],
      is_free_price: null,
      limit: pageSize,
      measurement_unit_ids: [],
      page,
      plu_codes: [],
      statistics,
      supplier_ids: params?.supplierIds ?? [],
    };

    try {
      const res = await apiFetch<any>("/v2/product-search-with-filters", {
        method: "POST",
        body: payload,
      });

      const items = Array.isArray(res?.products) ? res.products : [];
      const normalized = items.map(normalizeCatalogProduct);
      products.value = normalized;
      return {
        products: normalized,
        count: Number(res?.count ?? normalized.length ?? 0),
        total: Number(res?.total ?? normalized.length ?? 0),
        fields: Array.isArray(res?.fields) ? res.fields : [],
        statistics: isRecord(res?.statistics) ? res.statistics : null,
        statisticsByStatus: isRecord(res?.statistics_by_status)
          ? res.statistics_by_status
          : null,
      };
    } catch {
      try {
        const res = await apiFetch<any>("/products", {
          method: "GET",
          query: {
            page,
            limit: pageSize,
            search: search || undefined,
          },
        });

        const items = Array.isArray(res)
          ? res
          : Array.isArray(res?.items)
            ? res.items
            : Array.isArray(res?.data)
              ? res.data
              : [];

        const normalized = items.map(normalizeProduct);
        products.value = normalized;
        return {
          products: normalized,
          count: normalized.length,
          total: normalized.length,
          fields: [],
          statistics: null,
          statisticsByStatus: null,
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

  return { createProduct, listProducts };
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
          .filter((item): item is ProductSupplier => Boolean(item))
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
        .filter((item): item is ProductSupplier => Boolean(item))
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
