import { defineStore } from "pinia";
import { useApi } from "~/composables/useApi";
import { useLocationStore } from "./useLocationStore";

type NormalizedShop = {
  id: string;
  name: string;
  relationId?: string;
  branchCode?: string;
  companyId?: string;
};

const FULL_ACCESS_FALLBACK_ROLES = new Set([
  "admin",
  "owner",
  "superadmin",
  "super_admin",
  "platform_admin",
]);

function createEmptyUser() {
  return {
    id: null as number | null,
    firstName: "" as string,
    lastName: "" as string,
    birthYear: null as number | null,
    phone: "" as string,
    userType: "" as string,
    role: "" as string,
    roles: [] as string[],
    crmRoleId: "" as string,
    crmRole: null as null | {
      id: string;
      name: string;
      isAdmin: boolean;
    },
    companyId: "" as string,
    company: null as null | {
      id: string;
      companyId: string;
      login: string;
      subdomain: string;
      name: string;
    },
    canSwitchShops: false as boolean,
    branchCode: "" as string,
    branchTitle: "" as string,
    currentShopId: "" as string,
    currentShopName: "" as string,
    currentShop: null as null | {
      id?: string;
      shopId: string;
      companyId?: string;
      branchCode?: string;
      name: string;
    },
    shops: [] as NormalizedShop[],
    name: "" as string,
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  };
}

function normalizeCompany(company: any) {
  if (!company) {
    return null;
  }

  const id = String(company?.id ?? company?.company_id ?? "");
  const companyId = String(company?.company_id ?? company?.id ?? "");
  const login = String(company?.login ?? "");
  const subdomain = String(company?.subdomain ?? "");
  const name = String(company?.name ?? "");

  if (!id && !companyId && !name) {
    return null;
  }

  return { id, companyId, login, subdomain, name };
}

function normalizeShop(shop: any): NormalizedShop | null {
  const id = String(shop?.id ?? shop?.shop_id ?? shop?.shop?.id ?? "");
  const name = String(shop?.shop?.name ?? shop?.name ?? shop?.shop_name ?? "");

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    relationId: shop?.id ? String(shop.id) : undefined,
    branchCode: shop?.branch_code ? String(shop.branch_code) : undefined,
    companyId: shop?.company_id ? String(shop.company_id) : undefined,
  };
}

function roleValue(value: any) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
}

function normalizeRoleName(value: unknown) {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function collectActiveSlugs(sections: any[]) {
  const slugs = new Set<string>();

  const walk = (node: any) => {
    if (node?.is_active && node?.slug) {
      slugs.add(String(node.slug));
    }
    if (Array.isArray(node?.children)) {
      node.children.forEach(walk);
    }
  };

  sections.forEach((section) => {
    if (Array.isArray(section?.permissions)) {
      section.permissions.forEach(walk);
    }
  });

  return slugs;
}

export const useUserStore = defineStore("user", {
  state: () => ({
    user: createEmptyUser(),
    token: null as string | null,
    location: null as null | { id: string; name: string },
    initializing: false as boolean,
    refreshingUser: false as boolean,
    lastUserFetchAt: 0 as number,
    permissionsLoaded: false as boolean,
    permissionsLoading: false as boolean,
    activePermissionSlugs: [] as string[],
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    isCompanyUser: (state) => state.user.userType === "company",
    isPlatformUser: (state) => state.user.userType === "platform",
    normalizedRoles: (state) =>
      [state.user.role, ...(state.user.roles || [])]
        .map((role) => String(role || "").trim().toLowerCase())
        .filter(Boolean),
    hasPlatformAccess(): boolean {
      return (
        this.user.userType === "platform" ||
        ["platform_admin", "support", "superadmin"].some((role) => this.normalizedRoles.includes(role))
      );
    },
    fullName: (state) =>
      state.user.firstName || state.user.lastName
        ? `${state.user.firstName} ${state.user.lastName}`.trim()
        : state.user.name,
    isAdmin(): boolean {
      return (
        this.user.userType === "platform" ||
        Boolean(this.user.crmRole?.isAdmin) ||
        this.normalizedRoles.some((role) => FULL_ACCESS_FALLBACK_ROLES.has(normalizeRoleName(role)))
      );
    },
    activeSlugs: (state) => new Set(state.activePermissionSlugs),
    can(): (slug: string) => boolean {
      return (slug: string) => this.isAdmin || this.activeSlugs.has(slug);
    },
  },

  actions: {
    setUser(user: any) {
      const roleCandidates = [
        roleValue(user?.role?.code),
        roleValue(user?.role?.role),
        roleValue(user?.role?.name),
        roleValue(user?.role?.role_id),
        roleValue(user?.role?.id),
        roleValue(user?.role_name),
        roleValue(user?.crm_role_id),
        roleValue(user?.role),
        roleValue(user?.roles?.[0]?.role?.code),
        roleValue(user?.roles?.[0]?.role?.role),
        roleValue(user?.roles?.[0]?.role?.name),
        roleValue(user?.roles?.[0]?.role_id),
        roleValue(user?.roles?.[0]?.role?.id),
      ];
      const normalizedRole = roleCandidates.find(Boolean) ?? "";
      const normalizedRoles = Array.from(
        new Set([
          ...roleCandidates,
          ...(Array.isArray(user?.roles)
            ? user.roles.flatMap((item: any) => [
                roleValue(item?.role_id),
                roleValue(item?.role?.id),
                roleValue(item?.role?.code),
                roleValue(item?.role?.role),
                roleValue(item?.role?.name),
                roleValue(item?.name),
                roleValue(item?.code),
                roleValue(item?.role),
              ])
            : []),
        ].filter(Boolean).map((role: any) => String(role))),
      );

      const normalizedCompany = normalizeCompany(user?.company);
      const normalizedShops = Array.isArray(user?.shops)
        ? user.shops.map((shop: any) => normalizeShop(shop)).filter(Boolean)
        : [];
      const canSwitchShops =
        typeof user?.can_switch_shops === "boolean"
          ? user.can_switch_shops
          : normalizedShops.length > 1;

      const currentShopId = String(
        user?.current_shop_id ?? user?.current_shop?.id ?? user?.current_shop?.shop_id ?? "",
      );
      const currentShopName =
        String(user?.current_shop?.shop?.name ?? "").trim() ||
        normalizedShops.find((shop: any) => shop?.id === currentShopId)?.name ||
        "";
      const currentShop = currentShopId
        ? {
            id: user?.current_shop?.id ? String(user.current_shop.id) : undefined,
            shopId: currentShopId,
            companyId:
              user?.current_shop?.company_id
                ? String(user.current_shop.company_id)
                : normalizedCompany?.companyId || undefined,
            branchCode: user?.current_shop?.branch_code
              ? String(user.current_shop.branch_code)
              : undefined,
            name: currentShopName,
          }
        : null;

      const normalized = {
        id: user?.id ?? null,
        firstName: user?.first_name ?? user?.firstName ?? "",
        lastName: user?.last_name ?? user?.lastName ?? "",
        birthYear: user?.birth_year ?? user?.birthYear ?? null,
        phone: user?.phone ?? user?.phone_number ?? "",
        userType: String(user?.user_type ?? ""),
        role: normalizedRole,
        roles: normalizedRoles,
        crmRoleId: String(user?.crm_role_id ?? ""),
        crmRole: user?.crm_role
          ? {
              id: String(user.crm_role.id ?? ""),
              name: String(user.crm_role.name ?? ""),
              isAdmin: Boolean(user.crm_role.is_admin ?? user.crm_role.isAdmin),
            }
          : null,
        companyId:
          String(user?.company_id ?? normalizedCompany?.companyId ?? normalizedCompany?.id ?? ""),
        company: normalizedCompany,
        canSwitchShops: canSwitchShops,
        branchCode:
          user?.current_shop?.branch_code ??
          user?.branch_code ??
          user?.branchCode ??
          currentShop?.branchCode ??
          currentShopId,
        branchTitle:
          user?.branch_title ??
          user?.branchTitle ??
          currentShopName ??
          user?.current_shop?.branch_code ??
          user?.branch_code ??
          "",
        currentShopId,
        currentShopName,
        currentShop,
        shops: normalizedShops as NormalizedShop[],
        name:
          user?.name ??
          user?.full_name ??
          user?.username ??
          `${user?.first_name ?? user?.firstName ?? ""} ${user?.last_name ?? user?.lastName ?? ""}`.trim() ??
          user?.phone ??
          user?.phone_number ??
          "",
        avatarUrl: user?.avatarUrl ?? user?.avatar_url ?? this.user.avatarUrl,
      };

      this.user = normalized as typeof this.user;
      this.permissionsLoaded = false;
      this.activePermissionSlugs = [];
      this.location =
        normalized.currentShopId && normalized.currentShopName
          ? { id: normalized.currentShopId, name: normalized.currentShopName }
          : null;
    },
    async loadPermissionsForCurrentUser() {
      if (!this.user.id || this.permissionsLoading) {
        return;
      }

      this.permissionsLoading = true;

      try {
        if (this.isAdmin) {
          this.activePermissionSlugs = [];
          this.permissionsLoaded = true;
          return;
        }

        const roleId = this.user.crmRoleId || String(this.user.roles?.[0] ?? "");
        if (!roleId) {
          this.activePermissionSlugs = [];
          this.permissionsLoaded = true;
          return;
        }

        const { apiFetch } = useApi();
        const response = await apiFetch<any>(`/v2/role/${encodeURIComponent(roleId)}/permissions`, {
          method: "GET",
        });

        this.activePermissionSlugs = [...collectActiveSlugs(response?.sections ?? [])];
        this.permissionsLoaded = true;
      } catch (_) {
        this.activePermissionSlugs = [];
        this.permissionsLoaded = true;
      } finally {
        this.permissionsLoading = false;
      }
    },
    async fetchMe(options?: { force?: boolean }) {
      const now = Date.now();
      const force = Boolean(options?.force);

      if (this.refreshingUser) {
        return false;
      }

      if (!force && this.lastUserFetchAt && now - this.lastUserFetchAt < 1500) {
        return Boolean(this.user.id);
      }

      this.refreshingUser = true;
      try {
        const { apiFetch } = useApi();
        const me = await apiFetch<any>("/auth/me", { method: "GET" });
        this.setUser(me);
        useLocationStore().syncFromUser(me);
        await this.loadPermissionsForCurrentUser();
        this.lastUserFetchAt = Date.now();
        return Boolean(this.user.id);
      } catch (error: any) {
        const status = error?.statusCode ?? error?.status ?? error?.response?.status;
        if (status === 401 || status === 403) {
          this.logout();
        }
        return false;
      } finally {
        this.refreshingUser = false;
      }
    },
    login(token: string, userData: any) {
      this.token = token;
      this.setUser(userData);
      useLocationStore().syncFromUser(userData);
      try {
        const tokenCookie = useCookie<string | null>("auth_token", { sameSite: "lax" });
        tokenCookie.value = token;
        if (import.meta.client) {
          localStorage.setItem("auth_token", token);
        }
      } catch (_) {}
    },
    setToken(token: string) {
      this.token = token;
      try {
        const tokenCookie = useCookie<string | null>("auth_token", { sameSite: "lax" });
        tokenCookie.value = token;
        if (import.meta.client) {
          localStorage.setItem("auth_token", token);
        }
      } catch (_) {}
    },
    loadToken() {
      try {
        const tokenCookie = useCookie<string | null>("auth_token");
        if (tokenCookie?.value) {
          this.token = tokenCookie.value;
          return;
        }
        if (import.meta.client) {
          const token = localStorage.getItem("auth_token");
          if (token) this.token = token;
        }
      } catch (_) {}
    },
    setLocation(location: { id: string; name: string }) {
      this.location = location;
      if (import.meta.client) {
        localStorage.setItem("selectedLocation", JSON.stringify(location));
      }
    },
    loadLocation() {
      if (!import.meta.client) {
        return;
      }

      const location = localStorage.getItem("selectedLocation");
      if (location) {
        this.location = JSON.parse(location);
      }
    },
    async init() {
      this.initializing = true;
      try {
        this.loadToken();
        this.loadLocation();
        if (this.token) {
          await this.fetchMe({ force: true });
        }
      } finally {
        this.initializing = false;
      }
    },
    logout() {
      this.user = createEmptyUser() as typeof this.user;
      this.token = null;
      this.location = null;
      this.refreshingUser = false;
      this.lastUserFetchAt = 0;
      this.permissionsLoaded = false;
      this.permissionsLoading = false;
      this.activePermissionSlugs = [];
      useLocationStore().reset();
      try {
        const tokenCookie = useCookie<string | null>("auth_token");
        tokenCookie.value = null;
        if (import.meta.client) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("selectedLocation");
        }
      } catch (_) {}
    },
  },
});

