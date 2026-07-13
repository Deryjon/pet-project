import { defineStore } from "pinia";
import { reactive, ref } from "vue";

type PriceTagSize = "small" | "medium" | "a4";

const STORAGE_KEY = "print-settings-v1";

const defaultSettings = {
  receiptPrinterName: "",
  priceTagPrinterName: "",
  receiptCopies: 1,
  autoOpenReceiptAfterSale: true,
  autoPrintReceiptAfterSale: false,
  priceTagSize: "small" as PriceTagSize,
  priceTagCopies: 1,
  showBarcodeOnPriceTag: true,
  showSkuOnPriceTag: true,
};

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSettings(raw: any) {
  return {
    ...defaultSettings,
    ...raw,
    priceTagSize: ["small", "medium", "a4"].includes(raw?.priceTagSize)
      ? raw.priceTagSize
      : "small",
    receiptCopies: Math.max(1, Math.min(5, toNumber(raw?.receiptCopies, 1))),
    priceTagCopies: Math.max(1, Math.min(100, toNumber(raw?.priceTagCopies, 1))),
  };
}

export const usePrintSettingsStore = defineStore("printSettings", () => {
  const settings = reactive({ ...defaultSettings });
  const receiptPreviewOpen = ref(false);

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

  loadSettings();

  return {
    settings,
    receiptPreviewOpen,
    loadSettings,
    saveSettings,
    resetSettings,
  };
});
