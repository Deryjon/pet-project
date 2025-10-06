import { useUserStore } from "~/store/useUserStore";
import { useApi } from "~/composables/useApi";

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  phone: string;
  password: string;
  role: string;
  branch_code: string;
}

export function useAuth() {
  const user = useUserStore();
  const { apiFetch } = useApi();

  async function login(payload: LoginPayload) {
    const res: any = await apiFetch("/auth/login", {
      method: "POST",
      body: payload,
    });

    const token = res?.token || res?.access_token || res?.data?.token;
    if (token) user.setToken(token);
    if (res?.user) user.setUser(res.user);
    return res;
  }

  async function register(payload: RegisterPayload) {
    return apiFetch("/auth/register", {
      method: "POST",
      body: payload,
    });
  }

  return { login, register };
}

