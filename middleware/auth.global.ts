import { useUserStore } from "~/store/useUserStore";

export default defineNuxtRouteMiddleware((to) => {
  if (process.server) return;

  const userStore = useUserStore();

  try {
    userStore.loadToken();
  } catch (_) {
    // ignore localStorage access issues
  }

  const isAuthRoute = to.path.startsWith("/auth");

  if (!userStore.isLoggedIn && !isAuthRoute) {
    return navigateTo("/auth/register");
  }
});
