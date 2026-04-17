import { computed } from "vue";

export function usePageLoader() {
  const pendingRequests = useState<number>("global-pending-requests", () => 0);
  const pendingRoute = useState<boolean>("global-pending-route", () => false);

  const isPageLoading = computed(() => pendingRequests.value > 0 || pendingRoute.value);

  function startPageLoading() {
    pendingRequests.value += 1;
  }

  function stopPageLoading() {
    pendingRequests.value = Math.max(0, pendingRequests.value - 1);
  }

  function startRouteLoading() {
    pendingRoute.value = true;
  }

  function stopRouteLoading() {
    pendingRoute.value = false;
  }

  return {
    isPageLoading,
    pendingRequests,
    pendingRoute,
    startPageLoading,
    stopPageLoading,
    startRouteLoading,
    stopRouteLoading,
  };
}
