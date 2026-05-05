import { collectActivePermissionIds, type PermissionSection, useRolePermissionsApi } from "@/composables/useRolePermissions";
import { usePlatformAdminApi } from "@/composables/usePlatformAdmin";

export function usePlatformRoles() {
  const api = usePlatformAdminApi();
  const permissionsApi = useRolePermissionsApi();

  return {
    getPlatformRoles: api.getPlatformRoles,
    getCompanyRoles: api.getCompanyRoles,
    updateCompanyRole: api.updateCompanyRole,
    createRole: permissionsApi.createRole,
    updateRoleMeta: permissionsApi.updateRole,
    deleteRole: permissionsApi.deleteRole,
    getRolePermissions: permissionsApi.getRolePermissions,
    updateRolePermissions: permissionsApi.updateRolePermissions,
    getRolesForSelect: permissionsApi.getRolesForSelect,
    collectActivePermissionIds,
  };
}

export type PlatformPermissionSections = PermissionSection[];
