import { computed } from "vue";
import { useApi } from "~/composables/useApi";
import { useUserStore } from "~/store/useUserStore";
import { formatUzPhoneDisplay } from "~/utils/phone";

export type PlatformStatus = "active" | "inactive" | "blocked";
export type PlatformSubscriptionStatus = "active" | "expired" | "cancelled";
export type PlatformPlanStatus = "active" | "inactive";
export type PlatformPaymentMethod = "cash" | "card" | "click" | "payme" | "bank" | "other";

export interface PlatformCompany {
  id: string;
  companyId: string;
  name: string;
  login: string;
  subdomain: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  status: PlatformStatus;
  blockReason: string;
  createdAt: string;
  updatedAt: string;
  shopsCount: number;
  usersCount: number;
  shops: PlatformShop[];
  subscription: PlatformSubscription | null;
  subscriptions: PlatformSubscription[];
}

export interface PlatformShop {
  id: string;
  shopId: string;
  name: string;
  companyId: string;
  companyName: string;
  branchCode: string;
  status: PlatformStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformPlan {
  id: string;
  name: string;
  priceMonthly: number;
  maxShops: number;
  maxUsers: number;
  maxProducts: number;
  status: PlatformPlanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformSubscription {
  id: string;
  companyId: string;
  planId: string;
  status: PlatformSubscriptionStatus;
  startDate: string;
  endDate: string;
  companyName: string;
  companyStatus: PlatformStatus;
  planName: string;
  plan: PlatformPlan | null;
  company: Partial<PlatformCompany> | null;
}

export interface PlatformProduct {
  id: string;
  name: string;
  price: number;
  barcode: string;
  category: string;
  status: string;
  createdAt: string;
}

export interface PlatformPayment {
  id: string;
  companyId: string;
  subscriptionId: string;
  companyName: string;
  amount: number;
  method: PlatformPaymentMethod;
  paidAt: string;
  periodStart: string;
  periodEnd: string;
  period: string;
  createdById: string;
  createdByName: string;
  comment: string;
  company: Partial<PlatformCompany> | null;
  subscription: Partial<PlatformSubscription> | null;
}

export interface PlatformUser {
  id: string;
  userType: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string;
  roleId: string;
  crmRoleId: string;
  roleName: string;
  role: string;
  status: PlatformStatus;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  birthDate: string;
  companyId: string;
  companyName: string;
  currentShopId: string;
  currentShopName: string;
  allowedShopIds: string[];
  canSwitchShops: boolean;
}

export interface PlatformRole {
  id: string;
  name: string;
  description: string;
  isAdmin: boolean;
  type: number;
  companyId: string;
}

export interface PlatformDashboardStats {
  totalCompanies: number;
  activeCompanies: number;
  blockedCompanies: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  expiringSoonSubscriptions: number;
  monthlyRevenue: number;
  totalShops: number;
  totalUsers: number;
  totalSales: number;
}

export interface PlatformUserPayload {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  email?: string;
  password?: string;
  crm_role_id?: string;
  birth_date?: string;
  company_id?: string;
  current_shop_id?: string;
  allowed_shop_ids?: string[];
  can_switch_shops?: boolean;
  is_active?: boolean;
}

export interface PlatformCompanyCreatePayload {
  login: string;
  name: string;
  subdomain: string;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  plan_id: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
}

export interface PlatformCompanyUpdatePayload {
  name?: string;
  login?: string;
  subdomain?: string;
  is_active?: boolean;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  status?: PlatformStatus;
}

export interface PlatformPlanPayload {
  name?: string;
  price_monthly?: number;
  max_shops?: number;
  max_users?: number;
  max_products?: number;
  status?: PlatformPlanStatus;
}

export interface PlatformPaymentPayload {
  subscription_id: string;
  amount: number;
  method: PlatformPaymentMethod;
  paid_at?: string;
  comment?: string;
}

export interface PlatformShopPayload {
  name?: string;
  branch_code?: string;
  is_active?: boolean;
}

function pickArray<T = any>(input: any, keys: string[]): T[] {
  if (Array.isArray(input)) return input;
  for (const key of keys) {
    if (Array.isArray(input?.[key])) return input[key];
    if (Array.isArray(input?.data?.[key])) return input.data[key];
  }
  if (Array.isArray(input?.data)) return input.data;
  return [];
}

function pickObject<T = any>(input: any, keys: string[]): T | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  for (const key of keys) {
    if (input?.[key] && typeof input[key] === "object") return input[key];
    if (input?.data?.[key] && typeof input.data[key] === "object") return input.data[key];
  }
  return (input?.data && typeof input.data === "object" && !Array.isArray(input.data) ? input.data : input) as T;
}

function pickValue<T = any>(input: any, keys: string[], fallback?: T): T | undefined {
  for (const key of keys) {
    if (input?.[key] !== undefined && input[key] !== null) return input[key] as T;
    if (input?.data?.[key] !== undefined && input.data[key] !== null) return input.data[key] as T;
  }
  return fallback;
}

function toDate(value: any): string {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized.slice(0, 10) : "";
}

function toNumber(value: any): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toBoolean(value: any, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  return !["false", "0", "inactive", "disabled", "blocked", "archived"].includes(normalized);
}

function toStatus(value: any): PlatformStatus {
  if (typeof value === "boolean") return value ? "active" : "blocked";
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["inactive", "disabled"].includes(normalized)) return "inactive";
  if (["blocked", "archived", "false", "0"].includes(normalized)) return "blocked";
  return "active";
}

function toPlanStatus(value: any): PlatformPlanStatus {
  return toBoolean(value, true) ? "active" : "inactive";
}

function toSubscriptionStatus(value: any): PlatformSubscriptionStatus {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "cancelled") return "cancelled";
  if (normalized === "expired") return "expired";
  return "active";
}

function roleDisplay(role: any): string {
  const normalized = String(role ?? "").trim();
  const labels: Record<string, string> = {
    platform_admin: "Администратор платформы",
    superadmin: "Superadmin",
    company_owner: "Основатель",
    company_admin: "Управляющий",
    seller: "Продавец",
    support: "Поддержка",
  };
  return labels[normalized] || normalized;
}

function normalizeSlug(value: any): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePlan(raw: any): PlatformPlan {
  return {
    id: String(pickValue(raw, ["id", "_id"]) ?? ""),
    name: String(pickValue(raw, ["name"]) ?? ""),
    priceMonthly: toNumber(pickValue(raw, ["priceMonthly", "price_monthly", "price"])),
    maxShops: toNumber(pickValue(raw, ["maxShops", "max_shops", "shopLimit"])),
    maxUsers: toNumber(pickValue(raw, ["maxUsers", "max_users", "employeeLimit"])),
    maxProducts: toNumber(pickValue(raw, ["maxProducts", "max_products", "productLimit"])),
    status: toPlanStatus(pickValue(raw, ["status", "is_active"])),
    createdAt: toDate(pickValue(raw, ["created_at", "createdAt"])),
    updatedAt: toDate(pickValue(raw, ["updated_at", "updatedAt"])),
  };
}

function normalizeShop(raw: any, company?: Partial<PlatformCompany>): PlatformShop {
  const nestedShop = pickObject(raw?.shop, ["shop", "data"]) ?? raw?.shop ?? null;
  const companyInfo = pickObject(raw?.company, ["company", "data"]) ?? company ?? null;
  return {
    id: String(pickValue(raw, ["id", "shop_id"]) ?? pickValue(nestedShop, ["id", "shop_id"]) ?? ""),
    shopId: String(pickValue(raw, ["shop_id", "id"]) ?? pickValue(nestedShop, ["shop_id", "id"]) ?? ""),
    name: String(pickValue(raw, ["name", "shop_name"]) ?? pickValue(nestedShop, ["name", "shop_name"]) ?? ""),
    companyId: String(pickValue(raw, ["company_id", "companyId"]) ?? pickValue(companyInfo, ["company_id", "companyId", "id"]) ?? ""),
    companyName: String(pickValue(raw, ["company_name"]) ?? pickValue(companyInfo, ["name", "company_name"]) ?? ""),
    branchCode: String(pickValue(raw, ["branch_code", "branchCode", "code"]) ?? pickValue(nestedShop, ["branch_code", "branchCode", "code"]) ?? ""),
    status: toStatus(pickValue(raw, ["is_active", "isActive", "status"]) ?? pickValue(nestedShop, ["is_active", "isActive", "status"])),
    createdAt: toDate(pickValue(raw, ["created_at", "createdAt"]) ?? pickValue(nestedShop, ["created_at", "createdAt"])),
    updatedAt: toDate(pickValue(raw, ["updated_at", "updatedAt"]) ?? pickValue(nestedShop, ["updated_at", "updatedAt"])),
  };
}

function normalizeProduct(raw: any): PlatformProduct {
  return {
    id: String(pickValue(raw, ["publicId", "public_id", "uuid"]) ?? pickValue(raw, ["id", "product_id"]) ?? ""),
    name: String(pickValue(raw, ["name"]) ?? ""),
    price: toNumber(pickValue(raw, ["price", "sell_price", "selling_price"])),
    barcode: String(pickValue(raw, ["barcode", "bar_code"]) ?? ""),
    category: String(pickValue(raw, ["category", "category_name"]) ?? ""),
    status: String(pickValue(raw, ["status"]) ?? "active"),
    createdAt: toDate(pickValue(raw, ["createdAt", "created_at"])),
  };
}

function normalizeSubscription(raw: any): PlatformSubscription {
  const company = pickObject(raw?.company, ["company", "data"]) ?? raw?.company ?? null;
  const plan = pickObject(raw?.plan, ["plan", "data"]) ?? raw?.plan ?? null;
  return {
    id: String(pickValue(raw, ["id", "subscription_id", "subscriptionId", "_id"]) ?? ""),
    companyId: String(pickValue(raw, ["companyId", "company_id"]) ?? pickValue(company, ["id", "company_id"]) ?? ""),
    planId: String(pickValue(raw, ["planId", "plan_id"]) ?? pickValue(plan, ["id"]) ?? ""),
    status: toSubscriptionStatus(pickValue(raw, ["status"])),
    startDate: toDate(pickValue(raw, ["startDate", "start_date"])),
    endDate: toDate(pickValue(raw, ["endDate", "end_date"])),
    companyName: String(pickValue(company, ["name"]) ?? pickValue(raw, ["companyName", "company_name"]) ?? ""),
    companyStatus: toStatus(pickValue(company, ["status", "is_active"])),
    planName: String(pickValue(plan, ["name"]) ?? pickValue(raw, ["planName", "plan_name"]) ?? ""),
    plan: plan ? normalizePlan(plan) : null,
    company: company ? normalizeCompany(company) : null,
  };
}

function normalizeCompany(raw: any): PlatformCompany {
  const shops = pickArray(raw, ["shops", "data", "items"]).map((shop) => normalizeShop(shop, raw));
  const subscriptions = pickArray(raw, ["subscriptions"]).map(normalizeSubscription);
  const subscriptionRaw = pickObject(raw?.subscription, ["subscription", "data"]) ?? raw?.subscription ?? subscriptions[0] ?? null;
  return {
    id: String(pickValue(raw, ["id", "company_id"]) ?? ""),
    companyId: String(pickValue(raw, ["company_id", "companyId", "id"]) ?? ""),
    name: String(pickValue(raw, ["name", "company_name"]) ?? ""),
    login: String(pickValue(raw, ["login", "company_login"]) ?? ""),
    subdomain: String(pickValue(raw, ["subdomain"]) ?? ""),
    ownerName: String(pickValue(raw, ["ownerName", "owner_name"]) ?? ""),
    ownerPhone: formatUzPhoneDisplay(pickValue(raw, ["ownerPhone", "owner_phone"])) || String(pickValue(raw, ["ownerPhone", "owner_phone"]) ?? ""),
    ownerEmail: String(pickValue(raw, ["ownerEmail", "owner_email"]) ?? ""),
    status: toStatus(pickValue(raw, ["status", "is_active", "isActive"])),
    blockReason: String(pickValue(raw, ["blockReason", "block_reason"]) ?? ""),
    createdAt: toDate(pickValue(raw, ["created_at", "createdAt"])),
    updatedAt: toDate(pickValue(raw, ["updated_at", "updatedAt"])),
    shopsCount: toNumber(pickValue(raw, ["shops_count", "shopsCount"], shops.length)),
    usersCount: toNumber(pickValue(raw, ["users_count", "usersCount"])),
    shops,
    subscription: subscriptionRaw ? normalizeSubscription(subscriptionRaw) : null,
    subscriptions,
  };
}

function normalizeRole(raw: any): PlatformRole {
  return {
    id: String(pickValue(raw, ["id", "role_id", "crm_role_id", "code"]) ?? "").trim(),
    name: String(pickValue(raw, ["name"]) ?? "").trim(),
    description: String(pickValue(raw, ["description"]) ?? "").trim(),
    isAdmin: Boolean(pickValue(raw, ["is_admin", "isAdmin"])),
    type: toNumber(pickValue(raw, ["type"])),
    companyId: String(pickValue(raw, ["company_id", "companyId"]) ?? "").trim(),
  };
}

function normalizeUser(raw: any): PlatformUser {
  const company = pickObject(raw?.company, ["company", "data"]) ?? raw?.company ?? null;
  const firstName = String(pickValue(raw, ["first_name", "firstName"]) ?? "").trim();
  const lastName = String(pickValue(raw, ["last_name", "lastName"]) ?? "").trim();
  const phone = formatUzPhoneDisplay(pickValue(raw, ["phone_number", "phone"])) || String(pickValue(raw, ["phone_number", "phone"]) ?? "");
  const rawRole = pickValue(raw, ["role_name", "roleName", "role"]);
  const fullName = String(pickValue(raw, ["full_name", "fullName", "name"]) ?? "").trim() || [firstName, lastName].filter(Boolean).join(" ").trim() || phone;
  const isActive = toBoolean(pickValue(raw, ["is_active", "isActive", "status"]), true);
  return {
    id: String(pickValue(raw, ["id", "user_id"]) ?? ""),
    userType: String(pickValue(raw, ["user_type", "userType"]) ?? "platform"),
    firstName,
    lastName,
    fullName,
    phone,
    email: String(raw?.email ?? ""),
    roleId: String(pickValue(raw, ["role_id", "roleId"]) ?? ""),
    crmRoleId: String(pickValue(raw, ["crm_role_id", "crmRoleId"]) ?? ""),
    roleName: roleDisplay(rawRole),
    role: roleDisplay(rawRole),
    status: isActive ? "active" : "blocked",
    is_active: isActive,
    createdAt: toDate(pickValue(raw, ["created_at", "createdAt"])),
    updatedAt: toDate(pickValue(raw, ["updated_at", "updatedAt"])),
    birthDate: String(pickValue(raw, ["birth_date", "birthDate"]) ?? ""),
    companyId: String(pickValue(raw, ["company_id", "companyId"]) ?? pickValue(company, ["id", "company_id", "companyId"]) ?? ""),
    companyName: String(pickValue(raw, ["company_name"]) ?? pickValue(company, ["name", "company_name"]) ?? ""),
    currentShopId: String(pickValue(raw, ["current_shop_id", "currentShopId"]) ?? ""),
    currentShopName: "",
    allowedShopIds: pickArray(raw, ["allowed_shop_ids", "allowedShopIds"]).map(String),
    canSwitchShops: Boolean(pickValue(raw, ["can_switch_shops", "canSwitchShops"])),
  };
}

function normalizePayment(raw: any): PlatformPayment {
  const company = pickObject(raw?.company, ["company", "data"]) ?? raw?.company ?? null;
  const subscription = pickObject(raw?.subscription, ["subscription", "data"]) ?? raw?.subscription ?? null;
  const createdBy = pickObject(raw?.created_by, ["created_by", "data"]) ?? raw?.created_by ?? null;
  const periodStart = toDate(pickValue(raw, ["period_start", "periodStart"]));
  const periodEnd = toDate(pickValue(raw, ["period_end", "periodEnd"]));
  return {
    id: String(pickValue(raw, ["id"]) ?? ""),
    companyId: String(pickValue(raw, ["company_id", "companyId"]) ?? pickValue(company, ["id", "company_id"]) ?? ""),
    subscriptionId: String(pickValue(raw, ["subscription_id", "subscriptionId"]) ?? pickValue(subscription, ["id"]) ?? ""),
    companyName: String(pickValue(company, ["name"]) ?? pickValue(raw, ["companyName", "company_name"]) ?? ""),
    amount: toNumber(pickValue(raw, ["amount"])),
    method: String(pickValue(raw, ["method"]) ?? "cash") as PlatformPaymentMethod,
    paidAt: toDate(pickValue(raw, ["paid_at", "paidAt"])),
    periodStart,
    periodEnd,
    period: [periodStart, periodEnd].filter(Boolean).join(" - "),
    createdById: String(pickValue(raw, ["created_by_id", "createdById"]) ?? pickValue(createdBy, ["id"]) ?? ""),
    createdByName: String(pickValue(createdBy, ["name", "full_name", "phone_number"]) ?? ""),
    comment: String(pickValue(raw, ["comment"]) ?? ""),
    company: company ? normalizeCompany(company) : null,
    subscription: subscription ? normalizeSubscription(subscription) : null,
  };
}

export function formatPlatformMoney(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value) + " сум";
}

export function daysLeft(date: string) {
  if (!date) return 0;
  const end = new Date(date).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((end - today.getTime()) / 86400000);
}

export function usePlatformAdminSession() {
  const { apiFetch } = useApi();
  const userStore = useUserStore();
  const authenticated = computed(() => userStore.isLoggedIn && userStore.hasPlatformAccess);

  async function restore() {
    userStore.loadToken();
    userStore.loadRefreshToken();
    if (!userStore.token) return false;
    try {
      return await userStore.fetchPlatformMe();
    } catch {
      userStore.logout();
      return false;
    }
  }

  async function signIn(payload: { phone_number: string; password: string }) {
    const response: any = await apiFetch("/platform/auth/login", { method: "POST", body: payload });
    const token = response?.access_token ?? response?.token;
    const refreshToken = String(response?.refresh_token ?? "").trim();
    if (!token) throw new Error("Token not found in server response");
    if (!refreshToken) throw new Error("Refresh token not found in server response");
    userStore.setAuthTokens(String(token), refreshToken);
    const authenticated = await userStore.fetchPlatformMe();
    if (!authenticated || !userStore.hasPlatformAccess) {
      userStore.logout();
      throw new Error("Нет доступа к панели администратора платформы");
    }
    return response;
  }

  async function signOut() {
    try {
      await apiFetch("/platform/auth/logout", {
        method: "POST",
        body: {
          refresh_token: userStore.refreshToken,
        },
      });
    } catch {}
    userStore.logout();
  }

  return { authenticated, restore, signIn, signOut };
}

export function usePlatformAdminApi() {
  const { apiFetch } = useApi();
  const pathId = (value: string) => encodeURIComponent(String(value || "").trim());

  const list = async <T>(path: string, normalizer: (raw: any) => T, keys: string[]) => {
    const response = await apiFetch<any>(path, { method: "GET" });
    return pickArray(response, keys).map(normalizer);
  };

  function normalizeCompanyUpdatePayload(payload: PlatformCompanyUpdatePayload) {
    const { status, ...rest } = payload;
    return {
      ...rest,
      ...(status ? { is_active: status === "active" } : {}),
    };
  }

  async function getDashboardStats(): Promise<PlatformDashboardStats> {
    const response = await apiFetch<any>("/platform/dashboard/stats", { method: "GET" });
    const stats = pickObject(response, ["stats", "data"]) ?? response;
    return {
      totalCompanies: toNumber(pickValue(stats, ["totalCompanies", "total_companies"])),
      activeCompanies: toNumber(pickValue(stats, ["activeCompanies", "active_companies"])),
      blockedCompanies: toNumber(pickValue(stats, ["blockedCompanies", "blocked_companies"])),
      activeSubscriptions: toNumber(pickValue(stats, ["activeSubscriptions", "active_subscriptions"])),
      expiredSubscriptions: toNumber(pickValue(stats, ["expiredSubscriptions", "expired_subscriptions"])),
      expiringSoonSubscriptions: toNumber(pickValue(stats, ["expiringSoonSubscriptions", "expiring_soon_subscriptions"])),
      monthlyRevenue: toNumber(pickValue(stats, ["monthlyRevenue", "monthly_revenue"])),
      totalShops: toNumber(pickValue(stats, ["totalShops", "total_shops"])),
      totalUsers: toNumber(pickValue(stats, ["totalUsers", "total_users"])),
      totalSales: toNumber(pickValue(stats, ["totalSales", "total_sales"])),
    };
  }

  const getCompanies = () => list("/platform/companies", normalizeCompany, ["companies", "items", "data"]);
  async function getCompany(companyId: string) {
    const response = await apiFetch<any>(`/platform/companies/${pathId(companyId)}`, { method: "GET" });
    return normalizeCompany(pickObject(response, ["company", "data"]) ?? response);
  }
  async function createCompany(payload: PlatformCompanyCreatePayload) {
    const response = await apiFetch<any>("/platform/companies", { method: "POST", body: payload });
    return normalizeCompany(pickObject(response, ["company", "data"]) ?? response);
  }
  async function updateCompany(companyId: string, payload: PlatformCompanyUpdatePayload) {
    const response = await apiFetch<any>(`/platform/companies/${pathId(companyId)}`, { method: "PATCH", body: normalizeCompanyUpdatePayload(payload) });
    return normalizeCompany(pickObject(response, ["company", "data"]) ?? response);
  }
  async function updateCompanyStatus(companyId: string, isActive: boolean) {
    const response = await apiFetch<any>(`/platform/companies/${pathId(companyId)}/status`, { method: "PATCH", body: { is_active: isActive } });
    return normalizeCompany(pickObject(response, ["company", "data"]) ?? response);
  }
  async function blockCompany(companyId: string, block_reason = "manual") {
    const response = await apiFetch<any>(`/platform/companies/${pathId(companyId)}/block`, { method: "POST", body: { block_reason } });
    return normalizeCompany(pickObject(response, ["company", "data"]) ?? response);
  }
  async function unblockCompany(companyId: string) {
    const response = await apiFetch<any>(`/platform/companies/${pathId(companyId)}/unblock`, { method: "POST" });
    return normalizeCompany(pickObject(response, ["company", "data"]) ?? response);
  }
  const deleteCompany = (companyId: string) => apiFetch(`/platform/companies/${pathId(companyId)}`, { method: "DELETE" });

  async function getCompanyShops(companyId: string, company?: PlatformCompany) {
    if (!companyId && company?.shops) return company.shops;
    const response = await apiFetch<any>(`/platform/companies/${pathId(companyId)}/shops`, { method: "GET" });
    const shops = pickArray(response, ["shops", "items", "data"]).map((shop) => normalizeShop(shop, company));
    return shops.length || !company?.shops ? shops : company.shops;
  }
  async function createShop(companyId: string, payload: PlatformShopPayload) {
    const response = await apiFetch<any>(`/platform/companies/${pathId(companyId)}/shops`, { method: "POST", body: payload });
    return normalizeShop(pickObject(response, ["shop", "data"]) ?? response, { id: companyId, companyId });
  }
  async function updateShop(companyId: string, shopId: string, payload: PlatformShopPayload) {
    const response = await apiFetch<any>(`/platform/companies/${pathId(companyId)}/shops/${pathId(shopId)}`, { method: "PUT", body: payload });
    return normalizeShop(pickObject(response, ["shop", "data"]) ?? response, { id: companyId, companyId });
  }
  async function updateShopStatus(companyId: string, shopId: string, isActive: boolean) {
    const response = await apiFetch<any>(`/platform/companies/${pathId(companyId)}/shops/${pathId(shopId)}/status`, { method: "PATCH", body: { is_active: isActive } });
    return normalizeShop(pickObject(response, ["shop", "data"]) ?? response, { id: companyId, companyId });
  }
  const deleteShop = (companyId: string, shopId: string) => apiFetch(`/platform/companies/${pathId(companyId)}/shops/${pathId(shopId)}`, { method: "DELETE" });

  const getCompanyProducts = (companyId: string) => list(`/platform/companies/${pathId(companyId)}/products`, normalizeProduct, ["products", "items", "data"]);
  const deleteCompanyProduct = (companyId: string, productId: string) => apiFetch(`/platform/companies/${pathId(companyId)}/products/${pathId(productId)}`, { method: "DELETE" });
  const deleteAllCompanyProducts = (companyId: string) => apiFetch(`/platform/companies/${pathId(companyId)}/products`, { method: "DELETE" });

  const getPlans = () => list("/platform/plans", normalizePlan, ["plans", "items", "data"]);
  async function createPlan(payload: PlatformPlanPayload) {
    const response = await apiFetch<any>("/platform/plans", { method: "POST", body: payload });
    return normalizePlan(pickObject(response, ["plan", "data"]) ?? response);
  }
  async function updatePlan(id: string, payload: PlatformPlanPayload) {
    const response = await apiFetch<any>(`/platform/plans/${pathId(id)}`, { method: "PATCH", body: payload });
    return normalizePlan(pickObject(response, ["plan", "data"]) ?? response);
  }
  const deletePlan = (id: string) => apiFetch(`/platform/plans/${pathId(id)}`, { method: "DELETE" });

  const getSubscriptions = () => list("/platform/subscriptions", normalizeSubscription, ["subscriptions", "items", "data"]);
  const renewSubscription = (id: string) => apiFetch(`/platform/subscriptions/${pathId(id)}/renew`, { method: "POST" });
  const checkExpiredSubscriptions = () => apiFetch<{ expired_count: number }>("/platform/subscriptions/check-expired", { method: "POST" });
  async function changePlan(subscriptionId: string, planId: string) {
    const response = await apiFetch<any>(`/platform/subscriptions/${pathId(subscriptionId)}/plan`, {
      method: "PATCH",
      body: { plan_id: planId },
    });
    return normalizeSubscription(pickObject(response, ["subscription", "data"]) ?? response);
  }

  const getPayments = () => list("/platform/payments", normalizePayment, ["payments", "items", "data"]);
  async function createPayment(payload: PlatformPaymentPayload) {
    const response = await apiFetch<any>("/platform/payments", { method: "POST", body: payload });
    return normalizePayment(pickObject(response, ["payment", "data"]) ?? response);
  }

  const getPlatformUsers = () => list("/platform/users", normalizeUser, ["users", "items", "data"]);
  async function getPlatformUser(id: string) {
    const response = await apiFetch<any>(`/platform/users/${pathId(id)}`, { method: "GET" });
    return normalizeUser(pickObject(response, ["user", "data"]) ?? response);
  }
  async function createPlatformUser(payload: PlatformUserPayload) {
    const response = await apiFetch<any>("/platform/users", { method: "POST", body: payload });
    return normalizeUser(pickObject(response, ["user", "data"]) ?? response);
  }
  async function updateUser(id: string, payload: PlatformUserPayload) {
    const response = await apiFetch<any>(`/platform/users/${pathId(id)}`, { method: "PUT", body: payload });
    return normalizeUser(pickObject(response, ["user", "data"]) ?? response);
  }
  const blockUser = (id: string) => apiFetch(`/platform/users/${pathId(id)}/block`, { method: "POST" });
  const unblockUser = (id: string) => apiFetch(`/platform/users/${pathId(id)}/unblock`, { method: "POST" });
  const deleteUser = (id: string) => apiFetch(`/platform/users/${pathId(id)}`, { method: "DELETE" });

  const getPlatformRoles = () => list("/platform/roles", normalizeRole, ["roles", "items", "data"]);
  async function getCompanyRoles(companyId?: string) {
    const roles = await getPlatformRoles();
    const safeCompanyId = String(companyId ?? "").trim();
    return safeCompanyId ? roles.filter((role) => !role.companyId || role.companyId === safeCompanyId) : roles;
  }

  const getCompanyUsers = (companyId: string) => list(`/platform/companies/${pathId(companyId)}/users`, normalizeUser, ["users", "items", "data"]);
  async function getCompanyUser(companyId: string, id: string) {
    const response = await apiFetch<any>(`/platform/companies/${pathId(companyId)}/users/${pathId(id)}`, { method: "GET" });
    return normalizeUser(pickObject(response, ["user", "data"]) ?? response);
  }
  async function createCompanyUser(companyId: string, payload: PlatformUserPayload) {
    const response = await apiFetch<any>(`/platform/companies/${pathId(companyId)}/users`, { method: "POST", body: payload });
    return normalizeUser(pickObject(response, ["user", "data"]) ?? response);
  }
  async function updateCompanyUser(companyId: string, id: string, payload: PlatformUserPayload) {
    const response = await apiFetch<any>(`/platform/companies/${pathId(companyId)}/users/${pathId(id)}`, { method: "PUT", body: payload });
    return normalizeUser(pickObject(response, ["user", "data"]) ?? response);
  }
  const blockCompanyUser = (companyId: string, id: string) => apiFetch(`/platform/companies/${pathId(companyId)}/users/${pathId(id)}/block`, { method: "POST" });
  const unblockCompanyUser = (companyId: string, id: string) => apiFetch(`/platform/companies/${pathId(companyId)}/users/${pathId(id)}/unblock`, { method: "POST" });
  const deleteCompanyUser = (companyId: string, id: string) => apiFetch(`/platform/companies/${pathId(companyId)}/users/${pathId(id)}`, { method: "DELETE" });

  const getSettings = () => apiFetch<Record<string, any>>("/platform/settings", { method: "GET" });
  const updateSettings = (payload: Record<string, any>) => apiFetch<Record<string, any>>("/platform/settings", { method: "PATCH", body: payload });

  return {
    getDashboardStats,
    getCompanies,
    getCompany,
    createCompany,
    updateCompany,
    blockCompany,
    unblockCompany,
    deleteCompany,
    updateCompanyStatus,
    getPlans,
    createPlan,
    updatePlan,
    deletePlan,
    getSubscriptions,
    renewSubscription,
    checkExpiredSubscriptions,
    changePlan,
    getPayments,
    createPayment,
    getPlatformUsers,
    getPlatformUser,
    updateUser,
    blockUser,
    unblockUser,
    deleteUser,
    getSettings,
    updateSettings,
    getUsers: getPlatformUsers,
    getPlatformRoles,
    getCompanyRoles,
    getCompanyUsers,
    getCompanyUser,
    getCompanyShops,
    createShop,
    updateShop,
    updateShopStatus,
    deleteShop,
    getCompanyProducts,
    deleteCompanyProduct,
    deleteAllCompanyProducts,
    createPlatformUser,
    createUser: createPlatformUser,
    createCompanyUser,
    updateCompanyUser,
    blockCompanyUser,
    unblockCompanyUser,
    deleteCompanyUser,
    updateCompanyRole: async (_companyId: string, roleId: string) => ({ id: roleId, name: "", description: "", isAdmin: false, type: 0, companyId: _companyId }),
  };
}
