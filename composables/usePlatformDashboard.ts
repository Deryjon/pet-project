import { usePlatformAdminApi } from "@/composables/usePlatformAdmin";

export function usePlatformDashboard() {
  const api = usePlatformAdminApi();

  return {
    getDashboardStats: api.getDashboardStats,
    getCompanies: api.getCompanies,
    getPlatformUsers: api.getPlatformUsers,
  };
}
