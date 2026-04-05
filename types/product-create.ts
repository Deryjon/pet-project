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
  id: string;
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

export interface CreateProductApiPayload {
  name: string;
  sku: string;
  barcode: string;
  product_type_id: ProductType;
  measurement_type: string;
  measurement_unit_id?: string;
  description?: string;
  brand_name?: string;
  supplier_ids?: string[];
  supply_price?: number;
  retail_price?: number;
  profit_margin?: number;
  category_ids?: string[];
  images?: string[];
  shop_measurement_values?: Array<{
    shop_id: string;
    measurement_value: number;
    has_trigger: boolean;
    small_left_measurement_value: number;
  }>;
  shop_prices?: Array<{
    shop_id: string;
    supply_price: number;
    retail_price: number;
    wholesale_price: number;
  }>;
  shop_free_prices?: Array<{
    shop_id: string;
  }>;
  set_products?: Array<{
    name: string;
    quantity: number;
  }>;
  variants?: Array<{
    id: string;
    name: string;
    retail_price: number;
    supply_price: number;
    profit_margin: number;
    stocks: Record<string, number>;
  }>;
  metadata?: Record<string, unknown>;
}

