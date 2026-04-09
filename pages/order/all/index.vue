<template>
  <section class="sales-page grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_420px]">
    <div class="sales-surface overflow-hidden rounded-[24px] bg-[#262626] text-white">
      <div class="px-6 py-5">
        <div class="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p class="text-[12px] uppercase tracking-[0.18em] text-[#4993dd]">POS</p>
            <h1 class="mt-2 text-[30px] font-semibold leading-none">All Orders</h1>
            <p class="mt-2 max-w-[620px] text-[14px] text-[#bdbdbd]">
              Р’СЃРµ РїСЂРѕРґР°Р¶Рё РїРѕ РЅРѕРјРµСЂСѓ, РїСЂРѕРґР°РІС†Сѓ, С‚РѕС‡РєРµ, СЃС‚Р°С‚СѓСЃСѓ Рё СЃРїРѕСЃРѕР±Сѓ РѕРїР»Р°С‚С‹.
            </p>
          </div>

          <div class="grid gap-2 md:grid-cols-4 xl:min-w-[720px]">
            <div class="filter-field">
              <span class="filter-label">Р”Р°С‚Р°</span>
              <UInput
                v-model="filters.date"
                type="date"
                color="neutral"
                variant="none"
                :ui="inputUi"
              />
            </div>

            <div class="filter-field">
              <span class="filter-label">РџСЂРѕРґР°РІРµС†</span>
              <UInput
                v-model="filters.seller"
                placeholder="РРјСЏ РїСЂРѕРґР°РІС†Р°"
                color="neutral"
                variant="none"
                :ui="inputUi"
              >
                <template #leading>
                  <Icon name="heroicons:user" class="h-4 w-4 text-[#bdbdbd]" />
                </template>
              </UInput>
            </div>

            <div class="filter-field">
              <span class="filter-label">РўРѕС‡РєР°</span>
              <UInput
                v-model="filters.point"
                placeholder="РќР°Р·РІР°РЅРёРµ С‚РѕС‡РєРё"
                color="neutral"
                variant="none"
                :ui="inputUi"
              >
                <template #leading>
                  <Icon name="heroicons:building-storefront" class="h-4 w-4 text-[#bdbdbd]" />
                </template>
              </UInput>
            </div>

            <div class="filter-field">
              <span class="filter-label">Р”РµР№СЃС‚РІРёСЏ</span>
              <UButton
                color="neutral"
                variant="soft"
                class="h-[48px] justify-center rounded-[14px] bg-[#404040] text-white hover:bg-[#5e5e5e]"
                @click="resetFilters"
              >
                <Icon name="heroicons:x-mark" class="mr-2 h-4 w-4" />
                РЎР±СЂРѕСЃРёС‚СЊ
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <div class="orders-grid bg-[#303030] px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#bdbdbd]">
        <span>РќРѕРјРµСЂ</span>
        <span>Р”Р°С‚Р°</span>
        <span>РџСЂРѕРґР°РІРµС†</span>
        <span>РўРѕС‡РєР°</span>
        <span>РЎСѓРјРјР°</span>
        <span>РЎС‚Р°С‚СѓСЃ</span>
        <span>РћРїР»Р°С‚Р°</span>
      </div>

      <div class="relative min-h-[520px] overflow-auto">
        <div
          v-if="loading"
          class="absolute inset-x-0 top-0 z-10 flex items-center gap-2 bg-[#262626]/95 px-6 py-3 text-[#4993dd] backdrop-blur-sm"
        >
          <Icon name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />
          Р—Р°РіСЂСѓР¶Р°РµРј РїСЂРѕРґР°Р¶Рё...
        </div>

        <div
          v-if="!loading && !filteredSales.length"
          class="flex min-h-[520px] flex-col items-center justify-center px-6 text-center"
        >
          <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#404040] text-[#4993dd]">
            <Icon name="heroicons:receipt-percent" class="h-6 w-6" />
          </div>
          <p class="text-[18px] font-semibold text-white">РџСЂРѕРґР°Р¶Рё РЅРµ РЅР°Р№РґРµРЅС‹</p>
          <p class="mt-2 max-w-[320px] text-[14px] text-[#bdbdbd]">
            РР·РјРµРЅРё С„РёР»СЊС‚СЂС‹ РёР»Рё РґРѕР¶РґРёСЃСЊ РїРѕСЏРІР»РµРЅРёСЏ РЅРѕРІС‹С… РїСЂРѕРґР°Р¶ РІ СЃРёСЃС‚РµРјРµ.
          </p>
        </div>

        <button
          v-for="sale in filteredSales"
          :key="sale.id"
          type="button"
          class="orders-grid w-full px-6 py-4 text-left transition"
          :class="selectedSale?.id === sale.id ? 'bg-[#404040]' : 'hover:bg-[#303030]'"
          @click="selectSale(sale)"
        >
          <span class="font-semibold text-white">{{ sale.numberLabel }}</span>
          <span class="text-[#bdbdbd]">{{ sale.dateLabel }}</span>
          <span class="truncate text-white">{{ sale.sellerLabel }}</span>
          <span class="truncate text-[#bdbdbd]">{{ sale.pointLabel }}</span>
          <span class="font-semibold text-white">{{ sale.amountLabel }}</span>
          <span>
            <UBadge
              :label="sale.statusLabel"
              variant="soft"
              :class="statusClass(sale.statusKey)"
            />
          </span>
          <span class="text-[#bdbdbd]">{{ sale.paymentLabel }}</span>
        </button>
      </div>

      <div class="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <p class="text-[14px] text-[#bdbdbd]">
          РџРѕРєР°Р·Р°РЅРѕ <span class="text-white">{{ filteredSales.length }}</span> РёР·
          <span class="text-white">{{ total }}</span>
        </p>

        <div class="flex items-center gap-2">
          <UButton
            color="neutral"
            variant="soft"
            class="rounded-[12px] bg-[#404040] text-white hover:bg-[#5e5e5e]"
            :disabled="page <= 1 || loading"
            @click="page--"
          >
            РќР°Р·Р°Рґ
          </UButton>
          <span class="min-w-[44px] text-center text-[14px] font-semibold text-white">{{ page }}</span>
          <UButton
            color="neutral"
            variant="soft"
            class="rounded-[12px] bg-[#404040] text-white hover:bg-[#5e5e5e]"
            :disabled="page * limit >= total || loading"
            @click="page++"
          >
            Р’РїРµСЂС‘Рґ
          </UButton>
          <UInput
            v-model.number="limit"
            type="number"
            min="1"
            max="100"
            color="neutral"
            variant="none"
            class="w-[92px]"
            :ui="pagerInputUi"
          />
        </div>
      </div>
    </div>

    <aside class="sales-surface flex min-h-[780px] flex-col overflow-hidden rounded-[24px] bg-[#262626] text-white">
      <div class="px-5 py-5">
        <p class="text-[12px] uppercase tracking-[0.18em] text-[#4993dd]">Order Details</p>
        <template v-if="selectedSale">
          <div class="mt-3 flex items-start justify-between gap-3">
            <div>
              <h2 class="text-[26px] font-semibold">{{ selectedSale.numberLabel }}</h2>
              <p class="mt-1 text-[14px] text-[#bdbdbd]">{{ selectedSale.dateTimeLabel }}</p>
            </div>
            <UBadge
              :label="selectedSale.statusLabel"
              variant="soft"
              :class="statusClass(selectedSale.statusKey)"
            />
          </div>
        </template>
        <template v-else>
          <p class="mt-3 text-[14px] text-[#bdbdbd]">Р’С‹Р±РµСЂРёС‚Рµ РїСЂРѕРґР°Р¶Сѓ СЃР»РµРІР°, С‡С‚РѕР±С‹ РїРѕСЃРјРѕС‚СЂРµС‚СЊ РґРµС‚Р°Р»Рё.</p>
        </template>
      </div>

      <div v-if="selectedSale" class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div class="grid grid-cols-2 gap-3 px-5 py-4">
          <div class="detail-card">
            <span class="detail-label">РџСЂРѕРґР°РІРµС†</span>
            <span class="detail-value">{{ selectedSale.sellerLabel }}</span>
          </div>
          <div class="detail-card">
            <span class="detail-label">РљР»РёРµРЅС‚</span>
            <span class="detail-value">{{ selectedSale.clientLabel }}</span>
          </div>
          <div class="detail-card">
            <span class="detail-label">РўРѕС‡РєР°</span>
            <span class="detail-value">{{ selectedSale.pointLabel }}</span>
          </div>
          <div class="detail-card">
            <span class="detail-label">РћРїР»Р°С‚Р°</span>
            <span class="detail-value">{{ selectedSale.paymentLabel }}</span>
          </div>
        </div>

        <div class="px-5 py-4">
          <div class="flex items-center justify-between text-[14px]">
            <span class="text-[#bdbdbd]">РС‚РѕРі РїСЂРѕРґР°Р¶Рё</span>
            <span class="text-[20px] font-semibold text-white">{{ selectedSale.amountLabel }}</span>
          </div>
          <div class="mt-2 flex items-center justify-between text-[14px]">
            <span class="text-[#bdbdbd]">РЎРєРёРґРєР°</span>
            <span class="text-white">{{ selectedSale.discountLabel }}</span>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-auto px-5 py-4">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-[16px] font-semibold">РўРѕРІР°СЂС‹</h3>
            <span class="text-[13px] text-[#bdbdbd]">{{ selectedSale.items.length }} РїРѕР·.</span>
          </div>

          <div
            v-if="!selectedSale.items.length"
            class="rounded-[18px] bg-[#303030] px-4 py-5 text-[14px] text-[#bdbdbd]"
          >
            Р”Р»СЏ СЌС‚РѕР№ РїСЂРѕРґР°Р¶Рё С‚РѕРІР°СЂС‹ РЅРµ РїСЂРёС€Р»Рё РІ РѕС‚РІРµС‚Рµ API.
          </div>

          <div v-else class="flex flex-col gap-3">
            <article v-for="item in selectedSale.items" :key="item.key" class="item-card">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-[15px] font-semibold text-white">{{ item.name }}</p>
                  <p class="mt-1 text-[12px] uppercase tracking-[0.08em] text-[#bdbdbd]">
                    {{ item.skuLabel }}
                  </p>
                </div>
                <p class="text-[15px] font-semibold text-white">{{ item.totalLabel }}</p>
              </div>
              <div class="mt-3 grid grid-cols-4 gap-2 text-[13px] text-[#bdbdbd]">
                <div>
                  <p class="item-meta-label">РљРѕР»РёС‡РµСЃС‚РІРѕ</p>
                  <p class="item-meta-value">{{ item.quantityLabel }}</p>
                </div>
                <div>
                  <p class="item-meta-label">Р¦РµРЅР°</p>
                  <p class="item-meta-value">{{ item.priceLabel }}</p>
                </div>
                <div>
                  <p class="item-meta-label">РЎРєРёРґРєР°</p>
                  <p class="item-meta-value">{{ item.discountLabel }}</p>
                </div>
                <div>
                  <p class="item-meta-label">РС‚РѕРі</p>
                  <p class="item-meta-value">{{ item.totalLabel }}</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>

      <div v-else class="flex min-h-[320px] flex-1 items-center justify-center px-5 text-center text-[#bdbdbd]">
        <div>
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#404040] text-[#4993dd]">
            <Icon name="heroicons:document-text" class="h-6 w-6" />
          </div>
          <p class="text-[18px] font-semibold text-white">Р”РµС‚Р°Р»Рё РїСЂРѕРґР°Р¶Рё</p>
          <p class="mt-2 max-w-[260px] text-[14px]">
            Р—РґРµСЃСЊ РїРѕСЏРІСЏС‚СЃСЏ С‚РѕРІР°СЂС‹, СЃСѓРјРјР°, СЃРєРёРґРєР°, РїСЂРѕРґР°РІРµС† Рё РєР»РёРµРЅС‚ РІС‹Р±СЂР°РЅРЅРѕР№ РїСЂРѕРґР°Р¶Рё.
          </p>
        </div>
      </div>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useApi } from "~/composables/useApi";
import { useFormatPrice } from "~/composables/useFormatPrice";

useHead({ title: "All Orders | Konkurent.cases" });

interface SaleItemView {
  key: string;
  name: string;
  skuLabel: string;
  quantityLabel: string;
  priceLabel: string;
  discountLabel: string;
  totalLabel: string;
}

interface SaleView {
  id: string;
  numberLabel: string;
  dateLabel: string;
  dateTimeLabel: string;
  sellerLabel: string;
  pointLabel: string;
  amountLabel: string;
  paymentLabel: string;
  clientLabel: string;
  statusLabel: string;
  statusKey: string;
  discountLabel: string;
  dateValue: string;
  sellerValue: string;
  pointValue: string;
  items: SaleItemView[];
  raw: any;
}

const inputUi = {
  root: "w-full",
  base: "h-[48px] rounded-[14px] border-0 bg-[#404040] px-4 text-white placeholder:text-[#bdbdbd] focus:outline-none focus:ring-0",
  leading: "ps-4",
};

const pagerInputUi = {
  root: "w-full",
  base: "h-[42px] rounded-[12px] border-0 bg-[#404040] px-3 text-center text-white placeholder:text-[#bdbdbd] focus:outline-none focus:ring-0",
};

const { apiFetch } = useApi();
const { formatPrice } = useFormatPrice();

const loading = ref(false);
const sales = ref<SaleView[]>([]);
const selectedSaleId = ref<string | null>(null);
const page = ref(1);
const limit = ref(10);
const total = ref(0);
const filters = ref({
  date: "",
  seller: "",
  point: "",
});

const selectedSale = computed(() =>
  filteredSales.value.find((sale) => sale.id === selectedSaleId.value)
  ?? sales.value.find((sale) => sale.id === selectedSaleId.value)
  ?? filteredSales.value[0]
  ?? null
);

const filteredSales = computed(() => {
  const sellerFilter = filters.value.seller.trim().toLowerCase();
  const pointFilter = filters.value.point.trim().toLowerCase();

  return sales.value.filter((sale) => {
    const matchesDate = !filters.value.date || sale.dateValue === filters.value.date;
    const matchesSeller = !sellerFilter || sale.sellerValue.toLowerCase().includes(sellerFilter);
    const matchesPoint = !pointFilter || sale.pointValue.toLowerCase().includes(pointFilter);
    return matchesDate && matchesSeller && matchesPoint;
  });
});

watch(filteredSales, (value) => {
  if (!value.length) {
    selectedSaleId.value = null;
    return;
  }

  if (!value.some((sale) => sale.id === selectedSaleId.value)) {
    selectedSaleId.value = value[0]?.id ?? null;
  }
});

watch(limit, (value) => {
  const normalized = Math.min(Math.max(Number(value) || 10, 1), 100);
  if (normalized !== value) {
    limit.value = normalized;
  }
});

function resetFilters() {
  filters.value = {
    date: "",
    seller: "",
    point: "",
  };
}

function normalizeSale(raw: any): SaleView {
  const id = String(raw?.id ?? raw?.sale_id ?? raw?.number ?? Math.random());
  const createdAt = raw?.created_at ?? raw?.createdAt ?? raw?.date ?? null;
  const date = createdAt ? new Date(createdAt) : null;
  const totalAmount = toNumber(
    raw?.payable_total ?? raw?.total ?? raw?.amount ?? raw?.grand_total
  );
  const discountAmount = toNumber(
    raw?.discount_amount ?? raw?.discount ?? raw?.discount_total
  );

  const sellerLabel =
    raw?.seller?.name
    ?? raw?.seller_name
    ?? raw?.cashier?.name
    ?? raw?.employee?.name
    ?? raw?.user?.name
    ?? raw?.operator?.name
    ?? "РќРµ СѓРєР°Р·Р°РЅ";

  const pointLabel =
    raw?.shop?.name
    ?? raw?.branch_title
    ?? raw?.branch_name
    ?? raw?.location?.name
    ?? raw?.point?.name
    ?? raw?.branch_code
    ?? "РќРµ СѓРєР°Р·Р°РЅР°";

  const statusKey = String(raw?.status ?? "unknown").toLowerCase();

  return {
    id,
    numberLabel: `в„– ${raw?.number ?? raw?.sale_number ?? raw?.id ?? "вЂ”"}`,
    dateLabel: formatDate(createdAt, { dateStyle: "short" }),
    dateTimeLabel: formatDate(createdAt, { dateStyle: "medium", timeStyle: "short" }),
    sellerLabel,
    pointLabel,
    amountLabel: `${formatPrice(totalAmount)} UZS`,
    paymentLabel: formatPaymentMethod(
      raw?.payment?.name
      ?? raw?.payment_method
      ?? raw?.payment_type
      ?? raw?.paymentType
      ?? raw?.payment?.method
      ?? raw?.payment?.type
      ?? raw?.payments
    ),
    clientLabel:
      raw?.client?.name
      ?? raw?.customer?.name
      ?? raw?.buyer?.name
      ?? raw?.client_name
      ?? raw?.customer_name
      ?? "Р‘РµР· РєР»РёРµРЅС‚Р°",
    statusLabel: formatStatus(statusKey),
    statusKey,
    discountLabel: discountAmount > 0 ? `${formatPrice(discountAmount)} UZS` : "РќРµС‚",
    dateValue: date ? date.toISOString().slice(0, 10) : "",
    sellerValue: sellerLabel,
    pointValue: pointLabel,
    items: normalizeItems(raw?.items),
    raw,
  };
}

function normalizeItems(items: any): SaleItemView[] {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => {
    const quantity = toNumber(item?.quantity ?? item?.qty ?? 0);
    const price = toNumber(item?.sale_price ?? item?.price ?? item?.unit_price ?? 0);
    const discount = toNumber(item?.discount_amount ?? item?.discount ?? 0);
    const total = Math.max(0, quantity * price - discount);

    return {
      key: String(item?.id ?? item?.sku ?? `${index}-${item?.name ?? "item"}`),
      name: item?.name ?? item?.product?.name ?? "РўРѕРІР°СЂ Р±РµР· РЅР°Р·РІР°РЅРёСЏ",
      skuLabel: item?.sku ?? item?.article ?? item?.barcode ?? "вЂ”",
      quantityLabel: `${quantity || 0} С€С‚`,
      priceLabel: `${formatPrice(price)} UZS`,
      discountLabel: discount > 0 ? `${formatPrice(discount)} UZS` : "вЂ”",
      totalLabel: `${formatPrice(total)} UZS`,
    };
  });
}

function toNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatDate(
  value: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
) {
  if (!value) return "вЂ”";
  try {
    return new Date(value).toLocaleString("ru-RU", options);
  } catch {
    return String(value);
  }
}

function formatStatus(status: string) {
  if (status === "paid") return "РћРїР»Р°С‡РµРЅ";
  if (status === "pending") return "РћР¶РёРґР°РµС‚";
  if (status === "cancelled") return "РћС‚РјРµРЅС‘РЅ";
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Неизвестно";
}

function statusClass(status: string) {
  if (status === "paid") return "bg-[#1f3b2d] text-[#7dd9a3]";
  if (status === "pending") return "bg-[#45311f] text-[#f2c282]";
  if (status === "cancelled") return "bg-[#452424] text-[#f4a3a3]";
  return "bg-[#404040] text-[#d6d6d6]";
}

function formatPaymentMethod(value: unknown): string {
  if (value && typeof value === "object") {
    const keys: string[] = Object.entries(value as Record<string, unknown>)
      .filter(([, amount]) => toNumber(amount) > 0)
      .map(([key]) => formatPaymentMethod(key));
    return keys.length ? keys.join(", ") : "РќРµ СѓРєР°Р·Р°РЅ";
  }

  const normalized = String(value ?? "").toLowerCase();
  if (!normalized) return "РќРµ СѓРєР°Р·Р°РЅ";
  if (normalized === "cash") return "РќР°Р»РёС‡РЅС‹Рµ";
  if (normalized === "card") return "РљР°СЂС‚Р°";
  if (normalized === "cardtransfer" || normalized === "card_transfer" || normalized === "transfer") return "РџРµСЂРµРІРѕРґ";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function selectSale(sale: SaleView) {
  selectedSaleId.value = sale.id;
}

async function fetchSales() {
  loading.value = true;
  try {
    const response: any = await apiFetch("/sales", {
      method: "GET",
      query: {
        page: page.value,
        limit: Math.min(Math.max(limit.value, 1), 100),
      },
    });

    const items = Array.isArray(response?.items) ? response.items : Array.isArray(response) ? response : [];
    sales.value = items.map(normalizeSale);
    total.value = Number(response?.total ?? sales.value.length ?? 0) || 0;
    page.value = Number(response?.page ?? page.value) || 1;
    limit.value = Number(response?.limit ?? limit.value) || 10;
  } catch {
    sales.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
watch([page, limit], () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetchSales, 180);
}, { immediate: true });
</script>

<style scoped>
.sales-page {
  min-height: calc(100vh - 110px);
}

.sales-surface {
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.24);
}

.orders-grid {
  display: grid;
  grid-template-columns: 120px 140px minmax(150px, 1fr) minmax(130px, 1fr) 140px 120px 150px;
  gap: 12px;
  align-items: center;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #bdbdbd;
}

.detail-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-radius: 16px;
  background: #404040;
  padding: 14px;
}

.detail-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #bdbdbd;
}

.detail-value {
  font-size: 14px;
  color: white;
}

.item-card {
  border-radius: 18px;
  background: #303030;
  padding: 14px;
}

.item-meta-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #bdbdbd;
}

.item-meta-value {
  margin-top: 4px;
  color: white;
}

@media (max-width: 1536px) {
  .sales-page {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1024px) {
  .orders-grid {
    min-width: 980px;
  }
}
</style>



