import { computed } from "vue";
import { useApi } from "~/composables/useApi";
import { useUserStore } from "~/store/useUserStore";

export type PlatformStatus = "active" | "inactive";

export interface PlatformCompany {
  id: string;
  companyId: string;
  name: string;
  login: string;
  subdomain: string;
  status: PlatformStatus;
  createdAt: string;
  updatedAt: string;
  shopsCount: number;
  usersCount: number;
  shops: PlatformShop[];
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

export interface PlatformUser {
  id: string;
  userType: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string;
  roleId: string;
  roleName: string;
  role: string;
  status: PlatformStatus;
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
  totalShops: number;
  totalUsers: number;
  totalSales: number;
  activeCompanies: number;
}

export interface PlatformUserPayload {
  first_name: string;
  last_name: string;
  phone_number: string;
  password?: string;
  role: string;
  birth_date?: string;
  company_id?: string;
  current_shop_id?: string;
  allowed_shop_ids?: string[];
  can_switch_shops?: boolean;
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

function pickValue<T = any>(input: any, keys: string[], fallback?: T): T | undefined {
  for (const key of keys) {
    if (input?.[key] !== undefined && input[key] !== null) {
      return input[key] as T;
    }
  }

  return fallback;
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

function normalizeSlug(value: any): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeShop(raw: any, company?: Partial<PlatformCompany>): PlatformShop {
  const nestedShop = pickObject(raw?.shop, ["shop", "data"]) ?? raw?.shop ?? null;
  const companyInfo = pickObject(raw?.company, ["company", "data"]) ?? company ?? null;

  return {
    id: String(
      pickValue(raw, ["id", "shop_id"]) ??
        pickValue(nestedShop, ["id", "shop_id"]) ??
        "",
    ),
    shopId: String(
      pickValue(raw, ["shop_id", "id"]) ??
        pickValue(nestedShop, ["shop_id", "id"]) ??
        "",
    ),
    name: String(
      pickValue(raw, ["name", "shop_name"]) ??
        pickValue(nestedShop, ["name", "shop_name"]) ??
        "",
    ),
    companyId: String(
      pickValue(raw, ["company_id", "companyId"]) ??
        pickValue(companyInfo, ["company_id", "companyId", "id"]) ??
        "",
    ),
    companyName: String(
      pickValue(raw, ["company_name"]) ??
        pickValue(companyInfo, ["name", "company_name"]) ??
        "",
    ),
    branchCode: String(
      pickValue(raw, ["branch_code", "branchCode", "code"]) ??
        pickValue(nestedShop, ["branch_code", "branchCode", "code"]) ??
        "",
    ),
    status: toStatus(
      pickValue(raw, ["is_active", "isActive", "status"]) ??
        pickValue(nestedShop, ["is_active", "isActive", "status"]),
    ),
    createdAt: toDate(
      pickValue(raw, ["created_at", "createdAt"]) ??
        pickValue(nestedShop, ["created_at", "createdAt"]),
    ),
    updatedAt: toDate(
      pickValue(raw, ["updated_at", "updatedAt"]) ??
        pickValue(nestedShop, ["updated_at", "updatedAt"]),
    ),
  };
}

function normalizeRole(raw: any): PlatformRole {
  return {
    id: String(pickValue(raw, ["id"]) ?? "").trim(),
    name: String(pickValue(raw, ["name"]) ?? "").trim(),
    description: String(pickValue(raw, ["description"]) ?? "").trim(),
    isAdmin: Boolean(pickValue(raw, ["is_admin", "isAdmin"])),
    type: toNumber(pickValue(raw, ["type"])),
    companyId: String(pickValue(raw, ["company_id", "companyId"]) ?? "").trim(),
  };
}

function normalizeCompany(raw: any): PlatformCompany {
  const shops = pickArray(raw, ["shops", "data", "items"]).map((shop) =>
    normalizeShop(shop, raw),
  );

  return {
    id: String(pickValue(raw, ["id", "company_id"]) ?? ""),
    companyId: String(pickValue(raw, ["company_id", "id"]) ?? ""),
    name: String(pickValue(raw, ["name", "company_name"]) ?? ""),
    login: String(pickValue(raw, ["login", "company_login"]) ?? ""),
    subdomain: String(pickValue(raw, ["subdomain"]) ?? ""),
    status: toStatus(pickValue(raw, ["is_active", "isActive", "status"])),
    createdAt: toDate(pickValue(raw, ["created_at", "createdAt"])),
    updatedAt: toDate(pickValue(raw, ["updated_at", "updatedAt"])),
    shopsCount: toNumber(pickValue(raw, ["shops_count", "shopsCount"], shops.length)),
    usersCount: toNumber(pickValue(raw, ["users_count", "usersCount"])),
    shops,
  };
}

function normalizeUser(raw: any): PlatformUser {
  const company = pickObject(raw?.company, ["company", "data"]) ?? raw?.company ?? null;
  const currentShop = pickObject(raw?.current_shop, ["current_shop", "data"]) ?? raw?.current_shop ?? null;
  const primaryRole = raw?.role?.role ?? raw?.role ?? raw?.roles?.[0]?.role ?? raw?.roles?.[0] ?? null;
  const firstName = String(pickValue(raw, ["first_name", "firstName"]) ?? "").trim();
  const lastName = String(pickValue(raw, ["last_name", "lastName"]) ?? "").trim();
  const fullName =
    String(pickValue(raw, ["full_name", "fullName"]) ?? "").trim() ||
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    String(pickValue(raw, ["name"]) ?? "").trim() ||
    String(pickValue(raw, ["phone_number", "phone"]) ?? "").trim();

  const allowedShopIds = pickArray(raw, ["allowed_shop_ids", "allowedShopIds"]).map((item) =>
    String(item),
  );

  return {
    id: String(pickValue(raw, ["id", "user_id"]) ?? ""),
    userType: String(pickValue(raw, ["user_type", "userType"]) ?? ""),
    firstName,
    lastName,
    fullName,
    phone: String(pickValue(raw, ["phone_number", "phone"]) ?? ""),
    email: String(raw?.email ?? ""),
    roleId: String(
      pickValue(primaryRole, ["id", "role_id", "roleId"]) ??
        (typeof primaryRole === "string" ? primaryRole : "") ??
        "",
    ).trim(),
    roleName: String(
      pickValue(primaryRole, ["name"]) ??
        (typeof primaryRole === "string" ? primaryRole : "") ??
        "",
    ).trim(),
    role: String(
      pickValue(primaryRole, ["name"]) ??
        (typeof primaryRole === "string" ? primaryRole : "") ??
        "",
    ).trim(),
    status: toStatus(pickValue(raw, ["is_active", "isActive", "status"])),
    createdAt: toDate(pickValue(raw, ["created_at", "createdAt"])),
    updatedAt: toDate(pickValue(raw, ["updated_at", "updatedAt"])),
    birthDate: String(pickValue(raw, ["birth_date", "birthDate"]) ?? ""),
    companyId: String(
      pickValue(raw, ["company_id", "companyId"]) ??
        pickValue(company, ["id", "company_id", "companyId"]) ??
        "",
    ),
    companyName: String(
      pickValue(raw, ["company_name"]) ??
        pickValue(company, ["name", "company_name"]) ??
        "",
    ),
    currentShopId: String(
      pickValue(raw, ["current_shop_id", "currentShopId"]) ??
        pickValue(currentShop, ["id", "shop_id", "shopId"]) ??
        "",
    ),
    currentShopName: String(
      pickValue(currentShop, ["name"]) ??
        pickValue(currentShop?.shop, ["name"]) ??
        "",
    ),
    allowedShopIds,
    canSwitchShops: Boolean(pickValue(raw, ["can_switch_shops", "canSwitchShops"])),
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

  async function getCompany(companyId: string) {
    const response = await apiFetch<any>(`/platform/companies/${companyId}`, { method: "GET" });
    return normalizeCompany(pickObject(response, ["company", "data"]));
  }

  async function createCompany(payload: { login: string; name: string; subdomain: string }) {
    const response = await apiFetch<any>("/platform/companies", {
      method: "POST",
      body: {
        login: normalizeSlug(payload.login),
        name: String(payload.name ?? "").trim(),
        subdomain: normalizeSlug(payload.subdomain),
      },
    });

    return normalizeCompany(pickObject(response, ["company", "data"]));
  }

  async function updateCompany(
    companyId: string,
    payload: Partial<{ login: string; name: string; subdomain: string; is_active: boolean }>,
  ) {
    const response = await apiFetch<any>(`/platform/companies/${companyId}`, {
      method: "PUT",
      body: {
        ...(payload.name !== undefined ? { name: String(payload.name).trim() } : {}),
        ...(payload.login !== undefined ? { login: normalizeSlug(payload.login) } : {}),
        ...(payload.subdomain !== undefined ? { subdomain: normalizeSlug(payload.subdomain) } : {}),
        ...(payload.is_active !== undefined ? { is_active: Boolean(payload.is_active) } : {}),
      },
    });

    return normalizeCompany(pickObject(response, ["company", "data"]));
  }

  async function updateCompanyStatus(companyId: string, isActive: boolean) {
    const response = await apiFetch<any>(`/platform/companies/${companyId}/status`, {
      method: "PATCH",
      body: {
        is_active: Boolean(isActive),
      },
    });

    return normalizeCompany(pickObject(response, ["company", "data"]));
  }

  async function deleteCompany(companyId: string) {
    return apiFetch<{ message: string; company_id: string }>(`/platform/companies/${companyId}`, {
      method: "DELETE",
    });
  }

  async function getCompanyShops(companyId: string, company?: Partial<PlatformCompany>) {
    const response = await apiFetch<any>(`/platform/companies/${companyId}/shops`, { method: "GET" });
    return pickArray(response, ["shops", "items", "data"]).map((item) => normalizeShop(item, company));
  }

  async function createShop(companyId: string, payload: { name: string; branch_code: string }) {
    const response = await apiFetch<any>(`/platform/companies/${companyId}/shops`, {
      method: "POST",
      body: {
        name: String(payload.name ?? "").trim(),
        branch_code: normalizeSlug(payload.branch_code),
      },
    });

    return normalizeShop(pickObject(response, ["shop", "data"]), { id: companyId, companyId });
  }

  async function updateShop(
    companyId: string,
    shopId: string,
    payload: Partial<{ name: string; branch_code: string; is_active: boolean }>,
  ) {
    const response = await apiFetch<any>(`/platform/companies/${companyId}/shops/${shopId}`, {
      method: "PUT",
      body: {
        ...(payload.name !== undefined ? { name: String(payload.name).trim() } : {}),
        ...(payload.branch_code !== undefined ? { branch_code: normalizeSlug(payload.branch_code) } : {}),
        ...(payload.is_active !== undefined ? { is_active: Boolean(payload.is_active) } : {}),
      },
    });

    return normalizeShop(pickObject(response, ["shop", "data"]), { id: companyId, companyId });
  }

  async function updateShopStatus(companyId: string, shopId: string, isActive: boolean) {
    const response = await apiFetch<any>(`/platform/companies/${companyId}/shops/${shopId}/status`, {
      method: "PATCH",
      body: {
        is_active: Boolean(isActive),
      },
    });

    return normalizeShop(pickObject(response, ["shop", "data"]), { id: companyId, companyId });
  }

  async function deleteShop(companyId: string, shopId: string) {
    return apiFetch<{ message: string; shop_id: string; company_id: string }>(
      `/platform/companies/${companyId}/shops/${shopId}`,
      { method: "DELETE" },
    );
  }

  async function getPlatformUsers() {
    const response = await apiFetch<any>("/platform/users", { method: "GET" });
    return pickArray(response, ["users", "items", "data"]).map(normalizeUser);
  }

  async function getPlatformRoles() {
    const response = await apiFetch<any>("/platform/roles", { method: "GET" });
    return pickArray(response, ["roles", "items", "data"]).map(normalizeRole);
  }

  async function getPlatformUser(id: string) {
    const response = await apiFetch<any>(`/platform/users/${id}`, { method: "GET" });
    return normalizeUser(pickObject(response, ["user", "data"]));
  }

  async function createPlatformUser(payload: PlatformUserPayload) {
    const response = await apiFetch<any>("/platform/users", {
      method: "POST",
      body: payload,
    });

    return normalizeUser(pickObject(response, ["user", "data"]));
  }

  async function getCompanyUsers(companyId: string) {
    const response = await apiFetch<any>(`/platform/companies/${companyId}/users`, { method: "GET" });
    return pickArray(response, ["users", "items", "data"]).map(normalizeUser);
  }

  async function getCompanyRoles() {
    const response = await apiFetch<any>("/company/roles", { method: "GET" });
    return pickArray(response, ["roles", "items", "data"]).map(normalizeRole);
  }

  async function createCompanyUser(companyId: string, payload: PlatformUserPayload) {
    const response = await apiFetch<any>(`/platform/companies/${companyId}/users`, {
      method: "POST",
      body: {
        ...payload,
        company_id: companyId,
      },
    });

    return normalizeUser(pickObject(response, ["user", "data"]));
  }

  async function updateUser(id: string, payload: PlatformUserPayload) {
    const response = await apiFetch<any>(`/platform/users/${id}`, {
      method: "PUT",
      body: payload,
    });

    return normalizeUser(pickObject(response, ["user", "data"]));
  }

  async function deleteUser(id: string) {
    return apiFetch<{ message: string; id?: string; user_id?: string }>(`/platform/users/${id}`, {
      method: "DELETE",
    });
  }

  async function getDashboardStats(): Promise<PlatformDashboardStats> {
    const [companies, users] = await Promise.all([getCompanies(), getPlatformUsers()]);
    const totalShops = companies.reduce((sum, company) => sum + company.shopsCount, 0);

    return {
      totalCompanies: companies.length,
      totalShops,
      totalUsers: users.length,
      totalSales: 0,
      activeCompanies: companies.filter((company) => company.status === "active").length,
    };
  }

  return {
    getCompanies,
    getCompany,
    createCompany,
    updateCompany,
    updateCompanyStatus,
    deleteCompany,
    getCompanyShops,
    createShop,
    updateShop,
    updateShopStatus,
    deleteShop,
    getPlatformUsers,
    getPlatformRoles,
    getPlatformUser,
    createPlatformUser,
    getCompanyUsers,
    getCompanyRoles,
    createCompanyUser,
    updateUser,
    deleteUser,
    getDashboardStats,
    getUsers: getPlatformUsers,
    createUser: createPlatformUser,
  };
}
