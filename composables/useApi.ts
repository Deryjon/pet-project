import { navigateTo } from "#app";
import { useUserStore } from "~/store/useUserStore";

type ApiFetchOptions<T> = Parameters<typeof $fetch<T>>[1] & {
  pageLoading?: boolean;
  retryOnAuthError?: boolean;
};

let refreshRequestPromise: Promise<boolean> | null = null;

export function useApi() {
  const config = useRuntimeConfig();
  const user = useUserStore();
  const { startPageLoading, stopPageLoading } = usePageLoader();

  const rawApiBase = String(config.public.apiBase || "").trim();
  const apiBase = normalizeApiBase(rawApiBase);

  async function apiFetch<T>(
    path: string,
    opts: ApiFetchOptions<T> = {}
  ) {
    const {
      pageLoading = false,
      retryOnAuthError = true,
      ...fetchOptions
    } = opts;

    const tokenlessAuth = [
      "/auth/login",
      "/auth/company-login",
      "/auth/platform-login",
      "/platform/auth/login",
      "/auth/refresh",
    ];
    const isPublic =
      typeof path === "string" &&
      tokenlessAuth.some((p) => path === p || path.startsWith(p + "/"));

    if ((!user.token || !user.refreshToken) && typeof window !== "undefined") {
      try {
        user.loadToken();
        user.loadRefreshToken();
      } catch {}
    }

    if (!isPublic && !user.token) {
      throw new Error("Auth token is missing");
    }

    const needsToken = !!user.token && !isPublic;
    const isFormData =
      typeof FormData !== "undefined" &&
      fetchOptions?.body instanceof FormData;

    const headers = buildHeaders(
      fetchOptions?.headers as Record<string, string> | undefined,
      needsToken ? user.token : null,
      isFormData,
    );

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
    } catch (error: any) {
      const status = error?.statusCode ?? error?.status ?? error?.response?.status;
      const shouldRefresh =
        status === 401 &&
        retryOnAuthError &&
        !isPublic &&
        path !== "/auth/refresh";

      if (!shouldRefresh) {
        throw error;
      }

      const refreshed = await refreshTokens(apiBase, user, getCurrentPath());
      if (!refreshed) {
        throw error;
      }

      const retryHeaders = buildHeaders(
        fetchOptions?.headers as Record<string, string> | undefined,
        user.token,
        isFormData,
      );

      return await $fetch<T>(path, {
        baseURL: apiBase,
        credentials: "include",
        timeout: 20000,
        ...fetchOptions,
        headers: retryHeaders,
      });
    } finally {
      if (pageLoading) {
        stopPageLoading();
      }
    }
  }

  return { apiBase, apiFetch };
}

function buildHeaders(
  baseHeaders: Record<string, string> | undefined,
  token: string | null,
  isFormData: boolean,
) {
  const headers: Record<string, string> = {
    ...(baseHeaders ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

async function refreshTokens(
  apiBase: string,
  user: ReturnType<typeof useUserStore>,
  currentPath: string,
) {
  if (refreshRequestPromise) {
    return refreshRequestPromise;
  }

  refreshRequestPromise = (async () => {
    user.loadRefreshToken();

    if (!user.refreshToken) {
      user.logout();
      await redirectToLogin(currentPath);
      return false;
    }

    try {
      const response: any = await $fetch("/auth/refresh", {
        baseURL: apiBase,
        method: "POST",
        credentials: "include",
        timeout: 20000,
        body: {
          refresh_token: user.refreshToken,
        },
        headers: buildHeaders(undefined, null, false),
      });

      const accessToken = String(response?.access_token ?? response?.token ?? "").trim();
      const refreshToken = String(response?.refresh_token ?? "").trim();

      if (!accessToken || !refreshToken) {
        throw new Error("Refresh response did not include rotated tokens");
      }

      user.setAuthTokens(accessToken, refreshToken);
      return true;
    } catch (_) {
      user.logout();
      await redirectToLogin(currentPath);
      return false;
    } finally {
      refreshRequestPromise = null;
    }
  })();

  return refreshRequestPromise;
}

async function redirectToLogin(currentPath: string) {
  if (!import.meta.client) {
    return;
  }

  const loginPath = currentPath.startsWith("/platform") ? "/platform/login" : "/auth/login";
  await navigateTo(loginPath, { replace: true });
}

function getCurrentPath() {
  if (!import.meta.client) {
    return "/";
  }

  return window.location.pathname || "/";
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
