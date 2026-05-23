import { useUserStore } from "~/store/useUserStore";

type ApiFetchOptions<T> = Parameters<typeof $fetch<T>>[1] & {
  pageLoading?: boolean;
};

export function useApi() {
  const config = useRuntimeConfig();
  const user = useUserStore();
  const { startPageLoading, stopPageLoading } = usePageLoader();

  const rawApiBase = String(config.public.apiBase || "").trim();
  const apiBase = normalizeApiBase(rawApiBase); // e.g. '/api' or 'https://host/api'


  async function apiFetch<T>(
    path: string,
    opts: ApiFetchOptions<T> = {}
  ) {
    const { pageLoading = false, ...fetchOptions } = opts;

    const tokenlessAuth = ["/auth/login", "/auth/company-login", "/auth/platform-login", "/platform/auth/login"];
    const isPublic =
      typeof path === "string" &&
      tokenlessAuth.some((p) => path === p || path.startsWith(p + "/"));

    if (!user.token && typeof window !== "undefined") {
      try {
        user.loadToken();
      } catch {}
    }

    if (!isPublic && !user.token) {
      throw new Error("Auth token is missing");
    }

    const needsToken = !!user.token && !isPublic;

    const isFormData =
      typeof FormData !== "undefined" &&
      fetchOptions?.body instanceof FormData;

    const headers: Record<string, string> = {
      ...(fetchOptions?.headers as Record<string, string> | undefined),
      ...(needsToken ? { Authorization: `Bearer ${user.token}` } : {}),
      Accept: "application/json",
      // Help some backends detect AJAX and CSRF contexts
      "X-Requested-With": "XMLHttpRequest",
    };

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    if (pageLoading) {
      startPageLoading();
    }

    try {
      return await $fetch<T>(path, {
        baseURL: apiBase,
        credentials: "include",
        timeout: 20000,
        ...fetchOptions,
        headers,
      });
    } finally {
      if (pageLoading) {
        stopPageLoading();
      }
    }
  }

  return { apiBase, apiFetch };
}

function normalizeApiBase(value: string) {
  if (!value) {
    return "/api";
  }

  if (value === "/api" || value.endsWith("/api")) {
    return value;
  }

  if (/^https?:\/\//i.test(value)) {
    return `${value.replace(/\/+$/, "")}/api`;
  }

  return value;
}
