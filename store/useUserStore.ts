import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    user: {
      id: null as number | null,
      name: "Iskandarjon Yusupov",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    token: null as string | null,
    location: null as null | { id: number; name: string },
  }),
  getters:{
    isLoggedIn: (state) => !!state.token,

  },

  actions: {
    setUser(user: { id: number; name: string; avatarUrl: string }) {
      this.user = user;
    },
    login(token: string, userData: any) {
        this.token = token;
        this.user = userData;
      },
    setToken(token: string) {
      this.token = token;
      localStorage.setItem("auth_token", token);
    },

    loadToken() {
      const token = localStorage.getItem("auth_token");
      if (token) this.token = token;
    },

    setLocation(location: { id: number; name: string }) {
      this.location = location;
      localStorage.setItem("selectedLocation", JSON.stringify(location));
    },

    loadLocation() {
        const location = localStorage.getItem("selectedLocation");
        if (location) this.location = JSON.parse(location);
    },
    init() {
      this.loadToken();
      this.loadLocation();
    },
    logout() {
      this.user = { id: null, name: "", avatarUrl: "" };
      this.token = null;
      this.location = null;
      localStorage.clear();
    },
  },
});
