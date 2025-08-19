import { defineStore } from "pinia";
import { ref } from "vue";

export const useSidebarStore = defineStore("sidebar", () => {
  // состояние: свернут ли сайдбар
  const collapsed = ref(false);

  // данные меню
  const menu = ref([
    { name: "Главная", icon: "heroicons:home", route: "/" },
    { name: "Товары", icon: "heroicons:archive-box", route: "/products" },
    { name: "Продажи", icon: "heroicons:shopping-cart", route: "/sales" },
    { name: "Клиенты", icon: "heroicons:user-group", route: "/clients" },
    { name: "Отчёты", icon: "heroicons:chart-bar", route: "/reports" },
  ]);

  function toggle() {
    collapsed.value = !collapsed.value;
  }

  return { collapsed, menu, toggle };
});
