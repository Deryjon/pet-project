import { usePlatformAdminApi } from "@/composables/usePlatformAdmin";

export function usePlatformUsers() {
  const api = usePlatformAdminApi();

  return {
    getPlatformUsers: api.getPlatformUsers,
    getPlatformUser: api.getPlatformUser,
    createPlatformUser: api.createPlatformUser,
    getCompanyUsers: api.getCompanyUsers,
    createCompanyUser: api.createCompanyUser,
    updateCompanyUser: api.updateCompanyUser,
    blockCompanyUser: api.blockCompanyUser,
    unblockCompanyUser: api.unblockCompanyUser,
    deleteCompanyUser: api.deleteCompanyUser,
    updateUser: api.updateUser,
    deleteUser: api.deleteUser,
  };
}
