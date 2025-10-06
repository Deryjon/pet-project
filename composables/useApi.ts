import { useUserStore } from "~/store/useUserStore";

export function useApi() {
  const config = useRuntimeConfig();
  const user = useUserStore();

  const apiBase = config.public.apiBase as string;

  async function apiFetch<T>(path: string, opts: Parameters<typeof $fetch<T>>[1] = {}) {
    const headers = {
      ...(opts?.headers as Record<string, string> | undefined),
      ...(user.token ? { Authorization: `Bearer ${user.token}` } : {}),
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

