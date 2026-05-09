import { useApi } from "~/composables/useApi";
import type { ReportFilterQuery, SellerSalaryReport } from "~/composables/useReportsApi";

export type SalaryCalculationType =
  | "FIXED_ONLY"
  | "PROFIT_PERCENT_ONLY"
  | "REVENUE_PERCENT_ONLY"
  | "FIXED_PLUS_PROFIT"
  | "FIXED_PLUS_REVENUE";

export type SellerSalarySettings = {
  fixedSalary: number;
  salaryPercent: number;
  calculationType: SalaryCalculationType;
  bonusEnabled: boolean;
  isActive: boolean;
};

function asNumber(value: unknown, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function asString(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

function normalizeSalarySettings(raw: any): SellerSalarySettings {
  return {
    fixedSalary: asNumber(raw?.fixedSalary ?? raw?.fixed_salary),
    salaryPercent: asNumber(raw?.salaryPercent ?? raw?.salary_percent),
    calculationType: asString(raw?.calculationType ?? raw?.calculation_type, "FIXED_PLUS_PROFIT") as SalaryCalculationType,
    bonusEnabled: Boolean(raw?.bonusEnabled ?? raw?.bonus_enabled ?? true),
    isActive: Boolean(raw?.isActive ?? raw?.is_active ?? true),
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
    items: Array.isArray(raw?.items)
      ? raw.items.map((item: any) => ({
          sale_id: asString(item?.sale_id ?? item?.saleId),
          product_name: asString(item?.product_name ?? item?.name, "Товар"),
          final_price: asNumber(item?.final_price),
          supply_price_at_sale: asNumber(item?.supply_price_at_sale),
          profit_at_sale: asNumber(item?.profit_at_sale),
          seller_bonus_amount: asNumber(item?.seller_bonus_amount),
        }))
      : [],
  };
}

function buildQuery(query: ReportFilterQuery) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== ""),
  );
}

export const SALARY_TYPE_OPTIONS = [
  { label: "Только фикс", value: "FIXED_ONLY" as SalaryCalculationType },
  { label: "Только % от прибыли", value: "PROFIT_PERCENT_ONLY" as SalaryCalculationType },
  { label: "Только % от выручки", value: "REVENUE_PERCENT_ONLY" as SalaryCalculationType },
  { label: "Фикс + % от прибыли", value: "FIXED_PLUS_PROFIT" as SalaryCalculationType },
  { label: "Фикс + % от выручки", value: "FIXED_PLUS_REVENUE" as SalaryCalculationType },
];

export function salaryTypeLabel(type: string) {
  return SALARY_TYPE_OPTIONS.find((item) => item.value === type)?.label || type;
}

export function useSalarySettingsApi() {
  const { apiFetch } = useApi();

  async function getSalarySettings(sellerId: string) {
    const response: any = await apiFetch(`/sellers/${encodeURIComponent(sellerId)}/salary-settings`, { method: "GET" });
    return normalizeSalarySettings(response?.data ?? response);
  }

  async function updateSalarySettings(sellerId: string, payload: SellerSalarySettings) {
    const response: any = await apiFetch(`/sellers/${encodeURIComponent(sellerId)}/salary-settings`, {
      method: "PUT",
      body: payload,
    });
    return normalizeSalarySettings(response?.data ?? response);
  }

  async function getSalaryReport(sellerId: string, query: ReportFilterQuery = {}) {
    const response: any = await apiFetch(`/sellers/${encodeURIComponent(sellerId)}/salary-report`, {
      method: "GET",
      query: buildQuery(query),
    });
    return normalizeSalaryReport(response?.data ?? response);
  }

  return {
    getSalarySettings,
    updateSalarySettings,
    getSalaryReport,
  };
}
