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
  const name = String(shop?.shop?.name ?? shop?.name ?? "");

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

export const useUserStore = defineStore("user", {
  state: () => ({
    user: createEmptyUser(),
    token: null as string | null,
    location: null as null | { id: string; name: string },
    initializing: false as boolean,
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
      return ["platform_admin", "support"].some((role) => this.normalizedRoles.includes(role));
    },
    fullName: (state) =>
      state.user.firstName || state.user.lastName
        ? `${state.user.firstName} ${state.user.lastName}`.trim()
        : state.user.name,
    isAdmin(): boolean {
      return this.normalizedRoles.includes("admin") || this.normalizedRoles.includes("админ");
    },
  },

  actions: {
    setUser(user: any) {
      const normalizedRole =
        user?.role?.id ??
        user?.role?.role_id ??
        user?.role?.name ??
        user?.roles?.[0]?.role_id ??
        user?.roles?.[0]?.role?.id ??
        user?.roles?.[0]?.role?.name ??
        user?.role ??
        "";
      const normalizedRoles = Array.isArray(user?.roles)
        ? user.roles
            .flatMap((item: any) => [
              item?.role_id,
              item?.role?.id,
              item?.role?.name,
              item?.name,
              item?.role,
            ])
            .filter(Boolean)
            .map((role: any) => String(role))
        : normalizedRole
          ? [String(normalizedRole)]
          : [];

      const normalizedCompany = normalizeCompany(user?.company);
      const normalizedShops = Array.isArray(user?.shops)
        ? user.shops.map((shop: any) => normalizeShop(shop)).filter(Boolean)
        : [];

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
        companyId:
          String(user?.company_id ?? normalizedCompany?.companyId ?? normalizedCompany?.id ?? ""),
        company: normalizedCompany,
        canSwitchShops: Boolean(user?.can_switch_shops),
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
      this.location =
        normalized.currentShopId && normalized.currentShopName
          ? { id: normalized.currentShopId, name: normalized.currentShopName }
          : null;
    },
    async fetchMe() {
      try {
        const { apiFetch } = useApi();
        const me = await apiFetch<any>("/auth/me", { method: "GET" });
        this.setUser(me);
        useLocationStore().syncFromUser(me);
      } catch (error: any) {
        if (error?.status === 401 || error?.response?.status === 401) {
          this.logout();
        }
      }
    },
    login(token: string, userData: any) {
      this.token = token;
      this.setUser(userData);
      useLocationStore().syncFromUser(userData);
      try {
        const tokenCookie = useCookie<string | null>("auth_token", { sameSite: "lax" });
        tokenCookie.value = token;
        if (process.client) {
          localStorage.setItem("auth_token", token);
        }
      } catch (_) {}
    },
    setToken(token: string) {
      this.token = token;
      try {
        const tokenCookie = useCookie<string | null>("auth_token", { sameSite: "lax" });
        tokenCookie.value = token;
        if (process.client) {
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
        if (process.client) {
          const token = localStorage.getItem("auth_token");
          if (token) this.token = token;
        }
      } catch (_) {}
    },
    setLocation(location: { id: string; name: string }) {
      this.location = location;
      if (process.client) {
        localStorage.setItem("selectedLocation", JSON.stringify(location));
      }
    },
    loadLocation() {
      if (!process.client) {
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
          await this.fetchMe();
        }
      } finally {
        this.initializing = false;
      }
    },
    logout() {
      this.user = createEmptyUser() as typeof this.user;
      this.token = null;
      this.location = null;
      useLocationStore().reset();
      try {
        const tokenCookie = useCookie<string | null>("auth_token");
        tokenCookie.value = null;
        if (process.client) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("selectedLocation");
        }
      } catch (_) {}
    },
  },
});
