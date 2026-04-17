import { useApi } from "~/composables/useApi";

export type PermissionChild = {
  id: string;
  name: string;
  slug: string;
  route: string;
  description: string;
  is_active: boolean;
};

export type PermissionItem = {
  id: string;
  name: string;
  slug: string;
  route: string;
  description: string;
  is_active: boolean;
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
};

type ApiMethod = "GET" | "POST" | "PUT";

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
  return sections.flatMap((section) =>
    section.permissions.flatMap((permission) => {
      const ids = permission.is_active ? [permission.id] : [];
      const childIds = permission.children
        .filter((child) => child.is_active)
        .map((child) => child.id);
      return [...ids, ...childIds].filter(Boolean);
    }),
  );
}

export function useRolePermissionsApi() {
  const { apiFetch } = useApi();

  const roleBaseCandidates = ["/v2/role", "/api/v2/role"];
  const rolesListCandidates = [...roleBaseCandidates, "/company/roles"];

  async function requestWithCandidates<T = any>(
    method: ApiMethod,
    candidates: string[],
    body?: any,
  ): Promise<T> {
    let lastError: any = null;

    for (const path of candidates) {
      try {
        return await apiFetch<T>(path, {
          method,
          ...(body !== undefined ? { body } : {}),
        });
      } catch (error: any) {
        lastError = error;
      }
    }

    throw lastError ?? new Error("Request failed");
  }

  async function createRole(payload: { name: string; description?: string }) {
    const response = await requestWithCandidates<any>("POST", roleBaseCandidates, {
      name: asString(payload.name),
      description: asString(payload.description),
    });
    const id = ensureRoleId(response);
    if (!id) {
      throw new Error("Role id not found in create role response");
    }
    return id;
  }

  async function updateRole(payload: { id: string; name: string; description?: string }) {
    const safeId = encodeURIComponent(asString(payload.id));
    return requestWithCandidates<any>(
      "PUT",
      roleBaseCandidates.map((base) => `${base}/${safeId}`),
      {
        name: asString(payload.name),
        description: asString(payload.description),
      },
    );
  }

  async function getRolePermissions(roleId: string): Promise<RolePermissionsResponse> {
    const safeId = encodeURIComponent(asString(roleId));
    const response = await requestWithCandidates<any>(
      "GET",
      roleBaseCandidates.map((base) => `${base}/${safeId}/permissions`),
    );
    return normalizeRolePermissions(response);
  }

  async function updateRolePermissions(
    roleId: string,
    payload: { sections: PermissionSection[] } | { permission_ids: string[] },
  ) {
    const safeId = encodeURIComponent(asString(roleId));
    return requestWithCandidates<any>(
      "PUT",
      roleBaseCandidates.map((base) => `${base}/${safeId}/permissions`),
      payload,
    );
  }

  async function getRolesForSelect(): Promise<RoleSelectItem[]> {
    let lastError: any = null;

    for (const path of rolesListCandidates) {
      try {
        const response = await apiFetch<any>(path, { method: "GET" });
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
    getRolePermissions,
    updateRolePermissions,
    getRolesForSelect,
    getCompanyRolesForSelect,
  };
}
