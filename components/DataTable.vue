<template>
  <div class="space-y-4">
    <div class="top flex justify-between gap-[10px]">
      <div
        class="input pl-[17px] w-full bg-[#404040] rounded-[15px] flex items-center gap-[10px] hover:bg-[#5e5e5e] transition-colors duration-300"
      >
        <Icon name="material-symbols:search" class="w-6 h-6 text-[#bdbdbd]" />
        <input
          v-model="globalFilter"
          type="text"
          placeholder="Артикул, баркод, наименование"
          class="bg-transparent w-full text-[#bdbdbd] text-[17px] font-bold"
        />
      </div>
      <div class="filters">
        <button
          class="filter bg-[#404040] rounded-[20px] flex items-center gap-[10px] p-[17px] text-[17px] font-bold text-white hover:bg-[#5e5e5e] transition-colors duration-300"
          @click="showFilters = !showFilters"
        >
          <svg
            aria-hidden="true"
            focusable="false"
            data-prefix="fas"
            data-icon="chevron-down"
            class="w-[14px] transition-transform duration-200"
            :class="{ 'rotate-180': showFilters }"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
          >
            <path
              fill="currentColor"
              d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
            ></path>
          </svg>
          <Icon name="heroicons:funnel" class="w-5 h-5 text-[#4993dd]" />
          Фильтры
        </button>
      </div>

      <div class="action">
        <button
          class="filter bg-[#404040] rounded-[15px] flex items-center gap-[10px] p-[17px] text-[17px] font-bold text-white hover:bg-[#5e5e5e] transition-colors duration-300"
          @click="goToActions"
        >
          <Icon
            name="heroicons:adjustments-horizontal"
            class="w-5 h-5 text-[#4993dd]"
          />
          Действия
        </button>
      </div>
      <div class="action">
        <button
          class="filter bg-[#1f78ff] rounded-[15px] flex items-center gap-[15px] p-[17px] text-[17px] font-bold text-white"
          @click="goToCreate"
        >
          <Icon name="heroicons:plus" class="w-5 h-5" />
          Создать
        </button>
      </div>
    </div>
    <TableFilter v-if="showFilters" />
    <div v-if="loading" class="text-center text-white py-6">
      Загружаем данные...
    </div>

    <!-- Таблица -->
    <table v-else class="w-full text-sm text-left text-[15px] text-[#bdbdbd]">
      <thead class="border-t border-b">
        <tr
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
        >
          <th
            v-for="header in headerGroup.headers"
            :key="header.id"
            class="cursor-pointer font-bold select-none p-[20px] hover:bg-[#5e5e5e] transition-colors duration-300"
            @click="header.column.getToggleSortingHandler()?.($event)"
          >
            <div class="flex justify-between">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
              <span v-if="header.column.getIsSorted() === 'asc'">▲</span>
              <span v-else-if="header.column.getIsSorted() === 'desc'">▼</span>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in table.getRowModel().rows"
          :key="row.id"
          class="overflow-hidden"
        >
          <td
            v-for="(cell, i) in row.getVisibleCells()"
            :key="cell.id"
            class="text-left text-[15px] font-bold"
            :class="[
              'px-4 py-2',
              index % 2 === 0 ? 'bg-[#262626]' : 'bg-[#404040]',
              row.getVisibleCells().length === 1
                ? 'rounded-[20px]'
                : i === 0
                ? 'rounded-l-[20px]'
                : i === row.getVisibleCells().length - 1
                ? 'rounded-r-[20px]'
                : '',
              cell.column.id === 'name'
                ? 'px-[25px] py-[20px] text-left text-[15px] text-[#4993dd] cursor-pointer'
                : 'text-white',
            ]"
            @click="
              cell.column.id === 'name' ? openProduct(row.original) : null
            "
          >
            <FlexRender
              :render="cell.column.columnDef.cell"
              :props="cell.getContext()"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Пагинация -->
    <div class="flex items-center justify-between text-white mt-4">
      <button
        @click="table.previousPage()"
        :disabled="!table.getCanPreviousPage()"
        class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
      >
        Назад
      </button>
      <span>
        Страница {{ table.getState().pagination.pageIndex + 1 }} из
        {{ table.getPageCount() }}
      </span>
      <button
        @click="table.nextPage()"
        :disabled="!table.getCanNextPage()"
        class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
      >
        Вперёд
      </button>
    </div>

    <!-- Боковое окно -->
    <transition name="slide">
      <teleport to="body">
        <div
          v-if="showProductSidebar"
          class="fixed top-0 right-0 h-full w-full max-w-[700px] bg-[#2b2b2b] text-white shadow-lg px-8 py-10 rounded-l-[60px] z-[9999] overflow-y-auto"
        >
          <!-- Заголовок -->
          <div class="flex justify-between items-center mb-6">
            <div class="border-gray-600 flex gap-[20px]">
              <img
                src="https://via.placeholder.com/40"
                alt=""
                class="rounded-full w-[60px] h-[60px] object-cover"
              />
              <div class="flex flex-col font-semibold">
                <p class="text-lg">{{ selectedProduct?.name }}</p>
                <p class="text-[#bdbdbd]">
                  {{ selectedProduct?.sku }} / {{ selectedProduct?.barcode }} /
                  {{ selectedProduct?.category }} /
                  {{ selectedProduct?.sale_price }} UZS
                </p>
              </div>
            </div>
            <button
              @click="showProductSidebar = false"
              class="flex items-center justify-center text-white bg-[#404040] rounded-full w-10 h-10 hover:bg-gray-400"
            >
              <Icon name="heroicons:x-mark" class="w-6 h-6" />
            </button>
          </div>
          <div class="mb-6">
            <h3 class="text-lg font-bold mb-3">История продукта</h3>
            <table
              class="w-full text-sm border border-gray-700 rounded-lg overflow-hidden"
            >
              <thead class="bg-[#3a3a3a] text-left">
                <tr>
                  <th class="p-2">Дата</th>
                  <th class="p-2">Действие</th>
                  <th class="p-2">Кол-во</th>
                  <th class="p-2">Магазин</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-t border-gray-700">
                  <td class="p-2">18.08.2025<br />16:02:42</td>
                  <td class="p-2">Импорт #892933</td>
                  <td class="p-2">1</td>
                  <td class="p-2">Samarqand Darvoza</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Цены -->
          <div class="mb-6">
            <h3 class="text-lg font-bold mb-3">Цены</h3>
            <table
              class="w-full text-sm border border-gray-700 rounded-lg overflow-hidden"
            >
              <thead class="bg-[#3a3a3a] text-left">
                <tr>
                  <th class="p-2">Магазин</th>
                  <th class="p-2">Цена поставки</th>
                  <th class="p-2">Наценка</th>
                  <th class="p-2">Цена продажи</th>
                  <th class="p-2">Оптовая</th>
                  <th class="p-2">Скидочная</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-t border-gray-700">
                  <td class="p-2">Samarqand Darvoza</td>
                  <td class="p-2">70 000 UZS</td>
                  <td class="p-2">164.28 %</td>
                  <td class="p-2">185 000 UZS</td>
                  <td class="p-2">-</td>
                  <td class="p-2">-</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Остатки -->
          <div class="mb-6">
            <h3 class="text-lg font-bold mb-3">Остатки</h3>
            <table
              class="w-full text-sm border border-gray-700 rounded-lg overflow-hidden"
            >
              <thead class="bg-[#3a3a3a] text-left">
                <tr>
                  <th class="p-2">Магазин</th>
                  <th class="p-2">Активные</th>
                  <th class="p-2">Неактивные</th>
                  <th class="p-2">Малый остаток</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-t border-gray-700">
                  <td class="p-2">Samarqand Darvoza</td>
                  <td class="p-2">1</td>
                  <td class="p-2">0</td>
                  <td class="p-2">0</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Характеристики -->
          <div class="mb-6">
            <h3 class="text-lg font-bold mb-3">Характеристики</h3>
            <div
              class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-[#bdbdbd]"
            >
              <p><b>Артикул:</b> XSN-29015</p>
              <p><b>Баркод:</b> 2000000013404</p>
              <p><b>Ед. изм.:</b> Штука</p>
              <p><b>Бренд:</b> -</p>
              <p><b>Весовой продукт:</b> Нет</p>
              <p><b>Маркировка:</b> Нет</p>
              <p><b>Поставщики:</b> -</p>
              <p><b>Категория:</b> Товар</p>
            </div>
          </div>
        </div>
      </teleport>
    </transition>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch, h } from "vue";
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  FlexRender,
} from "@tanstack/vue-table";
import { data as mockData } from "../data";
import TableFilter from "./TableFilter.vue";
import { useRouter } from "vue-router";
import placeholderImg from "../assets/images/placeholder_img.svg";

const router = useRouter();

const placeholder = placeholderImg;

const showProductSidebar = ref(false);
const selectedProduct = ref<any | null>(null);

function goToCreate() {
  router.push({
    path: "/products/create",
    query: { page: 1 },
  });
}

function openProduct(product: any) {
  selectedProduct.value = product;
  showProductSidebar.value = true;
}

// Получаем массив выбранных товаров
const selectedProducts = computed(
  () => table.getSelectedRowModel().rows.map((row) => row.original.id) // id должен быть в данных товара
);

function goToActions() {
  if (selectedProducts.value.length === 0) {
    alert("Выберите хотя бы один товар");
    return;
  }

  // Переход с передачей выбранных ID
  router.push({
    path: "/products/settings",
    query: { ids: selectedProducts.value.join(",") },
  });
}

const rawData = ref([]);
const globalFilter = ref("");
const loading = ref(false); // ⬅️ Состояние загрузки

// Пагинация и сортировка
const pagination = ref({ pageSize: 10, pageIndex: 0 });
const sorting = ref([]);

const showFilters = ref(false);

function applyFilters() {
  // Здесь логика применения фильтров
  showFilters.value = false;
}
// Симуляция загрузки с бэка
async function fetchData() {
  loading.value = true;
  rawData.value = [];
  // здесь будет реальный API-запрос
  await new Promise((resolve) => setTimeout(resolve, 500));
  rawData.value = mockData;
  loading.value = false;
}

// Загрузка при первом открытии
fetchData();

// Обновление при поиске
watch(globalFilter, async () => {
  pagination.value.pageIndex = 0;
  await fetchData();
});

const filteredData = computed(() => {
  if (!globalFilter.value) return rawData.value;
  return rawData.value.filter((item) =>
    Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(globalFilter.value.toLowerCase())
  );
});
const columns = [
  {
    id: "select",
    header: () =>
      h("input", {
        type: "checkbox",
        class: "w-3.5 h-3.5 accent-[#4993dd] cursor-pointer",
        // здесь можешь реализовать "выбрать всё"
        onChange: (e) => {
          const checked = e.target.checked;
          table
            .getRowModel()
            .rows.forEach((row) => row.toggleSelected(checked));
        },
      }),
    cell: ({ row }) =>
      h("input", {
        type: "checkbox",
        class: "w-3.5 h-3.5  accent-[#4993dd] cursor-pointer",
        checked: row.getIsSelected?.(),
        onChange: (e) => row.toggleSelected?.(e.target.checked),
      }),
    enableSorting: false,
    enableColumnFilter: false,
    size: 40,
  },
  {
    accessorKey: "photo",
    header: "Фото",
    cell: ({ getValue }) => {
      const url = getValue();
      const imageUrl = url
        ? url
        : new URL("../assets/images/placeholder_img.svg", import.meta.url).href;
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
    cell: ({ getValue }) => `${getValue()} шт`,
  },
  {
    accessorKey: "purchase_price",
    header: "Цена поставки",
    cell: ({ getValue }) => `${getValue()} UZS`,
  },
  {
    accessorKey: "sale_price",
    header: "Цена продажи",
    cell: ({ getValue }) => `${getValue()} UZS`,
  },
];

const table = useVueTable({
  data: filteredData,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  enableRowSelection: true, // ⬅️ обязательно
  state: {
    get pagination() {
      return pagination.value;
    },
    get sorting() {
      return sorting.value;
    },
  },
  onPaginationChange: (updater) => {
    pagination.value =
      typeof updater === "function" ? updater(pagination.value) : updater;
  },
  onSortingChange: (updater) => {
    sorting.value =
      typeof updater === "function" ? updater(sorting.value) : updater;
  },
});
</script>

<style scoped>
/* Анимация справа */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

table {
  border-collapse: collapse;
  width: 100%;
}

td {
  padding: 25px 20px;
  text-align: left;
}
th {
  text-align: left;
  font-weight: bold;
}
button:disabled {
  cursor: not-allowed;
}
input:focus {
  border: none;
  outline: none;
}
input::placeholder {
  color: #bdbdbd;
}
</style>
