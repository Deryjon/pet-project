import { useUserStore } from "~/store/useUserStore";
import { firstAllowedRbacRoute, routeCanAccess } from "~/composables/useAccessControl";

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
    return "/platform/dashboard";
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

  await userStore.initAuth({ platform: platformRoute });

  const isAuthenticated = userStore.isAuthenticated;
  const hasPlatformAccess = userStore.isPlatformUser && userStore.hasPlatformAccess;
  const hasCrmAccess = userStore.isCompanyUser;

  if (!isAuthenticated) {
    if (publicRoute || path === "/") {
      return;
    }

    return navigateTo(platformRoute ? "/platform/login" : "/auth/login");
  }

  if (platformLoginRoute || crmLoginRoute) {
    return navigateTo(getHomeRoute(userStore));
  }

  if (path === "/403" && hasCrmAccess) {
    if (!userStore.permissionsLoaded) {
      await userStore.loadPermissionsForCurrentUser();
    }

    const from = typeof to.query.from === "string" ? to.query.from : "";
    if (from && routeCanAccess(from, userStore.can)) {
      return navigateTo(from);
    }

    return;
  }

  if (platformRoute) {
    if (!hasPlatformAccess) {
      return navigateTo(hasCrmAccess ? "/" : "/platform/login");
    }

    return;
  }

  if (!authRoute && !hasCrmAccess) {
    return navigateTo(hasPlatformAccess ? "/platform/dashboard" : "/auth/login");
  }

  if (!authRoute && hasCrmAccess) {
    if (import.meta.server) {
      return;
    }

    if (!userStore.permissionsLoaded) {
      await userStore.loadPermissionsForCurrentUser();
    }

    if (userStore.permissionsLoadFailed) {
      return;
    }

    if (path === "/" && !routeCanAccess(path, userStore.can)) {
      return navigateTo(firstAllowedRbacRoute(userStore.can));
    }

    if (!routeCanAccess(path, userStore.can)) {
      return navigateTo({
        path: "/403",
        query: { from: to.fullPath },
      });
    }
  }
});
