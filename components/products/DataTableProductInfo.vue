<script setup lang="ts">
import { computed } from "vue";
import { useCatalogDataTableStore } from "@/store/DataTables/catalogDataTableStore";

type TableSection = {
  title: string;
  columns: string[];
  rows: string[][];
};

const store = useCatalogDataTableStore();
const footerActions = [
  { label: "Добавить остатки", icon: "heroicons:plus" },
  { label: "Печать ценников", icon: "heroicons:printer" },
  { label: "Изменить", icon: "heroicons:pencil-square" },
];

const selectedProduct = computed(() => store.selectedProduct);
const showProductSidebar = computed({
  get: () => !!store.selectedProduct,
  set: (isOpen: boolean) => {
    if (!isOpen) {
      closeSidebar();
    }
  },
});

const formatUZS = (value: unknown) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return `${new Intl.NumberFormat("ru-RU").format(num)} UZS`;
};

const tableSections = computed<TableSection[]>(() => {
  const p = selectedProduct.value;
  if (!p) return [];

  const supplierOrStore = p.suppliers || "-";
  const quantity = Number(p.quantity ?? 0);
  const purchasePrice = Number(p.purchase_price ?? 0);
  const salePrice = Number(p.sale_price ?? 0);
  const markup =
    purchasePrice > 0
      ? `${(((salePrice - purchasePrice) / purchasePrice) * 100).toFixed(2)} %`
      : "-";

  return [
    {
      title: "История продукта",
      columns: ["Дата", "Действие", "Кол-во", "Источник"],
      rows: [
        [
          new Date().toLocaleString("ru-RU"),
          "Выбран из каталога",
          String(quantity),
          supplierOrStore,
        ],
      ],
    },
    {
      title: "Цены",
      columns: [
        "Источник",
        "Цена поставки",
        "Наценка",
        "Цена продажи",
        "Оптовая",
        "Скидочная",
      ],
      rows: [
        [
          supplierOrStore,
          formatUZS(p.purchase_price),
          markup,
          formatUZS(p.sale_price),
          "-",
          formatUZS(p.discount_price),
        ],
      ],
    },
    {
      title: "Остатки",
      columns: ["Источник", "Активные", "Неактивные", "Малый остаток"],
      rows: [
        [supplierOrStore, String(quantity), "0", quantity > 0 ? "0" : "1"],
      ],
    },
  ];
});

const characteristics = computed(() => [
  { label: "Артикул", value: selectedProduct.value?.sku || "XSN-29015" },
  { label: "Баркод", value: selectedProduct.value?.barcode || "2000000013404" },
  { label: "Ед. изм.", value: "Штука" },
  { label: "Бренд", value: selectedProduct.value?.brand || "-" },
  { label: "Весовой продукт", value: "Нет" },
  { label: "Маркировка", value: "Нет" },
  { label: "Поставщики", value: selectedProduct.value?.suppliers || "-" },
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
  <USlideover
    v-model:open="showProductSidebar"
    side="right"
    :ui="{
      content:
        'z-[9999] h-full w-full max-w-[950px] overflow-y-auto rounded-l-[60px] bg-[#2b2b2b] px-16 pt-14 pb-0 text-white shadow-lg',
    }"
    :close="false"
  >
    <template #content>
      <div class="flex min-h-full flex-col">
        <div class="flex-1 pb-24">
          <div class="mb-6 flex items-center justify-between">
            <div class="flex gap-[20px] border-gray-600">
              <img
                :src="
                  selectedProduct?.photo ||
                  '../../assets/images/placeholder_img.svg'
                "
                alt="Фото товара"
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
            <table
              class="w-full overflow-hidden rounded-lg border border-gray-700 text-sm"
            >
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
            <div
              class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-[#bdbdbd]"
            >
              <p v-for="item in characteristics" :key="item.label">
                <b>{{ item.label }}:</b> {{ item.value }}
              </p>
            </div>
          </div>
        </div>
        <div
          class="sticky bottom-0 left-0 right-0 z-10 -mx-16 mt-auto border-[#4a4a4a] bg-[#2b2b2b] px-16 pt-4 pb-8"
        >
          <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
            <UButton
              v-for="action in footerActions"
              :key="action.label"
              class="inline-flex py-4 items-center justify-center gap-2 rounded-2xl bg-[#1f6bff] px-4 text-md font-semibold text-white transition hover:bg-[#1659d9]"
            >
              <Icon :name="action.icon" class="h-5 w-5" />
              <span>{{ action.label }}</span>
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </USlideover>
</template>
