import { useUserStore } from "~/store/useUserStore";

export function useApi() {
  const config = useRuntimeConfig();
  const user = useUserStore();

  const apiBase = config.public.apiBase as string; // e.g. '/api'


  async function apiFetch<T>(
    path: string,
    opts: Parameters<typeof $fetch<T>>[1] = {}
  ) {
    if (!user.token && typeof window !== "undefined") {
      try {
        user.loadToken();
      } catch {}
    }

    const tokenlessAuth = ["/auth/login", "/auth/company-login", "/auth/platform-login"];
    const needsToken =
      !!user.token &&
      !tokenlessAuth.some(
        (p) => typeof path === "string" && (path === p || (path as string).startsWith(p + "/"))
      );

    const isFormData =
      typeof FormData !== "undefined" &&
      opts?.body instanceof FormData;

    const headers: Record<string, string> = {
      ...(opts?.headers as Record<string, string> | undefined),
      ...(needsToken ? { Authorization: `Bearer ${user.token}` } : {}),
      Accept: "application/json",
      // Help some backends detect AJAX and CSRF contexts
      "X-Requested-With": "XMLHttpRequest",
    };

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    return $fetch<T>(path, {
      baseURL: apiBase,
      credentials: "include",
      timeout: 20000,
      ...opts,
      headers,
    });
  }

  return { apiBase, apiFetch };
}
