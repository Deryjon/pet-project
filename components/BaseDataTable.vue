<script setup lang="ts">
import { FlexRender } from "@tanstack/vue-table";
// Пропсы
defineProps<{
  table: any; // экземпляр таблицы из useVueTable
  store: any; // стор, чтобы дергать методы (openProduct и т.п.)
}>();
</script>

<template>
  <!-- Контейнер со скроллом -->
  <div class="overflow-x-auto">
    <!-- Лоадер -->
    <div v-if="store.loading" class="text-center text-white py-6">
      Загружаем данные...
    </div>

    <!-- Таблица -->
    <table
      v-else
      class="min-w-full text-sm text-left text-[17px] text-[#bdbdbd]"
    >
      <thead class="border-t border-b rounded-[0px]">
        <tr
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
        >
          <th
            v-for="header in headerGroup.headers"
            :key="header.id"
            class="cursor-pointer font-bold select-none px-[20px] py-[25px] hover:bg-[#5e5e5e] transition-colors duration-300 whitespace-nowrap"
            :class="{ 'w-[50px] text-center': header.column.id === 'select' }"
            @click="header.column.getToggleSortingHandler()?.($event)"
          >
            <div
              class="flex justify-between"
              :class="{ 'justify-center': header.column.id === 'select' }"
            >
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
        >
          <td
            v-for="(cell, i) in row.getVisibleCells()"
            :key="cell.id"
            class="text-left text-[17px] font-normal whitespace-nowrap"
            :class="[ 
              'px-[20px] py-[25px]',
              index % 2 === 0 ? 'bg-[#262626]' : 'bg-[#404040]',
              row.getVisibleCells().length === 1
                ? 'rounded-[20px]'
                : i === 0
                ? 'rounded-l-[20px]'
                : i === row.getVisibleCells().length - 1
                ? 'rounded-r-[20px]'
                : '',
              cell.column.id === 'name'
                ? 'px-[20px] py-[25px] text-left text-[15px] text-[#4993dd] cursor-pointer'
                : 'text-white',
              cell.column.id === 'select'
                ? 'w-[50px] text-center align-middle'
                : '',
            ]"
            @click="
              cell.column.id === 'name' ? store.openProduct(row.original) : null
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
  </div>
</template>
