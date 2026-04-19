import { useUserStore } from "~/store/useUserStore";

const FULL_ACCESS_ROLES = new Set([
  "admin",
  "administrator",
  "администратор",
  "админ",
  "manager",
  "store_manager",
  "управляющий",
  "управляющий_магазином",
  "управляющий_магазином",
  "owner",
  "владелец",
]);

const CASHIER_ROLES = new Set(["cashier", "кассир"]);
const SELLER_ROLES = new Set(["seller", "продавец", "sales", "employee", "сотрудник"]);

const CASHIER_ALLOWED_PREFIXES = [
  "/",
  "/dashboard",
  "/order/new-order",
  "/order/all",
  "/clients/all",
  "/settings/profile",
];

const SELLER_ALLOWED_PREFIXES = [
  ...CASHIER_ALLOWED_PREFIXES,
  "/products/catalog",
];

const ALWAYS_ALLOWED_PREFIXES = ["/auth", "/platform/login"];

function normalizeRole(role: unknown) {
  return String(role || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function pathMatches(path: string, prefix: string) {
  if (prefix === "/") return path === "/";
  return path === prefix || path.startsWith(`${prefix}/`);
}

function hasAnyRole(roles: string[], allowed: Set<string>) {
  return roles.some((role) => allowed.has(role));
}

function allowedPrefixesForRoles(roles: string[]) {
  if (hasAnyRole(roles, FULL_ACCESS_ROLES)) return null;
  if (hasAnyRole(roles, CASHIER_ROLES)) return CASHIER_ALLOWED_PREFIXES;
  if (hasAnyRole(roles, SELLER_ROLES)) return SELLER_ALLOWED_PREFIXES;
  return SELLER_ALLOWED_PREFIXES;
}

export function normalizeAccessRoles(roles: unknown[]) {
  return roles.map(normalizeRole).filter(Boolean);
}

export function isFullAccessRole(roles: unknown[]) {
  return hasAnyRole(normalizeAccessRoles(roles), FULL_ACCESS_ROLES);
}

export function canAccessPath(path: string, roles: unknown[]) {
  const normalizedRoles = normalizeAccessRoles(roles);

  if (ALWAYS_ALLOWED_PREFIXES.some((prefix) => pathMatches(path, prefix))) {
    return true;
  }

  const prefixes = allowedPrefixesForRoles(normalizedRoles);
  if (!prefixes) return true;

  return prefixes.some((prefix) => pathMatches(path, prefix));
}

export function firstAllowedCompanyRoute(roles: unknown[]) {
  const normalizedRoles = normalizeAccessRoles(roles);
  const prefixes = allowedPrefixesForRoles(normalizedRoles);

  if (!prefixes) return "/dashboard";
  if (hasAnyRole(normalizedRoles, CASHIER_ROLES)) return "/order/new-order";
  if (hasAnyRole(normalizedRoles, SELLER_ROLES)) return "/order/new-order";
  return "/dashboard";
}

export function useAccessControl() {
  const userStore = useUserStore();

  const userRoles = computed(() => userStore.normalizedRoles);
  const hasFullAccess = computed(() => isFullAccessRole(userRoles.value));

  function canAccess(routePath: string) {
    return canAccessPath(routePath, userRoles.value);
  }

  return {
    userRoles,
    hasFullAccess,
    canAccess,
    firstAllowedRoute: computed(() => firstAllowedCompanyRoute(userRoles.value)),
  };
}
