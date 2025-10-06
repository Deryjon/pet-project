import { useApi } from "~/composables/useApi";

export interface ProductStockPayload {
  branch_code: string;
  quantity: number;
  purchase_price: number;
  sale_price: number;
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

export function useProducts() {
  const { apiFetch } = useApi();

  async function createProduct(payload: CreateProductPayload) {
    return apiFetch("/products", {
      method: "POST",
      body: payload,
    });
  }

  return { createProduct };
}
