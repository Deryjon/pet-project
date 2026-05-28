import { useApi } from "~/composables/useApi";

export type ReportFilterQuery = {
  from?: string;
  to?: string;
  dateFrom?: string;
  dateTo?: string;
  shopId?: string;
  shopIds?: string[];
  sellerIds?: string[];
  productIds?: string[];
  categoryIds?: string[];
  supplierIds?: string[];
  brandIds?: string[];
  plotShopIds?: string[];
  sellerId?: string;
  categoryId?: string;
  productId?: string;
  brandId?: string;
  supplierId?: string;
  startDate?: string;
  endDate?: string;
  page?: number | string;
  perPage?: number | string;
  limit?: number | string;
  currency?: string;
  groupBy?: string;
  field?: string;
  topProductField?: string;
  topCategoryField?: string;
  detalization?: string;
  priceType?: number | string;
  method?: "revenue" | "profit" | "quantity";
  reportDate?: string;
  version?: number | string;
  groupWithoutShop?: boolean;
  groupWithoutShops?: boolean;
  groupWithSupplier?: boolean;
  allSuppliers?: boolean;
  detalizationByPosition?: boolean;
  importType?: string;
};

export type SelectOption = {
  label: string;
  value: string;
};

export type ReportKpi = {
  key: string;
  label: string;
  value: number;
  formattedValue: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "primary";
};

export type ReportPoint = {
  label: string;
  value: number;
};

export type ReportSummary = {
  gross_sales: number;
  net_gross_sales: number;
  gross_profit: number;
  average_cheque: number;
  transactions_count: number;
  products_sold: number;
  discount_sum: number;
  discount_percent: number;
  average_extra_charge: number;
  returns_count: number;
  exchanges_count: number;
  chart_sales: ReportPoint[];
  chart_profit: ReportPoint[];
  kpis: ReportKpi[];
};

export type ShopReportRow = {
  id: string;
  name: string;
  gross_sales: number;
  net_gross_sales: number;
  gross_profit: number;
  discount_sum: number;
  discount_percent: number;
  average_cheque: number;
  products_sold: number;
  transactions_count: number;
  returns_count: number;
  average_extra_charge: number;
};

export type ProductReportRow = {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  sold_quantity: number;
  gross_revenue: number;
  net_revenue: number;
  sold_cost: number;
  gross_profit: number;
  margin_percent: number;
  average_discount: number;
  stock_left: number;
  returns_count: number;
};

export type SellerReportRow = {
  id: string;
  name: string;
  shop_name: string;
  gross_sales: number;
  net_gross_sales: number;
  gross_profit: number;
  products_sold: number;
  transactions_count: number;
  average_cheque: number;
  discount_sum: number;
  discount_percent: number;
  returns_count: number;
  average_extra_charge: number;
  kpi_score: number;
  fixed_salary: number;
  salary_percent: number;
  bonus_amount: number;
  salary_total: number;
  calculation_type: string;
};

export type CustomerStatus = "Новый" | "Постоянный" | "VIP" | "Спящий" | "Потерянный";

export type CustomerReportRow = {
  id: string;
  name: string;
  phone: string;
  purchases_count: number;
  total_spent: number;
  average_cheque: number;
  last_purchase_at: string;
  purchased_products: string[];
  status: CustomerStatus;
};

export type SellerBonusItem = {
  sale_id: string;
  product_name: string;
  final_price: number;
  supply_price_at_sale: number;
  profit_at_sale: number;
  seller_bonus_amount: number;
};

export type SellerSalaryReport = {
  seller_id: string;
  seller_name: string;
  fixed_salary: number;
  salary_percent: number;
  calculation_type: string;
  gross_sales: number;
  net_gross_sales: number;
  gross_profit: number;
  bonus_amount: number;
  salary_total: number;
  items: SellerBonusItem[];
};

export type ShopReportDetails = {
  id: string;
  name: string;
  summary: ReportSummary;
  sales_by_day: ReportPoint[];
  profit_by_day: ReportPoint[];
  top_products: ProductReportRow[];
  sellers: SellerReportRow[];
  stock_items: ProductReportRow[];
};

export type SellerReportDetails = {
  id: string;
  name: string;
  shop_name: string;
  summary: ReportSummary;
  sales_by_day: ReportPoint[];
  profit_by_day: ReportPoint[];
  sold_products: ProductReportRow[];
  salary_report: SellerSalaryReport | null;
};

export type GeneralReportTableRow = {
  id: string;
  date: string;
  shop_name: string;
  gross_sales: number;
  discount_sum: number;
  discount_percent: number;
  sales_supply_price: number;
  net_gross_sales: number;
  gross_profit: number;
  average_cheque: number;
  average_price: number;
  products_sold: number;
  transactions_count: number;
  orders_count: number;
  returns_count: number;
  exchanges_count: number;
};

export type GeneralReportTableResult = {
  rows: GeneralReportTableRow[];
  count: number;
};

export type GeneralSalesReportResult = {
  value: number;
  shop_stats: ShopReportRow[];
  shop_plot: ReportPoint[];
};

export type GeneralProductCategoryRow = {
  id: string;
  name: string;
  sold_quantity: number;
  net_revenue: number;
  gross_profit: number;
};

export type GeneralProductReportResult = {
  value: number;
  shop_stats: ShopReportRow[];
  shop_plot: ReportPoint[];
  top_products: ProductReportRow[];
  top_categories: GeneralProductCategoryRow[];
};

export type GeneralSellerReportRow = {
  id: string;
  name: string;
  net_profit: number;
  net_sales: number;
  average_cheque: number;
  average_sold_measurement_value: number;
  average_price: number;
  total_sold_measurement_value: number;
};

export type GeneralSellerReportResult = {
  top_sellers: GeneralSellerReportRow[];
  count_others: number;
  other_sellers: GeneralSellerReportRow[];
};

export type GeneralCustomerStatRow = {
  id: string;
  name: string;
  new_count: number;
  returned_count: number;
};

export type GeneralCustomerTopEntity = {
  id: string;
  name: string;
  value: number;
  subtitle: string;
};

export type GeneralCustomerReportResult = {
  shop_plot: ReportPoint[];
  shop_stats: GeneralCustomerStatRow[];
  new_count: number;
  returned_count: number;
  top_client: GeneralCustomerTopEntity | null;
  top_transaction: GeneralCustomerTopEntity | null;
};

function asString(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

function asNumber(value: unknown, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function pickArray(source: any, keys: string[]) {
  if (Array.isArray(source)) return source;
  for (const key of keys) {
    const value = source?.[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function unwrapPayload(response: any) {
  return response?.data ?? response ?? {};
}

function extractRows(payload: any, keys: string[]) {
  return pickArray(payload, ["rows", ...keys]);
}

function extractChart(payload: any, keys: string[]) {
  return pickArray(payload, ["chart", ...keys]).map(normalizePoint);
}

function extractSummaryPayload(payload: any) {
  return payload?.summary ?? payload;
}

function normalizePoint(raw: any): ReportPoint {
  return {
    label: asString(raw?.label ?? raw?.date ?? raw?.day ?? raw?.name),
    value: asNumber(raw?.value ?? raw?.amount ?? raw?.sum ?? raw?.gross_sales ?? raw?.gross_profit),
  };
}

function formatKpiValue(key: string, value: number) {
  if (["transactions_count", "products_sold", "returns_count", "exchanges_count"].includes(key)) {
    return Intl.NumberFormat("ru-RU").format(value);
  }

  if (["discount_percent", "average_extra_charge"].includes(key)) {
    return `${value.toFixed(1)}%`;
  }

  return `${Intl.NumberFormat("ru-RU").format(Math.round(value))} UZS`;
}

function buildSummary(raw: any): ReportSummary {
  const grossSales = asNumber(raw?.gross_sales);
  const netGrossSales = asNumber(raw?.net_gross_sales);
  const grossProfit = asNumber(raw?.gross_profit);
  const averageCheque = asNumber(raw?.average_cheque);
  const transactionsCount = asNumber(raw?.transactions_count);
  const productsSold = asNumber(raw?.products_sold);
  const discountSum = asNumber(raw?.discount_sum);
  const discountPercent = asNumber(raw?.discount_percent);
  const averageExtraCharge = asNumber(raw?.average_extra_charge);
  const returnsCount = asNumber(raw?.returns_count);
  const exchangesCount = asNumber(raw?.exchanges_count);

  const kpis: ReportKpi[] = [
    { key: "gross_sales", label: "Общие продажи", value: grossSales, formattedValue: formatKpiValue("gross_sales", grossSales), tone: "primary" },
    { key: "net_gross_sales", label: "Чистая выручка", value: netGrossSales, formattedValue: formatKpiValue("net_gross_sales", netGrossSales), tone: "neutral" },
    { key: "gross_profit", label: "Валовая прибыль", value: grossProfit, formattedValue: formatKpiValue("gross_profit", grossProfit), tone: grossProfit >= 0 ? "success" : "danger" },
    { key: "average_cheque", label: "Средний чек", value: averageCheque, formattedValue: formatKpiValue("average_cheque", averageCheque), tone: "neutral" },
    { key: "transactions_count", label: "Количество чеков", value: transactionsCount, formattedValue: formatKpiValue("transactions_count", transactionsCount), tone: "neutral" },
    { key: "products_sold", label: "Продано товаров", value: productsSold, formattedValue: formatKpiValue("products_sold", productsSold), tone: "neutral" },
    { key: "discount_sum", label: "Сумма скидок", value: discountSum, formattedValue: formatKpiValue("discount_sum", discountSum), tone: "warning" },
    { key: "discount_percent", label: "Процент скидок", value: discountPercent, formattedValue: formatKpiValue("discount_percent", discountPercent), tone: "warning" },
    { key: "average_extra_charge", label: "Средняя наценка", value: averageExtraCharge, formattedValue: formatKpiValue("average_extra_charge", averageExtraCharge), tone: "success" },
    { key: "returns_count", label: "Возвраты", value: returnsCount, formattedValue: formatKpiValue("returns_count", returnsCount), tone: "danger" },
    { key: "exchanges_count", label: "Обмены", value: exchangesCount, formattedValue: formatKpiValue("exchanges_count", exchangesCount), tone: "warning" },
  ];

  return {
    gross_sales: grossSales,
    net_gross_sales: netGrossSales,
    gross_profit: grossProfit,
    average_cheque: averageCheque,
    transactions_count: transactionsCount,
    products_sold: productsSold,
    discount_sum: discountSum,
    discount_percent: discountPercent,
    average_extra_charge: averageExtraCharge,
    returns_count: returnsCount,
    exchanges_count: exchangesCount,
    chart_sales: [],
    chart_profit: [],
    kpis,
  };
}

function normalizeShop(raw: any): ShopReportRow {
  return {
    id: asString(raw?.id ?? raw?.shop_id),
    name: asString(raw?.name ?? raw?.shop_name ?? raw?.title, "Магазин"),
    gross_sales: asNumber(raw?.gross_sales),
    net_gross_sales: asNumber(raw?.net_gross_sales),
    gross_profit: asNumber(raw?.gross_profit),
    discount_sum: asNumber(raw?.discount_sum),
    discount_percent: asNumber(raw?.discount_percent),
    average_cheque: asNumber(raw?.average_cheque),
    products_sold: asNumber(raw?.products_sold),
    transactions_count: asNumber(raw?.transactions_count),
    returns_count: asNumber(raw?.returns_count),
    average_extra_charge: asNumber(raw?.average_extra_charge),
  };
}

function normalizeProduct(raw: any): ProductReportRow {
  return {
    id: asString(raw?.id ?? raw?.product_id),
    name: asString(raw?.name ?? raw?.product_name, "Товар"),
    sku: asString(raw?.sku ?? raw?.article),
    category: asString(raw?.category ?? raw?.category_name, "Без категории"),
    brand: asString(raw?.brand ?? raw?.brand_name, "Без бренда"),
    sold_quantity: asNumber(raw?.sold_qty ?? raw?.sold_quantity ?? raw?.products_sold ?? raw?.quantity),
    gross_revenue: asNumber(raw?.gross_revenue ?? raw?.gross_sales),
    net_revenue: asNumber(raw?.net_revenue ?? raw?.net_gross_sales),
    sold_cost: asNumber(raw?.sold_cost ?? raw?.sales_supply_price ?? raw?.supply_cost ?? raw?.cost_price),
    gross_profit: asNumber(raw?.gross_profit ?? raw?.profit_at_sale),
    margin_percent: asNumber(raw?.margin_percent ?? raw?.profit_margin_percent),
    average_discount: asNumber(raw?.average_discount ?? raw?.discount_percent),
    stock_left: asNumber(raw?.stock_left ?? raw?.leftover ?? raw?.stock),
    returns_count: asNumber(raw?.returns_count),
  };
}

function normalizeSeller(raw: any): SellerReportRow {
  return {
    id: asString(raw?.id ?? raw?.seller_id ?? raw?.user_id),
    name: asString(raw?.name ?? raw?.seller_name ?? raw?.user_name, "Продавец"),
    shop_name: asString(raw?.shop_name ?? raw?.branch_name ?? raw?.shop?.name, "Не указан"),
    gross_sales: asNumber(raw?.gross_sales),
    net_gross_sales: asNumber(raw?.net_gross_sales),
    gross_profit: asNumber(raw?.gross_profit),
    products_sold: asNumber(raw?.products_sold),
    transactions_count: asNumber(raw?.transactions_count),
    average_cheque: asNumber(raw?.average_cheque),
    discount_sum: asNumber(raw?.discount_sum),
    discount_percent: asNumber(raw?.discount_percent),
    returns_count: asNumber(raw?.returns_count),
    average_extra_charge: asNumber(raw?.average_extra_charge),
    kpi_score: asNumber(raw?.kpi_score),
    fixed_salary: asNumber(raw?.fixed_salary),
    salary_percent: asNumber(raw?.salary_percent),
    bonus_amount: asNumber(raw?.bonus_amount),
    salary_total: asNumber(raw?.salary_total),
    calculation_type: asString(raw?.calculation_type, "FIXED_PLUS_PROFIT"),
  };
}

function normalizeGeneralSeller(raw: any): GeneralSellerReportRow {
  return {
    id: asString(raw?.seller_id ?? raw?.id ?? raw?.user_id),
    name: asString(raw?.name ?? raw?.seller_name ?? raw?.user_name, "Продавец"),
    net_profit: asNumber(raw?.net_profit ?? raw?.gross_profit),
    net_sales: asNumber(raw?.net_sales ?? raw?.net_gross_sales),
    average_cheque: asNumber(raw?.average_cheque),
    average_sold_measurement_value: asNumber(raw?.average_sold_measurement_value),
    average_price: asNumber(raw?.average_price),
    total_sold_measurement_value: asNumber(raw?.total_sold_measurement_value ?? raw?.products_sold),
  };
}

function normalizeGeneralCategory(raw: any): GeneralProductCategoryRow {
  return {
    id: asString(raw?.id ?? raw?.category_id ?? raw?.name),
    name: asString(raw?.name ?? raw?.category_name, "Без категории"),
    sold_quantity: asNumber(raw?.sold_qty ?? raw?.sold_quantity ?? raw?.products_sold),
    net_revenue: asNumber(raw?.net_gross_sales ?? raw?.net_revenue),
    gross_profit: asNumber(raw?.gross_profit),
  };
}

function normalizeGeneralCustomerStat(raw: any): GeneralCustomerStatRow {
  return {
    id: asString(raw?.shop_id ?? raw?.id ?? raw?.name),
    name: asString(raw?.shop_name ?? raw?.name, "Магазин"),
    new_count: asNumber(raw?.new_count ?? raw?.new),
    returned_count: asNumber(raw?.returned_count ?? raw?.returned),
  };
}

function normalizeTopCustomerEntity(raw: any): GeneralCustomerTopEntity | null {
  if (!raw) return null;

  const id = asString(raw?.id ?? raw?.customer_id ?? raw?.transaction_id ?? raw?.name);
  const name = asString(raw?.name ?? raw?.customer_name ?? raw?.order_number, "");
  const value = asNumber(raw?.value ?? raw?.gross_sales ?? raw?.net_gross_sales ?? raw?.amount ?? raw?.sum);
  const subtitle = asString(raw?.phone ?? raw?.shop_name ?? raw?.label ?? raw?.date, "");

  if (!id && !name && !value && !subtitle) {
    return null;
  }

  return { id: id || name, name: name || "Без названия", value, subtitle };
}

function normalizeGeneralReportTableRow(raw: any, index: number): GeneralReportTableRow {
  return {
    id: asString(raw?.id ?? `${raw?.date ?? raw?.start_date ?? index}-${raw?.shop_id ?? raw?.shop_name ?? index}`),
    date: asString(raw?.date ?? raw?.start_date ?? raw?.day),
    shop_name: asString(raw?.shop_name ?? raw?.name, "Магазин"),
    gross_sales: asNumber(raw?.gross_sales),
    discount_sum: asNumber(raw?.discount_sum),
    discount_percent: asNumber(raw?.discount_percent),
    sales_supply_price: asNumber(raw?.sales_supply_price),
    net_gross_sales: asNumber(raw?.net_gross_sales),
    gross_profit: asNumber(raw?.gross_profit),
    average_cheque: asNumber(raw?.average_cheque),
    average_price: asNumber(raw?.average_price),
    products_sold: asNumber(raw?.products_sold),
    transactions_count: asNumber(raw?.transactions_count),
    orders_count: asNumber(raw?.orders_count),
    returns_count: asNumber(raw?.returns_count),
    exchanges_count: asNumber(raw?.exchanges_count),
  };
}

function deriveCustomerStatus(raw: any): CustomerStatus {
  const explicit = asString(raw?.status);
  if (explicit) return explicit as CustomerStatus;

  const purchases = asNumber(raw?.purchases_count);
  const totalSpent = asNumber(raw?.total_spent);
  const lastPurchaseAt = asString(raw?.last_purchase_at);
  if (!purchases) return "Новый";
  if (purchases >= 10 || totalSpent >= 10_000_000) return "VIP";
  if (purchases >= 4) return "Постоянный";
  if (!lastPurchaseAt) return "Спящий";
  const daysSinceLast = (Date.now() - new Date(lastPurchaseAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceLast > 120) return "Потерянный";
  if (daysSinceLast > 45) return "Спящий";
  return "Постоянный";
}

function normalizeCustomer(raw: any): CustomerReportRow {
  return {
    id: asString(raw?.id ?? raw?.customer_id),
    name: asString(raw?.name ?? raw?.customer_name, "Клиент"),
    phone: asString(raw?.phone ?? raw?.phone_number),
    purchases_count: asNumber(raw?.purchases_count ?? raw?.orders_count),
    total_spent: asNumber(raw?.total_spent ?? raw?.gross_sales),
    average_cheque: asNumber(raw?.average_cheque),
    last_purchase_at: asString(raw?.last_purchase_at ?? raw?.last_order_at),
    purchased_products: pickArray(raw, ["purchased_products", "products"]).map((item: any) => asString(item?.name ?? item)),
    status: deriveCustomerStatus(raw),
  };
}

function normalizeSalaryReport(raw: any): SellerSalaryReport {
  return {
    seller_id: asString(raw?.seller_id ?? raw?.sellerId ?? raw?.id),
    seller_name: asString(raw?.seller_name ?? raw?.sellerName ?? raw?.name, "Продавец"),
    fixed_salary: asNumber(raw?.fixed_salary ?? raw?.fixedSalary),
    salary_percent: asNumber(raw?.salary_percent ?? raw?.salaryPercent),
    calculation_type: asString(raw?.calculation_type ?? raw?.calculationType, "FIXED_PLUS_PROFIT"),
    gross_sales: asNumber(raw?.gross_sales),
    net_gross_sales: asNumber(raw?.net_gross_sales),
    gross_profit: asNumber(raw?.gross_profit),
    bonus_amount: asNumber(raw?.bonus_amount),
    salary_total: asNumber(raw?.salary_total),
    items: pickArray(raw, ["items"]).map((item: any) => ({
      sale_id: asString(item?.sale_id ?? item?.saleId),
      product_name: asString(item?.product_name ?? item?.name, "Товар"),
      final_price: asNumber(item?.final_price),
      supply_price_at_sale: asNumber(item?.supply_price_at_sale),
      profit_at_sale: asNumber(item?.profit_at_sale),
      seller_bonus_amount: asNumber(item?.seller_bonus_amount),
    })),
  };
}

function buildQuery(query: ReportFilterQuery) {
  const params: Record<string, string | number> = {};

  const assign = (key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      const normalized = value.map((item) => String(item).trim()).filter(Boolean).join(",");
      if (normalized) params[key] = normalized;
      return;
    }

    const normalized = String(value).trim();
    if (normalized !== "") {
      params[key] = normalized;
    }
  };

  assign("from", query.from);
  assign("to", query.to);
  assign("date_from", query.dateFrom ?? query.startDate ?? query.from);
  assign("date_to", query.dateTo ?? query.endDate ?? query.to);
  assign("shopId", query.shopId);
  assign("shop_id", query.shopId);
  assign("sellerId", query.sellerId);
  assign("seller_id", query.sellerId);
  assign("categoryId", query.categoryId);
  assign("category_id", query.categoryId);
  assign("productId", query.productId);
  assign("product_id", query.productId);
  assign("brandId", query.brandId);
  assign("brand_id", query.brandId);
  assign("supplierId", query.supplierId);
  assign("supplier_id", query.supplierId);
  assign("page", query.page);
  assign("perPage", query.perPage);
  assign("per_page", query.perPage);
  assign("method", query.method);

  assign("start_date", query.startDate ?? query.from);
  assign("end_date", query.endDate ?? query.to);
  assign("shop_ids", query.shopIds?.length ? query.shopIds : query.shopId ? [query.shopId] : undefined);
  assign("seller_ids", query.sellerIds?.length ? query.sellerIds : query.sellerId ? [query.sellerId] : undefined);
  assign("product_ids", query.productIds?.length ? query.productIds : query.productId ? [query.productId] : undefined);
  assign("category_ids", query.categoryIds?.length ? query.categoryIds : query.categoryId ? [query.categoryId] : undefined);
  assign("supplier_ids", query.supplierIds?.length ? query.supplierIds : query.supplierId ? [query.supplierId] : undefined);
  assign("brand_ids", query.brandIds?.length ? query.brandIds : query.brandId ? [query.brandId] : undefined);
  assign("plot_shop_ids", query.plotShopIds);
  assign("limit", query.limit);
  assign("page_size", query.limit);
  assign("currency", query.currency);
  assign("group_by", query.groupBy);
  assign("field", query.field);
  assign("top_product_field", query.topProductField);
  assign("top_category_field", query.topCategoryField);
  assign("detalization", query.detalization);
  assign("price_type", query.priceType);
  assign("report_date", query.reportDate);
  assign("version", query.version);
  assign("group_without_shop", query.groupWithoutShop);
  assign("group_without_shops", query.groupWithoutShops);
  assign("group_with_supplier", query.groupWithSupplier);
  assign("all_suppliers", query.allSuppliers);
  assign("detalization_by_position", query.detalizationByPosition);
  assign("import_type", query.importType);

  return params;
}

export function useReportsApi() {
  const { apiFetch } = useApi();

  async function request(path: string, query: ReportFilterQuery = {}) {
    return unwrapPayload(await apiFetch(path, { method: "GET", query: buildQuery(query) }));
  }

  async function getSummary(query: ReportFilterQuery = {}) {
    const payload = await request("/reports/summary", query);
    const summary = buildSummary(extractSummaryPayload(payload));
    summary.chart_sales = extractChart(payload, ["chart_sales", "sales_by_day", "sales"]);
    summary.chart_profit = extractChart(payload, ["chart_profit", "profit_by_day", "profits"]);
    return summary;
  }

  async function getShops(query: ReportFilterQuery = {}) {
    const payload = await request("/reports/shops", query);
    return extractRows(payload, ["shops", "items", "data"]).map(normalizeShop);
  }

  async function getShopDetails(shopId: string, query: ReportFilterQuery = {}) {
    const payload = await request(`/reports/shops/${encodeURIComponent(shopId)}`, query);
    return {
      id: asString(payload?.id ?? shopId),
      name: asString(payload?.name ?? payload?.shop_name, "Магазин"),
      summary: getSummaryFromPayload(payload),
      sales_by_day: extractChart(payload, ["sales_by_day", "chart_sales", "sales"]),
      profit_by_day: extractChart(payload, ["profit_by_day", "chart_profit", "profits"]),
      top_products: extractRows(payload, ["top_products", "products"]).map(normalizeProduct),
      sellers: extractRows(payload, ["sellers"]).map(normalizeSeller),
      stock_items: extractRows(payload, ["stock_items", "leftovers", "stock"]).map(normalizeProduct),
    } satisfies ShopReportDetails;
  }

  async function getProducts(query: ReportFilterQuery = {}) {
    const payload = await request("/reports/products", query);
    return extractRows(payload, ["products", "items", "data"]).map(normalizeProduct);
  }

  async function getProductSales(query: ReportFilterQuery = {}) {
    const payload = await request("/product-sales-report", query);
    return {
      value: asNumber(payload?.value),
      product_plot: pickArray(payload, ["product_plot", "plot", "chart"]),
      product_values: extractRows(payload, ["product_values", "products", "items"]).map((row: any, index: number) => ({
        id: asString(row?.id ?? row?.product_id ?? row?.name ?? index),
        name: asString(row?.name, "Товар"),
        value: asNumber(row?.value),
      })),
      other_products_count: asNumber(payload?.other_products_count),
      other_products_value: asNumber(payload?.other_products_value),
    };
  }

  async function getV1ProductsSummary(query: ReportFilterQuery = {}) {
    const payload = await request("/v1/reports/products/summary", query);
    return {
      product_sold: asNumber(payload?.product_sold ?? payload?.sold ?? payload?.sold_count ?? payload?.total_sold),
      product_returned: asNumber(payload?.product_returned ?? payload?.returned ?? payload?.returned_count ?? payload?.total_returned),
      net_gross_sales: asNumber(payload?.net_gross_sales ?? payload?.net_sales ?? payload?.net_revenue ?? payload?.total_net_sales),
      net_gross_profit: asNumber(payload?.net_gross_profit ?? payload?.gross_profit ?? payload?.profit ?? payload?.total_profit),
      count: asNumber(payload?.count ?? payload?.total ?? payload?.products_count),
    };
  }

  async function getV1ProductsSales(query: ReportFilterQuery = {}) {
    const payload = await request("/v1/reports/products/sales", query);
    return {
      rows: extractRows(payload, ["rows", "items", "data", "sales", "products"]).map((row: any, index: number) => ({
        id: asString(row?.id ?? row?.product_id ?? row?.sale_id ?? `${row?.date ?? index}-${index}`),
        date: asString(row?.date ?? row?.sold_at ?? row?.created_at),
        shop_name: asString(row?.shop_name, "Магазин"),
        product_name: asString(row?.product_name ?? row?.name, "Товар"),
        product_sku: asString(row?.product_sku ?? row?.sku),
        product_barcode: asString(row?.product_barcode ?? row?.barcode),
        product_brand_name: asString(row?.product_brand_name ?? row?.brand_name, "Без бренда"),
        sold_measurement_value: asNumber(row?.sold_measurement_value ?? row?.sold_qty ?? row?.quantity),
        returned_measurement_value: asNumber(row?.returned_measurement_value ?? row?.returned_qty ?? row?.returns_count),
        net_sales: asNumber(row?.net_sales ?? row?.net_revenue ?? row?.revenue),
        net_profit: asNumber(row?.net_profit ?? row?.gross_profit ?? row?.profit),
      })),
      count: asNumber(payload?.count ?? payload?.total),
    };
  }

  async function getV1ProductSalesReport(query: ReportFilterQuery = {}) {
    const payload = await request("/v1/product-sales-report", {
      field: "net_sales",
      groupBy: "name",
      ...query,
    });

    return {
      value: asNumber(payload?.value ?? payload?.total ?? payload?.net_sales),
      product_plot: pickArray(payload, ["product_plot", "plot", "chart", "points"]),
      product_values: extractRows(payload, ["product_values", "products", "items", "data"]).map((row: any, index: number) => ({
        id: asString(row?.id ?? row?.product_id ?? row?.name ?? index),
        name: asString(row?.name ?? row?.product_name, "Товар"),
        value: asNumber(row?.value ?? row?.net_sales ?? row?.net_revenue),
      })),
      other_products_count: asNumber(payload?.other_products_count),
      other_products_value: asNumber(payload?.other_products_value),
    };
  }

  async function getV1ProductsSummaryResolved(query: ReportFilterQuery = {}) {
    const payload = await request("/v1/reports/products/summary", query);

    const normalizeRow = (row: any, index: number) => ({
      id: asString(row?.id ?? row?.product_id ?? index),
      product_id: asString(row?.product_id ?? row?.id ?? index),
      product_name: asString(row?.product_name ?? row?.name, "Товар"),
      product_sku: asString(row?.sku ?? row?.product_sku),
      product_barcode: asString(row?.barcode ?? row?.product_barcode),
      product_brand_name: asString(row?.brand ?? row?.brand_name, "Без бренда"),
      category: asString(row?.category),
      sold_measurement_value: asNumber(row?.quantity_sold ?? row?.sold_quantity),
      returned_measurement_value: asNumber(row?.returns ?? row?.returned_quantity),
      gross_sales: asNumber(row?.gross_sales ?? row?.revenue),
      net_sales: asNumber(row?.net_gross_sales ?? row?.net_sales ?? row?.value),
      net_profit: asNumber(row?.gross_profit ?? row?.net_profit),
      sold_cost_price: asNumber(row?.sold_cost_price ?? row?.supply_cost),
      average_discount: asNumber(row?.average_discount),
      margin_percent: asNumber(row?.margin_percent),
      stock_left: asNumber(row?.stock_left),
    });

    return {
      count: asNumber(payload?.count ?? payload?.total ?? payload?.products_count),
      products: extractRows(payload, ["products"]).map(normalizeRow),
      top_selling_products: extractRows(payload, ["top_selling_products"]).map(normalizeRow),
      most_profitable_products: extractRows(payload, ["most_profitable_products"]).map(normalizeRow),
      low_margin_products: extractRows(payload, ["low_margin_products"]).map(normalizeRow),
      biggest_discount_products: extractRows(payload, ["biggest_discount_products"]).map(normalizeRow),
      slow_moving_products: extractRows(payload, ["slow_moving_products"]).map(normalizeRow),
      low_stock_products: extractRows(payload, ["low_stock_products"]).map(normalizeRow),
    };
  }

  async function getV1ProductsSalesResolved(query: ReportFilterQuery = {}) {
    const payload = await request("/v1/reports/products/sales", query);
    return {
      summary: {
        gross_sales: asNumber(payload?.summary?.gross_sales),
        net_gross_sales: asNumber(payload?.summary?.net_gross_sales),
        gross_profit: asNumber(payload?.summary?.gross_profit),
        average_cheque: asNumber(payload?.summary?.average_cheque),
        transactions_count: asNumber(payload?.summary?.transactions_count),
        products_sold: asNumber(payload?.summary?.products_sold),
        discount_sum: asNumber(payload?.summary?.discount_sum),
        discount_percent: asNumber(payload?.summary?.discount_percent),
        average_extra_charge: asNumber(payload?.summary?.average_extra_charge),
        returns_count: asNumber(payload?.summary?.returns_count),
        exchanges_count: asNumber(payload?.summary?.exchanges_count),
      },
      rows: extractRows(payload, ["items", "rows", "data", "sales", "products"]).map((row: any, index: number) => ({
        id: asString(row?.id ?? row?.product_id ?? row?.sale_id ?? index),
        date: asString(row?.date ?? row?.sold_at ?? row?.created_at),
        shop_name: asString(row?.shop_name, "Магазин"),
        product_name: asString(row?.product_name ?? row?.name, "Товар"),
        product_sku: asString(row?.sku ?? row?.product_sku),
        product_barcode: asString(row?.barcode ?? row?.product_barcode),
        product_brand_name: asString(row?.brand ?? row?.brand_name, "Без бренда"),
        category: asString(row?.category),
        sold_measurement_value: asNumber(row?.sold_quantity ?? row?.quantity ?? row?.sold_measurement_value),
        returned_measurement_value: asNumber(row?.returned_quantity ?? row?.returns_count ?? row?.returned_measurement_value),
        stock_left: asNumber(row?.stock_left),
        gross_sales: asNumber(row?.revenue ?? row?.gross_sales),
        net_sales: asNumber(row?.net_gross_sales ?? row?.net_sales),
        supply_cost: asNumber(row?.supply_cost ?? row?.sold_cost_price),
        net_profit: asNumber(row?.gross_profit ?? row?.net_profit),
        margin_percent: asNumber(row?.margin_percent),
        average_discount: asNumber(row?.average_discount),
        average_price: asNumber(row?.average_price),
      })),
      top_selling_products: extractRows(payload, ["top_selling_products"]).map((row: any, index: number) => ({
        id: asString(row?.product_id ?? row?.id ?? index),
        product_name: asString(row?.product_name ?? row?.name, "Товар"),
        product_sku: asString(row?.sku),
        product_barcode: asString(row?.barcode),
        product_brand_name: asString(row?.brand, "Без бренда"),
        sold_measurement_value: asNumber(row?.sold_quantity),
        returned_measurement_value: asNumber(row?.returned_quantity),
        stock_left: asNumber(row?.stock_left),
        gross_sales: asNumber(row?.revenue),
        net_sales: asNumber(row?.net_gross_sales),
        supply_cost: asNumber(row?.supply_cost),
        net_profit: asNumber(row?.gross_profit),
      })),
      count: asNumber(payload?.count ?? payload?.total),
    };
  }

  async function getV1ProductSalesReportResolved(query: ReportFilterQuery = {}) {
    const payload = await request("/v1/product-sales-report", {
      field: "net_sales",
      groupBy: "name",
      ...query,
    });

    return {
      value: asNumber(payload?.value ?? payload?.total ?? payload?.net_sales),
      product_plot: pickArray(payload, ["product_plot", "plot", "chart", "points"]).map((row: any, index: number) => {
        if (typeof row === "number") {
          return { label: String(index + 1), value: row };
        }

        const dynamicEntry = Object.entries(row || {}).find(([key]) => !["start_date", "date", "label"].includes(key));
        return {
          label: asString(row?.start_date ?? row?.date ?? row?.label, String(index + 1)),
          value: asNumber(dynamicEntry?.[1]),
          name: asString(dynamicEntry?.[0]),
        };
      }),
      product_values: extractRows(payload, ["product_values", "products", "items", "data"]).map((row: any, index: number) => ({
        id: asString(row?.id ?? row?.product_id ?? row?.name ?? index),
        name: asString(row?.name ?? row?.product_name, "Товар"),
        value: asNumber(row?.value ?? row?.net_sales ?? row?.net_revenue),
      })),
      other_products_count: asNumber(payload?.other_products_count),
      other_products_value: asNumber(payload?.other_products_value),
    };
  }

  async function getProductGeneralReport(query: ReportFilterQuery = {}) {
    const payload = await request("/product-general-report", query);
    return {
      product_sold: asNumber(payload?.product_sold),
      product_returned: asNumber(payload?.product_returned),
      net_gross_sales: asNumber(payload?.net_gross_sales),
      net_gross_profit: asNumber(payload?.net_gross_profit),
      products_left: asNumber(payload?.products_left),
      products_left_supply_price: asNumber(payload?.products_left_supply_price),
      products_left_retail_price: asNumber(payload?.products_left_retail_price),
      count: asNumber(payload?.count),
    };
  }

  async function getProductGeneralTable(query: ReportFilterQuery = {}) {
    const payload = await request("/product-general-table", query);
    return {
      rows: extractRows(payload, ["products_stats_by_date", "items", "data"]).map((row: any, index: number) => ({
        id: asString(row?.product_id ?? row?.order_id ?? row?.movement_id ?? `${row?.date ?? index}-${index}`),
        date: asString(row?.date),
        shop_name: asString(row?.shop_name, "Магазин"),
        product_name: asString(row?.product_name, "Товар"),
        product_sku: asString(row?.product_sku),
        product_barcode: asString(row?.product_barcode),
        product_brand_name: asString(row?.product_brand_name, "Без бренда"),
        supplier_name: asString(row?.product_suppliers),
        sold_measurement_value: asNumber(row?.sold_measurement_value),
        returned_measurement_value: asNumber(row?.returned_measurement_value),
        net_sold_measurement_value: asNumber(row?.net_sold_measurement_value),
        gross_sales: asNumber(row?.gross_sales),
        net_sales: asNumber(row?.net_sales),
        net_profit: asNumber(row?.net_profit),
        sold_supply_sum: asNumber(row?.sold_supply_sum),
        average_margin: asNumber(row?.average_margin),
        discount: asNumber(row?.discount),
        sold_with_discount: asNumber(row?.sold_with_discount),
        left_end_date: asNumber(row?.left_end_date),
      })),
      totals: payload?.products_stats_total ?? {},
      count: asNumber(payload?.count),
    };
  }

  async function getProductEffectiveness(query: ReportFilterQuery = {}) {
    const payload = await request("/product-performance-report", query);
    return {
      rows: extractRows(payload, ["products", "items", "data"]).map((row: any, index: number) => ({
        id: asString(row?.id ?? row?.product_id ?? row?.product_field ?? index),
        product_field: asString(row?.product_field, "Товар"),
        main_image_url: asString(row?.main_image_url),
        net_sales: asNumber(row?.net_sales),
        net_profit: asNumber(row?.net_profit),
        total_sold_measurement_value: asNumber(row?.total_sold_measurement_value),
        total_returned_measurement_value: asNumber(row?.total_returned_measurement_value),
      })),
      other_products_count: asNumber(payload?.other_products_count),
      other_products_performance: payload?.other_products_performance ?? null,
    };
  }

  async function getV1ProductEffectiveness(query: ReportFilterQuery = {}) {
    const payload = await request("/v1/reports/products/effectiveness", query);
    const sourceRows = extractRows(payload, ["items", "rows", "data", "products", "table_data"]);

    return {
      summary: payload?.summary ?? null,
      count: asNumber(payload?.count ?? payload?.total ?? sourceRows.length),
      rows: sourceRows.map((row: any, index: number) => {
        const normalized = { ...(row || {}) } as Record<string, any>;
        normalized.id = asString(
          row?.id
            ?? row?.product_id
            ?? row?.sku
            ?? row?.bar_code
            ?? row?.barcode
            ?? row?.name
            ?? index,
        );
        normalized.shop_name = asString(row?.shop_name ?? row?.branch_name ?? row?.shop, normalized.shop_name ?? "Магазин");
        normalized.name = asString(row?.name ?? row?.product_name ?? row?.product_field, normalized.name ?? "Товар");
        normalized.sku = asString(row?.sku ?? row?.product_sku, normalized.sku ?? "");
        normalized.bar_code = asString(row?.bar_code ?? row?.barcode ?? row?.product_barcode, normalized.bar_code ?? "");
        normalized.category_name = asString(
          row?.category_name ?? row?.category ?? row?.group_name,
          normalized.category_name ?? "",
        );
        normalized.brand_name = asString(row?.brand_name ?? row?.brand, normalized.brand_name ?? "");
        normalized.supplier_name = asString(
          row?.supplier_name ?? row?.product_suppliers ?? row?.supplier,
          normalized.supplier_name ?? "",
        );
        return normalized;
      }),
    };
  }

  async function getProductPerformanceTable(query: ReportFilterQuery = {}) {
    const payload = await request("/report-product-performance-table", query);
    return {
      rows: extractRows(payload, ["table_data", "items", "data"]).map((row: any, index: number) => ({
        id: asString(row?.product_id ?? row?.name ?? index),
        shop_name: asString(row?.shop_name, "Магазин"),
        name: asString(row?.name, "Товар"),
        sku: asString(row?.sku),
        bar_code: asString(row?.bar_code),
        brand_name: asString(row?.brand_name, "Без бренда"),
        supplier_name: asString(row?.supplier_name),
        stock_amount_begin: asNumber(row?.stock_amount_begin),
        stock_amount_end: asNumber(row?.stock_amount_end),
        import_amount: asNumber(row?.import_amount),
        sold_amount: asNumber(row?.sold_amount),
        returned_amount: asNumber(row?.returned_amount),
        write_off_amount: asNumber(row?.write_off_amount),
        qty_sellout: asNumber(row?.qty_sellout),
        sellout_by_days: asNumber(row?.sellout_by_days),
      })),
      count: asNumber(payload?.count),
      grouping_fields: asString(payload?.grouping_fields),
      group_without_shop: Boolean(payload?.group_without_shop),
      group_with_supplier: Boolean(payload?.group_with_supplier),
    };
  }

  async function getProductPerformanceTotals(query: ReportFilterQuery = {}) {
    const payload = await request("/report-product-performance-totals", query);
    return {
      totals: payload?.table_data ?? {},
      count: asNumber(payload?.count),
    };
  }

  async function getImportReportTable(query: ReportFilterQuery = {}) {
    const payload = await request("/import-report-table", query);
    return {
      rows: extractRows(payload, ["rows", "items", "data"]).map((row: any, index: number) => ({
        id: asString(row?.import_id ?? row?.product_id ?? row?.external_import_id ?? index),
        shop_name: asString(row?.shop_name, "Магазин"),
        import_name: asString(row?.import_name, "Импорт"),
        supplier_name: asString(row?.supplier_name),
        import_type: asString(row?.import_type ?? row?.type),
        date: asString(row?.date),
        product_name: asString(row?.product_name, "Товар"),
        product_sku: asString(row?.product_sku),
        imported_qty: asNumber(row?.imported_qty),
        imported_supply_sum: asNumber(row?.imported_supply_sum),
        sold_qty: asNumber(row?.sold_qty),
        sold_sale_sum: asNumber(row?.sold_sale_sum),
        left_qty: asNumber(row?.left_qty),
        outcome: asNumber(row?.outcome),
      })),
      count: asNumber(payload?.count),
    };
  }

  async function getV1ImportReportTable(query: ReportFilterQuery = {}) {
    const payload = await request("/v1/import-report-table", query);
    const sourceRows = extractRows(payload, ["rows", "items", "data", "table_data", "imports"]);

    return {
      summary: payload?.summary ?? null,
      count: asNumber(payload?.count ?? payload?.total ?? sourceRows.length),
      rows: sourceRows.map((row: any, index: number) => {
        const normalized = { ...(row || {}) } as Record<string, any>;
        normalized.id = asString(
          row?.id
            ?? row?.import_id
            ?? row?.external_import_id
            ?? row?.product_id
            ?? row?.document_number
            ?? index,
        );
        normalized.date = asString(row?.date ?? row?.created_at ?? row?.imported_at, normalized.date ?? "");
        normalized.shop_name = asString(row?.shop_name ?? row?.branch_name ?? row?.shop, normalized.shop_name ?? "Магазин");
        normalized.import_type = asString(row?.import_type ?? row?.type, normalized.import_type ?? "");
        normalized.import_number = asString(
          row?.import_number ?? row?.document_number ?? row?.external_import_id ?? row?.import_id,
          normalized.import_number ?? "",
        );
        normalized.product_name = asString(row?.product_name ?? row?.name, normalized.product_name ?? "Товар");
        normalized.product_barcode = asString(row?.product_barcode ?? row?.barcode ?? row?.bar_code, normalized.product_barcode ?? "");
        normalized.product_sku = asString(row?.product_sku ?? row?.sku, normalized.product_sku ?? "");
        normalized.category_name = asString(row?.category_name ?? row?.category, normalized.category_name ?? "");
        normalized.brand_name = asString(row?.brand_name ?? row?.brand, normalized.brand_name ?? "");
        normalized.supplier_name = asString(
          row?.supplier_name ?? row?.product_suppliers ?? row?.supplier,
          normalized.supplier_name ?? "",
        );
        return normalized;
      }),
    };
  }

  async function getImportReportTotals(query: ReportFilterQuery = {}) {
    const payload = await request("/import-report-totals", query);
    return payload ?? {};
  }

  async function getV1ImportReportTotals(query: ReportFilterQuery = {}) {
    const payload = await request("/v1/import-report-totals", query);
    return payload ?? {};
  }

  async function getProductSuppliersTable(query: ReportFilterQuery = {}) {
    const payload = await request("/product-sells-by-suppliers-table", query);
    return {
      rows: extractRows(payload, ["products_stats_by_date", "items", "data"]).map((row: any, index: number) => ({
        id: asString(row?.product_id ?? row?.supplier_id ?? `${row?.date ?? index}-${index}`),
        date: asString(row?.date),
        shop_name: asString(row?.shop_name, "Магазин"),
        product_name: asString(row?.product_name, "Товар"),
        product_sku: asString(row?.product_sku),
        product_brand_name: asString(row?.product_brand_name, "Без бренда"),
        product_suppliers: asString(row?.product_suppliers, "Без поставщика"),
        sold_measurement_value: asNumber(row?.sold_measurement_value),
        net_sales: asNumber(row?.net_sales),
        net_profit: asNumber(row?.net_profit),
        sold_supply_sum: asNumber(row?.sold_supply_sum),
        average_margin: asNumber(row?.average_margin),
        discount: asNumber(row?.discount),
        left_end_date: asNumber(row?.left_end_date),
      })),
      totals: payload?.products_stats_total ?? {},
      count: asNumber(payload?.count),
    };
  }

  async function getProductStocks(query: ReportFilterQuery = {}) {
    const payload = await request("/stock-report-table", query);
    return {
      rows: extractRows(payload, ["rows", "items", "data"]).map((row: any, index: number) => ({
        id: asString(row?.product_id ?? row?.supplier_id ?? index),
        shop_name: asString(row?.shop_name, "Магазин"),
        product_name: asString(row?.product_name, "Товар"),
        product_sku: asString(row?.product_sku),
        product_barcode: asString(row?.product_barcode),
        supplier_name: asString(row?.supplier_name),
        supply_price: asNumber(row?.supply_price),
        retail_price: asNumber(row?.retail_price),
        measurement_value: asNumber(row?.measurement_value),
        last_import: asString(row?.last_import),
        estimated_income: asNumber(row?.estimated_income),
        estimated_margin: asNumber(row?.estimated_margin),
      })),
      count: asNumber(payload?.count),
    };
  }

  async function getProductAbcAnalysis(query: ReportFilterQuery = {}) {
    const payload = await request("/reports/products/abc-analysis", query);
    return {
      summary: extractSummaryPayload(payload),
      rows: extractRows(payload, ["products", "items", "data"]).map(normalizeProduct),
      totals: payload?.totals ?? {},
    };
  }

  async function getSellers(query: ReportFilterQuery = {}) {
    const payload = await request("/reports/sellers", query);
    return extractRows(payload, ["sellers", "items", "data"]).map(normalizeSeller);
  }

  async function getSellerSales(sellerId: string, query: ReportFilterQuery = {}) {
    const payload = await request(`/reports/seller-sales/${encodeURIComponent(sellerId)}`, query);
    return extractRows(payload, ["sales", "items", "data"]);
  }

  async function getSellerDetails(sellerId: string, query: ReportFilterQuery = {}) {
    const payload = await request(`/reports/sellers/${encodeURIComponent(sellerId)}`, query);
    return {
      id: asString(payload?.id ?? sellerId),
      name: asString(payload?.name ?? payload?.seller_name, "Продавец"),
      shop_name: asString(payload?.shop_name ?? payload?.branch_name, "Не указан"),
      summary: getSummaryFromPayload(payload),
      sales_by_day: extractChart(payload, ["sales_by_day", "chart_sales", "sales"]),
      profit_by_day: extractChart(payload, ["profit_by_day", "chart_profit", "profits"]),
      sold_products: extractRows(payload, ["sold_products", "products", "items"]).map(normalizeProduct),
      salary_report: payload?.salary_report ? normalizeSalaryReport(payload.salary_report) : null,
    } satisfies SellerReportDetails;
  }

  async function getCustomers(query: ReportFilterQuery = {}) {
    const payload = await request("/reports/customers", query);
    return extractRows(payload, ["customers", "items", "data"]).map(normalizeCustomer);
  }

  async function getGeneralReport(query: ReportFilterQuery = {}) {
    const payload = await request("/general-report", query);
    return {
      summary: buildSummary(payload),
      shop_stats: extractRows(payload, ["shop_stats", "shops", "items"]).map(normalizeShop),
    };
  }

  async function getGeneralReportTable(query: ReportFilterQuery = {}): Promise<GeneralReportTableResult> {
    const payload = await request("/general-report-table", query);
    const rows = extractRows(payload, ["shop_stats_by_date", "items", "data"]).map((row: any, index: number) =>
      normalizeGeneralReportTableRow(row, index),
    );

    return {
      rows,
      count: asNumber(payload?.count ?? payload?.total ?? rows.length),
    };
  }

  async function getGeneralSalesReport(query: ReportFilterQuery = {}): Promise<GeneralSalesReportResult> {
    const payload = await request("/general-sales-report", query);
    return {
      value: asNumber(payload?.value),
      shop_stats: extractRows(payload, ["shop_stats", "shops", "items"]).map(normalizeShop),
      shop_plot: extractChart(payload, ["shop_plot", "plot", "chart"]),
    };
  }

  async function getGeneralProductReport(query: ReportFilterQuery = {}): Promise<GeneralProductReportResult> {
    const payload = await request("/general-product-report", query);
    return {
      value: asNumber(payload?.value),
      shop_stats: extractRows(payload, ["shop_stats", "shops", "items"]).map(normalizeShop),
      shop_plot: extractChart(payload, ["shop_plot", "plot", "chart"]),
      top_products: extractRows(payload, ["top_products", "products", "items"]).map(normalizeProduct),
      top_categories: extractRows(payload, ["top_categories", "categories", "items"]).map(normalizeGeneralCategory),
    };
  }

  async function getGeneralSellerReport(query: ReportFilterQuery = {}): Promise<GeneralSellerReportResult> {
    const payload = await request("/general-seller-report", query);
    return {
      top_sellers: extractRows(payload, ["top_sellers", "sellers", "items"]).map(normalizeGeneralSeller),
      count_others: asNumber(payload?.count_others),
      other_sellers: extractRows(payload, ["other_sellers"]).map(normalizeGeneralSeller),
    };
  }

  async function getGeneralCustomerReport(query: ReportFilterQuery = {}): Promise<GeneralCustomerReportResult> {
    const payload = await request("/general-customer-report", query);
    return {
      shop_plot: extractChart(payload, ["shop_plot", "plot", "chart"]),
      shop_stats: extractRows(payload, ["shop_stats", "shops", "items"]).map(normalizeGeneralCustomerStat),
      new_count: asNumber(payload?.new_count),
      returned_count: asNumber(payload?.returned_count),
      top_client: normalizeTopCustomerEntity(payload?.top_client),
      top_transaction: normalizeTopCustomerEntity(payload?.top_transaction),
    };
  }

  function getSummaryFromPayload(payload: any) {
    const summary = buildSummary(extractSummaryPayload(payload));
    summary.chart_sales = extractChart(payload, ["chart_sales", "sales_by_day", "sales"]);
    summary.chart_profit = extractChart(payload, ["chart_profit", "profit_by_day", "profits"]);
    return summary;
  }

  return {
    getSummary,
    getShops,
    getShopDetails,
    getProducts,
    getProductSales,
    getV1ProductsSummary,
    getV1ProductsSales,
    getV1ProductSalesReport,
    getV1ProductsSummaryResolved,
    getV1ProductsSalesResolved,
    getV1ProductSalesReportResolved,
    getProductGeneralReport,
    getProductGeneralTable,
    getProductEffectiveness,
    getV1ProductEffectiveness,
    getProductPerformanceTable,
    getProductPerformanceTotals,
    getImportReportTable,
    getV1ImportReportTable,
    getImportReportTotals,
    getV1ImportReportTotals,
    getProductSuppliersTable,
    getProductStocks,
    getProductAbcAnalysis,
    getSellers,
    getSellerSales,
    getSellerDetails,
    getCustomers,
    getGeneralReport,
    getGeneralReportTable,
    getGeneralSalesReport,
    getGeneralProductReport,
    getGeneralSellerReport,
    getGeneralCustomerReport,
  };
}
