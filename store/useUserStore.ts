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

export type NormalizedUser = ReturnType<typeof createEmptyUser>;

function createEmptyUser() {
  return {
    id: null as number | null,
    firstName: "" as string,
    lastName: "" as string,
    birthYear: null as number | null,
    phone: "" as string,
    userType: "" as string,
    role: "" as string,
    roleName: "" as string,
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

let permissionsLoadPromise: Promise<void> | null = null;

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null as NormalizedUser | null,
    token: null as string | null,
    refreshToken: null as string | null,
    location: null as null | { id: string; name: string },
    initializing: false as boolean,
    authLoading: true as boolean,
    authChecked: false as boolean,
    authScope: null as "crm" | "platform" | null,
    refreshingUser: false as boolean,
    lastUserFetchAt: 0 as number,
    permissions: [] as string[],
    roles: [] as string[],
    currentTenantId: null as string | null,
    permissionsLoaded: false as boolean,
    permissionsLoading: false as boolean,
    permissionsLoadFailed: false as boolean,
    permissionSections: [] as any[],
    activePermissionSlugs: [] as string[],
  }),
  getters: {
    userState: (state) => state.user ?? createEmptyUser(),
    isLoggedIn: (state) => !!state.token,
    isAuthenticated: (state) => !!state.user?.id,
    isCompanyUser: (state) => state.user?.userType === "company",
    isPlatformUser: (state) => state.user?.userType === "platform",
    normalizedRoles: (state) =>
      [state.user?.role, ...(state.user?.roles || [])]
        .map((role) => String(role || "").trim().toLowerCase())
        .filter(Boolean),
    hasPlatformAccess(): boolean {
      return (
        this.user?.userType === "platform" ||
        ["platform_admin", "support", "superadmin"].some((role) => this.normalizedRoles.includes(role))
      );
    },
    fullName: (state) =>
      state.user?.firstName || state.user?.lastName
        ? `${state.user?.firstName ?? ""} ${state.user?.lastName ?? ""}`.trim()
        : state.user?.name ?? "",
    isAdmin(): boolean {
      return (
        this.user?.userType === "platform" ||
        Boolean(this.user?.crmRole?.isAdmin)
      );
    },
    activeSlugs: (state) => new Set(state.activePermissionSlugs),
    visiblePermissionSections: (state) =>
      state.permissionSections.map((section: any) => ({
        ...section,
        permissions: Array.isArray(section?.permissions)
          ? section.permissions.filter(
              (permission: any) => permission?.is_active && !permission?.hide_from_ui,
            )
          : [],
      })),
    can(): (slug: string) => boolean {
      return (slug: string) => this.user?.userType === "platform" || this.activeSlugs.has(slug);
    },
  },

  actions: {
    setUser(user: any) {
      const crmRole = user?.crm_role
        ? {
            id: String(user.crm_role.id ?? ""),
            name: String(user.crm_role.name ?? ""),
            isAdmin: Boolean(user.crm_role.is_admin ?? user.crm_role.isAdmin),
          }
        : null;
      const displayRoleName = String(crmRole?.name ?? user?.role_name ?? "").trim();
      const roleCandidates = [
        roleValue(user?.role?.code),
        roleValue(user?.role?.role),
        roleValue(user?.role_code),
        roleValue(user?.role?.role_id),
        roleValue(user?.role?.id),
        roleValue(user?.crm_role_id),
        roleValue(user?.role),
        roleValue(user?.roles?.[0]?.role?.code),
        roleValue(user?.roles?.[0]?.role?.role),
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
                roleValue(item?.role_code),
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

      const previousUserId = String(this.user?.id ?? "");
      const previousCrmRoleId = String(this.user?.crmRoleId ?? "");

      const normalized = {
        id: user?.id ?? null,
        firstName: user?.first_name ?? user?.firstName ?? "",
        lastName: user?.last_name ?? user?.lastName ?? "",
        birthYear: user?.birth_year ?? user?.birthYear ?? null,
        phone: user?.phone ?? user?.phone_number ?? "",
        userType: String(user?.user_type ?? ""),
        role: normalizedRole,
        roleName: displayRoleName,
        roles: normalizedRoles,
        crmRoleId: String(user?.crm_role_id ?? crmRole?.id ?? user?.role_code ?? ""),
        crmRole,
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
        avatarUrl: user?.avatarUrl ?? user?.avatar_url ?? this.user?.avatarUrl ?? createEmptyUser().avatarUrl,
      };

      const nextUserId = String(normalized.id ?? "");
      const nextCrmRoleId = String(normalized.crmRoleId ?? "");
      const accessScopeChanged =
        previousUserId !== nextUserId || previousCrmRoleId !== nextCrmRoleId;

      this.user = normalized as typeof this.user;
      this.roles = [...normalizedRoles];
      this.currentTenantId = normalized.companyId || null;
      if (accessScopeChanged) {
        this.permissionsLoaded = false;
      }

      if (previousUserId && previousUserId !== nextUserId) {
        this.permissionSections = [];
        this.activePermissionSlugs = [];
      }
      this.location =
        normalized.currentShopId && normalized.currentShopName
          ? { id: normalized.currentShopId, name: normalized.currentShopName }
          : null;
      this.authChecked = true;
    },
    async fetchPlatformMe() {
      try {
        const { apiFetch } = useApi();
        const response: any = await apiFetch("/platform/auth/me", { method: "GET" });
        this.setUser(response?.user ?? response);
        this.authScope = "platform";
        this.lastUserFetchAt = Date.now();
        return this.isAuthenticated;
      } catch (error: any) {
        const status = error?.statusCode ?? error?.status ?? error?.response?.status;
        if (status === 401 || status === 403) {
          this.logout();
        }
        this.authChecked = true;
        return false;
      }
    },
    async loadPermissionsForCurrentUser(options?: { force?: boolean }) {
      if (this.permissionsLoading && permissionsLoadPromise) {
        await permissionsLoadPromise;
        return;
      }

      if (this.permissionsLoaded && !options?.force) {
        return;
      }

      if (!this.user?.id || this.permissionsLoading) {
        return;
      }

      this.permissionsLoading = true;
      this.permissionsLoadFailed = false;
      const hadPermissions = this.activePermissionSlugs.length > 0;

      permissionsLoadPromise = (async () => {
        try {
          if (this.user?.userType === "platform") {
            this.permissionSections = [];
            this.activePermissionSlugs = [];
            this.permissionsLoaded = true;
            this.permissionsLoadFailed = false;
            return;
          }

          const userId = String(this.user?.id ?? "");
          if (!userId) {
            this.permissionSections = [];
            this.activePermissionSlugs = [];
            this.permissionsLoaded = true;
            this.permissionsLoadFailed = false;
            return;
          }

          const { apiFetch } = useApi();
          const response = await apiFetch<any>(`/v2/user/${encodeURIComponent(userId)}/permissions`, {
            method: "GET",
          });

          const sections = Array.isArray(response?.sections) ? response.sections : [];
          this.permissionSections = sections;
          this.activePermissionSlugs = [...collectActiveSlugs(sections)];
          this.permissions = [...this.activePermissionSlugs];
          this.permissionsLoaded = true;
          this.permissionsLoadFailed = false;
        } catch (_) {
          if (!hadPermissions) {
            this.permissionSections = [];
            this.activePermissionSlugs = [];
            this.permissions = [];
            this.permissionsLoaded = false;
          } else {
            this.permissionsLoaded = true;
          }
          this.permissionsLoadFailed = true;
        }
      })();

      try {
        await permissionsLoadPromise;
      } finally {
        this.permissionsLoading = false;
        permissionsLoadPromise = null;
      }
    },
    async fetchMe(options?: { force?: boolean }) {
      const now = Date.now();
      const force = Boolean(options?.force);

      if (this.refreshingUser) {
        return false;
      }

      if (!force && this.lastUserFetchAt && now - this.lastUserFetchAt < 1500) {
        return this.isAuthenticated;
      }

      this.refreshingUser = true;
      try {
        const { apiFetch } = useApi();
        const me = await apiFetch<any>("/auth/me", { method: "GET" });
        this.setUser(me);
        this.authScope = "crm";
        useLocationStore().syncFromUser(me);
        await this.loadPermissionsForCurrentUser({ force });
        this.lastUserFetchAt = Date.now();
        return this.isAuthenticated;
      } catch (error: any) {
        const status = error?.statusCode ?? error?.status ?? error?.response?.status;
        if (status === 401 || status === 403) {
          this.logout();
        }
        this.authChecked = true;
        return false;
      } finally {
        this.refreshingUser = false;
      }
    },
    async initAuth(options?: { force?: boolean; platform?: boolean }) {
      const force = Boolean(options?.force);
      const platform = Boolean(options?.platform);
      const scope = platform ? "platform" : "crm";

      if (this.authChecked && this.authScope === scope && !force) {
        return this.isAuthenticated;
      }

      this.initializing = true;
      this.authLoading = true;
      this.authScope = scope;

      try {
        this.loadToken();
        this.loadRefreshToken();
        this.loadLocation();

        if (!this.token) {
          this.user = null;
          this.authScope = scope;
          this.authChecked = true;
          return false;
        }

        if (platform) {
          return await this.fetchPlatformMe();
        }

        return await this.fetchMe({ force: true });
      } finally {
        this.authLoading = false;
        this.initializing = false;
        this.authChecked = true;
      }
    },
    login(token: string, userData: any, refreshToken?: string) {
      this.token = token;
      this.refreshToken = refreshToken ? String(refreshToken) : null;
      this.setUser(userData);
      useLocationStore().syncFromUser(userData);
      try {
        const tokenCookie = useCookie<string | null>("auth_token", { sameSite: "lax" });
        const refreshTokenCookie = useCookie<string | null>("auth_refresh_token", { sameSite: "lax" });
        tokenCookie.value = token;
        refreshTokenCookie.value = this.refreshToken;
        if (import.meta.client) {
          localStorage.setItem("auth_token", token);
          if (this.refreshToken) {
            localStorage.setItem("auth_refresh_token", this.refreshToken);
          } else {
            localStorage.removeItem("auth_refresh_token");
          }
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
    setRefreshToken(token: string) {
      this.refreshToken = token;
      try {
        const refreshTokenCookie = useCookie<string | null>("auth_refresh_token", { sameSite: "lax" });
        refreshTokenCookie.value = token;
        if (import.meta.client) {
          localStorage.setItem("auth_refresh_token", token);
        }
      } catch (_) {}
    },
    setAuthTokens(token: string, refreshToken: string) {
      this.setToken(token);
      this.setRefreshToken(refreshToken);
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
    loadRefreshToken() {
      try {
        const refreshTokenCookie = useCookie<string | null>("auth_refresh_token");
        if (refreshTokenCookie?.value) {
          this.refreshToken = refreshTokenCookie.value;
          return;
        }
        if (import.meta.client) {
          const refreshToken = localStorage.getItem("auth_refresh_token");
          if (refreshToken) this.refreshToken = refreshToken;
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
      return this.initAuth({ force: true });
    },
    logout() {
      this.user = null;
      this.token = null;
      this.refreshToken = null;
      this.location = null;
      this.initializing = false;
      this.authLoading = false;
      this.authChecked = true;
      this.authScope = null;
      this.refreshingUser = false;
      this.lastUserFetchAt = 0;
      this.permissionsLoaded = false;
      this.permissionsLoading = false;
      this.permissionsLoadFailed = false;
      this.permissionSections = [];
      this.activePermissionSlugs = [];
      this.permissions = [];
      this.roles = [];
      this.currentTenantId = null;
      useLocationStore().reset();
      try {
        const tokenCookie = useCookie<string | null>("auth_token");
        const refreshTokenCookie = useCookie<string | null>("auth_refresh_token");
        tokenCookie.value = null;
        refreshTokenCookie.value = null;
        if (import.meta.client) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_refresh_token");
          localStorage.removeItem("selectedLocation");
        }
      } catch (_) {}
    },
  },
});

