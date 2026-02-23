<script setup lang="ts">
import { computed } from "vue";
import { useCatalogDataTableStore } from "@/store/DataTables/catalogDataTableStore";

type TableSection = {
  title: string;
  columns: string[];
  rows: string[][];
};

const store = useCatalogDataTableStore();

const selectedProduct = computed(() => store.selectedProduct);
const showProductSidebar = computed(() => !!store.selectedProduct);

const tableSections: TableSection[] = [
  {
    title: "История продукта",
    columns: ["Дата", "Действие", "Кол-во", "Магазин"],
    rows: [["18.08.2025\n16:02:42", "Импорт #892933", "1", "Samarqand Darvoza"]],
  },
  {
    title: "Цены",
    columns: [
      "Магазин",
      "Цена поставки",
      "Наценка",
      "Цена продажи",
      "Оптовая",
      "Скидочная",
    ],
    rows: [["Samarqand Darvoza", "70 000 UZS", "164.28 %", "185 000 UZS", "-", "-"]],
  },
  {
    title: "Остатки",
    columns: ["Магазин", "Активные", "Неактивные", "Малый остаток"],
    rows: [["Samarqand Darvoza", "1", "0", "0"]],
  },
];

const characteristics = computed(() => [
  { label: "Артикул", value: selectedProduct.value?.sku || "XSN-29015" },
  { label: "Баркод", value: selectedProduct.value?.barcode || "2000000013404" },
  { label: "Ед. изм.", value: "Штука" },
  { label: "Бренд", value: "-" },
  { label: "Весовой продукт", value: "Нет" },
  { label: "Маркировка", value: "Нет" },
  { label: "Поставщики", value: "-" },
  { label: "Категория", value: selectedProduct.value?.category || "Товар" },
]);

const productMeta = computed(() => {
  const p = selectedProduct.value;
  if (!p) return "";
  return `${p.sku || "-"} / ${p.barcode || "-"} / ${p.category || "-"} / ${p.sale_price || 0} UZS`;
});

function closeSidebar() {
  store.closeProductSidebar();
}
</script>

<template>
  <transition name="slide">
    <teleport to="body">
      <div
        v-if="showProductSidebar"
        class="fixed top-0 right-0 z-[9999] h-full w-full max-w-[768px] overflow-y-auto rounded-l-[60px] bg-[#2b2b2b] px-16 py-14 text-white shadow-lg"
      >
        <div class="mb-6 flex items-center justify-between">
          <div class="flex gap-[20px] border-gray-600">
            <img
              src="../../assets/images/placeholder_img.svg"
              alt=""
              class="h-[60px] w-[60px] rounded-[20px] object-cover"
            />
            <div class="flex flex-col font-semibold">
              <p class="text-[24px]">{{ selectedProduct?.name }}</p>
              <p class="text-[16px] text-[#bdbdbd]">{{ productMeta }}</p>
            </div>
          </div>
          <button
            @click="closeSidebar"
            class="flex h-10 w-10 items-center justify-center rounded-full bg-[#404040] text-white hover:bg-gray-400"
          >
            <Icon name="heroicons:x-mark" class="h-6 w-6" />
          </button>
        </div>

        <div
          v-for="section in tableSections"
          :key="section.title"
          class="mb-6"
        >
          <h3 class="mb-3 text-lg font-bold">{{ section.title }}</h3>
          <table class="w-full overflow-hidden rounded-lg border border-gray-700 text-sm">
            <thead class="bg-[#3a3a3a] text-left">
              <tr>
                <th
                  v-for="column in section.columns"
                  :key="column"
                  class="p-2"
                >
                  {{ column }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, rowIndex) in section.rows"
                :key="`${section.title}-${rowIndex}`"
                class="border-t border-gray-700"
              >
                <td
                  v-for="(cell, cellIndex) in row"
                  :key="`${section.title}-${rowIndex}-${cellIndex}`"
                  class="p-2 whitespace-pre-line"
                >
                  {{ cell }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mb-6">
          <h3 class="mb-3 text-lg font-bold">Характеристики</h3>
          <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-[#bdbdbd]">
            <p
              v-for="item in characteristics"
              :key="item.label"
            >
              <b>{{ item.label }}:</b> {{ item.value }}
            </p>
          </div>
        </div>
      </div>
    </teleport>
  </transition>
</template>
