// /store/useLocationStore.ts
import { defineStore } from "pinia";

export const useLocationStore = defineStore("location", {
  state: () => ({
    locations: [
      { id: 1, name: "Globus Mall" },
      { id: 2, name: "Samarqand Darvoza" },
    ],
    selectedLocation: null as null | { id: number; name: string },
  }),
  actions: {
    selectLocation(location: { id: number; name: string }) {
      this.selectedLocation = location;
      console.log("Выбран магазин:", this.selectedLocation); // ✅ для проверки
    },
  },
});
