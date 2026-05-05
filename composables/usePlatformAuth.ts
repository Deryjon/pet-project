import { usePlatformAdminSession } from "@/composables/usePlatformAdmin";

export function usePlatformAuth() {
  return usePlatformAdminSession();
}
