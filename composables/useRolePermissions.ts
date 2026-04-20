import { useApi } from "~/composables/useApi";

export type PermissionChild = {
  id: string;
  name: string;
  slug: string;
  route: string;
  description: string;
  is_active: boolean;
  hide_from_ui?: boolean;
  children?: PermissionChild[];
};

export type PermissionItem = {
  id: string;
  name: string;
  slug: string;
  route: string;
  description: string;
  is_active: boolean;
  hide_from_ui?: boolean;
  children: PermissionChild[];
};

export type PermissionSection = {
  id: string;
  key: string;
  sequence_number: number;
  permissions: PermissionItem[];
};

export type RolePermissionsResponse = {
  sections: PermissionSection[];
  user_id: string;
};

export type RoleSelectItem = {
  id: string;
  name: string;
  code: string;
  description: string;
  is_admin: boolean;
  company_id: string;
  deleted_at: number;
};

type ApiMethod = "GET" | "POST" | "PUT" | "DELETE";
type RoleRequestContext = {
  companyId?: string;
};

function pickArray<T = any>(input: any, keys: string[]): T[] {
  if (Array.isArray(input)) return input;
  for (const key of keys) {
    if (Array.isArray(input?.[key])) {
      return input[key];
    }
  }
  return [];
}

function asString(value: any): string {
  return String(value ?? "").trim();
}

function asBoolean(value: any): boolean {
  return Boolean(value);
}

function asNumber(value: any): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeChild(raw: any): PermissionChild {
  return {
    id: asString(raw?.id),
    name: asString(raw?.name),
    slug: asString(raw?.slug),
    route: asString(raw?.route),
    description: asString(raw?.description),
    is_active: asBoolean(raw?.is_active),
    hide_from_ui: asBoolean(raw?.hide_from_ui),
    children: pickArray(raw, ["children"]).map(normalizeChild),
  };
}

function normalizePermission(raw: any): PermissionItem {
  return {
    id: asString(raw?.id),
    name: asString(raw?.name),
    slug: asString(raw?.slug),
    route: asString(raw?.route),
    description: asString(raw?.description),
    is_active: asBoolean(raw?.is_active),
    hide_from_ui: asBoolean(raw?.hide_from_ui),
    children: pickArray(raw, ["children"]).map(normalizeChild),
  };
}

function normalizeSection(raw: any): PermissionSection {
  return {
    id: asString(raw?.id),
    key: asString(raw?.key),
    sequence_number: asNumber(raw?.sequence_number),
    permissions: pickArray(raw, ["permissions"]).map(normalizePermission),
  };
}

function normalizeRolePermissions(raw: any): RolePermissionsResponse {
  return {
    sections: pickArray(raw, ["sections"]).map(normalizeSection),
    user_id: asString(raw?.user_id),
  };
}

function normalizeRole(raw: any): RoleSelectItem {
  const id = asString(raw?.id ?? raw?.role_id ?? raw?.code ?? raw?.role);
  const code = asString(raw?.code ?? raw?.role ?? raw?.role_id ?? raw?.slug ?? raw?.id);

  return {
    id,
    name: asString(raw?.name),
    code,
    description: asString(raw?.description),
    is_admin: asBoolean(raw?.is_admin),
    company_id: asString(raw?.company_id),
    deleted_at: asNumber(raw?.deleted_at),
  };
}

function ensureRoleId(raw: any): string {
  if (typeof raw === "string") return raw.trim();
  if (raw && typeof raw === "object") {
    return asString(raw?.message ?? raw?.id ?? raw?.role_id);
  }
  return "";
}

export function collectActivePermissionIds(sections: PermissionSection[]): string[] {
  const ids = new Set<string>();

  const walk = (permission: PermissionItem | PermissionChild) => {
    if (permission.is_active && permission.id) {
      ids.add(permission.id);
    }
    permission.children?.forEach(walk);
  };

  sections.forEach((section) => section.permissions.forEach(walk));

  return [...ids];
}

function appendCompanyId(path: string, companyId?: string) {
  const safeCompanyId = asString(companyId);
  if (!safeCompanyId) return path;

  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}company_id=${encodeURIComponent(safeCompanyId)}`;
}

export function useRolePermissionsApi() {
  const { apiFetch } = useApi();

  const roleBaseCandidates = ["/v2/role", "/api/v2/role"];
  const rolesListCandidates = [...roleBaseCandidates, "/company/roles"];

  async function requestWithCandidates<T = any>(
    method: ApiMethod,
    candidates: string[],
    body?: any,
    context?: RoleRequestContext,
  ): Promise<T> {
    let lastError: any = null;

    for (const path of candidates) {
      try {
        return await apiFetch<T>(appendCompanyId(path, context?.companyId), {
          method,
          ...(body !== undefined ? { body } : {}),
        });
      } catch (error: any) {
        lastError = error;
      }
    }

    throw lastError ?? new Error("Request failed");
  }

  async function createRole(payload: { name: string; description?: string; is_admin?: boolean; company_id?: string }) {
    const response = await requestWithCandidates<any>("POST", roleBaseCandidates, {
      name: asString(payload.name),
      description: asString(payload.description),
      is_admin: Boolean(payload.is_admin),
      ...(asString(payload.company_id) ? { company_id: asString(payload.company_id) } : {}),
    }, { companyId: payload.company_id });
    const id = ensureRoleId(response);
    if (!id) {
      throw new Error("Role id not found in create role response");
    }
    return id;
  }

  async function updateRole(payload: { id: string; name: string; description?: string; is_admin?: boolean; company_id?: string }) {
    const safeId = encodeURIComponent(asString(payload.id));
    return requestWithCandidates<any>(
      "PUT",
      roleBaseCandidates.map((base) => `${base}/${safeId}`),
      {
        name: asString(payload.name),
        description: asString(payload.description),
        is_admin: Boolean(payload.is_admin),
        ...(asString(payload.company_id) ? { company_id: asString(payload.company_id) } : {}),
      },
      { companyId: payload.company_id },
    );
  }

  async function deleteRole(roleId: string, context?: RoleRequestContext) {
    const safeId = encodeURIComponent(asString(roleId));
    return requestWithCandidates<any>(
      "DELETE",
      roleBaseCandidates.map((base) => `${base}/${safeId}`),
      undefined,
      context,
    );
  }

  async function getRolePermissions(roleId: string, context?: RoleRequestContext): Promise<RolePermissionsResponse> {
    const safeId = encodeURIComponent(asString(roleId));
    const response = await requestWithCandidates<any>(
      "GET",
      roleBaseCandidates.map((base) => `${base}/${safeId}/permissions`),
      undefined,
      context,
    );
    return normalizeRolePermissions(response);
  }

  async function updateRolePermissions(
    roleId: string,
    payload: { sections: PermissionSection[] } | { permission_ids: string[] },
    context?: RoleRequestContext,
  ) {
    const safeId = encodeURIComponent(asString(roleId));
    return requestWithCandidates<any>(
      "PUT",
      roleBaseCandidates.map((base) => `${base}/${safeId}/permissions`),
      payload,
      context,
    );
  }

  async function getRolesForSelect(context?: RoleRequestContext): Promise<RoleSelectItem[]> {
    let lastError: any = null;

    for (const path of rolesListCandidates) {
      try {
        const response = await apiFetch<any>(appendCompanyId(path, context?.companyId), { method: "GET" });
        const hasRolesShape =
          Array.isArray(response) ||
          Array.isArray(response?.roles) ||
          Array.isArray(response?.items) ||
          Array.isArray(response?.data);

        if (!hasRolesShape) {
          continue;
        }

        const roles = pickArray(response, ["roles", "items", "data"]).map(normalizeRole);
        return roles.filter((role) => role.id);
      } catch (error: any) {
        lastError = error;
      }
    }

    if (lastError) {
      throw lastError;
    }

    return [];
  }

  async function getCompanyRolesForSelect(): Promise<RoleSelectItem[]> {
    const response = await apiFetch<any>("/company/roles", { method: "GET" });
    return pickArray(response, ["roles", "items", "data"]).map(normalizeRole).filter((role) => role.id);
  }

  return {
    createRole,
    updateRole,
    deleteRole,
    getRolePermissions,
    updateRolePermissions,
    getRolesForSelect,
    getCompanyRolesForSelect,
  };
}
