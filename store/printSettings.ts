import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import { formatUzPhoneDisplay } from "~/utils/phone";

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
      const parsed = JSON.parse(raw);
      Object.assign(settings, normalizeSettings(parsed));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function saveSettings() {
    if (!import.meta.client) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings }));
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
    formatMoney,
  };
});
