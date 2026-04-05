import { computed } from "vue";
import { useApi } from "~/composables/useApi";
import { useUserStore } from "~/store/useUserStore";

export type PlatformStatus = "active" | "inactive";

export interface PlatformCompany {
  id: string;
  name: string;
  login: string;
  subdomain: string;
  status: PlatformStatus;
  createdAt: string;
  shopsCount: number;
  usersCount: number;
  salesCount: number;
}

export interface PlatformShop {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  branchCode: string;
  status: PlatformStatus;
  createdAt: string;
  city: string;
  address: string;
}

export interface PlatformUser {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: string;
  status: PlatformStatus;
  createdAt: string;
}

export interface PlatformDashboardStats {
  totalCompanies: number;
  totalShops: number;
  totalUsers: number;
  totalSales: number;
  activeCompanies: number;
}

function pickArray<T = any>(input: any, keys: string[]): T[] {
  if (Array.isArray(input)) return input;

  for (const key of keys) {
    if (Array.isArray(input?.[key])) {
      return input[key];
    }
  }

  return [];
}

function pickObject<T = any>(input: any, keys: string[]): T | null {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    for (const key of keys) {
      if (input?.[key] && typeof input[key] === "object") {
        return input[key];
      }
    }
    return input as T;
  }

  return null;
}

function toStatus(value: any): PlatformStatus {
  if (typeof value === "boolean") {
    return value ? "active" : "inactive";
  }

  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return "active";

  if (["inactive", "disabled", "blocked", "archived", "false", "0"].includes(normalized)) {
    return "inactive";
  }

  return "active";
}

function toDate(value: any): string {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized.slice(0, 10) : "";
}

function toNumber(value: any): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeCompany(raw: any): PlatformCompany {
  const shops = Array.isArray(raw?.shops) ? raw.shops.length : 0;

  return {
    id: String(raw?.id ?? raw?.company_id ?? ""),
    name: String(raw?.name ?? raw?.company_name ?? "Без названия"),
    login: String(raw?.login ?? raw?.company_login ?? ""),
    subdomain: String(raw?.subdomain ?? ""),
    status: toStatus(raw?.status ?? raw?.is_active),
    createdAt: toDate(raw?.created_at ?? raw?.createdAt),
    shopsCount: toNumber(raw?.shops_count ?? raw?.shopsCount ?? shops),
    usersCount: toNumber(raw?.users_count ?? raw?.usersCount),
    salesCount: toNumber(raw?.sales_count ?? raw?.salesCount ?? raw?.total_sales),
  };
}

function normalizeShop(raw: any, company?: Partial<PlatformCompany>): PlatformShop {
  return {
    id: String(raw?.id ?? raw?.shop_id ?? ""),
    name: String(raw?.name ?? raw?.shop_name ?? "Без названия"),
    companyId: String(raw?.company_id ?? company?.id ?? ""),
    companyName: String(raw?.company?.name ?? raw?.company_name ?? company?.name ?? ""),
    branchCode: String(raw?.branch_code ?? raw?.branchCode ?? raw?.code ?? ""),
    status: toStatus(raw?.status ?? raw?.is_active),
    createdAt: toDate(raw?.created_at ?? raw?.createdAt),
    city: String(raw?.city ?? ""),
    address: String(raw?.address ?? raw?.location ?? ""),
  };
}

function normalizeUser(raw: any): PlatformUser {
  const fullName =
    String(raw?.full_name ?? "").trim() ||
    String(raw?.name ?? "").trim() ||
    `${String(raw?.first_name ?? "").trim()} ${String(raw?.last_name ?? "").trim()}`.trim() ||
    String(raw?.phone_number ?? raw?.phone ?? "").trim() ||
    "Пользователь";

  return {
    id: String(raw?.id ?? raw?.user_id ?? ""),
    fullName,
    phone: String(raw?.phone_number ?? raw?.phone ?? ""),
    email: String(raw?.email ?? ""),
    role: String(raw?.role?.name ?? raw?.role ?? raw?.roles?.[0]?.role?.name ?? raw?.roles?.[0]?.name ?? ""),
    status: toStatus(raw?.status ?? raw?.is_active),
    createdAt: toDate(raw?.created_at ?? raw?.createdAt),
  };
}

export function usePlatformAdminSession() {
  const { apiFetch } = useApi();
  const userStore = useUserStore();

  const authenticated = computed(() => userStore.isLoggedIn && userStore.hasPlatformAccess);

  async function restore() {
    userStore.loadToken();
    if (!userStore.token) return false;

    if (!userStore.user.id) {
      await userStore.fetchMe();
    }

    return authenticated.value;
  }

  async function signIn(payload: { phone_number: string; password: string }) {
    const response: any = await apiFetch("/auth/platform-login", {
      method: "POST",
      body: payload,
    });

    const token = response?.access_token ?? response?.token;
    if (!token) {
      throw new Error("Токен не найден в ответе сервера");
    }

    userStore.login(token, response?.user ?? {});
    await userStore.fetchMe();

    if (!userStore.hasPlatformAccess) {
      userStore.logout();
      throw new Error("У пользователя нет доступа к панели платформы");
    }
  }

  function signOut() {
    userStore.logout();
  }

  return { authenticated, restore, signIn, signOut };
}

export function usePlatformAdminApi() {
  const { apiFetch } = useApi();

  async function getCompanies() {
    const response = await apiFetch<any>("/platform/companies", { method: "GET" });
    return pickArray(response, ["companies", "items", "data"]).map(normalizeCompany);
  }

  async function getCompany(id: string) {
    const response = await apiFetch<any>(`/platform/companies/${id}`, { method: "GET" });
    const company = pickObject(response, ["company", "data"]);
    return normalizeCompany(company);
  }

async function createCompany(payload: Record<string, any>) {
    const response = await apiFetch<any>("/platform/companies", {
      method: "POST",
      body: {
        login: payload.login,
        name: payload.name,
        subdomain: payload.subdomain,
      },
    });
    const company = pickObject(response, ["company", "data"]);
    return normalizeCompany(company);
  }

  async function updateCompany(id: string, payload: Record<string, any>) {
    const response = await apiFetch<any>(`/platform/companies/${id}`, {
      method: "PATCH",
      body: payload,
    });
    const company = pickObject(response, ["company", "data"]);
    return normalizeCompany(company);
  }

  async function getCompanyShops(companyId: string, company?: Partial<PlatformCompany>) {
    const response = await apiFetch<any>(`/platform/companies/${companyId}/shops`, { method: "GET" });
    return pickArray(response, ["shops", "items", "data"]).map((item) => normalizeShop(item, company));
  }

  async function createShop(companyId: string, payload: Record<string, any>) {
    const response = await apiFetch<any>(`/platform/companies/${companyId}/shops`, {
      method: "POST",
      body: {
        name: payload.name,
        branch_code: payload.branch_code,
      },
    });
    const shop = pickObject(response, ["shop", "data"]);
    return normalizeShop(shop, { id: companyId });
  }

  async function updateShop(id: string, payload: Record<string, any>) {
    const response = await apiFetch<any>(`/platform/shops/${id}`, {
      method: "PATCH",
      body: payload,
    });
    const shop = pickObject(response, ["shop", "data"]);
    return normalizeShop(shop);
  }

  async function getUsers() {
    const response = await apiFetch<any>("/platform/users", { method: "GET" });
    return pickArray(response, ["users", "items", "data"]).map(normalizeUser);
  }

  async function createUser(payload: Record<string, any>) {
    const response = await apiFetch<any>("/platform/users", {
      method: "POST",
      body: {
        first_name: payload.first_name,
        last_name: payload.last_name,
        phone_number: payload.phone_number,
        password: payload.password,
        role: payload.role,
      },
    });
    const user = pickObject(response, ["user", "data"]);
    return normalizeUser(user);
  }

  async function getDashboardStats(): Promise<PlatformDashboardStats> {
    const [companies, users] = await Promise.all([getCompanies(), getUsers()]);
    const shopsGroups = await Promise.all(companies.map((company) => getCompanyShops(company.id, company)));
    const shops = shopsGroups.flat();

    return {
      totalCompanies: companies.length,
      totalShops: shops.length,
      totalUsers: users.length,
      totalSales: companies.reduce((sum, company) => sum + company.salesCount, 0),
      activeCompanies: companies.filter((company) => company.status === "active").length,
    };
  }

  return {
    getCompanies,
    getCompany,
    createCompany,
    updateCompany,
    getCompanyShops,
    createShop,
    updateShop,
    getUsers,
    createUser,
    getDashboardStats,
  };
}
