<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useCatalogDataTableStore } from "@/store/DataTables/catalogDataTableStore";
import { useLocationStore } from "@/store/useLocationStore";
import { useProductStore } from "@/store/productStore";
import { resolveProductImageUrl, useProducts } from "~/composables/useProducts";
import type { ProductMovementItem, ProductMovementResponse } from "~/types/product-detail";

type TableSection = {
  title: string;
  columns: string[];
  rows: string[][];
};

type HistoryActionOption = {
  value: string;
  label: string;
};

type HistoryShopOption = {
  shopId: string;
  shopName: string;
};

const store = useCatalogDataTableStore();
const router = useRouter();
const locationStore = useLocationStore();
const productStore = useProductStore();
const { fetchProductMovements } = useProducts();
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
const canViewSupplyPrice = computed(() => store.canViewSupplyPrice);
const showProductSidebar = computed({
  get: () => !!store.selectedProduct,
  set: (isOpen: boolean) => {
    if (!isOpen) closeSidebar();
  },
});

const filtersOpen = ref(false);
const actionPopoverOpen = ref(false);
const shopPopoverOpen = ref(false);
const productHistoryLoading = ref(false);
const productMovementData = ref<ProductMovementResponse | null>(null);
const historyActionOptions = ref<HistoryActionOption[]>([]);
const historyShopOptions = ref<HistoryShopOption[]>([]);

const selectedDate = ref("");
const selectedActionType = ref("");
const selectedShopId = ref("");

const actionOptions = computed(() => [
  { value: "", label: "Все действия" },
  ...historyActionOptions.value,
]);

const shopOptions = computed(() => [
  { shopId: "", shopName: "Все магазины" },
  ...historyShopOptions.value,
]);

const formatUZS = (value: unknown) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return `${new Intl.NumberFormat("ru-RU").format(num)} UZS`;
};

const selectedActionLabel = computed(() =>
  actionOptions.value.find((option) => option.value === selectedActionType.value)?.label ?? "Все действия",
);

const selectedShopLabel = computed(() =>
  shopOptions.value.find((option) => option.shopId === selectedShopId.value)?.shopName ?? "Все магазины",
);

const productUnitLabel = computed(() =>
  String(selectedProduct.value?.unit ?? selectedProduct.value?._original?.measurement_unit?.short_name ?? "").trim(),
);

const shopNameMap = computed(() => {
  const entries = [
    ...locationStore.locations.map((shop) => [String(shop.id), String(shop.name)] as const),
    ...historyShopOptions.value.map((shop) => [String(shop.shopId), String(shop.shopName)] as const),
  ];

  return new Map(entries.filter(([id, name]) => id && name));
});

const movementStateMessage = computed(() => {
  if (productHistoryLoading.value) {
    return "Загрузка...";
  }

  const movement = productMovementData.value;
  if (!movement) return "Нет данных";
  if (movement.movements.length > 0) return "";
  if (movement.count > 0) return "Текущая страница пуста. Проверьте пагинацию или фильтры.";
  return "Нет движений";
});

const movementRows = computed<string[][]>(() => {
  if (movementStateMessage.value) {
    return [[movementStateMessage.value, "-", "-", "-", "-", "-", "-"]];
  }

  return (productMovementData.value?.movements ?? []).map((item) => [
    formatDateTimeCell(item.created_at),
    item.type_label,
    String(item.external_id || "-"),
    formatProductQuantity(item.measurement_value),
    formatProductQuantity(item.loaded_measurement_value),
    formatUZS(item.supply_price),
    formatUZS(item.retail_price),
  ]);
});

const stockRows = computed<string[][]>(() => {
  const p = selectedProduct.value;
  if (!p) return [];

  const original = p._original ?? {};
  const productSupplyStock = Array.isArray(original.product_supply_stock)
    ? original.product_supply_stock
    : [];
  const shopMeasurementValues = Array.isArray(original.shop_measurement_values)
    ? original.shop_measurement_values
    : [];

  const source = productSupplyStock.length ? productSupplyStock : shopMeasurementValues;

  if (source.length) {
    return source.map((item: any) => {
      const shopName =
        String(
          item?.shop?.name ??
          item?.shop_name ??
          item?.branch?.name ??
          item?.branch_name ??
          p.shop_name ??
          "-",
        ).trim() || "-";
      const active = Number(
        item?.active_measurement_value ??
        item?.measurement_value ??
        item?.total_measurement_value ??
        item?.quantity ??
        0,
      );
      const inactive = Number(item?.inactive_measurement_value ?? item?.inactive_quantity ?? 0);
      const low = Number(item?.small_left_measurement_value ?? item?.low_quantity ?? 0);

      return [
        shopName,
        formatProductQuantity(active),
        formatProductQuantity(inactive),
        formatProductQuantity(low),
      ];
    });
  }

  return [[
    String(p.shop_name || "-"),
    formatProductQuantity(p.quantity),
    formatProductQuantity(0),
    formatProductQuantity(0),
  ]];
});

const movementStatCards = computed(() => {
  const movement = productMovementData.value;
  if (!movement) return [];

  return [
    { label: "Остаток", value: formatProductQuantity(movement.total_measurement_value) },
    { label: "Импорт", value: formatProductQuantity(movement.imported) },
    { label: "Продано", value: formatProductQuantity(movement.sold) },
    { label: "Трансфер", value: formatProductQuantity(movement.transfered) },
    { label: "Пришло трансфером", value: formatProductQuantity(movement.transfer_arrived) },
    { label: "Списано", value: formatProductQuantity(movement.written_off) },
    { label: "В заказах", value: formatProductQuantity(movement.accepted_order) },
  ];
});

const supplyPriceHistoryRows = computed<string[][]>(() => {
  const movement = productMovementData.value;
  const history = Array.isArray(movement?.supply_price_history) ? movement.supply_price_history : [];

  if (!history.length) {
    return [["Нет истории закупочной цены", "-", "-", "-"]];
  }

  return history.map((item) => {
    const shopId = String(item.shop_id ?? "").trim();
    const shopName = shopNameMap.value.get(shopId) || shopId || "-";
    return [
      formatDateTimeCell(item.created_at),
      shopName,
      formatUZS(item.old_supply_price),
      formatUZS(item.supply_price),
    ];
  });
});

const tableSections = computed<TableSection[]>(() => {
  const p = selectedProduct.value;
  if (!p) return [];

  const supplierOrStore = p.suppliers || "-";

  const sections: TableSection[] = [
    {
      title: "История движения",
      columns: ["Дата", "Действие", "Документ", "Кол-во", "Остаток после", "Закупка", "Розница"],
      rows: movementRows.value,
    },
  ];

  if (canViewSupplyPrice.value) {
    const purchasePrice = Number(p.purchase_price ?? 0);
    const salePrice = Number(p.sale_price ?? 0);
    const markup =
      purchasePrice > 0
        ? `${(((salePrice - purchasePrice) / purchasePrice) * 100).toFixed(2)} %`
        : "-";

    sections.push({
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
    });
  } else {
    sections.push({
      title: "Цены",
      columns: ["Источник", "Цена продажи", "Оптовая", "Скидочная"],
      rows: [
        [
          supplierOrStore,
          formatUZS(p.sale_price),
          "-",
          formatUZS(p.discount_price),
        ],
      ],
    });
  }

  sections.push({
    title: "История закупочной цены",
    columns: ["Дата", "Магазин", "Старая цена", "Новая цена"],
    rows: supplyPriceHistoryRows.value,
  });

  sections.push({
    title: "Остатки",
    columns: ["Магазин", "Активные", "Неактивные", "Малый остаток"],
    rows: stockRows.value,
  });

  return sections;
});

const characteristics = computed(() => [
  { label: "Артикул", value: selectedProduct.value?.sku || "XSN-29015" },
  { label: "Баркод", value: selectedProduct.value?.barcode || "2000000013404" },
  { label: "Ед. изм.", value: productUnitLabel.value || "-" },
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

async function handleFooterAction(actionLabel: string) {
  if (!selectedProduct.value) {
    return;
  }

  const product = selectedProduct.value;

  if (actionLabel === "Печать ценников") {
    closeSidebar();
    await router.push({
      path: "/products/settings/print-tag",
      query: {
        productId: String(product.id ?? ""),
        productName: String(product.name ?? ""),
        sku: String(product.sku ?? ""),
        barcode: String(product.barcode ?? ""),
        price: String(product.sale_price ?? 0),
        shop: String(product.shop_name ?? ""),
        count: "1",
      },
    });
    return;
  }

  if (actionLabel === "Добавить остатки") {
    productStore.startEditingProduct(product);
    closeSidebar();
    await router.push({
      path: "/products/create",
      query: {
        mode: "edit",
        id: String(product.id ?? ""),
        focus: "stocks",
        intent: "add-receipt",
      },
    });
    return;
  }

  if (actionLabel !== "Изменить") {
    return;
  }

  productStore.startEditingProduct(product);
  closeSidebar();
  await router.push({
    path: "/products/create",
    query: {
      mode: "edit",
      id: String(product.id ?? ""),
    },
  });
}

function getProductImage(photo?: string | null) {
  const src = resolveProductImageUrl(photo);
  return src.length > 0 ? src : placeholderImgUrl;
}

function onProductImageError(event: Event) {
  const target = event.target as HTMLImageElement | null;
  if (!target) return;
  if (target.src !== placeholderImgUrl) {
    target.src = placeholderImgUrl;
  }
}

function formatDateTimeCell(value: unknown) {
  const date = value ? new Date(String(value)) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return "-";
  }

  return `${date.toLocaleDateString("ru-RU")}\n\n${date.toLocaleTimeString("ru-RU")}`;
}

function formatProductQuantity(value: unknown) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "-";

  const formatted = new Intl.NumberFormat("ru-RU").format(num);
  return productUnitLabel.value ? `${formatted} ${productUnitLabel.value}` : formatted;
}

function normalizeCalendarDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

async function loadProductHistory() {
  const productId = String(
    selectedProduct.value?._original?.public_id ??
      selectedProduct.value?.id ??
      selectedProduct.value?._original?.id ??
      "",
  ).trim();

  if (!productId) {
    productMovementData.value = null;
    historyActionOptions.value = [];
    historyShopOptions.value = [];
    return;
  }

  productHistoryLoading.value = true;

  try {
    const selectedDateKey = normalizeCalendarDateKey(selectedDate.value);
    const movementRes: ProductMovementResponse = await fetchProductMovements(productId, {
      page: 1,
      limit: 100,
      from_created_at: selectedDateKey ?? undefined,
      to_created_at: selectedDateKey ?? undefined,
      movement_type: selectedActionType.value || undefined,
      shop_id: selectedShopId.value || undefined,
    });
    productMovementData.value = movementRes;

    const movements = Array.isArray(movementRes?.movements) ? movementRes.movements : [];
    const availableShops = Array.isArray(movementRes?.available_shops) ? movementRes.available_shops : [];

    historyActionOptions.value = Array.isArray(movementRes?.available_movement_types)
      ? movementRes.available_movement_types
          .map((item) => ({
            value: String(item?.value ?? "").trim(),
            label: String(item?.label ?? "").trim() || String(item?.value ?? "").trim(),
          }))
          .filter((item) => item.value)
      : Array.from(
          new Map(
            movements.map((item: ProductMovementItem) => {
                const value = String(item.type ?? "").trim();
                const label = String(item.type_label ?? "").trim();
                return value && label ? [value, label] as const : null;
              })
              .filter(Boolean)
              .map((entry) => entry as readonly [string, string]),
          ),
          ([value, label]) => ({ value, label }),
        );

    historyShopOptions.value = availableShops
      ? availableShops
          .map((shop) => ({
            shopId: String(shop?.shop_id ?? "").trim(),
            shopName: String(shop?.shop_name ?? "").trim(),
          }))
          .filter((shop) => shop.shopId && shop.shopName)
      : [];
  } catch {
    productMovementData.value = null;
  } finally {
    productHistoryLoading.value = false;
  }
}

watch(
  () => [
    showProductSidebar.value,
    selectedProduct.value?.id,
    selectedActionType.value,
    selectedShopId.value,
    normalizeCalendarDateKey(selectedDate.value),
  ],
  async ([isOpen]) => {
    if (!isOpen) {
      productMovementData.value = null;
      return;
    }

    await loadProductHistory();
  },
  { immediate: true },
);
</script>

<template>
  <AppSlideover
    :open="showProductSidebar"
    @update:open="showProductSidebar = $event"
    maxWidthClass="max-w-[1120px]"
    roundedClass="rounded-none sm:rounded-l-[40px] lg:rounded-l-[60px]"
    overlayClass="bg-black/45 backdrop-blur-[1px]"
    panelClass="overflow-y-auto bg-[#2b2b2b] px-4 pt-6 pb-0 text-white sm:px-8 sm:pt-10 lg:px-16 lg:pt-14"
  >
      <div class="flex min-h-full flex-col">
        <div class="flex-1 pb-24">
          <div class="relative mb-6 flex items-start justify-between gap-4">
            <div class="flex min-w-0 gap-4 border-gray-600 sm:gap-[20px]">
              <img
                :src="getProductImage(selectedProduct?.photo)"
                @error="onProductImageError"
                alt="Фото товара"
                class="h-[56px] w-[56px] rounded-[16px] object-cover sm:h-[60px] sm:w-[60px] sm:rounded-[20px]"
              />
              <div class="flex min-w-0 flex-col font-semibold">
                <p class="break-words text-[18px] sm:text-[24px]">{{ selectedProduct?.name }}</p>
                <p class="break-words text-[13px] text-[#bdbdbd] sm:text-[16px]">{{ productMeta }}</p>
              </div>
            </div>

            <UButton
              @click="closeSidebar"
              class="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#404040] text-white hover:bg-gray-400 sm:h-12 sm:w-12"
            >
              <Icon name="mingcute:close-fill" class="h-6 w-6" />
            </UButton>
          </div>
          <div
            class="relative after:block after:h-[0.8px] after:w-full after:bg-[repeating-linear-gradient(to_right,#6f6f6f_0_12px,transparent_12px_24px)] after:content-[''] my-10"
          ></div>

          <div
            v-if="movementStatCards.length"
            class="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7"
          >
            <div
              v-for="card in movementStatCards"
              :key="card.label"
              class="rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,#363636,#2f2f2f)] px-4 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
            >
              <p class="text-[12px] uppercase tracking-[0.18em] text-[#9f9f9f]">{{ card.label }}</p>
              <p class="mt-2 text-[24px] font-bold text-white">{{ card.value }}</p>
            </div>
          </div>

          <div
            v-for="(section, sectionIndex) in tableSections"
            :key="section.title"
            class="mb-6"
          >
            <div class="mb-3 flex items-center justify-between gap-4">
              <h3 class="text-xl font-bold sm:text-2xl">{{ section.title }}</h3>
              <UButton
                v-if="sectionIndex === 0"
                color="neutral"
                variant="ghost"
                class="flex items-center gap-2 rounded-[12px] px-3 py-2 text-sm text-[#3b82f6] sm:px-4 sm:text-lg"
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
              <AppDatePicker
                v-model="selectedDate"
                placeholder="Все даты"
                clearable
                class="w-full"
              />

              <UPopover
                v-model:open="actionPopoverOpen"
                :content="{ align: 'start', side: 'bottom', sideOffset: 8 }"
                :ui="{
                  content:
                    'z-[10050] w-full min-w-[220px] rounded-[12px] border border-[#404040] bg-[#262626] p-2 text-sm shadow-xl sm:text-base',
                }"
              >
                <UButton
                  color="neutral"
                  variant="ghost"
                  class="flex w-full items-center justify-between rounded-[12px] bg-[#404040] px-4 py-3 text-sm text-white hover:bg-[#a7a6a6] sm:text-base"
                >
                  <span>{{ selectedActionLabel }}</span>
                  <Icon name="heroicons:chevron-down" class="h-4 w-4" />
                </UButton>

                <template #content>
                  <ul>
                    <li
                      v-for="option in actionOptions"
                      :key="option.value || 'all'"
                      class="cursor-pointer rounded-[8px] px-3 py-2 text-white hover:bg-[#a7a6a6]"
                      @click="
                        selectedActionType = option.value;
                        actionPopoverOpen = false;
                      "
                    >
                      {{ option.label }}
                    </li>
                  </ul>
                </template>
              </UPopover>

              <UPopover
                v-model:open="shopPopoverOpen"
                :content="{ align: 'start', side: 'bottom', sideOffset: 8 }"
                :ui="{
                  content:
                    'z-[10050] w-full min-w-[220px] rounded-[12px] border border-[#404040] bg-[#262626] p-2 text-sm shadow-xl sm:text-base',
                }"
              >
                <UButton
                  color="neutral"
                  variant="ghost"
                  class="flex w-full items-center justify-between rounded-[12px] bg-[#404040] px-4 py-3 text-sm text-white hover:bg-[#a7a6a6] sm:text-base"
                >
                  <span>{{ selectedShopLabel }}</span>
                  <Icon name="heroicons:chevron-down" class="h-5 w-5" />
                </UButton>

                <template #content>
                  <ul>
                    <li
                      v-for="option in shopOptions"
                      :key="option.shopId || 'all'"
                      class="cursor-pointer rounded-[8px] px-3 py-2 text-white hover:bg-[#404040]"
                      @click="
                        selectedShopId = option.shopId;
                        shopPopoverOpen = false;
                      "
                    >
                      {{ option.shopName }}
                    </li>
                  </ul>
                </template>
              </UPopover>
            </div>

            <div class="overflow-x-auto rounded-lg border border-gray-700">
              <table class="min-w-[560px] w-full overflow-hidden text-sm">
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
            <div
              class="relative after:block after:h-[0.8px] after:w-full after:bg-[repeating-linear-gradient(to_right,#6f6f6f_0_12px,transparent_12px_24px)] after:content-[''] my-10"
            ></div>
          </div>

          <div class="mb-6">
            <h3 class="mb-3 text-lg font-bold">Характеристики</h3>
            <div
              class="grid grid-cols-1 gap-x-6 gap-y-2 text-sm text-[#bdbdbd] sm:grid-cols-2"
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
          class="sticky bottom-0 left-0 right-0 z-10 -mx-4 mt-auto border-[#4a4a4a] bg-[#2b2b2b] px-4 pb-4 pt-4 sm:-mx-8 sm:px-8 sm:pb-6 lg:-mx-16 lg:px-16 lg:pb-8"
        >
          <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
            <UButton
              v-for="action in footerActions"
              :key="action.label"
              class="flex items-center justify-center gap-2 rounded-2xl bg-[#3b82f6] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1659d9] sm:py-4 sm:text-lg"
              @click="handleFooterAction(action.label)"
            >
              <Icon :name="action.icon" class="h-6 w-6" />
              <span>{{ action.label }}</span>
            </UButton>
          </div>
        </div>
      </div>
  </AppSlideover>
</template>
