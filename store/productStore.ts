import { defineStore } from "pinia";
import {
  createBundleItem,
  createInitialProductFormState,
  createStockRows,
  createVariation,
  nonNegative,
  type ProductFormShopOption,
} from "~/composables/useCreateProductForm";
import { useApi } from "~/composables/useApi";
import type {
  CreateProductFormState,
  ProductImage,
  ProductTypeLabel,
  VariationTypeLabel,
} from "~/types/product-create";

const PRODUCT_TYPES: ProductTypeLabel[] = ["Товар", "Услуга", "Комплект"];
const PRODUCT_VARIANTS: VariationTypeLabel[] = ["Простой", "Вариативный"];
const UNITS = ["Штука", "Литр", "Килограмм"] as const;
const CATEGORIES = ["аудио-система", "пылесос", "станция", "подставка", "стекло"] as const;

interface ProductStoreState {
  form: CreateProductFormState;
  productTypes: ProductTypeLabel[];
  productVariants: VariationTypeLabel[];
  units: string[];
  categories: string[];
  availableShops: ProductFormShopOption[];
}

function fallbackSku() {
  return `SKU-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function fallbackBarcode() {
  return `2${Date.now().toString().slice(-12)}`;
}

export const useProductStore = defineStore("product", {
  state: (): ProductStoreState => ({
    form: createInitialProductFormState(),
    productTypes: [...PRODUCT_TYPES],
    productVariants: [...PRODUCT_VARIANTS],
    units: [...UNITS],
    categories: [...CATEGORIES],
    availableShops: [],
  }),
  actions: {
    syncAvailableShops(shops: ProductFormShopOption[] = []) {
      const normalized = shops
        .map((shop) => ({
          id: String(shop?.id || "").trim(),
          name: String(shop?.name || "").trim(),
        }))
        .filter((shop) => shop.id && shop.name);

      this.availableShops = normalized;

      const previousStocksById = new Map(this.form.stocks.map((stock) => [stock.id, stock.qty]));
      this.form.stocks = createStockRows(normalized).map((stock) => ({
        ...stock,
        qty: previousStocksById.get(stock.id) ?? 0,
      }));

      this.form.variations = this.form.variations.map((variation) => {
        const nextStocks = normalized.reduce(
          (acc, shop) => {
            acc[shop.id] = nonNegative(variation.stocks[shop.id] ?? 0);
            return acc;
          },
          {} as Record<string, number>,
        );

        return {
          ...variation,
          stocks: nextStocks,
        };
      });

      if (!this.form.variations.length) {
        this.form.variations = [createVariation(normalized)];
      }
    },
    resetForm() {
      this.form = createInitialProductFormState(this.availableShops);
    },
    setProductType(type: ProductTypeLabel) {
      this.form.productType = type;
      if (type !== "Товар") {
        this.form.variationType = "Простой";
      }
    },
    setVariationType(type: VariationTypeLabel) {
      this.form.variationType = type;
      if (type === "Вариативный" && this.form.variations.length === 0) {
        this.form.variations = [createVariation(this.availableShops)];
      }
    },
    async generateCode(type: "article" | "barcode") {
      try {
        const { apiFetch } = useApi();

        if (type === "article") {
          const res: any = await apiFetch("/v2/product/generate-sku", {
            method: "POST",
            body: {
              name: this.form.name.trim() || undefined,
            },
          });
          this.form.sku = String(res?.sku || fallbackSku());
          return;
        }

        const res: any = await apiFetch("/v2/product/generate-barcode", {
          method: "POST",
        });
        this.form.barcode = String(res?.barcode || fallbackBarcode());
      } catch {
        if (type === "article") {
          this.form.sku = fallbackSku();
          return;
        }

        this.form.barcode = fallbackBarcode();
      }
    },
    addImage(image: ProductImage) {
      this.form.images = [image];
    },
    removeImage(id: string) {
      const removed = this.form.images.find((img) => img.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      this.form.images = this.form.images.filter((img) => img.id !== id);
    },
    clearImages() {
      this.form.images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      this.form.images = [];
    },
    setStoreQty(storeId: string, qty: number) {
      const store = this.form.stocks.find((s) => s.id === storeId);
      if (store) store.qty = nonNegative(qty);
    },
    addVariation() {
      this.form.variations.push(createVariation(this.availableShops));
    },
    removeVariation(id: string) {
      if (this.form.variations.length <= 1) return;
      this.form.variations = this.form.variations.filter((v) => v.id !== id);
    },
    setVariationStock(variationId: string, storeId: string, qty: number) {
      const variation = this.form.variations.find((v) => v.id === variationId);
      if (!variation) return;
      variation.stocks[storeId] = nonNegative(qty);
    },
    addBundleItem() {
      this.form.bundleItems.push(createBundleItem());
    },
    removeBundleItem(id: string) {
      if (this.form.bundleItems.length <= 1) return;
      this.form.bundleItems = this.form.bundleItems.filter((item) => item.id !== id);
    },
    setBundleItemQty(id: string, qty: number) {
      const item = this.form.bundleItems.find((b) => b.id === id);
      if (!item) return;
      item.quantity = Math.max(1, Math.floor(Number(qty) || 1));
    },
  },
});
