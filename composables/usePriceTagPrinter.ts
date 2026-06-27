import { useApi } from "~/composables/useApi";

export interface PriceTagProduct {
  name: string;
  sku: string;
  barcode: string;
  price: number;
  unit?: string;
}

export interface PriceTagTemplate {
  id: number;
  name: string;
  width: number;
  length: number;
  barcodeType?: string;
  properties?: Record<string, unknown>;
}

export function usePriceTagPrinter() {
  const { apiFetch } = useApi();

  async function loadTemplates(): Promise<PriceTagTemplate[]> {
    const res: any = await apiFetch("/v1/price-tag");
    return Array.isArray(res?.price_tags) ? res.price_tags : [];
  }

  function printTags(products: PriceTagProduct[], template?: PriceTagTemplate) {
    const tagWidth = template?.width || 40;
    const tagHeight = template?.length || 20;

    const tagsHtml = products
      .map(
        (p) => `
      <div class="tag" style="width:${tagWidth}mm; height:${tagHeight}mm;">
        <div class="tag-name">${escapeHtml(p.name)}</div>
        <div class="tag-meta">
          <span class="tag-sku">${escapeHtml(p.sku || "")}</span>
          ${p.barcode ? `<span class="tag-barcode">${escapeHtml(p.barcode)}</span>` : ""}
        </div>
        <div class="tag-bottom">
          ${p.unit ? `<span class="tag-unit">${escapeHtml(p.unit)}</span>` : ""}
          <span class="tag-price">${formatPrice(p.price)} UZS</span>
        </div>
      </div>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ценники</title>
  <style>
    @page { margin: 3mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; }
    .tags { display: flex; flex-wrap: wrap; gap: 2mm; }
    .tag {
      border: 1px solid #ccc;
      padding: 2mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-inside: avoid;
      overflow: hidden;
    }
    .tag-name {
      font-size: 9px;
      font-weight: bold;
      line-height: 1.2;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .tag-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1mm;
    }
    .tag-sku { font-size: 7px; color: #666; }
    .tag-barcode { font-size: 7px; letter-spacing: 0.5px; color: #333; }
    .tag-bottom {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .tag-unit { font-size: 7px; color: #666; }
    .tag-price {
      font-size: 14px;
      font-weight: bold;
      text-align: right;
      flex: 1;
    }
  </style>
</head>
<body>
  <div class="tags">${tagsHtml}</div>
</body>
</html>`;

    const w = window.open("", "_blank", "width=600,height=800");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  }

  function escapeHtml(s: string): string {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatPrice(n: number): string {
    return new Intl.NumberFormat("ru-RU").format(Math.round(n));
  }

  return { loadTemplates, printTags };
}
