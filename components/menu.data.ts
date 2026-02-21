export interface IMenuItem {
  name: string;
  url: string;
  icon: string;
  items?: { title: string; url: string }[];
}

export const MENU_DATA: IMenuItem[] = [
  {
    name: "Товары",
    icon: "ph:shopping-cart-simple-fill",
    url: "/products",
    items: [
      { title: "Каталог", url: "/products/catalog" },
      { title: "Импорт", url: "/products/import" },
      { title: "Заказы", url: "/products/orders" },
      { title: "Инвентаризация", url: "/products/inventory" },
      { title: "Трансфер", url: "/products/transfer" },
      { title: "Переоценка", url: "/products/revaluation" },
      { title: "Списание", url: "/products/writeoff" },
      { title: "Поставщики", url: "/products/suppliers" },
    ],
  },
  {
    name: "Продажи",
    icon: "boxicons:scan-filled",
    url: "/order",
    items: [
      { title: "Новая продажа", url: "/pos/new-pos" },
      { title: "Все продажи", url: "/pos/all" },
    ],
  },
  {
    name: "Клиенты",
    icon: "solar:user-bold",
    url: "/clients",
    items: [
      { title: "Все клиенты", url: "/clients/all" },
      { title: "Программа лояльности", url: "/clients/loyalty-program" },
      { title: "Долги клиентов", url: "/clients/cashbox" },
    ],
  },
  {
    name: "Отчеты",
    icon: "flowbite:chart-pie-solid",
    url: "/analytics",
    items: [
      { title: "Магазин", url: "/analytics/shop" },
      { title: "Товары", url: "/analytics/products" },
      { title: "Продавцы", url: "/analytics/sellers" },
      { title: "Клиенты", url: "/analytics/clients" },
    ],
  },
  {
    name: "Управление",
    icon: "ix:work-case-filled",
    url: "",
    items: [
      { title: "Сотрудники", url: "/management/employees" },
      { title: "Роли", url: "/management/roles" },
    ],
  },
  {
    name: "Настройки",
    icon: "material-symbols:settings",
    url: "",
    items: [
      { title: "Профиль", url: "/settings/profile" },
      { title: "Компания", url: "/settings/company" },
        { title: 'Магазин', url: '/settings/shop' },
      { title: "Чеки", url: "/settings/checks" },
    ],
  },
];
