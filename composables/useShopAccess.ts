import { computed } from "vue";
import { useUserStore } from "~/store/useUserStore";
import { useLocationStore } from "~/store/useLocationStore";

export function useShopAccess() {
  const userStore = useUserStore();
  const locationStore = useLocationStore();

  function hasPermission(slug: string): boolean {
    return userStore.can(slug);
  }

  const canOpenCatalog = computed(() => userStore.can("catalog-operations"));

  const canSearchProducts = computed(() => userStore.can("catalog-operations"));

  const currentShopId = computed(
    () =>
      locationStore.selectedLocation?.id ||
      userStore.userState.currentShopId ||
      "",
  );

  const hasAvailableShops = computed(() => locationStore.locations.length > 0);

  const canSwitchShops = computed(
    () =>
      userStore.userState.canSwitchShops || locationStore.locations.length > 1,
  );

  // true when the user has catalog-operations but hasn't selected a shop yet
  const needsShopSelection = computed(
    () => canOpenCatalog.value && !currentShopId.value,
  );

  return {
    hasPermission,
    canOpenCatalog,
    canSearchProducts,
    needsShopSelection,
    currentShopId,
    hasAvailableShops,
    canSwitchShops,
    locations: computed(() => locationStore.locations),
    selectedLocation: computed(() => locationStore.selectedLocation),
    isSwitching: computed(() => locationStore.isSwitching),
    setLocation: (location: { id: string; name: string }) =>
      locationStore.setLocation(location),
  };
}
