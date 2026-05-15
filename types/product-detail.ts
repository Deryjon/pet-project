export interface ProductCategory {
  id: string;
  name: string;
  parent_id: string;
  all_parent_ids: string[] | null;
  subRows: unknown[] | null;
  product_count: number;
  company_id: string;
  is_open: boolean;
  level_number: number;
  from_parent: boolean;
  super_parent_id: string;
  deleted_at: number;
}

export interface MeasurementValues {
  total_measurement_value: number;
  total_active_measurement_value: number;
  total_inactive_measurement_value: number;
}

export interface ShopMeasurementValue {
  shop_id: string;
  small_left_measurement_value: number;
  has_trigger: boolean;
  total_measurement_value: number;
  total_min_supply_price: number | null;
  total_max_supply_price: number | null;
  total_supply_sum: number;
  total_active_measurement_value: number;
  total_active_min_supply_price: number | null;
  total_active_max_supply_price: number | null;
  total_active_supply_sum: number;
  total_inactive_measurement_value: number;
  total_inactive_min_supply_price: number | null;
  total_inactive_max_supply_price: number | null;
  total_inactive_supply_sum: number;
  total_sold_measurement_value: number;
  total_imported_measurement_value: number;
  total_transfer_arrived_measurement_value: number;
  total_transfered_measurement_value: number;
  total_in_transfer_measurement_value: number;
  total_in_transfer_min_supply_price: number | null;
  total_in_transfer_max_supply_price: number | null;
  total_in_transfer_supply_sum: number;
  total_written_off_measurement_value: number;
  import_started_measurement_value: number;
  is_small_left: boolean;
  total_retail_sum: number;
  total_active_retail_sum: number;
  total_inactive_retail_sum: number;
}

export interface ShopPriceCurrency {
  currency: string;
  retail_price: number;
  min_supply_price: number;
  max_supply_price: number;
  supply_price: number;
  wholesale_price: number;
  min_price: number;
  max_price: number;
  prices_list: unknown[];
}

export interface ShopPrice {
  shop_id: string;
  retail_price: number;
  retail_currency: string;
  supply_currency: string;
  min_supply_price: number;
  max_supply_price: number;
  supply_price: number;
  wholesale_price: number;
  min_price: number;
  max_price: number;
  prices_list: unknown[];
  from_supply_price: number;
  currency_prices: ShopPriceCurrency[];
  promo_price: number;
  promos: unknown[] | null;
}

export interface MeasurementUnit {
  id: string;
  name: string;
  company_id: string;
  short_name: string;
  precision: string;
  is_editable: boolean;
  is_default: boolean;
}

export interface ProductSupplier {
  id: string;
  company_id: string;
  name: string;
  deleted_at: number;
}

export interface ProductSupplyStock {
  shop_id: string;
  shop_name: string;
  measurement_value: number;
  active_measurement_value: number;
  inactive_measurement_value: number;
  supply_price: number;
  supplier_ids: string[] | null;
}

export interface ProductDetailResponse {
  id: string;
  internal_id?: string;
  public_id?: string;
  parent_id: string;
  company_id: string;
  product_type_id: string;
  is_variative: boolean;
  is_marked: boolean;
  name: string;
  sku: string;
  main_image_url: string;
  images: Array<{ url: string }> | null;
  barcode: string;
  additional_barcodes: string[] | null;
  categories: ProductCategory[];
  brand_id: string;
  measurement_unit_id: string;
  set_products: unknown[];
  retail_price: number;
  supply_price: number;
  description: string;
  measurement_type: string;
  measurement_values: MeasurementValues;
  shop_measurement_values: ShopMeasurementValue[];
  shop_prices: ShopPrice[];
  has_expiration_date: boolean;
  packages: unknown[];
  product_attributes: unknown[];
  supplier_id: string;
  supplier_ids: string[] | null;
  suppliers: ProductSupplier[];
  is_divisible: boolean;
  measurement_unit: MeasurementUnit;
  custom_fields: unknown[];
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  brand_name: string;
  product_supply_stock: ProductSupplyStock[];
  product_supplier_stock: unknown[] | null;
  variations: unknown[];
  base_name: string;
  variation_id: string;
  free_price: boolean;
  archived_at: string;
  archived_by: { id: string; name: string };
  deleted: boolean;
  status: number;
  all_promos: unknown[];
  scale_plu: number;
  scale_code: number;
  is_scalable: boolean;
  shop_free_prices: unknown[] | null;
  supplier_order_ids: unknown[] | null;
  import_ids: unknown[] | null;
  is_default: boolean;
}

export interface ProductMovementItem {
  internal_id?: number;
  id: string;
  type?: string;
  action_type?: string;
  action_label?: string;
  direction?: "in" | "out" | string;
  created_at: string;
  external_id?: string;
  measurement_value?: number;
  loaded_measurement_value?: number;
  quantity?: number;
  before_quantity?: number;
  after_quantity?: number;
  from_shop?: string;
  to_shop?: string;
  shop_id?: string;
  shop_name?: string;
  branch_code?: string;
  supply_price?: number;
  retail_price?: number;
  new_retail_price?: number;
  from_retail_price?: number;
  from_supply_price?: number;
  user?: {
    id: string;
    name: string;
  } | null;
  document?: {
    id: string;
    number: string;
    type: string;
    status: string;
    created_at: string;
  } | null;
}

export interface ProductMovementTypeOption {
  value: string;
  label: string;
}

export interface ProductMovementShopOption {
  shop_id: string;
  shop_name: string;
  branch_code: string;
}

export interface ProductMovementResponse {
  total_measurement_value: number;
  imported: number;
  sold: number;
  returned?: number;
  transfer_arrived: number;
  transfer_returned: number;
  transfered: number;
  written_off: number;
  count: number;
  movements: ProductMovementItem[];
  supply_price_history: null;
  accepted_order?: number;
  available_movement_types?: ProductMovementTypeOption[];
  available_shops?: ProductMovementShopOption[];
  filters?: {
    from_created_at?: string | null;
    to_created_at?: string | null;
    movement_type?: string | null;
    shop_id?: string | null;
  };
}

export interface PriceTag {
  id: string;
  company_id: string;
  name: string;
  width: number;
  length: number;
  barcode_type: string;
  barcode_type_id: string;
  properties: unknown | null;
}

export interface PriceTagResponse {
  price_tags: PriceTag[];
}

export interface ShopItem {
  id: string;
  company_id: string;
  name: string;
  branch_code: string;
  address: string;
  phone_numbers: string[];
  cash_boxes_count: number;
  cash_boxes: unknown[];
  is_active: boolean;
}

export interface ShopListResponse {
  count: number;
  shops: ShopItem[];
}

export interface ProductCardData {
  product: ProductDetailResponse;
  measurementUnit: MeasurementUnit | null;
  movement: ProductMovementResponse | null;
  priceTags: PriceTag[];
  shops: ShopItem[];
}
