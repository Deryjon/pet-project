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

export function useProducts() {
  const { apiFetch } = useApi();

  async function createProduct(payload: CreateProductPayload) {
    return apiFetch("/products", {
      method: "POST",
      body: payload,
    });
  }

  async function listProducts(params?: { search?: string; page?: number; pageSize?: number }) {
    const query: Record<string, any> = {};
    if (params?.search) query.search = params.search;
    if (typeof params?.page === 'number') query.page = params.page;
    if (typeof params?.pageSize === 'number') query.per_page = params.pageSize;

    const res: any = await apiFetch<ProductDTO[] | { data: ProductDTO[] }>("/products", {
      method: "GET",
      query,
    });
    const list = Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
    return list as ProductDTO[];
  }

  return { createProduct, listProducts };
}
