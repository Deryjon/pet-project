import { computed, onMounted } from "vue";

export type PlatformStatus = "active" | "inactive";

export interface PlatformCompany {
  id: string;
  name: string;
  login: string;
  subdomain: string;
  status: PlatformStatus;
  createdAt: string;
  shopsCount: number;
  usersCount: number;
}

export interface PlatformShop {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  branchCode: string;
  status: PlatformStatus;
  createdAt: string;
  city: string;
}

export interface PlatformUser {
  id: string;
  fullName: string;
  phone: string;
  companyId: string;
  companyName: string;
  currentShopId: string;
  currentShopName: string;
  role: string;
  status: PlatformStatus;
  createdAt: string;
  email: string;
}

export interface PlatformActivity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  tone: "brand" | "success" | "warning";
}

const seedCompanies = (): PlatformCompany[] => [
  { id: "company-1", name: "Konkurent Retail", login: "konkurent-retail", subdomain: "retail.konkurent", status: "active", createdAt: "2026-03-11", shopsCount: 14, usersCount: 86 },
  { id: "company-2", name: "Atlas Group", login: "atlas-group", subdomain: "atlas.konkurent", status: "active", createdAt: "2026-02-22", shopsCount: 8, usersCount: 41 },
  { id: "company-3", name: "Verde Commerce", login: "verde-commerce", subdomain: "verde.konkurent", status: "inactive", createdAt: "2026-01-18", shopsCount: 5, usersCount: 17 },
  { id: "company-4", name: "Northwind Mart", login: "northwind-mart", subdomain: "northwind.konkurent", status: "active", createdAt: "2025-12-06", shopsCount: 19, usersCount: 112 },
  { id: "company-5", name: "Urban Supply", login: "urban-supply", subdomain: "urban.konkurent", status: "active", createdAt: "2025-11-24", shopsCount: 6, usersCount: 29 },
];

const seedShops = (): PlatformShop[] => [
  { id: "shop-1", name: "Tashkent Central", companyId: "company-1", companyName: "Konkurent Retail", branchCode: "KR-TAS-01", status: "active", createdAt: "2026-03-12", city: "Tashkent" },
  { id: "shop-2", name: "Samarqand Plaza", companyId: "company-1", companyName: "Konkurent Retail", branchCode: "KR-SAM-02", status: "active", createdAt: "2026-03-18", city: "Samarkand" },
  { id: "shop-3", name: "Atlas Premium Hall", companyId: "company-2", companyName: "Atlas Group", branchCode: "ATL-TP-07", status: "active", createdAt: "2026-02-26", city: "Tashkent" },
  { id: "shop-4", name: "Atlas Riverside", companyId: "company-2", companyName: "Atlas Group", branchCode: "ATL-RIV-03", status: "inactive", createdAt: "2026-02-28", city: "Bukhara" },
  { id: "shop-5", name: "Verde Downtown", companyId: "company-3", companyName: "Verde Commerce", branchCode: "VRD-DT-04", status: "inactive", createdAt: "2026-01-21", city: "Tashkent" },
  { id: "shop-6", name: "Northwind Flagship", companyId: "company-4", companyName: "Northwind Mart", branchCode: "NWM-FLG-01", status: "active", createdAt: "2025-12-09", city: "Tashkent" },
  { id: "shop-7", name: "Urban Green Mall", companyId: "company-5", companyName: "Urban Supply", branchCode: "URB-GM-02", status: "active", createdAt: "2025-11-28", city: "Andijan" },
];

const seedUsers = (): PlatformUser[] => [
  { id: "user-1", fullName: "Sardor Obidjonov", phone: "+998 90 345 12 12", companyId: "company-1", companyName: "Konkurent Retail", currentShopId: "shop-1", currentShopName: "Tashkent Central", role: "Owner", status: "active", createdAt: "2026-03-13", email: "sardor@konkurent.uz" },
  { id: "user-2", fullName: "Madina Yuldasheva", phone: "+998 93 118 88 21", companyId: "company-1", companyName: "Konkurent Retail", currentShopId: "shop-2", currentShopName: "Samarqand Plaza", role: "Store Manager", status: "active", createdAt: "2026-03-19", email: "madina@konkurent.uz" },
  { id: "user-3", fullName: "Jasur Eshnazarov", phone: "+998 97 411 55 30", companyId: "company-2", companyName: "Atlas Group", currentShopId: "shop-3", currentShopName: "Atlas Premium Hall", role: "Admin", status: "active", createdAt: "2026-02-27", email: "jasur@atlas.uz" },
  { id: "user-4", fullName: "Aziza Karimova", phone: "+998 90 567 22 91", companyId: "company-3", companyName: "Verde Commerce", currentShopId: "shop-5", currentShopName: "Verde Downtown", role: "Cashier", status: "inactive", createdAt: "2026-01-24", email: "aziza@verde.uz" },
  { id: "user-5", fullName: "Bekzod Turaev", phone: "+998 91 777 11 40", companyId: "company-4", companyName: "Northwind Mart", currentShopId: "shop-6", currentShopName: "Northwind Flagship", role: "Operations Lead", status: "active", createdAt: "2025-12-15", email: "bekzod@northwind.uz" },
  { id: "user-6", fullName: "Shahnoza Alimuhamedova", phone: "+998 88 900 42 55", companyId: "company-5", companyName: "Urban Supply", currentShopId: "shop-7", currentShopName: "Urban Green Mall", role: "Manager", status: "active", createdAt: "2025-12-02", email: "shahnoza@urban.uz" },
];

const seedActivity = (): PlatformActivity[] => [
  { id: "activity-1", title: "New company created", description: "Northwind Mart was onboarded with 3 initial roles and 2 branch templates.", timestamp: "8 min ago", tone: "brand" },
  { id: "activity-2", title: "Shop activated", description: "Atlas Premium Hall moved from draft to active and became available for assignments.", timestamp: "24 min ago", tone: "success" },
  { id: "activity-3", title: "Access policy updated", description: "Platform admin updated company-level permissions for Konkurent Retail.", timestamp: "1 hour ago", tone: "warning" },
];

export function usePlatformAdminSession() {
  const authenticated = useState<boolean>("platform-admin-authenticated", () => false);

  const restore = () => {
    if (!process.client) return;
    authenticated.value = localStorage.getItem("platform-admin-authenticated") === "1";
  };

  const signIn = () => {
    authenticated.value = true;
    if (process.client) localStorage.setItem("platform-admin-authenticated", "1");
  };

  const signOut = () => {
    authenticated.value = false;
    if (process.client) localStorage.removeItem("platform-admin-authenticated");
  };

  onMounted(restore);

  return { authenticated, restore, signIn, signOut };
}

export function usePlatformAdminMock() {
  const companies = useState<PlatformCompany[]>("platform-admin-companies", seedCompanies);
  const shops = useState<PlatformShop[]>("platform-admin-shops", seedShops);
  const users = useState<PlatformUser[]>("platform-admin-users", seedUsers);
  const activity = useState<PlatformActivity[]>("platform-admin-activity", seedActivity);

  const stats = computed(() => ({
    totalCompanies: companies.value.length,
    totalShops: shops.value.length,
    totalUsers: users.value.length,
    activeCompanies: companies.value.filter((item) => item.status === "active").length,
  }));

  const companyOptions = computed(() => companies.value.map((company) => ({ label: company.name, value: company.id })));
  const shopOptions = computed(() => shops.value.map((shop) => ({ label: shop.name, value: shop.id })));
  const userRoleOptions = [
    { label: "Owner", value: "Owner" },
    { label: "Admin", value: "Admin" },
    { label: "Store Manager", value: "Store Manager" },
    { label: "Manager", value: "Manager" },
    { label: "Cashier", value: "Cashier" },
    { label: "Operations Lead", value: "Operations Lead" },
  ];

  function upsertCompany(payload: Omit<PlatformCompany, "id" | "createdAt"> & { id?: string }) {
    const nextItem: PlatformCompany = {
      id: payload.id ?? `company-${Date.now()}`,
      createdAt: payload.id ? companies.value.find((item) => item.id === payload.id)?.createdAt ?? new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      ...payload,
    };
    companies.value = payload.id ? companies.value.map((item) => (item.id === payload.id ? nextItem : item)) : [nextItem, ...companies.value];
  }

  function upsertShop(payload: Omit<PlatformShop, "id" | "createdAt" | "companyName"> & { id?: string }) {
    const company = companies.value.find((item) => item.id === payload.companyId);
    const nextItem: PlatformShop = {
      id: payload.id ?? `shop-${Date.now()}`,
      companyName: company?.name ?? "Unknown company",
      createdAt: payload.id ? shops.value.find((item) => item.id === payload.id)?.createdAt ?? new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      ...payload,
    };
    shops.value = payload.id ? shops.value.map((item) => (item.id === payload.id ? nextItem : item)) : [nextItem, ...shops.value];
  }

  function upsertUser(payload: Omit<PlatformUser, "id" | "createdAt" | "companyName" | "currentShopName"> & { id?: string }) {
    const company = companies.value.find((item) => item.id === payload.companyId);
    const shop = shops.value.find((item) => item.id === payload.currentShopId);
    const nextItem: PlatformUser = {
      id: payload.id ?? `user-${Date.now()}`,
      companyName: company?.name ?? "Unknown company",
      currentShopName: shop?.name ?? "Unknown shop",
      createdAt: payload.id ? users.value.find((item) => item.id === payload.id)?.createdAt ?? new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      ...payload,
    };
    users.value = payload.id ? users.value.map((item) => (item.id === payload.id ? nextItem : item)) : [nextItem, ...users.value];
  }

  return { companies, shops, users, activity, stats, companyOptions, shopOptions, userRoleOptions, upsertCompany, upsertShop, upsertUser };
}
