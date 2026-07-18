import { isMobileAppAllowedPath } from "~/composables/useMobileAppScope";

// Runs after auth.global.ts (alphabetical order). Further restricts the
// Capacitor (App Store) build to its allowed section, regardless of the
// user's CRM permissions — desktop-only workflows never ship in the app.
export default defineNuxtRouteMiddleware((to) => {
  const config = useRuntimeConfig();
  if (config.public.appMode !== "mobile") return;

  if (!isMobileAppAllowedPath(to.path)) {
    return navigateTo("/dashboard");
  }
});
