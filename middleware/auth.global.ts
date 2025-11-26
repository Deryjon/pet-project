import { useUserStore } from "~/store/useUserStore";

export default defineNuxtRouteMiddleware((to) => {
  const isAuthRoute = to.path.startsWith("/auth");

  // Read token from cookie so SSR and client both work
  const tokenCookie = useCookie<string | null>("auth_token");
  const hasToken = Boolean(tokenCookie.value);

  // Also sync token to store on client for UI state
  if (process.client) {
    const userStore = useUserStore();
    try {
      userStore.loadToken();
    } catch (_) {
      // ignore client storage access issues
    }
  }

  if (!hasToken && !isAuthRoute) {
    return navigateTo("/auth/login");
  }
});
