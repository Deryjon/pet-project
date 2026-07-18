// Routes reachable inside the Capacitor (App Store) build. Everything else
// stays web-only (goods receiving, inventory, management, platform admin, ...).
export const MOBILE_APP_ALLOWED_PREFIXES = [
  "/",
  "/dashboard",
  "/products/catalog",
  "/products/create",
  "/order/new-order",
  "/order/all",
  "/settings/profile",
  "/auth/login",
  "/403",
];

function pathMatches(path: string, prefix: string) {
  if (prefix === "/") return path === "/";
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function isMobileAppAllowedPath(path: string) {
  const normalizedPath = path.split("?")[0] || "/";
  return MOBILE_APP_ALLOWED_PREFIXES.some((prefix) => pathMatches(normalizedPath, prefix));
}
