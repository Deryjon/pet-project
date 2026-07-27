import { useApi } from "~/composables/useApi";

// Mirrors Billz's /api/v1/price-tag element shape — properties is a bare
// array of absolutely-positioned, independently-styled elements on a label.
// A brand-new template starts with properties: [] (matches Billz's own
// create request) — the user adds elements one at a time from the preset
// catalog below. Shared by the designer
// (pages/products/settings/print-tag.vue) and the actual print renderer
// (components/print/PriceTag.vue) so the two never diverge again.
export type PriceTagElementType = "text" | "barcode";
export type PriceTagAlignment = "LEFT" | "CENTER" | "RIGHT";
export type PriceTagElementName = "product_name" | "price" | "sku" | "shop_name" | "discount" | "barcode";

export interface PriceTagElement {
  id: string;
  name: PriceTagElementName;
  type: PriceTagElementType;
  fontFamily: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderlined: boolean;
  isLineThrough: boolean;
  alignmentType: PriceTagAlignment;
  width: number;
  length: number;
  xAxis: number;
  yAxis: number;
  rotation: number;
}

export const ELEMENT_LABELS: Record<PriceTagElementName, string> = {
  product_name: "Наименование",
  price: "Цена",
  sku: "Артикул",
  shop_name: "Магазин",
  discount: "Скидка",
  barcode: "Штрих-код",
};

export const BARCODE_TYPES = ["CODE128", "EAN13", "EAN8"] as const;

// Mirrors the server-side presets in price-tag-element.constant.ts — offered
// in the designer's "Добавить свойство" menu, never auto-inserted.
export const ELEMENT_PRESETS: PriceTagElement[] = [
  { id: "product_name", name: "product_name", type: "text", fontFamily: "Arial", fontSize: 8, isBold: true, isItalic: false, isUnderlined: false, isLineThrough: false, alignmentType: "LEFT", width: 36, length: 6, xAxis: 2, yAxis: 2, rotation: 0 },
  { id: "price", name: "price", type: "text", fontFamily: "Arial", fontSize: 14, isBold: true, isItalic: false, isUnderlined: false, isLineThrough: false, alignmentType: "LEFT", width: 30, length: 6, xAxis: 2, yAxis: 10, rotation: 0 },
  { id: "barcode", name: "barcode", type: "barcode", fontFamily: "", fontSize: 6, isBold: false, isItalic: false, isUnderlined: false, isLineThrough: false, alignmentType: "LEFT", width: 36, length: 10, xAxis: 2, yAxis: 22, rotation: 0 },
  { id: "sku", name: "sku", type: "text", fontFamily: "Arial", fontSize: 6, isBold: false, isItalic: false, isUnderlined: false, isLineThrough: false, alignmentType: "LEFT", width: 36, length: 4, xAxis: 2, yAxis: 36, rotation: 0 },
  { id: "shop_name", name: "shop_name", type: "text", fontFamily: "Arial", fontSize: 6, isBold: false, isItalic: false, isUnderlined: false, isLineThrough: false, alignmentType: "LEFT", width: 36, length: 4, xAxis: 2, yAxis: 42, rotation: 0 },
  { id: "discount", name: "discount", type: "text", fontFamily: "Arial", fontSize: 7, isBold: true, isItalic: false, isUnderlined: false, isLineThrough: false, alignmentType: "LEFT", width: 30, length: 5, xAxis: 2, yAxis: 48, rotation: 0 },
];

export interface PriceTagTemplate {
  id: string;
  name: string;
  width: number;
  length: number;
  barcodeType: string;
  barcodeTypeId: string;
  elements: PriceTagElement[];
}

export interface PriceTagProduct {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  oldPrice: number;
  discountPercent: number;
  unit: string;
  shopName: string;
  quantity: number;
  copies: number;
}

function normalizeElement(raw: any): PriceTagElement {
  const preset = ELEMENT_PRESETS.find((d) => d.name === raw?.name);
  return {
    id: String(raw?.id ?? preset?.id ?? raw?.name ?? Math.random().toString(36).slice(2)),
    name: (raw?.name ?? preset?.name ?? "product_name") as PriceTagElementName,
    type: (raw?.type ?? preset?.type ?? "text") as PriceTagElementType,
    fontFamily: String(raw?.font_family ?? preset?.fontFamily ?? "Arial"),
    fontSize: Number(raw?.font_size ?? preset?.fontSize ?? 8),
    isBold: Boolean(raw?.is_bold ?? preset?.isBold ?? false),
    isItalic: Boolean(raw?.is_italic ?? preset?.isItalic ?? false),
    isUnderlined: Boolean(raw?.is_underlined ?? preset?.isUnderlined ?? false),
    isLineThrough: Boolean(raw?.is_line_through ?? preset?.isLineThrough ?? false),
    alignmentType: (raw?.alignment_type ?? preset?.alignmentType ?? "LEFT") as PriceTagAlignment,
    width: Number(raw?.width ?? preset?.width ?? 30),
    length: Number(raw?.length ?? preset?.length ?? 6),
    xAxis: Number(raw?.x_axis ?? preset?.xAxis ?? 2),
    yAxis: Number(raw?.y_axis ?? preset?.yAxis ?? 2),
    rotation: Number(raw?.rotation ?? preset?.rotation ?? 0),
  };
}

export function serializeElement(el: PriceTagElement): Record<string, unknown> {
  return {
    id: el.id,
    name: el.name,
    type: el.type,
    font_family: el.fontFamily,
    font_size: el.fontSize,
    is_bold: el.isBold,
    is_italic: el.isItalic,
    is_underlined: el.isUnderlined,
    is_line_through: el.isLineThrough,
    alignment_type: el.alignmentType,
    width: el.width,
    length: el.length,
    x_axis: el.xAxis,
    y_axis: el.yAxis,
    rotation: el.rotation,
  };
}

function normalizeTemplate(raw: any): PriceTagTemplate {
  const properties = Array.isArray(raw?.properties)
    ? raw.properties
    : Array.isArray(raw?.properties?.elements)
      ? raw.properties.elements // tolerate the old {elements:[...]} wrapper on already-saved rows
      : [];
  return {
    id: String(raw?.id ?? ""),
    name: String(raw?.name ?? ""),
    width: Number(raw?.width ?? 40),
    length: Number(raw?.length ?? 20),
    barcodeType: String(raw?.barcode_type ?? "CODE128"),
    barcodeTypeId: String(raw?.barcode_type_id ?? ""),
    elements: properties.map(normalizeElement),
  };
}

function normalizeProduct(raw: any): PriceTagProduct {
  return {
    id: Number(raw?.id ?? 0),
    name: String(raw?.name ?? ""),
    sku: String(raw?.sku ?? ""),
    barcode: String(raw?.barcode ?? ""),
    price: Number(raw?.price ?? 0),
    oldPrice: Number(raw?.old_price ?? 0),
    discountPercent: Number(raw?.discount_percent ?? 0),
    unit: String(raw?.unit ?? ""),
    shopName: String(raw?.shop_name ?? ""),
    quantity: Number(raw?.quantity ?? 0),
    copies: Math.max(1, Math.floor(Number(raw?.copies ?? 1)) || 1),
  };
}

export function usePriceTagsData() {
  const { apiFetch } = useApi();

  async function fetchPriceTagTemplateList(): Promise<PriceTagTemplate[]> {
    const res: any = await apiFetch("/price-tag", { method: "GET" });
    return Array.isArray(res?.price_tags) ? res.price_tags.map(normalizeTemplate) : [];
  }

  async function fetchPriceTagTemplate(id: string): Promise<PriceTagTemplate> {
    const res = await apiFetch(`/price-tag/${encodeURIComponent(id)}`, { method: "GET" });
    return normalizeTemplate(res);
  }

  async function createPriceTagTemplate(payload: {
    name: string;
    width: number;
    length: number;
    barcodeType: string;
  }): Promise<PriceTagTemplate> {
    const res = await apiFetch("/price-tag", {
      method: "POST",
      body: {
        name: payload.name,
        width: payload.width,
        length: payload.length,
        barcode_type: payload.barcodeType,
        properties: [],
      },
    });
    return normalizeTemplate(res);
  }

  async function updatePriceTagTemplate(
    id: string,
    patch: Partial<Pick<PriceTagTemplate, "name" | "width" | "length" | "barcodeType" | "elements">>,
  ): Promise<PriceTagTemplate> {
    const body: Record<string, unknown> = {};
    if (patch.name !== undefined) body.name = patch.name;
    if (patch.width !== undefined) body.width = patch.width;
    if (patch.length !== undefined) body.length = patch.length;
    if (patch.barcodeType !== undefined) body.barcode_type = patch.barcodeType;
    if (patch.elements !== undefined) body.properties = patch.elements.map(serializeElement);

    const res = await apiFetch(`/price-tag/${encodeURIComponent(id)}`, { method: "PUT", body });
    return normalizeTemplate(res);
  }

  async function deletePriceTagTemplate(id: string): Promise<void> {
    await apiFetch(`/price-tag/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

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

  async function fetchPriceTagTemplates(branchId: string): Promise<PriceTagTemplate[]> {
    const res: any = await apiFetch(`/price-tag-templates/${encodeURIComponent(branchId)}`, {
      method: "GET",
    });
    return Array.isArray(res?.price_tags) ? res.price_tags.map(normalizeTemplate) : [];
  }

  return {
    fetchPriceTagTemplateList,
    fetchPriceTagTemplate,
    createPriceTagTemplate,
    updatePriceTagTemplate,
    deletePriceTagTemplate,
    fetchPriceTags,
    fetchPriceTagTemplates,
  };
}
