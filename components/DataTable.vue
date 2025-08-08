<template>
  <div class="space-y-4">
    <!-- Поиск -->
    <input
      v-model="globalFilter"
      type="text"
      placeholder="Артикул, баркод, наименование"
      class="p-[17px] bg-[#404040] rounded-[15px] w-full text-[#bdbdbd] text-[16px] font-bold"
    />
    <div v-if="loading" class="text-center text-white py-6">
      Загружаем данные...
    </div>

    <!-- Таблица -->
    <table v-else class="w-full text-sm text-left text-[16px] text-[#bdbdbd]">
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
            class="text-left text-[16px] font-bold"
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
                ? 'px-[25px] py-[20px] text-left text-[16px] text-[#4993dd] cursor-pointer'
                : 'text-white',
            ]"
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

const rawData = ref([]);
const globalFilter = ref("");
const loading = ref(false); // ⬅️ Состояние загрузки

// Пагинация и сортировка
const pagination = ref({ pageSize: 10, pageIndex: 0 });
const sorting = ref([]);

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
  { accessorKey: "photo", header: "Фото", cell: ({ getValue }) => {
      const url = getValue();
      const imageUrl = url
        ? url
        : new URL("../assets/images/placeholder_img.svg", import.meta.url).href;
      return h("img", {
        src: imageUrl,
        alt: "Фото товара",
        class: "w-12 h-12 object-cover rounded",
      });
    }
  },
  { accessorKey: "name", header: "Наименование" },
  { accessorKey: "sku", header: "Артикул" },
  { accessorKey: "barcode", header: "Баркод" },
  { accessorKey: "category", header: "Категория" },
  { accessorKey: "supplier", header: "Поставщик" },
  { accessorKey: "quantity", header: "Кол-во", cell: ({ getValue }) => `${getValue()} шт` },
  { accessorKey: "purchase_price", header: "Цена поставки", cell: ({ getValue }) => `${getValue()} UZS` },
  { accessorKey: "sale_price", header: "Цена продажи", cell: ({ getValue }) => `${getValue()} UZS` },
];

const table = useVueTable({
  data: filteredData,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  state: {
    get pagination() {
      return pagination.value;
    },
    get sorting() {
      return sorting.value;
    },
  },
  onPaginationChange: (updater) => {
    pagination.value = typeof updater === "function" ? updater(pagination.value) : updater;
  },
  onSortingChange: (updater) => {
    sorting.value = typeof updater === "function" ? updater(sorting.value) : updater;
  },
});
</script>

<style scoped>
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
</style>
