import { useApi } from "~/composables/useApi";
import type { Cheque } from "~/composables/useCheques";

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
  extraPayments?: Array<{ payment_method: string; amount: number; payment_name: string }> | null;
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

  function buildReceiptHtml(data: ReceiptData, template: Cheque | null): string {
    const width = template?.compact ? "58mm" : template?.width ? `${template.width}mm` : "80mm";
    const extra = template?.extra_settings;

    const sections: string[] = [];

    // --- Logo ---
    if (template?.has_logo && template.logo_url) {
      sections.push(`
        <div class="center" style="margin-bottom:6px;">
          <img src="${escapeHtml(template.logo_url)}" alt="logo"
               style="max-width:80%;max-height:60px;object-fit:contain;" />
        </div>`);
    }

    // --- Information block ---
    if (template?.has_information_block !== false) {
      const infoLines: string[] = [];
      if (data.shop) infoLines.push(`<div class="center bold">${escapeHtml(data.shop)}</div>`);

      if (extra?.hasBranchName && extra.branchName) {
        infoLines.push(`<div class="center">${escapeHtml(extra.branchName)}</div>`);
      }
      if (extra?.hasAddress && extra.address) {
        infoLines.push(`<div class="center">${escapeHtml(extra.address)}</div>`);
      }
      if (extra?.hasPhone && extra.phone) {
        infoLines.push(`<div class="center">${escapeHtml(extra.phone)}</div>`);
      }
      if (extra?.hasWorkingHours && extra.workingHours) {
        infoLines.push(`<div class="center">${escapeHtml(extra.workingHours)}</div>`);
      }
      if (extra?.hasWebsite && extra.website) {
        infoLines.push(`<div class="center">${escapeHtml(extra.website)}</div>`);
      }
      if (extra?.hasTaxId && extra.taxId) {
        infoLines.push(`<div class="row"><span>ИНН:</span><span>${escapeHtml(extra.taxId)}</span></div>`);
      }

      infoLines.push(`<div class="row"><span>Дата:</span><span>${escapeHtml(data.date)}</span></div>`);
      infoLines.push(`<div class="row"><span>Чек #:</span><span>${escapeHtml(data.number)}</span></div>`);
      if (data.seller) {
        infoLines.push(`<div class="row"><span>Продавец:</span><span>${escapeHtml(data.seller)}</span></div>`);
      }
      if (data.cashier && data.cashier !== data.seller) {
        infoLines.push(`<div class="row"><span>Кассир:</span><span>${escapeHtml(data.cashier)}</span></div>`);
      }
      if (data.client && data.client !== "—") {
        infoLines.push(`<div class="row"><span>Клиент:</span><span>${escapeHtml(data.client)}</span></div>`);
      }

      sections.push(infoLines.join("\n"));
    }

    // --- Items ---
    sections.push('<div class="hr"></div>');

    const itemRows = data.items.map((item, idx) => {
      const num = idx + 1;
      const lines: string[] = [];
      lines.push(`<div class="item-name">${num}. ${escapeHtml(item.name)}</div>`);
      if (item.code) {
        lines.push(`<div class="item-code">${escapeHtml(item.code)}</div>`);
      }
      lines.push(`<div class="row"><span>${item.quantity} x ${escapeHtml(item.price)}</span><span>${escapeHtml(item.price)}</span></div>`);
      return `<div class="item">${lines.join("\n")}</div>`;
    });
    sections.push(itemRows.join("\n"));

    sections.push('<div class="hr"></div>');

    // --- Totals ---
    sections.push(`<div class="row total"><span>ИТОГО:</span><span>${escapeHtml(data.total)}</span></div>`);

    // --- Payment ---
    if (data.extraPayments && data.extraPayments.length > 1) {
      data.extraPayments.forEach((ep) => {
        sections.push(`<div class="row"><span>${escapeHtml(ep.payment_name)}:</span><span>${escapeHtml(String(ep.amount))}</span></div>`);
      });
    } else {
      sections.push(`<div class="row"><span>Оплата:</span><span>${escapeHtml(data.payment)}</span></div>`);
    }

    // --- Barcode placeholder ---
    if (template?.has_bar_code) {
      sections.push(`
        <div class="hr"></div>
        <div class="center" style="margin:8px 0;">
          <div style="font-family:monospace;letter-spacing:4px;font-size:14px;">${escapeHtml(data.number)}</div>
          <div style="font-size:9px;color:#666;">Штрих-код</div>
        </div>`);
    }

    // --- QR Code ---
    if (extra?.hasQrCode && extra.qrCodeUrl) {
      sections.push(`
        <div class="center" style="margin:6px 0;">
          <img src="${escapeHtml(extra.qrCodeUrl)}" alt="QR"
               style="max-width:100px;max-height:100px;" />
        </div>`);
    }

    // --- Footer / lower block ---
    if (template?.has_lower_block && template.display_text) {
      sections.push(`<div class="hr"></div>`);
      sections.push(`<div class="footer">${escapeHtml(template.display_text)}</div>`);
    }

    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>Чек #${escapeHtml(data.number)}</title>
  <style>
    @page {
      size: ${width} auto;
      margin: 2mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      width: ${width};
      max-width: ${width};
      margin: 0 auto;
      padding: 4px;
      color: #000;
      background: #fff;
      -webkit-print-color-adjust: exact;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .hr { border-top: 1px dashed #000; margin: 6px 0; }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 4px;
      line-height: 1.4;
    }
    .row span:last-child { text-align: right; white-space: nowrap; }
    .total { font-size: 14px; font-weight: bold; margin: 4px 0; }
    .item { margin-bottom: 4px; }
    .item-name { font-weight: bold; }
    .item-code { font-size: 10px; color: #444; }
    .footer {
      text-align: center;
      font-size: 10px;
      color: #666;
      margin-top: 8px;
      white-space: pre-line;
    }
    @media print {
      body { width: ${width}; }
    }
  </style>
</head>
<body>
${sections.join("\n")}
</body>
</html>`;
  }

  async function printReceipt(data: ReceiptData): Promise<void> {
    const template = await loadDefaultTemplate();
    const html = buildReceiptHtml(data, template);
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  }

  return { printReceipt, loadDefaultTemplate };
}
