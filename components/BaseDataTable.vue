<script setup lang="ts">
import { FlexRender } from "@tanstack/vue-table";

defineProps<{
  table: any;
  store: any;
}>();
</script>

<template>
  <div class="overflow-x-auto">
    <div v-if="store.loading" class="py-6 text-center text-white">
      Загружаем данные...
    </div>

    <table
      v-else-if="table.getRowModel().rows.length"
      class="min-w-full text-left text-sm text-[17px] text-[#bdbdbd]"
    >
      <thead class="border-t border-b rounded-[0px]">
        <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <th
            v-for="header in headerGroup.headers"
            :key="header.id"
            class="cursor-pointer select-none whitespace-nowrap px-[20px] py-[25px] font-bold transition-colors duration-300 hover:bg-[#5e5e5e]"
            :class="{ 'w-[50px] text-center': header.column.id === 'select' }"
            @click="header.column.getToggleSortingHandler()?.()"
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
        <tr v-for="(row, index) in table.getRowModel().rows" :key="row.id">
          <td
            v-for="(cell, i) in row.getVisibleCells()"
            :key="cell.id"
            class="whitespace-nowrap text-left text-[17px] font-normal"
            :class="[
              'px-[20px] py-[25px]',
              Number(index) % 2 === 0 ? 'bg-[#262626]' : 'bg-[#404040]',
              row.getVisibleCells().length === 1
                ? 'rounded-[20px]'
                : i === 0
                  ? 'rounded-l-[20px]'
                  : i === row.getVisibleCells().length - 1
                    ? 'rounded-r-[20px]'
                    : '',
              cell.column.id === 'name'
                ? 'cursor-pointer px-[20px] py-[25px] text-left text-[15px] text-[#4993dd]'
                : 'text-white',
              cell.column.id === 'select' ? 'w-[50px] text-center align-middle' : '',
              cell.column.columnDef.meta?.tdClass ?? '',
            ]"
            :style="cell.column.columnDef.meta?.tdStyle ?? null"
            @click="cell.column.id === 'name' ? store.openProduct(row.original) : null"
          >
            <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
          </td>
        </tr>
      </tbody>
    </table>

    <div
      v-else
      class="rounded-[20px] bg-[#262626] px-6 py-10 text-center text-[15px] text-[#bdbdbd]"
    >
      Нет данных. Таблица ожидает ответ от backend.
    </div>
  </div>
</template>
