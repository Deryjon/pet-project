import { useState } from "#imports";

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
    {
      id: 3,
      name: "Charger 20W Type-C",
      sku: "CHARGER-20W",
      barcode: "3234567890123",
      product_type: "goods",
      variant_type: "simple",
      unit: "piece",
      markup_percent: 30,
      quantity: 19,
      purchase_price: 80000,
      sale_price: 120000,
      category: { id: 2, name: "Chargers" },
      brand: { id: 3, name: "Green Lion" },
      suppliers: [{ id: 1, name: "Mobile Trade" }],
    },
    {
      id: 4,
      name: "AirPods 3 (Dubai)",
      sku: "AIRPODS3-DB",
      barcode: "4234567890123",
      product_type: "goods",
      variant_type: "simple",
      unit: "piece",
      markup_percent: 22,
      quantity: 8,
      purchase_price: 1200000,
      sale_price: 1500000,
      category: { id: 3, name: "Headphones" },
      brand: { id: 4, name: "Apple" },
      suppliers: [{ id: 3, name: "Premium Supply" }],
    },
  ];
}

export function useProducts() {
  const products = useState<ProductDTO[]>("mock-products", seedProducts);
  const idCounter = useState<number>(
    "mock-products-id-counter",
    () => Math.max(...products.value.map((p) => p.id), 0) + 1
  );

  async function createProduct(payload: CreateProductPayload) {
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

  async function listProducts(params?: { search?: string; page?: number; pageSize?: number }) {
    const search = (params?.search || "").trim().toLowerCase();
    const page = Math.max(1, Number(params?.page || 1));
    const pageSize = Math.max(1, Number(params?.pageSize || 10));

    const filtered = search
      ? products.value.filter((p) => {
          const text = `${p.name} ${p.sku} ${p.barcode}`.toLowerCase();
          return text.includes(search);
        })
      : products.value;

    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }

  return { createProduct, listProducts };
}
