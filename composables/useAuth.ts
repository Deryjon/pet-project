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

  async function login(payload: LoginPayload) {
    const mockToken = "dev-token";
    user.setToken(mockToken);
    user.setUser({ phone_number: String(payload.phone_number) });
    return { token: mockToken, user: { phone_number: String(payload.phone_number) } };
  }

  async function register(payload: RegisterPayload) {
    return {
      ok: true,
      user: {
        first_name: String(payload.first_name),
        last_name: String(payload.last_name),
        phone_number: String(payload.phone_number),
        role: String(payload.role),
        branch_location: String(payload.branch_location),
      },
    };
  }

  return { login, register };
}
