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
      "write-offs",
      "import-details",
      "transfers",
      "order-detail",
      "inventory-list",
    ],
  },
  "/products/catalog": { slug: "catalog-operations" },
  "/products/create": { anyOf: ["product-create", "product-edit"] },
  "/products/import": { slug: "import-details" },
  "/products/import/edit": { anyOf: ["import-check", "import-details"] },
  "/products/import/list": { slug: "import-details" },
  "/products/inventory": { slug: "inventory-list" },
  "/products/orders": { slug: "order-detail" },
  "/products/revaluation": { slug: "product-revaluation" },
  "/products/suppliers": { slug: "supplier-list" },
  "/products/transfer": { slug: "transfers" },
  "/products/writeoff": { slug: "write-offs" },
  "/products/write-off": { slug: "write-offs" },
  "/products/settings": {
    anyOf: [
      "bulk-price-tags",
      "product-bulk-archive",
      "bulk-products-fields",
      "bulk-photo",
      "small-quantity-products",
      "price-edit",
    ],
  },
  "/order/new-order": { slug: "order-new" },
  "/order": { anyOf: ["order-new", "orders", "cash-shifts-detail", "gl-transaction-view"] },
  "/order/all": { slug: "orders" },
  "/clients": { anyOf: ["clients", "loyalty-setting", "debt-detail", "group-list"] },
  "/clients/all": { slug: "clients" },
  "/clients/loyalty-program": { slug: "loyalty-setting" },
  "/clients/cashbox": { slug: "debt-detail" },
  "/analytics": {
    anyOf: [
      "reports-shop-summary",
      "summary-report",
      "reports-products-summary",
      "report-product",
      "reports-clients-summary",
      "report-client",
      "report-seller",
    ],
  },
  "/analytics/shop": { anyOf: ["reports-shop-summary", "summary-report"] },
  "/analytics/products": {
    anyOf: [
      "reports-products-summary",
      "reports-products-supplier",
      "reports-products-efficiency",
      "reports-products-leftover",
      "reports-products-import",
      "report-product",
    ],
  },
  "/analytics/sellers": { anyOf: ["report-seller", "report-seller-products"] },
  "/analytics/clients": { anyOf: ["reports-clients-summary", "reports-clients-purchases", "report-client"] },
  "/settings/profile": { slug: "settings-profile" },
  "/settings/company": { slug: "company-edit" },
  "/settings/payment-types": { slug: "payment-types" },
  "/settings/cheque": { slug: "cheque-list" },
  "/settings/cheque/create": { slug: "cheque-create" },
  "/settings/checks": { slug: "cheque-list" },
  "/settings/shop": { slug: "shop-list" },
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
      "write-off",
      "write-offs",
      "import",
      "import-details",
      "transfer",
      "transfers",
      "all-orders",
      "order-detail",
      "inventory",
      "inventory-list",
    ],
  },
  "/products/catalog": {
    anyOf: [
      "catalog",
      "catalog-operations",
      "catalog-statistics",
      "product-supply-price",
      "product-list",
      "product-create",
      "product-edit",
      "product-price-edit",
      "product-photo",
      "product-excel-export",
      "bulk-price-tags",
      "bulk-products-fields",
      "bulk-photo",
      "small-quantity-products",
      "price-edit",
      "product-bulk-archive",
    ],
  },
  "/products/import": {
    anyOf: [
      "import",
      "import-details",
      "import-create",
      "import-check",
      "import-delete",
    ],
  },
  "/products/orders": {
    anyOf: [
      "all-orders",
      "order-detail",
      "order-create",
      "order-edit",
      "order-accept",
      "order-payment",
      "order-all-sum",
      "order/return",
    ],
  },
  "/products/inventory": {
    anyOf: [
      "inventory",
      "inventory-list",
      "inventory-create",
      "inventory-partial",
      "inventory-result",
      "inventory-finish",
      "inventory-delete",
      "inventory-block",
      "inventory-declared",
    ],
  },
  "/products/transfer": {
    anyOf: [
      "transfer",
      "transfers",
      "transfer-create",
      "transfer-check",
    ],
  },
  "/products/revaluation": {
    anyOf: [
      "revaluation",
      "product-revaluation",
      "revaluation-accept",
      "revaluation-create",
      "revaluation-file",
    ],
  },
  "/products/writeoff": {
    anyOf: [
      "write-off",
      "write-offs",
      "write-off-create",
      "write-off-finish",
      "write-off-delete",
      "write-off-cost",
    ],
  },
  "/products/write-off": {
    anyOf: [
      "write-off",
      "write-offs",
      "write-off-create",
      "write-off-finish",
      "write-off-delete",
      "write-off-cost",
    ],
  },
  "/products/suppliers": {
    anyOf: [
      "suppliers",
      "supplier-list",
      "supplier-create",
      "supplier-edit",
    ],
  },
  "/order": {
    anyOf: [
      "new-sale",
      "order-new",
      "all-sales",
      "orders",
      "cash-shifts",
      "cash-shifts-detail",
      "cashbox-operations",
      "gl-transaction-view",
    ],
  },
  "/order/new-order": {
    anyOf: [
      "new-sale",
      "order-new",
      "manual-discount",
      "order-return",
      "order-debt",
      "delay-finish",
      "sell-gift-card",
      "pay-gift-card",
    ],
  },
  "/order/all": {
    anyOf: [
      "all-sales",
      "orders",
      "show-all-sales",
      "show_deleted_orders",
      "orders-other-shops",
    ],
  },
  "/clients": {
    anyOf: [
      "all-clients",
      "clients",
      "debts",
      "debt-detail",
      "loyalty-program",
      "loyalty-setting",
      "clients-group",
      "group-list",
    ],
  },
  "/clients/all": { anyOf: ["all-clients", "clients"] },
  "/clients/loyalty-program": { anyOf: ["loyalty-program", "loyalty-setting"] },
  "/clients/cashbox": { anyOf: ["debts", "debt-detail"] },
  "/analytics": {
    anyOf: [
      "reports-shop",
      "reports-shop-summary",
      "summary-report",
      "report-products",
      "reports-products-summary",
      "report-product",
      "report-clients",
      "reports-clients-summary",
      "report-client",
      "report-sellers",
      "report-seller",
    ],
  },
  "/analytics/shop": { anyOf: ["reports-shop", "reports-shop-summary", "summary-report"] },
  "/analytics/products": {
    anyOf: [
      "report-products",
      "reports-products-summary",
      "reports-products-supplier",
      "reports-products-efficiency",
      "reports-products-leftover",
      "reports-products-import",
      "report-product",
    ],
  },
  "/analytics/sellers": { anyOf: ["report-sellers", "report-seller", "report-seller-products"] },
  "/analytics/clients": { anyOf: ["report-clients", "reports-clients-summary", "reports-clients-purchases", "report-client"] },
  "/management/employees": {
    anyOf: [
      "employees",
      "employee-list",
      "employee-create",
      "employee-edit",
      "employee-delete",
      "employee-block",
      "employee-session-management",
    ],
  },
  "/management/roles": {
    anyOf: [
      "roles",
      "role-list",
      "role-create",
      "role-edit",
      "management-role-delete",
    ],
  },
  "/settings/profile": { anyOf: ["settings-profiles", "settings-profile"] },
  "/settings/company": { anyOf: ["settings-company", "company-edit"] },
  "/settings/payment-types": {
    anyOf: [
      "settings-payment",
      "payment-types",
      "payment-type-create",
      "payment-type-edit",
      "payment-type-delete",
      "currency-list",
      "currency-create",
      "currency-edit",
      "currency-delete",
    ],
  },
  "/settings/cheque": {
    anyOf: [
      "settings-cheque",
      "cheque-list",
      "cheque-create",
      "cheque-edit",
      "cheque-delete",
    ],
  },
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
    { path: "/products/import", slug: "import-details" },
    { path: "/products/orders", slug: "order-detail" },
    { path: "/products/inventory", slug: "inventory-list" },
    { path: "/products/transfer", slug: "transfers" },
    { path: "/products/writeoff", slug: "write-offs" },
    { path: "/order/all", slug: "orders" },
    { path: "/clients/all", slug: "clients" },
    { path: "/clients/loyalty-program", slug: "loyalty-setting" },
    { path: "/clients/cashbox", slug: "debt-detail" },
    { path: "/analytics/shop", slug: "reports-shop-summary" },
    { path: "/analytics/products", slug: "reports-products-summary" },
    { path: "/analytics/sellers", slug: "report-seller" },
    { path: "/analytics/clients", slug: "reports-clients-summary" },
    { path: "/management/employees", slug: "employee-list" },
    { path: "/management/roles", slug: "role-list" },
    { path: "/settings/profile", slug: "settings-profile" },
    { path: "/settings/company", slug: "company-edit" },
    { path: "/settings/payment-types", slug: "payment-types" },
    { path: "/settings/cheque", slug: "cheque-list" },
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
