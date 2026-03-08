import { defineStore } from "pinia";
import {
  createBundleItem,
  createInitialProductFormState,
  createVariation,
  nonNegative,
} from "~/composables/useCreateProductForm";
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
}

export const useProductStore = defineStore("product", {
  state: (): ProductStoreState => ({
    form: createInitialProductFormState(),
    productTypes: [...PRODUCT_TYPES],
    productVariants: [...PRODUCT_VARIANTS],
    units: [...UNITS],
    categories: [...CATEGORIES],
  }),
  actions: {
    resetForm() {
      this.form = createInitialProductFormState();
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
        this.form.variations = [createVariation(this.form.stocks.map((s) => s.name))];
      }
    },
    generateCode(type: "article" | "barcode") {
      const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
      if (type === "article") {
        this.form.sku = `ART-${randomCode}`;
      } else {
        this.form.barcode = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
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
    setStoreQty(storeName: string, qty: number) {
      const store = this.form.stocks.find((s) => s.name === storeName);
      if (store) store.qty = nonNegative(qty);
    },
    addVariation() {
      this.form.variations.push(createVariation(this.form.stocks.map((s) => s.name)));
    },
    removeVariation(id: string) {
      if (this.form.variations.length <= 1) return;
      this.form.variations = this.form.variations.filter((v) => v.id !== id);
    },
    setVariationStock(variationId: string, storeName: string, qty: number) {
      const variation = this.form.variations.find((v) => v.id === variationId);
      if (!variation) return;
      variation.stocks[storeName] = nonNegative(qty);
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
