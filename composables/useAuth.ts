import { useUserStore } from "~/store/useUserStore";
import { useApi } from "~/composables/useApi";

export interface LoginPayload {
  phone_number: string;
  password: string;
}

export interface RegisterPayload {
  phone_number: string;
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
      body: {
        phone_number: String(payload.phone_number),
        password: payload.password,
      },
    });

    const token = res?.token || res?.access_token || res?.data?.token;
    if (token) user.setToken(token);
    if (res?.user) user.setUser(res.user);
    // Always fetch fresh user profile from backend once token is set
    if (token) {
      await user.fetchMe();
    }
    return res;
  }

  async function register(payload: RegisterPayload) {
    return apiFetch("/auth/register", {
      method: "POST",
      body: {
        phone_number: String(payload.phone_number),
        password: payload.password,
        role: payload.role,
        branch_code: payload.branch_code,
      },
    });
  }

  return { login, register };
}
