// store/catalogDataTableStore.ts
import { defineStore } from "pinia";
import { ref, computed, watch, h } from "vue";
import { data } from "@/data"; // твой data.ts
import {
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useVueTable,
} from "@tanstack/vue-table";

export const useCatalogDataTableStore = defineStore(
  "catalogDataTableStore",
  () => {
    // исходные данные и состояние
    const rawData = ref<any[]>([]);
    const globalFilter = ref("");
    const loading = ref(false);

    // состояние таблицы (tanstack)
    const pagination = ref({ pageSize: 10, pageIndex: 0 });
    const sorting = ref<any[]>([]);

    // сайдбар продукта
    const showProductSidebar = ref(false);
    const selectedProduct = ref<any | null>(null);

    // загрузка данных (имитация)
    async function fetchData() {
      loading.value = true;
      rawData.value = [];
      await new Promise((r) => setTimeout(r, 200));
      rawData.value = data; // берем из /data.ts
      loading.value = false;
    }

    // сразу подгружаем данные
    fetchData();

    // при изменении фильтра — сбрасываем страницу и перезагружаем (как в твоём коде)
    watch(globalFilter, async () => {
      pagination.value.pageIndex = 0;
      await fetchData();
    });

    // фильтрация (глобальный фильтр по всем полям)
    const filteredData = computed(() => {
      if (!globalFilter.value) return rawData.value;
      const q = globalFilter.value.toLowerCase();
      return rawData.value.filter((item) =>
        Object.values(item)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    });

    // пагинация данных (выдаются на вход таблице)
    const paginatedProducts = computed(() => {
      const start = pagination.value.pageIndex * pagination.value.pageSize;
      return filteredData.value.slice(start, start + pagination.value.pageSize);
    });

    const totalPages = computed(() =>
      Math.ceil(filteredData.value.length / pagination.value.pageSize)
    );

    // placeholder для фото (использует import.meta.url)
    const placeholderImgUrl = new URL(
      "../assets/images/placeholder_img.svg",
      import.meta.url
    ).href;

    // колонки (включая чекбокс "select" и картинку)
    const columns: any[] = [
      {
        id: "select",
        header: () =>
          h("input", {
            type: "checkbox",
            class: "w-3.5 h-3.5 accent-[#4993dd] cursor-pointer",
            onChange: (e: Event) => {
              const checked = (e.target as HTMLInputElement).checked;
              // table будет определён ниже — это нормальная замыкание
              table
                .getRowModel()
                .rows.forEach((row) => row.toggleSelected(checked));
            },
          }),
        cell: ({ row }: any) =>
          h("input", {
            type: "checkbox",
            class: "w-3.5 h-3.5  accent-[#4993dd] cursor-pointer",
            checked: row.getIsSelected?.(),
            onChange: (e: Event) =>
              row.toggleSelected?.((e.target as HTMLInputElement).checked),
          }),
        enableSorting: false,
        enableColumnFilter: false,
        size: 40,
      },
      {
        accessorKey: "photo",
        header: "Фото",
        cell: ({ getValue }: any) => {
          const url = getValue();
          const imageUrl = url ? url : placeholderImgUrl;
          return h("img", {
            src: imageUrl,
            alt: "Фото товара",
            class: "w-12 h-12 object-cover rounded",
          });
        },
      },
      { accessorKey: "name", header: "Наименование" },
      { accessorKey: "sku", header: "Артикул" },
      { accessorKey: "barcode", header: "Баркод" },
      { accessorKey: "category", header: "Категория" },
      { accessorKey: "supplier", header: "Поставщик" },
      {
        accessorKey: "quantity",
        header: "Кол-во",
        cell: ({ getValue }: any) => `${getValue()} шт`,
      },
      {
        accessorKey: "purchase_price",
        header: "Цена поставки",
        cell: ({ getValue }: any) => `${getValue()} UZS`,
      },
      {
        accessorKey: "sale_price",
        header: "Цена продажи",
        cell: ({ getValue }: any) => `${getValue()} UZS`,
      },
    ];

    // создаём таблицу TanStack
    const table = useVueTable({
      data: filteredData, // таблица будет работать с фильтрованными данными (внутри используется pagination state)
      columns,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      enableRowSelection: true,
      state: {
        get pagination() {
          return pagination.value;
        },
        get sorting() {
          return sorting.value;
        },
      },
      onPaginationChange: (updater: any) => {
        pagination.value =
          typeof updater === "function" ? updater(pagination.value) : updater;
      },
      onSortingChange: (updater: any) => {
        sorting.value =
          typeof updater === "function" ? updater(sorting.value) : updater;
      },
    });

    // массив выбранных ID (используется в goToActions)
    const selectedProducts = computed(() =>
      table.getSelectedRowModel().rows.map((row: any) => row.original.id)
    );

    // открытие/закрытие сайдбара продукта
    function openProduct(product: any) {
      selectedProduct.value = product;
      showProductSidebar.value = true;
    }
    function closeProductSidebar() {
      selectedProduct.value = null;
      showProductSidebar.value = false;
    }

    // Удобные прокси-методы для шаблонов (по желанию можно вызывать table.nextPage() напрямую)
    function previousPage() {
      table.previousPage();
    }
    function nextPage() {
      table.nextPage();
    }

    return {
      // данные / состояние
      rawData,
      globalFilter,
      loading,
      pagination,
      sorting,
      filteredData,
      paginatedProducts,
      totalPages,

      // tanstack table
      table,

      // selection / sidebar
      selectedProduct,
      showProductSidebar,
      selectedProducts,
      openProduct,
      closeProductSidebar,

      // методы
      fetchData,
      previousPage,
      nextPage,
    };
  }
);
