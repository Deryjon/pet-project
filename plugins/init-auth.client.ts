import { useUserStore } from "~/store/useUserStore";

export default defineNuxtPlugin(async () => {
  const auth = useUserStore();
  const route = useRoute();

  if (route.path.startsWith("/platform")) {
    return;
  }

  if (!auth.authChecked) {
    await auth.initAuth();
  }
});
