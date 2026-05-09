<script setup lang="ts">
type ReportTableColumn = {
  key: string;
  label: string;
  align?: string;
  formatter?: (value: unknown, row: Record<string, any>) => string;
};

const props = defineProps<{
  title?: string;
  description?: string;
  columns: any[];
  rows: Record<string, any>[];
  rowKey?: string;
  loading?: boolean;
  emptyText?: string;
  rowLinkBase?: string;
}>();

function cellValue(column: ReportTableColumn, row: Record<string, any>) {
  const value = row[column.key];
  return column.formatter ? column.formatter(value, row) : String(value ?? "—");
}

function cellClass(align?: string) {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}
</script>

<template>
  <section class="overflow-hidden rounded-[28px] border border-white/10 bg-[#202020] shadow-[0_18px_50px_rgba(2,6,23,0.18)]">
    <div v-if="title || description" class="border-b border-white/10 px-5 py-5 sm:px-6">
      <h3 v-if="title" class="text-[20px] font-semibold text-white">{{ title }}</h3>
      <p v-if="description" class="mt-2 text-sm text-[#a3a3a3]">{{ description }}</p>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="border-b border-white/10 bg-white/5">
            <th v-for="column in columns" :key="column.key" class="px-4 py-3 font-semibold text-[#bdbdbd]" :class="cellClass(column.align)">
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length" class="px-4 py-8 text-center text-[#a3a3a3]">Загрузка...</td>
          </tr>
          <tr v-else-if="!rows.length">
            <td :colspan="columns.length" class="px-4 py-8 text-center text-[#a3a3a3]">{{ emptyText || "Нет данных" }}</td>
          </tr>
          <tr v-for="row in rows" v-else :key="String(row[rowKey || 'id'] ?? row.id ?? row.name)" class="border-b border-white/5 transition hover:bg-white/5">
            <td v-for="column in columns" :key="column.key" class="px-4 py-3 text-white/90" :class="cellClass(column.align)">
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
                <NuxtLink
                  v-if="column.key === 'name' && rowLinkBase && row.id"
                  :to="`${rowLinkBase}/${encodeURIComponent(String(row.id))}`"
                  class="font-medium text-[#8ebcff] hover:text-white"
                >
                  {{ cellValue(column, row) }}
                </NuxtLink>
                <span v-else>{{ cellValue(column, row) }}</span>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
