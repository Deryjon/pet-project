<template>
  <div class="relative flex flex-col items-stretch gap-2 sm:flex-row sm:items-start sm:justify-between">
    <div class="relative z-30 min-w-0 flex-1">
      <UInput
        v-model="searchQuery"
        class="w-full"
        placeholder="Артикул, баркод, наименование"
        size="xl"
        color="neutral"
        variant="none"
        :disabled="isActionBusy"
        :ui="{
          root: 'w-full',
          base: 'h-[52px] rounded-[15px] border-0 bg-[#404040] px-4 text-[15px] font-bold text-[#bdbdbd] placeholder:text-[#bdbdbd] focus:outline-none focus:ring-0 sm:h-[58px] sm:text-[17px]',
          leading: 'ps-4'
        }"
      >
        <template #leading>
          <Icon name="fe:search" class="h-4 w-4 text-[#bdbdbd]" />
        </template>
      </UInput>
    </div>

    <div class="relative z-30 flex gap-2 h-full`">
      <UButton
        color="primary"
        variant="solid"
        class="grouped-action-button flex-1 justify-between rounded-[15px] bg-[#1f78ff] px-4 text-white hover:bg-[#4993dd] sm:flex-none"
        :disabled="isActionBusy"
        aria-label="Открыть возврат или обмен"
        title="Открыть возврат или обмен"
        @click="void openSaleActionPicker()"
      >
        <Icon name="fa7-solid:exchange" class="h-5 w-5" />
      </UButton>

      <UButton
        color="neutral"
        variant="solid"
        class="grouped-action-button flex-1 justify-between rounded-[15px] bg-[#303030] px-4 text-white hover:bg-[#3a3a3a] sm:flex-none"
        :disabled="isActionBusy"
        aria-label="Открыть черновики или отложки"
        title="Открыть черновики или отложки"
        @click="void openResumePicker()"
      >
        <Icon name="heroicons:clock" class="h-5 w-5" />
      </UButton>
    </div>

    <transition name="fade">
      <div
        v-if="showDropdown"
        class="fixed inset-0 z-10 bg-black/40 backdrop-blur-sm"
        @click="searchQuery = ''"
      />
    </transition>

    <div
      v-if="showDropdown"
      class="absolute top-full z-20 mt-2 flex max-h-[250px] w-full flex-col gap-2 overflow-y-auto rounded-xl shadow-lg"
    >
      <div
        v-if="store.productsLoading"
        class="flex flex-col gap-2"
      >
        <div
          v-for="item in 3"
          :key="item"
          class="flex flex-col gap-3 rounded-[12px] bg-[#262626] p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex min-w-0 items-center gap-3 sm:gap-4">
            <div class="h-[20px] w-[20px] shrink-0 animate-pulse rounded bg-[#404040]" />
            <div class="min-w-0 space-y-2">
              <div class="h-4 w-48 max-w-[55vw] animate-pulse rounded-full bg-[#404040]" />
              <div class="text-[12px] font-bold uppercase tracking-[0.1em] text-[#777] sm:text-[14px]">
                #SKU-{{ item }} / 000{{ item }}000{{ item }}
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-2 sm:items-end">
            <div class="h-4 w-24 animate-pulse rounded-full bg-[#404040]" />
            <div class="text-[12px] font-bold uppercase tracking-[0.1em] text-[#777]">#QTY-{{ item }}</div>
          </div>
        </div>
      </div>

      <div
        v-else-if="filteredProducts.length === 0"
        class="rounded-[12px] bg-[#262626] p-4 text-[14px] font-semibold text-[#bdbdbd] sm:text-[16px]"
      >
        Ничего не найдено
      </div>

      <button
        v-for="product in filteredProducts"
        :key="product.id"
        type="button"
        :disabled="store.isItemBusy(product.id) || store.addingItem"
        class="flex cursor-pointer flex-col items-start gap-3 rounded-[12px] bg-[#262626] p-3 text-left text-[14px] font-semibold transition hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-row sm:items-center sm:justify-between sm:text-[16px]"
        @click="addToCart(product)"
      >
        <div class="flex w-full min-w-0 items-center gap-3 sm:gap-4">
          <div class="h-[20px] w-[20px] shrink-0 bg-[#404040]" />
          <div class="flex min-w-0 flex-col">
            <span class="truncate text-[#4993dd]">{{ product.name }}</span>
            <span class="break-all text-[12px] sm:text-[14px]">{{ product.barcode }} / {{ product.article }}</span>
          </div>
        </div>
        <div class="flex w-full flex-col text-left sm:w-auto sm:text-right">
          <span>{{ formatPrice(product.price) }} UZS</span>
          <span class="text-[#999]">Кол-во: {{ Number(product.availableQuantity ?? 0) }} шт</span>
        </div>
      </button>
    </div>

    <AppSlideover
      :open="pickerOpen"
      @update:open="pickerOpen = $event"
      maxWidthClass="max-w-[1180px]"
      roundedClass="rounded-none sm:rounded-l-[32px] lg:rounded-l-[44px]"
      panelClass="bg-[#1f1f1f] text-white"
    >
        <div class="flex min-h-full flex-col">
          <div class="flex flex-wrap items-start justify-between gap-4 px-5 py-5 sm:px-6">
            <div>
              <h3 class="text-[24px] font-semibold">{{ pickerGroupTitle }}</h3>
              <p class="mt-1 text-sm text-[#9a9a9a]">{{ pickerDescription }}</p>
              <div class="mt-4 inline-flex rounded-[16px] bg-white/5 p-1">
                <button
                  v-for="option in pickerModeOptions"
                  :key="option.value"
                  type="button"
                  class="rounded-[12px] px-4 py-2 text-sm font-semibold transition"
                  :class="
                    pickerMode === option.value
                      ? 'bg-[#1f78ff] text-white shadow-[0_8px_24px_rgba(31,120,255,0.28)]'
                      : 'text-[#bdbdbd] hover:bg-white/5 hover:text-white'
                  "
                  @click="void setPickerMode(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              class="rounded-full text-[#bdbdbd] hover:bg-white/5 hover:text-white"
              @click="pickerOpen = false"
            >
              <Icon name="mingcute:close-fill" class="h-5 w-5" />
            </UButton>
          </div>

          <div class="grid min-h-0 flex-1 grid-cols-1 gap-0 lg:grid-cols-[420px_minmax(0,1fr)]">
            <div class="flex min-h-0 flex-col p-5">
              <UInput
                v-model="saleSearch"
                color="neutral"
                variant="none"
                :placeholder="pickerSearchPlaceholder"
                :ui="{
                  root: 'w-full',
                  base: 'h-12 rounded-[16px] border border-[#404040] bg-[#262626] px-4 text-white placeholder:text-[#8f8f8f] focus:outline-none focus:ring-0',
                  leading: 'ps-4',
                }"
              >
                <template #leading>
                  <Icon name="fe:search" class="h-4 w-4 text-[#8f8f8f]" />
                </template>
              </UInput>

              <div class="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                <div
                  v-if="salesLoading"
                  class="flex items-center gap-2 rounded-[18px] border border-white/8 bg-[#262626] px-4 py-3 text-sm text-[#bdbdbd]"
                >
                  <Icon name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />
                  Загружаем продажи...
                </div>

                <button
                  v-for="sale in filteredSales"
                  :key="sale.id"
                  type="button"
                  class="w-full rounded-[18px] border px-4 py-4 text-left transition"
                  :class="
                    selectedSale?.id === sale.id
                      ? 'border-[#1f78ff] bg-[#1f78ff]/12'
                      : 'border-white/8 bg-[#262626] hover:border-white/15 hover:bg-[#2b2b2b]'
                  "
                  @click="selectSale(sale)"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <div class="text-[15px] font-semibold text-white">Продажа #{{ sale.number }}</div>
                      <div class="mt-1 text-xs text-[#9a9a9a]">{{ sale.clientName }} • {{ sale.sellerName }}</div>
                      <div class="mt-2 inline-flex rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#bdbdbd]">
                        {{ sale.statusLabel }}
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-[15px] font-semibold text-white">{{ formatPrice(sale.total) }} UZS</div>
                      <div class="mt-1 text-xs text-[#9a9a9a]">{{ sale.dateTimeLabel }}</div>
                    </div>
                  </div>
                </button>

                <div
                  v-if="!salesLoading && filteredSales.length === 0"
                  class="rounded-[18px] border border-white/8 bg-[#262626] px-4 py-5 text-sm text-[#bdbdbd]"
                >
                  {{ emptySalesLabel }}
                </div>
              </div>
            </div>

            <div class="min-h-0 overflow-y-auto p-5 sm:p-6">
              <div v-if="selectedSale" class="flex h-full flex-col">
                <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div class="rounded-[22px] border border-white/8 bg-[#262626] p-5">
                    <div class="flex items-start justify-between gap-4">
                      <div>
                        <div class="text-[22px] font-semibold">Продажа #{{ selectedSale.number }}</div>
                        <div class="mt-1 text-sm text-[#8f8f8f]">Общая сумма: {{ formatPrice(selectedSale.total) }} UZS</div>
                      </div>
                      <UButton
                        v-if="isSaleActionMode"
                        color="neutral"
                        variant="soft"
                        class="rounded-[14px] bg-[#404040] px-4 py-2 text-sm font-semibold text-white hover:bg-[#525252]"
                        @click="selectAllItems"
                      >
                        Выбрать все
                      </UButton>
                    </div>

                    <div class="mt-5 space-y-3">
                      <div class="text-sm font-semibold uppercase tracking-[0.1em] text-[#8f8f8f]">Корзина</div>
                      <div
                        v-for="item in selectedSale.items"
                        :key="item.productId"
                        class="rounded-[18px] border border-white/8 bg-[#202020] px-4 py-4"
                      >
                        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div class="min-w-0">
                            <div class="truncate text-[15px] font-semibold text-white">{{ item.name }}</div>
                            <div class="mt-1 text-xs text-[#8f8f8f]">{{ item.barcode || item.article || "Без кода" }}</div>
                            <div class="mt-2 text-sm text-[#bdbdbd]">Продано: {{ item.quantity }} шт • {{ formatPrice(item.lineTotal) }} UZS</div>
                          </div>

                          <div v-if="isSaleActionMode" class="flex items-center gap-3">
                            <label class="inline-flex items-center gap-2 text-sm text-[#d3d3d3]">
                              <input
                                :checked="getSelectedQuantity(item.productId) > 0"
                                type="checkbox"
                                class="h-4 w-4 rounded border-white/20 bg-transparent"
                                @change="toggleItem(item)"
                              />
                              Выбрать
                            </label>

                            <input
                              :value="getSelectedQuantity(item.productId)"
                              type="number"
                              min="0"
                              :max="item.quantity"
                              class="w-20 rounded-[12px] border border-white/10 bg-[#2b2b2b] px-3 py-2 text-center text-sm text-white outline-none"
                              @input="updateSelectedQuantity(item, $event)"
                            />
                          </div>

                          <div v-else class="text-right text-sm text-[#d3d3d3]">
                            {{ item.quantity }} шт
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="space-y-4">
                    <div class="rounded-[22px] border border-white/8 bg-[#262626] p-5">
                      <div class="text-sm font-semibold uppercase tracking-[0.1em] text-[#8f8f8f]">Способ оплаты</div>
                      <div class="mt-3 text-[16px] font-semibold text-white">{{ selectedSale.paymentMethodName }}</div>
                    </div>

                    <div class="rounded-[22px] border border-white/8 bg-[#262626] p-5">
                      <div class="text-sm font-semibold uppercase tracking-[0.1em] text-[#8f8f8f]">Детали</div>
                      <div class="mt-4 space-y-3 text-sm text-[#d3d3d3]">
                        <div class="flex items-start justify-between gap-3">
                          <span class="text-[#8f8f8f]">Дата и время</span>
                          <strong class="text-right text-white">{{ selectedSale.dateTimeLabel }}</strong>
                        </div>
                        <div class="flex items-start justify-between gap-3">
                          <span class="text-[#8f8f8f]">Филиал</span>
                          <strong class="text-right text-white">{{ selectedSale.branchName }}</strong>
                        </div>
                        <div class="flex items-start justify-between gap-3">
                          <span class="text-[#8f8f8f]">Кассир</span>
                          <strong class="text-right text-white">{{ selectedSale.cashierName }}</strong>
                        </div>
                        <div class="flex items-start justify-between gap-3">
                          <span class="text-[#8f8f8f]">Продавец</span>
                          <strong class="text-right text-white">{{ selectedSale.sellerName }}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mt-5 flex flex-col gap-3 sm:flex-row">
                  <UButton
                    block
                    color="neutral"
                    variant="soft"
                    class="justify-center rounded-[16px] bg-[#404040] py-3 font-semibold text-white hover:bg-[#525252]"
                    @click="pickerOpen = false"
                  >
                    Назад
                  </UButton>
                  <UButton
                    block
                    color="primary"
                    class="justify-center rounded-[16px] py-3 font-semibold disabled:cursor-not-allowed"
                    :disabled="isConfirmDisabled"
                    @click="handlePrimaryAction"
                  >
                    {{ confirmButtonLabel }}
                  </UButton>
                </div>
              </div>

              <div
                v-else
                class="flex h-full items-center justify-center rounded-[22px] border border-dashed border-white/10 bg-[#262626] text-sm text-[#8f8f8f]"
              >
                Выберите продажу слева.
              </div>
            </div>
          </div>
        </div>
    </AppSlideover>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useCartStore } from "~/store/cart";

type PickerMode = "return" | "exchange" | "draft" | "parked";
type PickerGroup = "sale-actions" | "resume-actions";

type SaleListItem = {
  id: string;
  statusKey: string;
  statusLabel: string;
  saleType: string;
  number: string;
  clientName: string;
  sellerName: string;
  cashierName: string;
  branchName: string;
  paymentMethodId: string;
  paymentMethodName: string;
  sellerId: string;
  createdAt: string;
  dateTimeLabel: string;
  total: number;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    lineTotal: number;
    unitPrice: number;
    barcode: string;
    article: string;
  }>;
};

const store = useCartStore();
const { formatPrice } = useFormatPrice();
const { searchQuery, filteredProducts } = storeToRefs(store);
const toast = useToast();
const addToCart = store.addToCartServer;

const showDropdown = computed(() => Boolean(searchQuery.value.trim()));
const isActionBusy = computed(() =>
  store.saleMetaLoading || store.payLoading || store.loadingSale || store.creatingSale,
);

const pickerOpen = ref(false);
const pickerMode = ref<PickerMode>("return");
const salesLoading = ref(false);
const rawSales = ref<SaleListItem[]>([]);
const saleSearch = ref("");
const selectedSaleId = ref("");
const selectedQuantities = ref<Record<string, number>>({});

const isSaleActionMode = computed(() =>
  pickerMode.value === "return" || pickerMode.value === "exchange",
);

const pickerGroup = computed<PickerGroup>(() =>
  isSaleActionMode.value ? "sale-actions" : "resume-actions",
);

const pickerGroupTitle = computed(() =>
  pickerGroup.value === "sale-actions" ? "Возврат / Обмен" : "Черновики / Отложки",
);

const pickerModeOptions = computed(() =>
  pickerGroup.value === "sale-actions"
    ? [
        { value: "return" as PickerMode, label: "Возврат" },
        { value: "exchange" as PickerMode, label: "Обмен" },
      ]
    : [
        { value: "draft" as PickerMode, label: "Черновик" },
        { value: "parked" as PickerMode, label: "Отложка" },
      ],
);

const pickerDescription = computed(() => {
  switch (pickerMode.value) {
    case "exchange":
      return "Выберите проведенную продажу, затем отметьте товары, которые пойдут в обмен.";
    case "draft":
      return "Выберите черновик, чтобы вернуть его обратно в текущую кассовую сессию.";
    case "parked":
      return "Выберите отложенную продажу, чтобы продолжить работу с ней в POS.";
    default:
      return "Выберите проведенную продажу, затем отметьте товары для возврата.";
  }
});

const pickerSearchPlaceholder = computed(() =>
  isSaleActionMode.value
    ? "Номер продажи, клиент, продавец"
    : "Номер продажи, клиент, продавец, статус",
);

const emptySalesLabel = computed(() => {
  switch (pickerMode.value) {
    case "draft":
      return "Черновики не найдены.";
    case "parked":
      return "Отложенные продажи не найдены.";
    default:
      return "Продажи не найдены.";
  }
});

const availableSales = computed(() => rawSales.value.filter(matchesCurrentMode));

const filteredSales = computed(() => {
  const query = saleSearch.value.trim().toLowerCase();
  if (!query) return availableSales.value;

  return availableSales.value.filter((sale) =>
    [sale.number, sale.clientName, sale.sellerName, sale.cashierName, sale.statusLabel].some((field) =>
      String(field || "").toLowerCase().includes(query),
    ),
  );
});

const selectedSale = computed(() =>
  filteredSales.value.find((sale) => sale.id === selectedSaleId.value) ??
  availableSales.value.find((sale) => sale.id === selectedSaleId.value) ??
  null,
);

const selectedReturnItems = computed(() => {
  if (!selectedSale.value) return [];

  return selectedSale.value.items
    .filter((item) => getSelectedQuantity(item.productId) > 0)
    .map((item) => ({
      ...item,
      selectedQuantity: Math.min(item.quantity, Math.max(1, getSelectedQuantity(item.productId))),
    }));
});

const confirmButtonLabel = computed(() => {
  switch (pickerMode.value) {
    case "exchange":
      return "Начать обмен";
    case "draft":
      return "Открыть черновик";
    case "parked":
      return "Открыть отложку";
    default:
      return "Начать возврат";
  }
});

const isConfirmDisabled = computed(() => {
  if (!selectedSale.value) return true;
  if (!isSaleActionMode.value) return false;
  return selectedReturnItems.value.length === 0;
});

async function openPicker(mode: PickerMode) {
  pickerMode.value = mode;
  pickerOpen.value = true;
  await ensureSalesLoaded();
  syncSelectionWithMode();
}

async function openSaleActionPicker() {
  await openPicker("return");
}

async function openResumePicker() {
  await openPicker("draft");
}

async function setPickerMode(mode: PickerMode) {
  if (pickerMode.value === mode) return;
  pickerMode.value = mode;
  await ensureSalesLoaded();
  syncSelectionWithMode();
}

async function ensureSalesLoaded() {
  salesLoading.value = true;
  try {
    const { apiFetch } = useApi();
    const response: any =
      pickerMode.value === "draft"
        ? await runSaleRequest([
            () => apiFetch("/v2/draft-sales", { method: "GET" }),
            () => apiFetch("/draft-sales", { method: "GET" }),
          ])
        : pickerMode.value === "parked"
          ? await runSaleRequest([
              () => apiFetch("/v2/parked-sales", { method: "GET" }),
              () => apiFetch("/parked-sales", { method: "GET" }),
            ])
          : await apiFetch("/sales", {
              method: "GET",
              query: {
                page: 1,
                limit: 100,
              },
            });

    rawSales.value = extractSalesFromResponse(response)
      .map(normalizeSale)
      .filter((sale: SaleListItem) => sale.items.length > 0);
  } catch (error: any) {
    toast.add({
      title: "Не удалось загрузить продажи",
      description: error?.data?.message || error?.message || undefined,
      color: "error",
    });
  } finally {
    salesLoading.value = false;
  }
}

function normalizeSale(raw: any): SaleListItem {
  const items = Array.isArray(raw?.items) ? raw.items : [];
  const createdAt = String(raw?.created_at ?? raw?.createdAt ?? new Date().toISOString());
  const statusKey = String(raw?.status ?? "paid").toLowerCase();

  return {
    id: String(raw?.id ?? ""),
    statusKey,
    statusLabel: statusLabel(statusKey),
    saleType: String(raw?.sale_type ?? raw?.type ?? "sale").toLowerCase(),
    number: String(raw?.number ?? raw?.sale_number ?? raw?.order_number ?? raw?.sid ?? raw?.id ?? ""),
    clientName: String(raw?.client?.name ?? raw?.customer?.name ?? raw?.client_name ?? "Без клиента"),
    sellerName: String(raw?.seller_name ?? raw?.seller?.name ?? raw?.cashier?.name ?? raw?.cashier_name ?? raw?.user?.name ?? "Не указан"),
    cashierName: String(raw?.cashier?.name ?? raw?.cashier_name ?? raw?.user?.name ?? raw?.seller_name ?? "Не указан"),
    branchName: String(raw?.shop?.name ?? raw?.branch_title ?? raw?.branch_name ?? raw?.location?.name ?? "Не указан"),
    paymentMethodId: String(raw?.payment_method ?? raw?.payment?.id ?? raw?.payment_type ?? ""),
    paymentMethodName: String(raw?.payment?.name ?? raw?.payment_type_name ?? "Не указано"),
    sellerId: String(raw?.seller_id ?? raw?.seller?.id ?? raw?.user_id ?? raw?.user?.id ?? ""),
    createdAt,
    dateTimeLabel: `${new Date(createdAt).toLocaleDateString("ru-RU")} ${new Date(createdAt).toLocaleTimeString("ru-RU")}`,
    total: Number(raw?.payable_total ?? raw?.amount ?? raw?.grand_total ?? raw?.total ?? 0),
    items: items
      .map((item: any) => {
        const quantity = Math.max(0, Number(item?.quantity ?? item?.qty ?? 0));
        const productId = String(item?.product_id ?? item?.product?.id ?? item?.id ?? "");
        const lineTotal = Number(item?.total ?? item?.amount ?? item?.line_total ?? item?.final_price ?? item?.sale_price ?? 0);

        return {
          productId,
          name: String(item?.name ?? item?.product?.name ?? "Товар"),
          quantity,
          lineTotal,
          unitPrice: quantity > 0 ? Math.round(lineTotal / quantity) : Number(item?.sale_price ?? item?.price ?? 0),
          barcode: String(item?.barcode ?? item?.product?.barcode ?? ""),
          article: String(item?.sku ?? item?.article ?? item?.product?.sku ?? ""),
        };
      })
      .filter((item: any) => item.productId && item.quantity > 0),
  };
}

function statusLabel(status: string) {
  switch (status) {
    case "draft":
      return "Черновик";
    case "parked":
      return "Отложка";
    case "paid":
      return "Проведена";
    case "partially_returned":
      return "Частичный возврат";
    case "returned":
      return "Возврат";
    case "partially_exchanged":
      return "Частичный обмен";
    case "exchanged":
      return "Обмен";
    case "cancelled":
      return "Отмена";
    default:
      return status || "Не указан";
  }
}

function matchesCurrentMode(sale: SaleListItem) {
  if (pickerMode.value === "draft") {
    return sale.statusKey === "draft";
  }
  if (pickerMode.value === "parked") {
    return sale.statusKey === "parked";
  }
  return sale.statusKey === "paid" && sale.saleType !== "return" && sale.saleType !== "exchange";
}

function syncSelectionWithMode() {
  saleSearch.value = "";
  selectedQuantities.value = {};

  const current = availableSales.value.find((sale) => sale.id === selectedSaleId.value);
  if (current) return;

  const firstSale = availableSales.value[0];
  selectedSaleId.value = firstSale?.id ?? "";
}

function selectSale(sale: SaleListItem) {
  selectedSaleId.value = sale.id;
  selectedQuantities.value = {};
}

function getSelectedQuantity(productId: string) {
  return Number(selectedQuantities.value[productId] || 0);
}

function selectAllItems() {
  if (!selectedSale.value) return;
  selectedQuantities.value = Object.fromEntries(
    selectedSale.value.items.map((item) => [item.productId, item.quantity]),
  );
}

function toggleItem(item: SaleListItem["items"][number]) {
  const current = getSelectedQuantity(item.productId);
  selectedQuantities.value = {
    ...selectedQuantities.value,
    [item.productId]: current > 0 ? 0 : item.quantity,
  };
}

function updateSelectedQuantity(item: SaleListItem["items"][number], event: Event) {
  const target = event.target as HTMLInputElement | null;
  const raw = Number(target?.value || 0);
  const next = Math.min(item.quantity, Math.max(0, raw));
  selectedQuantities.value = {
    ...selectedQuantities.value,
    [item.productId]: next,
  };
}

async function handlePrimaryAction() {
  if (!selectedSale.value) return;

  if (isSaleActionMode.value) {
    store.startReturnSession({
      sale: {
        id: selectedSale.value.id,
        number: selectedSale.value.number,
        paymentMethodId: selectedSale.value.paymentMethodId,
        paymentMethodName: selectedSale.value.paymentMethodName,
        sellerId: selectedSale.value.sellerId,
        sellerName: selectedSale.value.sellerName,
        cashierName: selectedSale.value.cashierName,
        branchName: selectedSale.value.branchName,
        createdAt: selectedSale.value.createdAt,
      },
      items: selectedReturnItems.value.map((item) => ({
        productId: item.productId,
        name: item.name,
        barcode: item.barcode,
        article: item.article,
        quantity: item.selectedQuantity,
        price: item.unitPrice,
      })),
    });

    pickerOpen.value = false;
    searchQuery.value = "";

    toast.add({
      title: pickerMode.value === "exchange" ? "Режим обмена подготовлен" : "Режим возврата подготовлен",
      color: "success",
    });
    return;
  }

  try {
    if (pickerMode.value === "parked") {
      await store.resumeParkedSale(selectedSale.value.id);
    } else {
      await store.loadSale(selectedSale.value.id);
    }
    pickerOpen.value = false;
    searchQuery.value = "";

    toast.add({
      title: pickerMode.value === "parked" ? "Отложка открыта" : "Черновик открыт",
      color: "success",
    });
  } catch (error: any) {
    toast.add({
      title: "Не удалось открыть продажу",
      description: error?.data?.message || store.lastCartError || error?.message || undefined,
      color: "error",
    });
  }
}

async function runSaleRequest(attempts: Array<() => Promise<any>>) {
  let lastError: unknown = null;

  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function extractSalesFromResponse(response: any) {
  if (Array.isArray(response?.draft_sales)) return response.draft_sales;
  if (Array.isArray(response?.parked_sales)) return response.parked_sales;
  if (Array.isArray(response?.sales)) return response.sales;
  if (Array.isArray(response?.data?.draft_sales)) return response.data.draft_sales;
  if (Array.isArray(response?.data?.parked_sales)) return response.data.parked_sales;
  if (Array.isArray(response?.data?.sales)) return response.data.sales;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response)) return response;
  return [];
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
