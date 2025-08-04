import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    user: {
      id: null as number | null,
      name: "Iskandarjon Yusupov",
      avatarUrl: "https://scontent.ftas6-2.fna.fbcdn.net/v/t39.30808-6/484968966_1035404795290627_2554265218382193021_n.jpg?stp=dst-jpg_s640x640_tt6&_nc_cat=108&ccb=1-7&_nc_sid=127cfc&_nc_ohc=4A7UJ6b9g3UQ7kNvwELZiIB&_nc_oc=Adm_a8oqn9GSpYsq4I6LYRV3rDSUf3c-4iGPPymmCC2HrLM4s96yBvjn8JliM081SpA&_nc_zt=23&_nc_ht=scontent.ftas6-2.fna&_nc_gid=ZZrpeD07xiqLTmA96UGexA&oh=00_AfVP0nSDuTk7OvGMCxaFwy2d7Z_J96kbsTOnUlbCKjmhLA&oe=68962FCB",
    },
    token: null as string | null,
    location: null as null | { id: number; name: string },
  }),

  actions: {
    setUser(user: { id: number; name: string; avatarUrl: string }) {
      this.user = user;
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
