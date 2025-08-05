import { useUserStore } from "~/store/useUserStore";

export default defineNuxtRouteMiddleware((to, from) => {
  const userStore = useUserStore();

//   if (!userStore.isLoggedIn && !["/auth/login", "/auth/register"].includes(to.path)) {
//     return navigateTo("/auth/login");
//   }
});
