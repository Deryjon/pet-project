<template>
  <div class="space-y-4">
    <!-- Поиск -->
    <input
      v-model="globalFilter"
      type="text"
      placeholder="Поиск..."
      class="border px-3 py-2 rounded w-full text-black"
    />

    <!-- Таблица -->
    <table class="w-full border border-gray-700 text-sm text-left text-white">
      <thead class="bg-gray-800 text-white">
        <tr
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
        >
          <th
            v-for="header in headerGroup.headers"
            :key="header.id"
            class="border border-gray-600 px-4 py-2 font-semibold cursor-pointer select-none"
            @click="header.column.getToggleSortingHandler()?.()"
          >
            <FlexRender
              v-if="!header.isPlaceholder"
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
            <span v-if="header.column.getIsSorted() === 'asc'">▲</span>
            <span v-else-if="header.column.getIsSorted() === 'desc'">▼</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in table.getRowModel().rows"
          :key="row.id"
          class="hover:bg-gray-700 transition"
        >
          <td
            v-for="cell in row.getVisibleCells()"
            :key="cell.id"
            class="border border-gray-600 px-4 py-2"
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
import { ref, computed } from "vue";
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  FlexRender,
  createColumnHelper,
} from "@tanstack/vue-table";
import { data } from "../data"; // Подстрой путь

const rawData = ref(data);
const globalFilter = ref("");

// Фильтрация
const filteredData = computed(() => {
  if (!globalFilter.value) return rawData.value;
  return rawData.value.filter((item) =>
    Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(globalFilter.value.toLowerCase())
  );
});

// Колонки
const columns = [
  { accessorKey: "name", header: "Наименование" },
  { accessorKey: "sku", header: "Артикул" },
  { accessorKey: "barcode", header: "Баркод" },
  { accessorKey: "category", header: "Категория" },
  { accessorKey: "supplier", header: "Поставщик" },
  { accessorKey: "quantity", header: "Кол-во" },
  { accessorKey: "purchase_price", header: "Цена поставки" },
  { accessorKey: "sale_price", header: "Цена продажи" },
];

// Таблица
const table = useVueTable({
  data: filteredData,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  state: {
    pagination: {
      pageSize: 10,
      pageIndex: 0,
    },
  },
});
</script>

<style scoped>
table {
  border-collapse: collapse;
  width: 100%;
}

th,
td {
  padding: 12px;
  border: 1px solid #333;
  text-align: left;
}

th {
  background-color: #222;
  color: #fff;
  font-weight: bold;
}

tr:hover {
  background-color: #333;
}

button:disabled {
  cursor: not-allowed;
}
</style>
