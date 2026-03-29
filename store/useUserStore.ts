import { defineStore } from "pinia";
import { useApi } from "~/composables/useApi";
import { useLocationStore } from "./useLocationStore";

export const useUserStore = defineStore("user", {
  state: () => ({
    user: {
      id: null as number | null,
      firstName: "" as string,
      lastName: "" as string,
      birthYear: null as number | null,
      phone: "" as string,
      role: "" as string,
      roles: [] as string[],
      branchCode: "" as string,
      branchTitle: "" as string,
      currentShopId: "" as string,
      currentShopName: "" as string,
      shops: [] as Array<{ id: string; name: string; relationId?: string }>,
      // Backward-compat display fields
      name: "" as string,
      avatarUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    token: null as string | null,
    location: null as null | { id: string; name: string },
    initializing: false as boolean,
  }),
  getters:{
    isLoggedIn: (state) => !!state.token,
    fullName: (state) => (state.user.firstName || state.user.lastName) ? `${state.user.firstName} ${state.user.lastName}`.trim() : state.user.name,
    isAdmin: (state) => {
      const directRoles = [state.user.role, ...(state.user.roles || [])]
        .map((role) => String(role || "").trim().toLowerCase())
        .filter(Boolean);

      return directRoles.includes("admin") || directRoles.includes("админ");
    },
  },

  actions: {
    setUser(user: any) {
      const normalizedRole =
        user?.role?.name ??
        user?.roles?.[0]?.role?.name ??
        user?.role ??
        "";
      const normalizedRoles = Array.isArray(user?.roles)
        ? user.roles
            .map((item: any) => item?.role?.name ?? item?.name ?? item?.role)
            .filter(Boolean)
            .map((role: any) => String(role))
        : normalizedRole
          ? [String(normalizedRole)]
          : [];

      const normalizedShops = Array.isArray(user?.shops)
        ? user.shops
            .map((shop: any) => {
              const id = String(shop?.shop_id ?? shop?.id ?? "");
              const name = String(shop?.shop?.name ?? shop?.name ?? "");

              if (!id || !name) {
                return null;
              }

              return {
                id,
                name,
                relationId: shop?.id ? String(shop.id) : undefined,
              };
            })
            .filter(Boolean)
        : [];

      const currentShopId = String(
        user?.current_shop_id ?? user?.current_shop?.shop_id ?? "",
      );
      const currentShopName =
        user?.current_shop?.shop?.name ??
        normalizedShops.find((shop: any) => shop?.id === currentShopId)?.name ??
        "";

      // Accept both legacy and API shapes and normalize
      const normalized = {
        id: user?.id ?? null,
        firstName: user?.first_name ?? user?.firstName ?? "",
        lastName: user?.last_name ?? user?.lastName ?? "",
        birthYear: user?.birth_year ?? user?.birthYear ?? null,
        phone: user?.phone ?? user?.phone_number ?? "",
        role: normalizedRole,
        roles: normalizedRoles,
        branchCode:
          user?.branch_code ?? user?.branchCode ?? user?.branch_location ?? currentShopId,
        branchTitle:
          user?.branch_title
          ?? user?.branchTitle
          ?? user?.branch_location
          ?? currentShopName
          ?? user?.branch_code
          ?? "",
        currentShopId,
        currentShopName,
        shops: normalizedShops,
        name:
          user?.name
          ?? user?.full_name
          ?? user?.username
          ?? `${user?.first_name ?? user?.firstName ?? ""} ${user?.last_name ?? user?.lastName ?? ""}`.trim()
          ?? user?.phone
          ?? user?.phone_number
          ?? "",
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
      } catch (e) {
        // If token invalid, ensure logged-out state
        // Optional: swallow error to avoid UI crash
      }
    },
    login(token: string, userData: any) {
      this.token = token;
      this.setUser(userData);
      useLocationStore().syncFromUser(userData);
      try {
        // Persist in both cookie (SSR-friendly) and localStorage
        const tokenCookie = useCookie<string | null>("auth_token", { sameSite: "lax" });
        tokenCookie.value = token;
        if (process.client) {
          localStorage.setItem("auth_token", token);
        }
      } catch (_) {
        // ignore persistence issues
      }
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
        // Prefer cookie (works on server), fall back to localStorage on client
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
        if (location) this.location = JSON.parse(location);
    },
    async init() {
      this.initializing = true;
      try {
        this.loadToken();
        this.loadLocation();
        if (this.token) {
          // Fetch current user details when token is present
          await this.fetchMe();
        }
      } finally {
        this.initializing = false;
      }
    },
    logout() {
      this.user = {
        id: null,
        firstName: "",
        lastName: "",
        birthYear: null,
        phone: "",
        role: "",
        roles: [],
        branchCode: "",
        branchTitle: "",
        currentShopId: "",
        currentShopName: "",
        shops: [],
        name: "",
        avatarUrl: "",
      } as any;
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
