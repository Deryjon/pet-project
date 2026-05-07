import { useApi } from "~/composables/useApi";
import { useUserStore } from "~/store/useUserStore";

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
    const response: any = await apiFetch("/auth/login", {
      method: "POST",
      body: {
        phone_number: String(payload.phone_number),
        password: String(payload.password),
      },
    });

    const token = String(response?.access_token ?? response?.token ?? "").trim();
    if (!token) {
      throw new Error("Token not found in login response");
    }

    user.login(token, response?.user ?? {});
    await user.fetchMe({ force: true });
    return { token, user: user.user };
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
        password: String(payload.password),
      },
    });
  }

  return { login, register };
}
