import { defineStore } from "pinia";
import { useApi } from "~/composables/useApi";

export const useUserStore = defineStore("user", {
  state: () => ({
    user: {
      id: null as number | null,
      firstName: "" as string,
      lastName: "" as string,
      birthYear: null as number | null,
      phone: "" as string,
      role: "" as string,
      branchCode: "" as string,
      branchTitle: "" as string,
      // Backward-compat display fields
      name: "" as string,
      avatarUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    token: null as string | null,
    location: null as null | { id: number; name: string },
    initializing: false as boolean,
  }),
  getters:{
    isLoggedIn: (state) => !!state.token,
    fullName: (state) => (state.user.firstName || state.user.lastName) ? `${state.user.firstName} ${state.user.lastName}`.trim() : state.user.name,

  },

  actions: {
    setUser(user: any) {
      // Accept both legacy and API shapes and normalize
      const normalized = {
        id: user?.id ?? null,
        firstName: user?.first_name ?? user?.firstName ?? "",
        lastName: user?.last_name ?? user?.lastName ?? "",
        birthYear: user?.birth_year ?? user?.birthYear ?? null,
        phone: user?.phone ?? "",
        role: user?.role ?? "",
        branchCode: user?.branch_code ?? user?.branchCode ?? "",
        branchTitle: user?.branch_title ?? user?.branchTitle ?? "",
        name: user?.name ?? `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim(),
        avatarUrl: user?.avatarUrl ?? this.user.avatarUrl,
      };
      this.user = normalized as typeof this.user;
    },
    async fetchMe() {
      try {
        const { apiFetch } = useApi();
        const me = await apiFetch<any>("/auth/me", { method: "GET" });
        this.setUser(me);
      } catch (e) {
        // If token invalid, ensure logged-out state
        // Optional: swallow error to avoid UI crash
      }
    },
    login(token: string, userData: any) {
      this.token = token;
      this.user = userData;
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

    setLocation(location: { id: number; name: string }) {
      this.location = location;
      localStorage.setItem("selectedLocation", JSON.stringify(location));
    },

    loadLocation() {
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
        branchCode: "",
        branchTitle: "",
        name: "",
        avatarUrl: "",
      } as any;
      this.token = null;
      this.location = null;
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
