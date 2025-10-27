import { useUserStore } from "~/store/useUserStore";

export function useApi() {
  const config = useRuntimeConfig();
  const user = useUserStore();

  const apiBase = config.public.apiBase as string; // e.g. '/api'

  const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

  function readCookie(name: string): string | undefined {
    if (typeof document === "undefined") return undefined;
    const match = document.cookie
      .split("; ")
      .find((c) => c.startsWith(name + "="));
    return match?.split("=")[1];
  }

  async function ensureCsrfCookie() {
    if (process.server) return;
    if (readCookie("csrftoken")) return;
    const candidates = [
      "/auth/csrf",
      "/csrf",
      "/auth/login",
      "/",
    ];
    for (const p of candidates) {
      try {
        await $fetch(p, {
          baseURL: apiBase,
          method: "GET",
          credentials: "include",
        });
        if (readCookie("csrftoken")) break;
      } catch (_) {
        // ignore and try next
      }
    }
  }

  async function apiFetch<T>(
    path: string,
    opts: Parameters<typeof $fetch<T>>[1] = {}
  ) {
    if (!user.token && typeof window !== "undefined") {
      try {
        user.loadToken();
      } catch {}
    }

    const method = (opts?.method || "GET").toString().toUpperCase();
    const tokenlessAuth = ["/auth/login", "/auth/register"];
    const needsToken =
      !!user.token &&
      !tokenlessAuth.some(
        (p) => typeof path === "string" && (path === p || (path as string).startsWith(p + "/"))
      );

    if (unsafeMethods.has(method) && typeof window !== "undefined") {
      await ensureCsrfCookie();
    }

    const csrftoken = unsafeMethods.has(method)
      ? readCookie("csrftoken")
      : undefined;

    const headers: Record<string, string> = {
      ...(opts?.headers as Record<string, string> | undefined),
      ...(needsToken ? { Authorization: `Bearer ${user.token}` } : {}),
      "Content-Type": "application/json",
      Accept: "application/json",
      // Help some backends detect AJAX and CSRF contexts
      "X-Requested-With": "XMLHttpRequest",
      ...(csrftoken ? { "X-CSRFToken": csrftoken } : {}),
    };

    return $fetch<T>(path, {
      baseURL: apiBase,
      credentials: "include",
      ...opts,
      headers,
    });
  }

  return { apiBase, apiFetch };
}
