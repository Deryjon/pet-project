import { useUserStore } from "~/store/useUserStore";

type AccessItem = {
  slug?: string;
  anyOf?: string[];
};

export const ROUTE_PERMISSION_MAP: Record<string, AccessItem> = {
  "/": { slug: "dashboard-orders" },
  "/dashboard": { slug: "dashboard-orders" },
  "/products": {
    anyOf: [
      "catalog-operations",
      "supplier-list",
      "product-revaluation",
    ],
  },
  "/products/catalog": { slug: "catalog-operations" },
  "/products/create": { anyOf: ["product-create", "product-edit"] },
  "/products/revaluation": { slug: "product-revaluation" },
  "/products/suppliers": { slug: "supplier-list" },
  "/order/new-order": { slug: "order-new" },
  "/order": { anyOf: ["order-new", "orders"] },
  "/order/all": { slug: "orders" },
  "/clients/all": { slug: "clients" },
  "/analytics/shop": { slug: "summary-report" },
  "/settings/profile": { slug: "settings-profile" },
  "/settings/company": { slug: "company-edit" },
  "/management/employees": { slug: "employee-list" },
  "/management/create-employees": { slug: "employee-create" },
  "/management/roles": { slug: "role-list" },
};

export const MENU_PERMISSION_MAP: Record<string, AccessItem> = {
  "/dashboard": { slug: "dashboard-orders" },
  "/products": {
    anyOf: [
      "catalog",
      "catalog-operations",
      "suppliers",
      "supplier-list",
      "revaluation",
      "product-revaluation",
    ],
  },
  "/products/catalog": { slug: "catalog" },
  "/products/revaluation": { slug: "revaluation" },
  "/products/suppliers": { slug: "suppliers" },
  "/order": { anyOf: ["new-sale", "order-new", "all-sales", "orders"] },
  "/order/new-order": { slug: "new-sale" },
  "/order/all": { slug: "all-sales" },
  "/clients": { anyOf: ["all-clients", "clients"] },
  "/clients/all": { slug: "all-clients" },
  "/analytics": { anyOf: ["reports-shop", "summary-report"] },
  "/analytics/shop": { slug: "reports-shop" },
  "/management/employees": { slug: "employees" },
  "/management/roles": { slug: "roles" },
  "/settings/profile": { slug: "settings-profiles" },
  "/settings/company": { slug: "settings-company" },
};

const FULL_ACCESS_ROLES = new Set([
  "admin",
  "administrator",
  "manager",
  "store_manager",
  "owner",
  "superadmin",
  "super_admin",
  "platform_admin",
]);

const ALWAYS_ALLOWED_PREFIXES = ["/auth", "/platform/login", "/403"];

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

function accessItemAllows(item: AccessItem | undefined, can: (slug: string) => boolean) {
  if (!item) return true;
  if (item.slug && can(item.slug)) return true;
  return item.anyOf?.some((slug) => can(slug)) ?? false;
}

function findAccessItem(path: string, map: Record<string, AccessItem>) {
  const normalizedPath = path.split("?")[0] || "/";
  const match = Object.keys(map)
    .filter((routePath) => pathMatches(normalizedPath, routePath))
    .sort((a, b) => b.length - a.length)[0];

  return match ? map[match] : undefined;
}

export function normalizeAccessRoles(roles: unknown[]) {
  return roles.map(normalizeRole).filter(Boolean);
}

export function isFullAccessRole(roles: unknown[]) {
  return hasAnyRole(normalizeAccessRoles(roles), FULL_ACCESS_ROLES);
}

export function canAccessPath(path: string, roles: unknown[]) {
  if (ALWAYS_ALLOWED_PREFIXES.some((prefix) => pathMatches(path, prefix))) {
    return true;
  }

  return isFullAccessRole(roles);
}

export function routeCanAccess(path: string, can: (slug: string) => boolean) {
  if (ALWAYS_ALLOWED_PREFIXES.some((prefix) => pathMatches(path, prefix))) {
    return true;
  }

  if (can("__admin__")) return true;

  const item = findAccessItem(path, ROUTE_PERMISSION_MAP);
  return Boolean(item) && accessItemAllows(item, can);
}

export function menuCanAccess(path: string, can: (slug: string) => boolean) {
  if (can("__admin__")) return true;

  const item = MENU_PERMISSION_MAP[path] ?? findAccessItem(path, MENU_PERMISSION_MAP);
  return Boolean(item) && accessItemAllows(item, can);
}

export function firstAllowedCompanyRoute(roles: unknown[]) {
  return isFullAccessRole(roles) ? "/dashboard" : "/403";
}

export function firstAllowedRbacRoute(can: (slug: string) => boolean) {
  const candidates = [
    { path: "/dashboard", slug: "dashboard-orders" },
    { path: "/order/new-order", slug: "order-new" },
    { path: "/products/catalog", slug: "catalog-operations" },
    { path: "/order/all", slug: "orders" },
    { path: "/clients/all", slug: "clients" },
    { path: "/settings/profile", slug: "settings-profile" },
  ];

  return candidates.find((item) => can(item.slug))?.path ?? "/403";
}

export function useAccessControl() {
  const userStore = useUserStore();

  const userRoles = computed(() => userStore.normalizedRoles);
  const hasFullAccess = computed(() => userStore.isAdmin);

  function canAccess(routePath: string) {
    return menuCanAccess(routePath, userStore.can);
  }

  return {
    userRoles,
    hasFullAccess,
    can: userStore.can,
    canAccess,
    canRoute: (routePath: string) => routeCanAccess(routePath, userStore.can),
    firstAllowedRoute: computed(() => firstAllowedRbacRoute(userStore.can)),
  };
}
