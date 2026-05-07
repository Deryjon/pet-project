import { defineStore } from "pinia";
import { usePanelStore } from "./usePanelStore";
import { useApi } from "~/composables/useApi";

export interface UserLocationOption {
  id: string;
  name: string;
  relationId?: string;
  branchCode?: string;
  companyId?: string;
}

export const useLocationStore = defineStore("location", {
  state: () => ({
    locations: [] as UserLocationOption[],
    selectedLocation: null as UserLocationOption | null,
    isSwitching: false as boolean,
    switchError: "" as string,
  }),
  actions: {
    async setLocation(location: UserLocationOption) {
      const { useUserStore } = await import("./useUserStore");
      const userStore = useUserStore();

      const canSwitchShops = userStore.userState.canSwitchShops || this.locations.length > 1;
      if (!canSwitchShops) {
        return;
      }

      if (this.isSwitching) {
        return;
      }

      if (this.selectedLocation?.id === location.id) {
        const panel = usePanelStore();
        panel.closeAll();
        return;
      }

      this.isSwitching = true;
      this.switchError = "";

      const previousLocation = this.selectedLocation;

      this.selectedLocation = location;
      const panel = usePanelStore();

      if (import.meta.client) {
        localStorage.setItem("selectedLocation", JSON.stringify(location));
      }

      try {
        const { apiFetch } = useApi();
        await apiFetch(`/user/set-current-shop/${encodeURIComponent(location.id)}`, {
          method: "PATCH",
        });

        await userStore.fetchMe();
        panel.closeAll();
      } catch (error: any) {
        this.selectedLocation = previousLocation;

        if (import.meta.client) {
          if (previousLocation) {
            localStorage.setItem("selectedLocation", JSON.stringify(previousLocation));
          } else {
            localStorage.removeItem("selectedLocation");
          }
        }

        this.switchError =
          error?.data?.message ||
          error?.message ||
          "Не удалось переключить магазин";
      } finally {
        this.isSwitching = false;
      }
    },
    syncFromUser(user: any) {
      const mappedLocations: UserLocationOption[] = Array.isArray(user?.shops)
        ? user.shops
            .map((item: any) => {
              const id = String(item?.id ?? item?.shop_id ?? item?.shop?.id ?? "");
              const name = String(item?.shop?.name ?? item?.name ?? item?.shop_name ?? "");

              if (!id || !name) {
                return null;
              }

              return {
                id,
                name,
                relationId: item?.id ? String(item.id) : undefined,
                branchCode: item?.branch_code ? String(item.branch_code) : undefined,
                companyId: item?.company_id ? String(item.company_id) : undefined,
              };
            })
            .filter(Boolean)
        : [];

      this.locations = mappedLocations;

      if (!mappedLocations.length) {
        this.selectedLocation = null;
        if (import.meta.client) {
          localStorage.removeItem("selectedLocation");
        }
        return;
      }

      const savedLocationId = this.selectedLocation?.id;
      const currentShopId = String(
        user?.current_shop_id ?? user?.current_shop?.id ?? user?.current_shop?.shop_id ?? "",
      );

      const nextSelectedLocation =
        mappedLocations.find((location) => location.id === savedLocationId) ||
        mappedLocations.find((location) => location.id === currentShopId) ||
        mappedLocations[0];

      this.selectedLocation = nextSelectedLocation || null;

      if (import.meta.client && nextSelectedLocation) {
        localStorage.setItem("selectedLocation", JSON.stringify(nextSelectedLocation));
      }
    },
    init() {
      if (!import.meta.client) {
        return;
      }

      const saved = localStorage.getItem("selectedLocation");
      if (saved) {
        try {
          this.selectedLocation = JSON.parse(saved);
        } catch (_) {
          localStorage.removeItem("selectedLocation");
          this.selectedLocation = null;
        }
      }
    },
    reset() {
      this.locations = [];
      this.selectedLocation = null;
      this.isSwitching = false;
      this.switchError = "";
      if (import.meta.client) {
        localStorage.removeItem("selectedLocation");
      }
    },
  },
});

