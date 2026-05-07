import { usePlatformAdminApi } from "@/composables/usePlatformAdmin";

export function usePlatformCompanies() {
  const api = usePlatformAdminApi();

  return {
    getCompanies: api.getCompanies,
    getCompany: api.getCompany,
    createCompany: api.createCompany,
    updateCompany: api.updateCompany,
    updateCompanyStatus: api.updateCompanyStatus,
    deleteCompany: api.deleteCompany,
    getCompanyShops: api.getCompanyShops,
    createShop: api.createShop,
    updateShop: api.updateShop,
    updateShopStatus: api.updateShopStatus,
    deleteShop: api.deleteShop,
  };
}
