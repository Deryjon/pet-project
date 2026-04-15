<script setup lang="ts">
import { FlexRender } from "@tanstack/vue-table";

const props = defineProps<{
  table: any;
  store: any;
  interactiveColumnId?: string;
  onRowClick?: (row: any) => void;
}>();

function handleCellClick(cell: any, row: any) {
  if (cell.column.id !== props.interactiveColumnId) {
    return;
  }

  if (props.store?.productDetailsLoading) {
    return;
  }

  if (props.onRowClick) {
    props.onRowClick(row.original);
    return;
  }

  props.store?.openProduct?.(row.original);
}
</script>

<template>
  <div class="overflow-hidden rounded-[20px]">
    <div v-if="store.loading" class="py-6 text-center text-white">
      Загружаем данные...
    </div>

    <div v-else-if="table.getRowModel().rows.length" class="overflow-x-auto">
      <table
        class="min-w-[720px] w-full text-left text-sm text-[#bdbdbd] sm:min-w-full sm:text-[17px]"
      >
        <thead class="border-t border-b rounded-[0px]">
          <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              class="cursor-pointer select-none whitespace-nowrap px-3 py-4 text-[13px] font-bold transition-colors duration-300 hover:bg-[#5e5e5e] sm:px-[20px] sm:py-[25px] sm:text-base"
              :class="{ 'w-[50px] text-center': header.column.id === 'select' }"
              @click="header.column.getToggleSortingHandler()?.()"
            >
              <div
                class="flex justify-between gap-2"
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
              class="whitespace-nowrap px-3 py-4 text-left text-[13px] font-normal sm:px-[20px] sm:py-[25px] sm:text-[17px]"
              :class="[
                Number(index) % 2 === 0 ? 'bg-[#262626]' : 'bg-[#404040]',
                row.getVisibleCells().length === 1
                  ? 'rounded-[20px]'
                  : i === 0
                    ? 'rounded-l-[20px]'
                    : i === row.getVisibleCells().length - 1
                      ? 'rounded-r-[20px]'
                      : '',
                cell.column.id === 'name'
                  ? 'cursor-pointer text-left text-[14px] text-[#4993dd] sm:text-[15px]'
                  : 'text-white',
                cell.column.id === 'select' ? 'w-[50px] text-center align-middle' : '',
                cell.column.columnDef.meta?.tdClass ?? '',
              ]"
              :style="cell.column.columnDef.meta?.tdStyle ?? null"
              @click="handleCellClick(cell, row)"
            >
              <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-else
      class="rounded-[20px] bg-[#262626] px-6 py-10 text-center text-[15px] text-[#bdbdbd]"
    >
      Нет данных. Таблица ожидает ответ от backend.
    </div>
  </div>
</template>
