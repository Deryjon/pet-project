export type ProductType = "goods" | "service" | "bundle";
export type VariationType = "simple" | "variant";

export type ProductTypeLabel = "Товар" | "Услуга" | "Комплект";
export type VariationTypeLabel = "Простой" | "Вариативный";

export interface ProductImage {
  id: string;
  file: File;
  name: string;
  size: number;
  previewUrl: string;
}

export interface PriceFields {
  purchasePrice: number;
  markupPercent: number;
  salePrice: number;
}

export interface ProductStoreStock {
  name: string;
  qty: number;
}

export interface ProductVariationForm {
  id: string;
  value: string;
  prices: PriceFields;
  stocks: Record<string, number>;
}

export interface BundleItemForm {
  id: string;
  name: string;
  quantity: number;
}

export interface ProductAttributesForm {
  brand: string;
  supplier: string;
  optionalField: string;
}

export interface CreateProductFormState {
  productType: ProductTypeLabel;
  variationType: VariationTypeLabel;
  name: string;
  sku: string;
  barcode: string;
  unit: string;
  images: ProductImage[];
  prices: PriceFields;
  stocks: ProductStoreStock[];
  attributes: ProductAttributesForm;
  category?: string;
  variationAttribute: string;
  variations: ProductVariationForm[];
  bundleItems: BundleItemForm[];
}

export interface FormValidationIssue {
  path: string;
  message: string;
}

