export type ProductSectionKey =
  | "sales-by-products"
  | "product-efficiency"
  | "imports"
  | "sales-by-suppliers"
  | "stock-balance";

export type ProductSectionCard = {
  key: ProductSectionKey;
  title: string;
  description: string;
  to: string;
};

export const productReportSections: ProductSectionCard[] = [
  {
    key: "sales-by-products",
    title: "Продажи по товарам",
    description:
      "Данный отчет покажет вам какие товары продаются хорошо. Вы сможете посмотреть разбивку по категориям, цветам, размерам и другим характеристикам товаров.",
    to: "/reports/products/summary",
  },
  {
    key: "product-efficiency",
    title: "Эффективность товаров",
    description:
      "Отчет покажет все движения по товарам от начального до конечного периода. Вы сможете посмотреть сколько товаров было, сколько продалось и сколько сейчас в остатке.",
    to: "/reports/products/efficiency",
  },
  {
    key: "imports",
    title: "Импорты",
    description:
      "Данный отчет используется, чтобы проанализировать, как продаются поставки, которые были сделаны в определенный период.",
    to: "/reports/products/imports",
  },
  {
    key: "sales-by-suppliers",
    title: "Продажи по поставщикам",
    description: "Отчет покажет как продаются товары в разбивке по поставщикам",
    to: "/reports/products/supplier",
  },
  {
    key: "stock-balance",
    title: "Отчет по остаткам",
    description:
      "Отчет отображает остатки товаров на выбранную дату, позволяя просмотреть их количество, цену продажи и закупки за указанный период.",
    to: "/reports/products/leftover",
  },
];
