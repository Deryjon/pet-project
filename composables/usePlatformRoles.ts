import { collectActivePermissionIds, type PermissionSection, useRolePermissionsApi } from "@/composables/useRolePermissions";
import { usePlatformAdminApi, type PlatformRole } from "@/composables/usePlatformAdmin";

function mapCrmRoleToPlatformRole(role: any): PlatformRole {
  return {
    id: String(role?.id ?? role?.role_id ?? role?.code ?? "").trim(),
    name: String(role?.name ?? role?.code ?? "").trim(),
    description: String(role?.description ?? "").trim(),
    isAdmin: Boolean(role?.is_admin),
    type: Number(role?.type ?? 0) || 0,
    companyId: String(role?.company_id ?? "").trim(),
  };
}

export function usePlatformRoles() {
  const api = usePlatformAdminApi();
  const permissionsApi = useRolePermissionsApi();

  async function getCompanyRoles(companyId?: string) {
    const roles = await permissionsApi.getRolesForSelect({ companyId });
    return roles.map(mapCrmRoleToPlatformRole).filter((role) => role.id);
  }

  return {
    getPlatformRoles: api.getPlatformRoles,
    getCompanyRoles,
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
