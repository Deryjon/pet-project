import { useApi } from "~/composables/useApi";

export interface PriceTagElement {
  id: string;
  x: number;
  y: number;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  visible: boolean;
  barcodeHeight?: number;
}

export interface PriceTagProduct {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  unit: string;
  copies: number;
}

export interface PriceTagTemplateData {
  id: string;
  name: string;
  width: number;
  length: number;
  barcodeType: string;
  elements: PriceTagElement[];
}

const DEFAULT_ELEMENTS: PriceTagElement[] = [
  { id: "name", x: 2, y: 2, fontSize: 8, fontWeight: "bold", visible: true },
  { id: "price", x: 2, y: 10, fontSize: 14, fontWeight: "bold", visible: true },
  { id: "barcode", x: 2, y: 22, fontSize: 6, barcodeHeight: 10, visible: true },
  { id: "sku", x: 2, y: 36, fontSize: 6, fontWeight: "normal", visible: true },
];

function normalizeProduct(raw: any): PriceTagProduct {
  return {
    id: Number(raw?.id ?? 0),
    name: String(raw?.name ?? ""),
    sku: String(raw?.sku ?? ""),
    barcode: String(raw?.barcode ?? ""),
    price: Number(raw?.price ?? 0),
    unit: String(raw?.unit ?? ""),
    copies: Math.max(1, Math.floor(Number(raw?.copies ?? 1)) || 1),
  };
}

function normalizeTemplate(raw: any): PriceTagTemplateData {
  const savedElements = raw?.properties?.elements;
  return {
    id: String(raw?.id ?? ""),
    name: String(raw?.name ?? ""),
    width: Number(raw?.width ?? 40),
    length: Number(raw?.length ?? 20),
    barcodeType: String(raw?.barcode_type ?? "CODE128"),
    elements: Array.isArray(savedElements) && savedElements.length
      ? savedElements
      : DEFAULT_ELEMENTS,
  };
}

export function usePriceTagsData() {
  const { apiFetch } = useApi();

  async function fetchPriceTags(
    productIds: string[],
    copies: Record<string, number>,
    branchId?: string,
  ): Promise<PriceTagProduct[]> {
    const copiesParam = Object.entries(copies)
      .map(([id, count]) => `${id}:${count}`)
      .join(",");
    const query = new URLSearchParams({ productIds: productIds.join(",") });
    if (copiesParam) query.set("copies", copiesParam);
    if (branchId) query.set("branchId", branchId);

    const res: any = await apiFetch(`/price-tags?${query.toString()}`, { method: "GET" });
    return Array.isArray(res?.products) ? res.products.map(normalizeProduct) : [];
  }

  async function fetchPriceTagTemplates(branchId: string): Promise<PriceTagTemplateData[]> {
    const res: any = await apiFetch(`/price-tag-templates/${encodeURIComponent(branchId)}`, {
      method: "GET",
    });
    return Array.isArray(res?.price_tags) ? res.price_tags.map(normalizeTemplate) : [];
  }

  return { fetchPriceTags, fetchPriceTagTemplates };
}
