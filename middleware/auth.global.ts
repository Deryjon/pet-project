import { useUserStore } from "~/store/useUserStore";
import { canAccessPath, firstAllowedCompanyRoute } from "~/composables/useAccessControl";

function isPlatformRoute(path: string) {
  return path === "/platform" || path.startsWith("/platform/");
}

function isPlatformLoginRoute(path: string) {
  return path === "/platform/login";
}

function isAuthRoute(path: string) {
  return path === "/auth" || path.startsWith("/auth/");
}

function isCrmLoginRoute(path: string) {
  return path === "/auth/login";
}

function getHomeRoute(userStore: ReturnType<typeof useUserStore>) {
  if (userStore.isPlatformUser && userStore.hasPlatformAccess) {
    return "/platform";
  }

  if (userStore.isCompanyUser) {
    return "/";
  }

  return "/auth/login";
}

export default defineNuxtRouteMiddleware(async (to) => {
  const userStore = useUserStore();
  const path = to.path;
  const platformRoute = isPlatformRoute(path);
  const platformLoginRoute = isPlatformLoginRoute(path);
  const crmLoginRoute = isCrmLoginRoute(path);
  const authRoute = isAuthRoute(path);
  const publicRoute = platformLoginRoute || crmLoginRoute;

  if (!userStore.token) {
    userStore.loadToken();
  }

  if (!userStore.token && import.meta.server && !publicRoute) {
    return;
  }

  if (userStore.token && !userStore.user.id && !userStore.initializing) {
    await userStore.fetchMe();
  }

  const isAuthenticated = userStore.isLoggedIn && !!userStore.user.id;
  const hasPlatformAccess = userStore.isPlatformUser && userStore.hasPlatformAccess;
  const hasCrmAccess = userStore.isCompanyUser;

  if (!isAuthenticated) {
    if (publicRoute) {
      return;
    }

    return navigateTo(platformRoute ? "/platform/login" : "/auth/login");
  }

  if (platformLoginRoute || crmLoginRoute) {
    return navigateTo(getHomeRoute(userStore));
  }

  if (platformRoute) {
    if (!hasPlatformAccess) {
      return navigateTo(hasCrmAccess ? "/" : "/platform/login");
    }

    return;
  }

  if (!authRoute && !hasCrmAccess) {
    return navigateTo(hasPlatformAccess ? "/platform" : "/auth/login");
  }

  if (!authRoute && hasCrmAccess && !canAccessPath(path, userStore.normalizedRoles)) {
    return navigateTo(firstAllowedCompanyRoute(userStore.normalizedRoles));
  }
});
