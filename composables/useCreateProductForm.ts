import type {
  BundleItemForm,
  CreateProductFormState,
  FormValidationIssue,
  PriceFields,
  ProductType,
  ProductTypeLabel,
  ProductVariationForm,
  VariationType,
  VariationTypeLabel,
} from "~/types/product-create";

const DEFAULT_STORES = ["Globus Mall", "Samarqand Darvoza"] as const;

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

export function createVariation(stores: readonly string[] = DEFAULT_STORES): ProductVariationForm {
  const stocks = stores.reduce(
    (acc, storeName) => {
      acc[storeName] = 0;
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

export function createInitialProductFormState(): CreateProductFormState {
  return {
    productType: "Товар",
    variationType: "Простой",
    name: "",
    sku: "",
    barcode: "",
    unit: "Штука",
    images: [],
    prices: createDefaultPrices(),
    stocks: DEFAULT_STORES.map((name) => ({ name, qty: 0 })),
    attributes: {
      brand: "",
      supplier: "",
      optionalField: "",
    },
    category: undefined,
    variationAttribute: "",
    variations: [createVariation()],
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

  if (nonNegative(form.prices.purchasePrice) !== form.prices.purchasePrice) {
    issues.push({ path: "prices.purchasePrice", message: "Цена прихода не может быть меньше 0." });
  }

  if (nonNegative(form.prices.markupPercent) !== form.prices.markupPercent) {
    issues.push({ path: "prices.markupPercent", message: "Наценка не может быть меньше 0." });
  }

  if (nonNegative(form.prices.salePrice) !== form.prices.salePrice) {
    issues.push({ path: "prices.salePrice", message: "Цена продажи не может быть меньше 0." });
  }

  if (form.productType === "Товар" && form.variationType === "Простой") {
    for (const stock of form.stocks) {
      if (nonNegative(stock.qty) !== stock.qty) {
        issues.push({
          path: `stocks.${stock.name}`,
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

      for (const [branchName, qty] of Object.entries(variation.stocks)) {
        if (nonNegative(qty) !== qty) {
          issues.push({
            path: `variations.${index}.stocks.${branchName}`,
            message: `Остаток вариации #${index + 1} в "${branchName}" не может быть меньше 0.`,
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
