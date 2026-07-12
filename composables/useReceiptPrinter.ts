import { useApi } from "~/composables/useApi";
import type { Cheque, ChequeExtraSettings } from "~/composables/useCheques";
import { renderQrSvg } from "~/utils/qrcode";

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: string;
  code?: string;
}

export interface ReceiptData {
  number: string;
  date: string;
  seller: string;
  cashier: string;
  client: string;
  shop: string;
  items: ReceiptItem[];
  total: string;
  payment: string;
  paymentMethodName?: string;
  extraPayments?: Array<{ payment_method: string; amount: number; payment_name: string }> | null;
  debt?: string;
  balance?: string;
}

interface ElementStyle {
  id: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  visible: boolean;
  order: number;
  marginBottom?: number;
}

export function useReceiptPrinter() {
  const { apiFetch } = useApi();

  async function loadDefaultTemplate(): Promise<Cheque | null> {
    try {
      const res: any = await apiFetch("/v1/cheque", {
        method: "GET",
        query: { limit: "100", page: "1", name: "" },
      });
      const cheques: Cheque[] = Array.isArray(res?.cheques) ? res.cheques : [];
      return cheques.find((c) => c.is_default) ?? cheques[0] ?? null;
    } catch {
      return null;
    }
  }

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getStyle(styles: ElementStyle[] | undefined, id: string): { fs: number; fw: string; visible: boolean; marginBottom: number } {
    const el = styles?.find((s) => s.id === id);
    if (!el) return { fs: 12, fw: "normal", visible: true, marginBottom: 4 };
    return {
      fs: el.fontSize || 12,
      fw: el.fontWeight === "bold" ? "900" : "normal",
      visible: el.visible !== false,
      marginBottom: el.marginBottom ?? 4,
    };
  }

  function renderElementHtml(
    elId: string,
    data: ReceiptData,
    template: Cheque | null,
    extra: ChequeExtraSettings | null | undefined,
    styles: ElementStyle[] | undefined,
  ): string {
    const { fs, fw } = getStyle(styles, elId);
    const s = `font-size:${fs}px;font-weight:${fw};`;
    const C = "text-align:center;";
    const ROW = "display:flex;justify-content:space-between;gap:4px;";
    const NW = "white-space:nowrap;";

    switch (elId) {
      case "shopName":
        return data.shop ? `<div style="${s}${C}">${escapeHtml(data.shop)}</div>` : "";
      case "branch":
        return (extra?.hasBranchName && extra.branchName) ? `<div style="${s}${C}">${escapeHtml(extra.branchName)}</div>` : "";
      case "address":
        return (extra?.hasAddress && extra.address) ? `<div style="${s}${C}">${escapeHtml(extra.address)}</div>` : "";
      case "phone":
        return (extra?.hasPhone && extra.phone) ? `<div style="${s}${C}">${escapeHtml(extra.phone)}</div>` : "";
      case "workingHours":
        return (extra?.hasWorkingHours && extra.workingHours) ? `<div style="${s}${C}">${escapeHtml(extra.workingHours)}</div>` : "";
      case "website":
        return (extra?.hasWebsite && extra.website) ? `<div style="${s}${C}">${escapeHtml(extra.website)}</div>` : "";
      case "taxId":
        return (extra?.hasTaxId && extra.taxId) ? `<div style="${s}${ROW}"><span>ИНН:</span><span style="${NW}">${escapeHtml(extra.taxId)}</span></div>` : "";
      case "chequeNumber":
        return `<div style="${s}${ROW}"><span>Чек #:</span><span style="${NW}">${escapeHtml(data.number)}</span></div>`;
      case "date":
        return `<div style="${s}${ROW}"><span>Дата:</span><span style="${NW}">${escapeHtml(data.date)}</span></div>`;
      case "seller":
        return data.seller ? `<div style="${s}${ROW}"><span>Продавец:</span><span style="${NW}">${escapeHtml(data.seller)}</span></div>` : "";
      case "cashier":
        return (data.cashier && data.cashier !== data.seller) ? `<div style="${s}${ROW}"><span>Кассир:</span><span style="${NW}">${escapeHtml(data.cashier)}</span></div>` : "";
      case "client":
        return (data.client && data.client !== "—") ? `<div style="${s}${ROW}"><span>Клиент:</span><span style="${NW}">${escapeHtml(data.client)}</span></div>` : "";
      case "items": {
        const itemFs = getStyle(styles, "items");
        return data.items.map((item, idx) => {
          const lines: string[] = [];
          lines.push(`<div style="font-size:${itemFs.fs}px;font-weight:${itemFs.fw};">${idx + 1}. ${escapeHtml(item.name)}</div>`);
          if (item.code) {
            lines.push(`<div style="font-size:10px;color:#444;">${escapeHtml(item.code)}</div>`);
          }
          lines.push(`<div style="font-size:${Math.max(10, itemFs.fs - 1)}px;${ROW}"><span>${item.quantity} x ${escapeHtml(item.price)}</span><span style="font-weight:900;${NW}">${escapeHtml(item.price)}</span></div>`);
          return `<div style="margin-bottom:6px;">${lines.join("\n")}</div>`;
        }).join("\n");
      }
      case "total":
        return `<div style="${s}${ROW}"><span>ИТОГО:</span><span style="${NW}">${escapeHtml(data.total)}</span></div>`;
      case "payment":
        if (data.extraPayments && data.extraPayments.length > 1) {
          return data.extraPayments.map((ep) =>
            `<div style="${s}${ROW}"><span>${escapeHtml(ep.payment_name)}:</span><span style="${NW}">${escapeHtml(String(ep.amount))}</span></div>`
          ).join("\n");
        }
        return `<div style="${s}${ROW}"><span>Оплачено${data.paymentMethodName ? ` (${escapeHtml(data.paymentMethodName)})` : ""}:</span><span style="${NW}">${escapeHtml(data.payment)}</span></div>`;
      case "debt":
        return data.debt ? `<div style="${s}${ROW}"><span>В долг:</span><span style="${NW}">${escapeHtml(data.debt)}</span></div>` : "";
      case "balance":
        return data.balance ? `<div style="${s}${ROW}"><span>Баланс:</span><span style="${NW}">${escapeHtml(data.balance)}</span></div>` : "";
      case "barcode":
        return template?.has_bar_code
          ? `<div style="${C}margin:8px 0;"><div style="font-family:monospace;letter-spacing:4px;font-size:${fs}px;font-weight:900;">${escapeHtml(data.number)}</div><div style="font-size:9px;">Штрих-код</div></div>`
          : "";
      case "footer":
        return template?.display_text ? `<div style="${s}${C}margin-top:6px;">${escapeHtml(template.display_text)}</div>` : "";
      case "qrCode":
        return (extra?.hasQrCode && extra.qrCodeUrl)
          ? `<div style="${C}margin:6px 0;width:100px;height:100px;display:inline-block;">${renderQrSvg(extra.qrCodeUrl, { pixelSize: 4 })}</div>`
          : "";
      default:
        if (elId.startsWith("hr")) return `<div style="border-top:1px dashed #000;"></div>`;
        return "";
    }
  }

  const DEFAULT_ORDER = [
    "shopName", "branch", "address", "phone", "workingHours", "website",
    "hr1", "chequeNumber", "date", "taxId", "seller", "cashier", "client",
    "hr2", "items", "hr3", "total", "payment", "debt", "balance",
    "hr4", "barcode", "footer", "qrCode",
  ];

  function buildReceiptHtml(data: ReceiptData, template: Cheque | null): string {
    const widthMm = template?.compact ? 58 : template?.width ? Number(template.width) : 80;
    const bodyW = `${widthMm - 10}mm`;
    const pageW = `${widthMm}mm`;
    const lengthMm = Number(template?.length) || 0;
    const pageH = lengthMm > 0 ? `${lengthMm}mm` : "auto";
    const extra = template?.extra_settings;
    const styles = extra?.elementStyles as ElementStyle[] | undefined;

    let orderedIds: string[];
    if (styles && styles.length > 0) {
      orderedIds = [...styles]
        .filter((s) => s.visible !== false)
        .sort((a, b) => a.order - b.order)
        .map((s) => s.id);
    } else {
      orderedIds = DEFAULT_ORDER;
    }

    function renderSection(id: string): string {
      const html = renderElementHtml(id, data, template, extra, styles);
      if (!html) return "";
      const { marginBottom } = getStyle(styles, id);
      return marginBottom ? `<div style="margin-bottom:${marginBottom}px;">${html}</div>` : html;
    }

    if (template?.has_logo && template.logo_url) {
      const logoHtml = `<div style="text-align:center;margin-bottom:6px;"><img src="${escapeHtml(template.logo_url)}" alt="logo" style="max-width:80%;max-height:60px;object-fit:contain;"/></div>`;
      const sections = [logoHtml];
      for (const id of orderedIds) {
        const html = renderSection(id);
        if (html) sections.push(html);
      }
      return wrapHtml(sections.join("\n"), bodyW, pageW, pageH, data.number);
    }

    const sections: string[] = [];
    for (const id of orderedIds) {
      const html = renderSection(id);
      if (html) sections.push(html);
    }

    return wrapHtml(sections.join("\n"), bodyW, pageW, pageH, data.number);
  }

  function wrapHtml(body: string, bodyW: string, pageW: string, pageH: string, number: string): string {
    return `<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8"><title>Чек #${escapeHtml(number)}</title>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{background:#fff;font-family:Arial,Helvetica,sans-serif;color:#000;width:${bodyW};max-width:${bodyW};padding:2mm;margin:0 auto;overflow:hidden;word-wrap:break-word;overflow-wrap:break-word;}@page{margin:0;size:${pageW} ${pageH};}</style>
</head><body>
${body}
<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script>
</body></html>`;
  }

  function openPrintHtml(html: string) {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  async function printReceipt(data: ReceiptData): Promise<void> {
    const template = await loadDefaultTemplate();
    const html = buildReceiptHtml(data, template);
    openPrintHtml(html);
  }

  return { printReceipt, loadDefaultTemplate, buildReceiptHtml, openPrintHtml };
}
