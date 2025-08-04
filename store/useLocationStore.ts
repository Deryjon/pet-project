import { defineStore } from "pinia";
import { usePanelStore } from "./usePanelStore";

export const useLocationStore = defineStore("location", {
  state: () => ({
    locations: [
      { id: 1, name: "Globus Mall" },
      { id: 2, name: "Samarqand Darvoza" },
    ],
    selectedLocation: null as null | { id: number; name: string },
  }),
  actions: {
    setLocation(location: { id: number; name: string }) {
      this.selectedLocation = location;
      localStorage.setItem("selectedLocation", JSON.stringify(location));
      const panel = usePanelStore();
      panel.closeAll();
    },
    init() {
      const saved = localStorage.getItem("selectedLocation");
      if (saved) {
        this.selectedLocation = JSON.parse(saved);
      }
    },
  },
});
