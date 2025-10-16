import { useUserStore } from "~/store/useUserStore";

export function useApi() {
  const config = useRuntimeConfig();
  const user = useUserStore();

  const apiBase = config.public.apiBase as string;

  async function apiFetch<T>(path: string, opts: Parameters<typeof $fetch<T>>[1] = {}) {
    // Ensure token is loaded on client before first request
    if (!user.token && typeof window !== 'undefined') {
      try {
        user.loadToken();
      } catch {}
    }
    // Only these auth endpoints are tokenless
    const tokenlessAuth = ['/auth/login', '/auth/register'];
    const needsToken = !!user.token && !tokenlessAuth.some(p => typeof path === 'string' && (path === p || (path as string).startsWith(p + '/')));
    const headers = {
      ...(opts?.headers as Record<string, string> | undefined),
      ...(needsToken ? { Authorization: `Bearer ${user.token}` } : {}),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    return $fetch<T>(path, {
      baseURL: apiBase,
      ...opts,
      headers,
    });
  }

  return { apiBase, apiFetch };
}
