import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";

type PaperWidth = "58" | "80";
type PriceTagSize = "small" | "medium" | "a4";

export type SaleReceiptLine = {
  name: string;
  quantity: number;
  price: number;
  total: number;
};

export type SaleReceiptSnapshot = {
  saleId?: string | number | null;
  saleNumber?: string | null;
  paidAt: string;
  paymentMethodName: string;
  subtotal: number;
  discount: number;
  total: number;
  lines: SaleReceiptLine[];
  receiptResponse?: any;
};

const STORAGE_KEY = "print-settings-v1";

const defaultSettings = {
  companyName: "Konkurent.cases",
  shopName: "",
  address: "",
  phone: "",
  receiptPrinterName: "",
  priceTagPrinterName: "",
  paperWidth: "80" as PaperWidth,
  receiptCopies: 1,
  autoOpenReceiptAfterSale: true,
  autoPrintReceiptAfterSale: false,
  showCompanyName: true,
  showShopName: true,
  showCashier: true,
  showPaymentMethod: true,
  showFooter: true,
  footerText: "Спасибо за покупку!",
  priceTagSize: "small" as PriceTagSize,
  priceTagCopies: 1,
  showBarcodeOnPriceTag: true,
  showSkuOnPriceTag: true,
};

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatMoney(value: number) {
  return `${Math.round(Number(value || 0)).toLocaleString("ru-RU")} UZS`;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeSettings(raw: any) {
  return {
    ...defaultSettings,
    ...raw,
    paperWidth: raw?.paperWidth === "58" ? "58" : "80",
    priceTagSize: ["small", "medium", "a4"].includes(raw?.priceTagSize)
      ? raw.priceTagSize
      : "small",
    receiptCopies: Math.max(1, Math.min(5, toNumber(raw?.receiptCopies, 1))),
    priceTagCopies: Math.max(1, Math.min(100, toNumber(raw?.priceTagCopies, 1))),
  };
}

export const usePrintSettingsStore = defineStore("printSettings", () => {
  const settings = reactive({ ...defaultSettings });
  const latestReceipt = ref<SaleReceiptSnapshot | null>(null);
  const receiptPreviewOpen = ref(false);

  const receiptPaperClass = computed(() =>
    settings.paperWidth === "58" ? "receipt-paper-58" : "receipt-paper-80",
  );

  function loadSettings() {
    if (!import.meta.client) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      Object.assign(settings, normalizeSettings(JSON.parse(raw)));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function saveSettings() {
    if (!import.meta.client) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  function resetSettings() {
    Object.assign(settings, { ...defaultSettings });
    saveSettings();
  }

  function setLatestReceipt(snapshot: SaleReceiptSnapshot) {
    latestReceipt.value = snapshot;

    if (settings.autoOpenReceiptAfterSale) {
      receiptPreviewOpen.value = true;
    }

    if (settings.autoPrintReceiptAfterSale) {
      printReceipt(snapshot);
    }
  }

  function buildReceiptHtml(snapshot: SaleReceiptSnapshot) {
    const width = settings.paperWidth === "58" ? "58mm" : "80mm";
    const paidAt = new Date(snapshot.paidAt);
    const rows = snapshot.lines
      .map(
        (line) => `
          <tr>
            <td>
              <strong>${escapeHtml(line.name)}</strong>
              <span>${line.quantity} x ${escapeHtml(formatMoney(line.price))}</span>
            </td>
            <td>${escapeHtml(formatMoney(line.total))}</td>
          </tr>
        `,
      )
      .join("");

    return `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Чек</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; background: white; color: #111; font-family: Arial, sans-serif; }
            .receipt { width: ${width}; padding: 10px; font-size: 12px; }
            .center { text-align: center; }
            .muted { color: #555; }
            .line { border-top: 1px dashed #111; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { vertical-align: top; padding: 4px 0; }
            td:last-child { text-align: right; white-space: nowrap; }
            td span { display: block; margin-top: 2px; color: #555; }
            .total { display: flex; justify-content: space-between; font-weight: 700; font-size: 14px; }
            @page { margin: 0; size: ${width} auto; }
          </style>
        </head>
        <body>
          <div class="receipt">
            ${
              settings.showCompanyName
                ? `<div class="center"><strong>${escapeHtml(settings.companyName)}</strong></div>`
                : ""
            }
            ${
              settings.showShopName && (settings.shopName || settings.address)
                ? `<div class="center muted">${escapeHtml(settings.shopName || settings.address)}</div>`
                : ""
            }
            ${settings.phone ? `<div class="center muted">${escapeHtml(settings.phone)}</div>` : ""}
            <div class="line"></div>
            <div>Чек: ${escapeHtml(snapshot.saleNumber || snapshot.saleId || "-")}</div>
            <div>Дата: ${escapeHtml(paidAt.toLocaleString("ru-RU"))}</div>
            ${
              settings.showPaymentMethod
                ? `<div>Оплата: ${escapeHtml(snapshot.paymentMethodName)}</div>`
                : ""
            }
            <div class="line"></div>
            <table>${rows}</table>
            <div class="line"></div>
            <div>Скидка: ${escapeHtml(formatMoney(snapshot.discount))}</div>
            <div class="total"><span>Итого</span><span>${escapeHtml(formatMoney(snapshot.total))}</span></div>
            ${
              settings.showFooter && settings.footerText
                ? `<div class="line"></div><div class="center">${escapeHtml(settings.footerText)}</div>`
                : ""
            }
          </div>
        </body>
      </html>`;
  }

  function printReceipt(snapshot = latestReceipt.value) {
    if (!import.meta.client || !snapshot) return;

    const printWindow = window.open("", "_blank", "width=420,height=720");
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(buildReceiptHtml(snapshot));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  function printTestReceipt() {
    const snapshot: SaleReceiptSnapshot = {
      saleId: "TEST",
      saleNumber: "TEST-001",
      paidAt: new Date().toISOString(),
      paymentMethodName: "Наличные",
      subtotal: 170000,
      discount: 10000,
      total: 160000,
      lines: [
        { name: "Товар для проверки печати", quantity: 1, price: 120000, total: 120000 },
        { name: "Аксессуар", quantity: 2, price: 25000, total: 50000 },
      ],
    };

    latestReceipt.value = snapshot;
    receiptPreviewOpen.value = true;
    printReceipt(snapshot);
  }

  loadSettings();

  return {
    settings,
    latestReceipt,
    receiptPreviewOpen,
    receiptPaperClass,
    loadSettings,
    saveSettings,
    resetSettings,
    setLatestReceipt,
    printReceipt,
    printTestReceipt,
    formatMoney,
  };
});
