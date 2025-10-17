import { useUserStore } from "~/store/useUserStore";
import { useApi } from "~/composables/useApi";

export interface LoginPayload {
  phone_number: string;
  password: string;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  birth_date: string; // DD.MM.YYYY
  phone_number: string;
  role: string;
  branch_location: string;
  password: string;
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
        first_name: String(payload.first_name),
        last_name: String(payload.last_name),
        birth_date: String(payload.birth_date),
        phone_number: String(payload.phone_number),
        role: String(payload.role),
        branch_location: String(payload.branch_location),
        password: payload.password,
      },
    });
  }

  return { login, register };
}
