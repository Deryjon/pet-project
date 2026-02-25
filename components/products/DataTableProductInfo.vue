<script setup lang="ts">
import { computed, ref } from "vue";
import { getLocalTimeZone, today } from "@internationalized/date";
import { useCatalogDataTableStore } from "@/store/DataTables/catalogDataTableStore";

type TableSection = {
  title: string;
  columns: string[];
  rows: string[][];
};

const store = useCatalogDataTableStore();
const placeholderImgUrl = new URL(
  "../../assets/images/placeholder_img.svg",
  import.meta.url,
).href;

const footerActions = [
  { label: "Добавить остатки", icon: "mynaui:plus-solid" },
  { label: "Печать ценников", icon: "pixel:print-solid" },
  { label: "Изменить", icon: "ic:round-edit" },
];

const selectedProduct = computed(() => store.selectedProduct);
const showProductSidebar = computed({
  get: () => !!store.selectedProduct,
  set: (isOpen: boolean) => {
    if (!isOpen) closeSidebar();
  },
});

const filtersOpen = ref(false);
const datePopoverOpen = ref(false);
const actionPopoverOpen = ref(false);
const shopPopoverOpen = ref(false);

const tz = getLocalTimeZone();
const selectedDate = ref<any>(today(tz));
const selectedAction = ref("Все действия");
const selectedShop = ref("Все магазины");

const actionOptions = [
  "Все действия",
  "Продажа",
  "Поступление",
  "Списание",
  "Перемещение",
];
const shopOptions = ["Все магазины", "Склад 1", "Склад 2", "Магазин 1"];

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

function getProductImage(photo?: string | null) {
  const src = typeof photo === "string" ? photo.trim() : "";
  return src.length > 0 ? src : placeholderImgUrl;
}

function onProductImageError(event: Event) {
  const target = event.target as HTMLImageElement | null;
  if (!target) return;
  if (target.src !== placeholderImgUrl) {
    target.src = placeholderImgUrl;
  }
}

function formatSingleDate(value: any) {
  if (!value || typeof value.toDate !== "function") return "Выберите дату";
  return value.toDate(tz).toLocaleDateString("ru-RU");
}
</script>

<template>
  <USlideover
    v-model:open="showProductSidebar"
    side="right"
    :ui="{
      overlay: 'bg-black/45 backdrop-blur-[1px]',
      content:
        'z-[9999] h-full w-full max-w-[950px] overflow-y-auto rounded-l-[60px] border-0 ring-0 sm:ring-0 bg-[#2b2b2b] px-16 pt-14 pb-0 text-white shadow-lg',
    }"
    :close="false"
  >
    <template #content>
      <div class="flex min-h-full flex-col">
        <div class="flex-1 pb-24">
          <div class="relative mb-6 flex items-center justify-between">
            <div class="flex gap-[20px] border-gray-600">
              <img
                :src="getProductImage(selectedProduct?.photo)"
                @error="onProductImageError"
                alt="Фото товара"
                class="h-[60px] w-[60px] rounded-[20px] object-cover"
              />
              <div class="flex flex-col font-semibold">
                <p class="text-[24px]">{{ selectedProduct?.name }}</p>
                <p class="text-[16px] text-[#bdbdbd]">{{ productMeta }}</p>
              </div>
            </div>

            <UButton
              @click="closeSidebar"
              class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#404040] text-white hover:bg-gray-400"
            >
              <Icon name="mingcute:close-fill" class="h-6 w-6" />
            </UButton>
          </div>
          <div
            class="relative after:block after:h-[0.8px] after:w-full after:bg-[repeating-linear-gradient(to_right,#6f6f6f_0_12px,transparent_12px_24px)] after:content-[''] my-10"
          ></div>

          <div
            v-for="(section, sectionIndex) in tableSections"
            :key="section.title"
            class="mb-6"
          >
            <div class="mb-3 flex items-center justify-between gap-4">
              <h3 class="text-2xl font-bold">{{ section.title }}</h3>
              <UButton
                v-if="sectionIndex === 0"
                color="neutral"
                variant="ghost"
                class="text-lg flex items-center gap-2 rounded-[12px] px-4 py-2 text-[#3b82f6]"
                @click="filtersOpen = !filtersOpen"
              >
                <Icon
                  name="heroicons:chevron-down"
                  class="h-5 w-5 transition-transform"
                  :class="{ 'rotate-180': filtersOpen }"
                />
                {{ filtersOpen ? "Скрыть фильтры" : "Показать фильтры" }}
              </UButton>
            </div>

            <div
              v-if="sectionIndex === 0 && filtersOpen"
              class="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3"
            >
              <UPopover
                v-model:open="datePopoverOpen"
                :content="{ align: 'start', side: 'bottom', sideOffset: 8 }"
                :ui="{
                  content:
                    'z-50 w-[320px] rounded-[12px] bg-[#262626] p-3 shadow-xl',
                }"
              >
                <UButton
                  color="neutral"
                  variant="ghost"
                  class="text-md flex w-full items-center justify-between rounded-[12px] bg-[#404040] px-4 py-4 text-left text-white hover:bg-[#a7a6a6]"
                >
                  <span>{{ formatSingleDate(selectedDate) }}</span>
                  <Icon name="ph:calendar" class="h-4 w-4 text-[#3b82f6]" />
                </UButton>
                <template #content>
                  <UCalendar
                    v-model="selectedDate"
                    color="neutral"
                    class="w-full rounded-[10px] bg-[#262626] text-white"
                    :ui="{
                      root: 'bg-[#262626] text-white',
                      header: 'text-white',
                      heading: 'text-white',
                      gridWeekDaysRow: 'text-[#bdbdbd]',
                    }"
                  />
                </template>
              </UPopover>

              <UPopover
                v-model:open="actionPopoverOpen"
                :content="{ align: 'start', side: 'bottom', sideOffset: 8 }"
                :ui="{
                  content:
                    'z-50 w-full min-w-[220px] rounded-[12px] border border-[#404040] bg-[#262626] p-2 shadow-xl text-md ',
                }"
              >
                <UButton
                  color="neutral"
                  variant="ghost"
                  class="flex w-full items-center justify-between rounded-[12px] bg-[#404040] px-4 py-3 text-white hover:bg-[#a7a6a6] text-md"
                >
                  <span>{{ selectedAction }}</span>
                  <Icon name="heroicons:chevron-down" class="h-4 w-4" />
                </UButton>

                <template #content>
                  <ul>
                    <li
                      v-for="option in actionOptions"
                      :key="option"
                      class="cursor-pointer rounded-[8px] px-3 py-2 text-white hover:bg-[#a7a6a6]"
                      @click="
                        selectedAction = option;
                        actionPopoverOpen = false;
                      "
                    >
                      {{ option }}
                    </li>
                  </ul>
                </template>
              </UPopover>

              <UPopover
                v-model:open="shopPopoverOpen"
                :content="{ align: 'start', side: 'bottom', sideOffset: 8 }"
                :ui="{
                  content:
                    'text-md  z-50 w-full min-w-[220px] rounded-[12px] border border-[#404040] bg-[#262626] p-2 shadow-xl',
                }"
              >
                <UButton
                  color="neutral"
                  variant="ghost"
                  class="flex w-full items-center justify-between rounded-[12px] bg-[#404040] px-4 py-3 text-white hover:bg-[#a7a6a6] text-md"
                >
                  <span>{{ selectedShop }}</span>
                  <Icon name="heroicons:chevron-down" class="h-5 w-5" />
                </UButton>

                <template #content>
                  <ul>
                    <li
                      v-for="option in shopOptions"
                      :key="option"
                      class="cursor-pointer rounded-[8px] px-3 py-2 text-white hover:bg-[#404040]"
                      @click="
                        selectedShop = option;
                        shopPopoverOpen = false;
                      "
                    >
                      {{ option }}
                    </li>
                  </ul>
                </template>
              </UPopover>
            </div>

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
                    class="whitespace-pre-line p-2"
                  >
                    {{ cell }}
                  </td>
                </tr>
              </tbody>
            </table>
            <div
              class="relative after:block after:h-[0.8px] after:w-full after:bg-[repeating-linear-gradient(to_right,#6f6f6f_0_12px,transparent_12px_24px)] after:content-[''] my-10"
            ></div>
          </div>

          <div class="mb-6">
            <h3 class="mb-3 text-lg font-bold">Характеристики</h3>
            <div
              class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm  text-[#bdbdbd]"
            >
              <p
                class="bg-[#3a3a3a] py-3 px-3 flex flex-col rounded-[15px]"
                v-for="item in characteristics"
                :key="item.label"
                :class="
                  ['Поставщики', 'Категория', 'Описание'].includes(item.label)
                    ? 'col-span-2 w-full'
                    : 'w-full'
                "
              >
                <span>{{ item.label }}</span>
                <span class="text-white">{{ item.value }}</span>
              </p>
            </div>
          </div>
        </div>

        <div
          class="sticky bottom-0 left-0 right-0 z-10 -mx-16 mt-auto border-[#4a4a4a] bg-[#2b2b2b] px-16 pb-8 pt-4"
        >
          <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
            <UButton
              v-for="action in footerActions"
              :key="action.label"
              class="flex items-center justify-center gap-2 rounded-2xl bg-[#3b82f6] px-4 py-4 text-lg font-semibold text-white transition hover:bg-[#1659d9]"
            >
              <Icon :name="action.icon" class="h-6 w-6" />
              <span>{{ action.label }}</span>
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </USlideover>
</template>
