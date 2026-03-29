import { useState } from "#imports";
import { useApi } from "~/composables/useApi";

export interface ProductStockPayload {
  branch_code: string;
  quantity: number;
  purchase_price: number;
  sale_price: number;
}

export interface ProductSupplier {
  id: number;
  name: string;
}

export interface ProductCategoryOrBrand {
  id: number;
  name: string;
}

export interface ProductDTO {
  id: number;
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
}

export interface CreateProductPayload {
  name: string;
  sku: string;
  barcode: string;
  photo?: string | null;
  category_id?: number;
  brand_id?: number;
  supplier_ids: number[];
  product_type: string;
  variant_type: string;
  unit: string;
  markup_percent: number;
  branch_code?: string;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  stocks?: ProductStockPayload[];
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
      const res = await apiFetch<any>("/products", {
        method: "POST",
        body: payload,
      });

      const created = normalizeProduct(res?.item ?? res?.data ?? res);
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

  async function listProducts(params?: { search?: string; page?: number; pageSize?: number }) {
    const search = (params?.search || "").trim();
    const page = Math.max(1, Number(params?.page || 1));
    const pageSize = Math.max(1, Number(params?.pageSize || 10));

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
      return normalized;
    } catch {
      const loweredSearch = search.toLowerCase();
      const filtered = loweredSearch
        ? products.value.filter((p) => {
            const text = `${p.name} ${p.sku} ${p.barcode}`.toLowerCase();
            return text.includes(loweredSearch);
          })
        : products.value;

      const start = (page - 1) * pageSize;
      return filtered.slice(start, start + pageSize);
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
