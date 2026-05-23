import { useApi } from "~/composables/useApi";

export type ReportFilterQuery = {
  from?: string;
  to?: string;
  shopId?: string;
  shopIds?: string[];
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
  assign("shopId", query.shopId);
  assign("sellerId", query.sellerId);
  assign("categoryId", query.categoryId);
  assign("productId", query.productId);
  assign("brandId", query.brandId);
  assign("supplierId", query.supplierId);
  assign("page", query.page);
  assign("perPage", query.perPage);
  assign("method", query.method);

  assign("start_date", query.startDate);
  assign("end_date", query.endDate);
  assign("shop_ids", query.shopIds);
  assign("plot_shop_ids", query.plotShopIds);
  assign("limit", query.limit);
  assign("currency", query.currency);
  assign("group_by", query.groupBy);
  assign("field", query.field);
  assign("top_product_field", query.topProductField);
  assign("top_category_field", query.topCategoryField);
  assign("detalization", query.detalization);
  assign("price_type", query.priceType);

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
    const payload = await request("/reports/products/sales", query);
    return extractRows(payload, ["products", "items", "data"]).map(normalizeProduct);
  }

  async function getProductEffectiveness(query: ReportFilterQuery = {}) {
    const payload = await request("/reports/products/effectiveness", query);
    return extractRows(payload, ["products", "items", "data"]).map(normalizeProduct);
  }

  async function getProductStocks(query: ReportFilterQuery = {}) {
    const payload = await request("/reports/products/stocks", query);
    return extractRows(payload, ["products", "items", "data"]).map(normalizeProduct);
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
    getProductEffectiveness,
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
