import type {
  BundleItemForm,
  CreateProductApiPayload,
  CreateProductFormState,
  FormValidationIssue,
  PriceFields,
  ProductStoreStock,
  ProductType,
  ProductTypeLabel,
  ProductVariationForm,
  VariationType,
  VariationTypeLabel,
} from "~/types/product-create";

export interface ProductFormShopOption {
  id: string;
  name: string;
}

function randomId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

export function mapProductType(label: ProductTypeLabel): ProductType {
  if (label === "Услуга") return "service";
  if (label === "Комплект") return "bundle";
  return "goods";
}

export function mapVariationType(label: VariationTypeLabel): VariationType {
  return label === "Вариативный" ? "variant" : "simple";
}

export function calculateSalePrice(purchasePrice: number, markupPercent: number): number {
  const p = Math.max(0, Number(purchasePrice) || 0);
  const m = Math.max(0, Number(markupPercent) || 0);
  return Math.round((p + (p * m) / 100) * 100) / 100;
}

export function calculateMarkup(purchasePrice: number, salePrice: number): number {
  const p = Math.max(0, Number(purchasePrice) || 0);
  const s = Math.max(0, Number(salePrice) || 0);
  if (p <= 0) return 0;
  return Math.round((((s - p) / p) * 100) * 100) / 100;
}

export function nonNegative(value: number): number {
  return Math.max(0, Number(value) || 0);
}

export function createDefaultPrices(): PriceFields {
  return {
    purchasePrice: 0,
    markupPercent: 0,
    salePrice: 0,
  };
}

function normalizeShopOptions(shops: ProductFormShopOption[] = []): ProductFormShopOption[] {
  const seen = new Set<string>();

  return shops.filter((shop) => {
    const id = String(shop?.id || "").trim();
    const name = String(shop?.name || "").trim();

    if (!id || !name || seen.has(id)) {
      return false;
    }

    seen.add(id);
    return true;
  });
}

export function createStockRows(shops: ProductFormShopOption[] = []): ProductStoreStock[] {
  return normalizeShopOptions(shops).map((shop) => ({
    id: shop.id,
    name: shop.name,
    qty: 0,
  }));
}

export function createVariation(
  shops: ProductFormShopOption[] = [],
): ProductVariationForm {
  const stocks = normalizeShopOptions(shops).reduce(
    (acc, shop) => {
      acc[shop.id] = 0;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    id: randomId("variation"),
    value: "",
    prices: createDefaultPrices(),
    stocks,
  };
}

export function createBundleItem(): BundleItemForm {
  return {
    id: randomId("bundle"),
    name: "",
    quantity: 1,
  };
}

export function createInitialProductFormState(
  shops: ProductFormShopOption[] = [],
): CreateProductFormState {
  return {
    productType: "Товар",
    variationType: "Простой",
    name: "",
    sku: "",
    barcode: "",
    unit: "Штука",
    images: [],
    prices: createDefaultPrices(),
    stocks: createStockRows(shops),
    attributes: {
      brand: "",
      supplier: "",
      optionalField: "",
    },
    category: undefined,
    variationAttribute: "",
    variations: [createVariation(shops)],
    bundleItems: [createBundleItem()],
  };
}

export function validateCreateProductForm(form: CreateProductFormState): FormValidationIssue[] {
  const issues: FormValidationIssue[] = [];

  if (!form.productType) {
    issues.push({ path: "productType", message: "Тип продукта обязателен." });
  }

  if (!form.name.trim()) {
    issues.push({ path: "name", message: "Наименование обязательно." });
  }

  if (!form.sku.trim()) {
    issues.push({ path: "sku", message: "SKU обязателен." });
  }

  if (!form.barcode.trim() && form.productType !== "Комплект") {
    issues.push({ path: "barcode", message: "Штрихкод обязателен." });
  }

  if (nonNegative(form.prices.purchasePrice) !== form.prices.purchasePrice) {
    issues.push({ path: "prices.purchasePrice", message: "Цена прихода не может быть меньше 0." });
  }

  if (nonNegative(form.prices.markupPercent) !== form.prices.markupPercent) {
    issues.push({ path: "prices.markupPercent", message: "Наценка не может быть меньше 0." });
  }

  if (nonNegative(form.prices.salePrice) !== form.prices.salePrice) {
    issues.push({ path: "prices.salePrice", message: "Цена продажи не может быть меньше 0." });
  }

  if (form.productType === "Товар" && form.stocks.length === 0) {
    issues.push({ path: "stocks", message: "Нет доступных магазинов для остатков." });
  }

  if (form.productType === "Товар" && form.variationType === "Простой") {
    for (const stock of form.stocks) {
      if (nonNegative(stock.qty) !== stock.qty) {
        issues.push({
          path: `stocks.${stock.id}`,
          message: `Количество в магазине "${stock.name}" не может быть меньше 0.`,
        });
      }
    }
  }

  if (form.productType === "Товар" && form.variationType === "Вариативный") {
    if (form.variations.length < 1) {
      issues.push({ path: "variations", message: "Добавьте хотя бы одну вариацию." });
    }

    form.variations.forEach((variation, index) => {
      if (!variation.value.trim()) {
        issues.push({
          path: `variations.${index}.value`,
          message: `Укажите название вариации #${index + 1}.`,
        });
      }

      if (nonNegative(variation.prices.purchasePrice) !== variation.prices.purchasePrice) {
        issues.push({
          path: `variations.${index}.prices.purchasePrice`,
          message: `Цена прихода вариации #${index + 1} не может быть меньше 0.`,
        });
      }

      if (nonNegative(variation.prices.markupPercent) !== variation.prices.markupPercent) {
        issues.push({
          path: `variations.${index}.prices.markupPercent`,
          message: `Наценка вариации #${index + 1} не может быть меньше 0.`,
        });
      }

      if (nonNegative(variation.prices.salePrice) !== variation.prices.salePrice) {
        issues.push({
          path: `variations.${index}.prices.salePrice`,
          message: `Цена продажи вариации #${index + 1} не может быть меньше 0.`,
        });
      }

      for (const [shopId, qty] of Object.entries(variation.stocks)) {
        const shopName = form.stocks.find((stock) => stock.id === shopId)?.name || shopId;
        if (nonNegative(qty) !== qty) {
          issues.push({
            path: `variations.${index}.stocks.${shopId}`,
            message: `Остаток вариации #${index + 1} в "${shopName}" не может быть меньше 0.`,
          });
        }
      }
    });
  }

  if (form.productType === "Комплект") {
    form.bundleItems.forEach((item, index) => {
      if (item.quantity < 1) {
        issues.push({
          path: `bundleItems.${index}.quantity`,
          message: `Количество товара #${index + 1} в комплекте не может быть меньше 1.`,
        });
      }
    });
  }

  return issues;
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

function buildProductPayload(
  form: CreateProductFormState,
  options?: {
    mode?: "create" | "update";
    sourceProduct?: any;
  },
): CreateProductApiPayload {
  const mode = options?.mode ?? "create";
  const sourceProduct = options?.sourceProduct ?? {};
  const variationType = mapVariationType(form.variationType);
  const isVariative = variationType === "variant";
  const isGoods = mapProductType(form.productType) === "goods";
  const basePrices = isVariative
    ? form.variations[0]?.prices ?? createDefaultPrices()
    : form.prices;

  const activeStocks = form.stocks
    .map((stock) => ({
      shop_id: String(stock.id || "").trim(),
      quantity: nonNegative(stock.qty),
      supply_price: nonNegative(basePrices.purchasePrice),
      retail_price: nonNegative(basePrices.salePrice),
      wholesale_price: 0,
    }))
    .filter((stock) => stock.shop_id);

  const payload: CreateProductApiPayload = {
    name: form.name.trim(),
    product_type_id: mapProductType(form.productType),
    measurement_type: "unit",
    description: form.attributes.optionalField.trim() || undefined,
    brand_name: form.attributes.brand.trim() || undefined,
    supply_price: nonNegative(basePrices.purchasePrice),
    retail_price: nonNegative(basePrices.salePrice),
    profit_margin: nonNegative(basePrices.markupPercent),
  };

  if (form.sku.trim()) {
    payload.sku = form.sku.trim();
  }

  if (form.barcode.trim()) {
    payload.barcode = form.barcode.trim();
  }

  if (form.category) {
    payload.category_ids = [form.category];
  }

  if (form.images.length) {
    payload.images = form.images.map((image) => image.name).filter(Boolean);
  }

  if (isUuidLike(form.unit)) {
    payload.measurement_unit_id = form.unit.trim();
  }

  if (isGoods && activeStocks.length) {
    payload.shop_measurement_values = activeStocks.map((stock) => ({
      shop_id: stock.shop_id,
      measurement_value: stock.quantity,
      has_trigger: false,
      small_left_measurement_value: 0,
    }));

    payload.shop_prices = activeStocks.map((stock) => ({
      shop_id: stock.shop_id,
      supply_price: stock.supply_price,
      retail_price: stock.retail_price,
      wholesale_price: stock.wholesale_price,
    }));

    payload.shop_free_prices = activeStocks.map((stock) => ({
      shop_id: stock.shop_id,
    }));
  }

  if (payload.product_type_id === "bundle") {
    const setProducts = form.bundleItems
      .filter((item) => item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        quantity: Math.max(1, item.quantity),
      }));

    if (setProducts.length) {
      payload.set_products = setProducts;
    }
  }

  if (isVariative) {
    payload.variants = form.variations.map((variation) => ({
      id: variation.id,
      name: variation.value.trim(),
      retail_price: nonNegative(variation.prices.salePrice),
      supply_price: nonNegative(variation.prices.purchasePrice),
      profit_margin: nonNegative(variation.prices.markupPercent),
      stocks: Object.fromEntries(
        Object.entries(variation.stocks)
          .map(([shopId, qty]) => [String(shopId).trim(), nonNegative(qty)])
          .filter(([shopId]) => Boolean(shopId)),
      ),
    }));
  }

  payload.metadata = {
    ...(isRecord(sourceProduct?.metadata) ? sourceProduct.metadata : {}),
    ui_unit: form.unit || "Штука",
    supplier_name: form.attributes.supplier.trim(),
    variation_attribute: form.variationAttribute.trim(),
  };

  if (mode === "update") {
    const sourceSuppliers = Array.isArray(sourceProduct?.suppliers)
      ? sourceProduct.suppliers
          .map((supplier: any) => supplier?.id ?? supplier?.supplier_id)
          .filter((id: unknown) => id != null && id !== "")
      : [];

    if (sourceSuppliers.length) {
      payload.supplier_ids = sourceSuppliers;
    }
  } else {
    payload.supplier_ids = [];
  }

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (value == null) return false;
      if (value === "") return false;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    }),
  ) as CreateProductApiPayload;
}

export function buildCreateProductPayload(
  form: CreateProductFormState,
): CreateProductApiPayload {
  return buildProductPayload(form, { mode: "create" });
}

export function buildUpdateProductPayload(
  form: CreateProductFormState,
  sourceProduct?: any,
): CreateProductApiPayload {
  return buildProductPayload(form, { mode: "update", sourceProduct });
}

export function createProductFormStateFromApi(
  raw: any,
  shops: ProductFormShopOption[] = [],
): CreateProductFormState {
  const form = createInitialProductFormState(shops);
  const productType = normalizeProductTypeLabel(raw?.product_type_id ?? raw?.product_type);
  const variationType = normalizeVariationTypeLabel(raw);
  const quantityByShop = extractShopQuantities(raw);
  const purchasePrice = Number(
    raw?.supply_price ??
      raw?.purchase_price ??
      raw?.shop_prices?.[0]?.supply_price ??
      0,
  );
  const salePrice = Number(
    raw?.retail_price ??
      raw?.sale_price ??
      raw?.price ??
      raw?.shop_prices?.[0]?.retail_price ??
      0,
  );

  form.productType = productType;
  form.variationType = variationType;
  form.name = String(raw?.name ?? raw?.base_name ?? "").trim();
  form.sku = String(raw?.sku ?? "").trim();
  form.barcode = String(raw?.barcode ?? "").trim();
  form.unit = normalizeMeasurementUnit(raw);
  form.images = extractImages(raw);
  form.prices = {
    purchasePrice: nonNegative(purchasePrice),
    salePrice: nonNegative(salePrice),
    markupPercent: calculateMarkup(purchasePrice, salePrice),
  };
  form.stocks = createStockRows(shops).map((stock) => ({
    ...stock,
    qty: nonNegative(quantityByShop[stock.id] ?? 0),
  }));
  form.attributes = {
    brand: String(raw?.brand_name ?? raw?.brand?.name ?? raw?.brand ?? "").trim(),
    supplier: extractSupplierName(raw),
    optionalField: String(raw?.description ?? raw?.metadata?.description ?? "").trim(),
  };
  form.category =
    String(
      raw?.category?.id ??
        raw?.category_id ??
        raw?.category_name ??
        raw?.category ??
        raw?.category_ids?.[0] ??
        "",
    ).trim() || undefined;
  form.variationAttribute = String(raw?.metadata?.variation_attribute ?? "").trim();

  if (mapProductType(productType) === "goods" && variationType === "Вариативный") {
    const variants = Array.isArray(raw?.variants) ? raw.variants : [];
    form.variations = variants.length
      ? variants.map((variant: any) => createVariationFromApi(variant, shops))
      : [createVariation(shops)];
  }

  return form;
}

function normalizeProductTypeLabel(value: unknown): ProductTypeLabel {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "service") return "Услуга";
  if (normalized === "bundle") return "Комплект";
  return "Товар";
}

function normalizeVariationTypeLabel(raw: any): VariationTypeLabel {
  if (raw?.is_variative === true) {
    return "Вариативный";
  }

  if (Array.isArray(raw?.variants) && raw.variants.length > 0) {
    return "Вариативный";
  }

  return "Простой";
}

function normalizeMeasurementUnit(raw: any): string {
  const measurementUnitId = String(raw?.measurement_unit_id ?? "").trim();
  if (measurementUnitId && isUuidLike(measurementUnitId)) {
    return measurementUnitId;
  }

  return String(
    raw?.measurement_unit?.short_name ??
      raw?.measurement_unit?.name ??
      raw?.metadata?.ui_unit ??
      raw?.unit ??
      "Штука",
  ).trim();
}

function extractShopQuantities(raw: any): Record<string, number> {
  const entries = Array.isArray(raw?.shop_measurement_values)
    ? raw.shop_measurement_values
    : Array.isArray(raw?.product_supply_stock)
      ? raw.product_supply_stock
      : [];

  return entries.reduce((acc: Record<string, number>, item: any) => {
    const shopId = String(
      item?.shop_id ?? item?.shopId ?? item?.branch_code ?? item?.branchCode ?? "",
    ).trim();

    if (!shopId) {
      return acc;
    }

    acc[shopId] = nonNegative(
      item?.active_measurement_value ??
        item?.measurement_value ??
        item?.total_measurement_value ??
        item?.quantity ??
        0,
    );
    return acc;
  }, {} as Record<string, number>);
}

function extractImages(raw: any): CreateProductFormState["images"] {
  const imageValues = Array.isArray(raw?.images) ? raw.images : raw?.photo ? [raw.photo] : [];

  return imageValues
    .map((image: any, index: number) => {
      const src = String(image?.url ?? image?.src ?? image?.path ?? image ?? "").trim();
      if (!src) return null;

      const filename = src.split("/").pop() || `image_${index + 1}`;
      return {
        id: `existing_${index}_${filename}`,
        file: null,
        name: filename,
        size: 0,
        previewUrl: src,
      };
    })
    .filter((image: CreateProductFormState["images"][number] | null): image is CreateProductFormState["images"][number] => Boolean(image));
}

function extractSupplierName(raw: any): string {
  if (typeof raw?.metadata?.supplier_name === "string" && raw.metadata.supplier_name.trim()) {
    return raw.metadata.supplier_name.trim();
  }

  if (Array.isArray(raw?.suppliers) && raw.suppliers.length) {
    return raw.suppliers
      .map((supplier: any) => String(supplier?.name ?? supplier ?? "").trim())
      .filter(Boolean)
      .join(", ");
  }

  return "";
}

function createVariationFromApi(
  variant: any,
  shops: ProductFormShopOption[] = [],
): ProductVariationForm {
  const stocks = createVariation(shops).stocks;
  const rawStocks = isRecord(variant?.stocks) ? variant.stocks : {};

  for (const [shopId, qty] of Object.entries(rawStocks)) {
    stocks[String(shopId).trim()] = nonNegative(Number(qty) || 0);
  }

  const purchasePrice = nonNegative(variant?.supply_price ?? variant?.purchase_price ?? 0);
  const salePrice = nonNegative(variant?.retail_price ?? variant?.sale_price ?? 0);

  return {
    id: String(variant?.id ?? randomId("variation")).trim(),
    value: String(variant?.name ?? variant?.value ?? "").trim(),
    prices: {
      purchasePrice,
      salePrice,
      markupPercent: calculateMarkup(purchasePrice, salePrice),
    },
    stocks,
  };
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
