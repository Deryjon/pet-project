<template>
  <section class="sales-page">
    <div class="sales-layout">
      <div class="sales-main">
        <header class="sales-header">
          <div class="header-top">
            <div class="scope-select">
              <button type="button" class="scope-trigger" @click="scopeOpen = !scopeOpen">
                <span>{{ selectedScopeLabel }}</span>
                <Icon name="heroicons:chevron-down-20-solid" class="h-6 w-6 transition" :class="{ 'rotate-180': scopeOpen }" />
              </button>

              <div v-if="scopeOpen" class="scope-menu">
                <button
                  v-for="option in saleScopeOptions"
                  :key="option.value"
                  type="button"
                  class="scope-option"
                  :class="{ 'scope-option--active': saleScope === option.value }"
                  @click="selectScope(option.value)"
                >
                  <span>{{ option.label }}</span>
                  <Icon v-if="saleScope === option.value" name="heroicons:check-20-solid" class="h-5 w-5 text-[#78b3ff]" />
                </button>
              </div>
            </div>

            <div class="header-meta">
              <span class="count-inline">{{ total }} продаж</span>
              <AppDatePicker v-model="selectedDate" clearable />
            </div>
          </div>

          <div class="header-controls">
            <div class="search-wrap">
              <Icon name="heroicons:magnifying-glass-20-solid" class="search-icon" />
              <UInput
                v-model="search"
                color="neutral"
                variant="none"
                placeholder="ID транзакции, клиент, пользователь"
                :ui="searchUi"
              />
            </div>

            <UButton color="neutral" variant="soft" class="toolbar-btn toolbar-btn--icon" @click="filtersOpen = !filtersOpen">
              <Icon name="heroicons:adjustments-horizontal" class="h-4 w-4" />
              Фильтр
            </UButton>
          </div>

          <div v-if="filtersOpen" class="filters-panel">
            <label class="filter-field">
              <span>Магазин</span>
              <select v-model="shopFilter">
                <option value="all">Выберите магазин</option>
                <option v-for="option in shopOptions" :key="option" :value="option">{{ option }}</option>
              </select>
            </label>

            <label class="filter-field">
              <span>Тип оплаты</span>
              <select v-model="paymentFilter">
                <option value="all">Выберите тип оплаты</option>
                <option v-for="option in dynamicPaymentOptions.filter((item) => item.value !== 'all')" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>

            <div class="filter-field filter-field--range">
              <span>Сумма чека</span>
              <div class="range-inputs">
                <input v-model="amountFrom" type="number" min="0" placeholder="от" />
                <input v-model="amountTo" type="number" min="0" placeholder="до" />
              </div>
            </div>

            <label class="filter-field">
              <span>Продавец</span>
              <select v-model="sellerFilter">
                <option value="all">Выберите продавца</option>
                <option v-for="option in sellerOptions" :key="option" :value="option">{{ option }}</option>
              </select>
            </label>

            <label class="filter-field">
              <span>Кассир</span>
              <select v-model="cashierFilter">
                <option value="all">Выберите кассира</option>
                <option v-for="option in cashierOptions" :key="option" :value="option">{{ option }}</option>
              </select>
            </label>

            <div class="filter-actions">
              <UButton color="neutral" variant="soft" class="toolbar-btn" @click="resetFilters">Сбросить</UButton>
              <UButton color="primary" variant="solid" class="report-btn" @click="filtersOpen = false">Применить</UButton>
            </div>
          </div>
        </header>

        <div class="panel sales-list">
          <div v-if="loading" class="state">
            <Icon name="heroicons:arrow-path" class="h-5 w-5 animate-spin" />
            Загружаем продажи...
          </div>

          <template v-else-if="groupedSales.length">
            <div v-for="group in groupedSales" :key="group.date" class="group">
              <div class="group-label">{{ group.label }}</div>

              <article
                v-for="sale in group.items"
                :key="sale.id"
                class="sale-card"
                :class="{ 'sale-card--active': selectedSaleId === sale.id }"
                @click="selectedSaleId = sale.id"
              >
                <div class="sale-left">
                  <div class="sale-badge">{{ sale.itemsCountLabel }}</div>
                  <div>
                    <p class="sale-id">{{ sale.numberLabel }}</p>
                    <p class="sale-meta">{{ sale.dateTimeLabel }}</p>
                    <p class="sale-user">{{ sale.clientLabel }} · {{ sale.sellerLabel }}</p>
                  </div>
                </div>

                <div class="sale-right">
                  <p class="sale-amount" :class="{ 'sale-amount--negative': sale.amountValue < 0 }">
                    {{ sale.amountLabel }}
                  </p>
                  <p class="sale-shop">
                    <span class="dot"></span>
                    {{ sale.pointLabel }}
                  </p>
                  <button type="button" class="arrow-btn" @click.stop="selectedSaleId = sale.id">
                    <Icon name="heroicons:arrow-right" class="h-4 w-4" />
                  </button>
                </div>
              </article>
            </div>
          </template>

          <div v-else class="state state--empty">
            <div class="empty-icon">
              <Icon name="heroicons:receipt-percent" class="h-6 w-6" />
            </div>
            <p class="empty-title">Продажи не найдены</p>
            <p class="empty-text">Измените дату, поиск или фильтры и попробуйте ещё раз.</p>
          </div>
        </div>

        <footer class="sales-footer">
          <div class="pagination">
            <UButton color="neutral" variant="soft" class="icon-btn" :disabled="page <= 1 || loading" @click="page--">
              <Icon name="heroicons:chevron-left" class="h-4 w-4" />
            </UButton>
            <span class="page-index">{{ page }}</span>
            <UButton
              color="neutral"
              variant="soft"
              class="icon-btn"
              :disabled="page * limit >= total || loading"
              @click="page++"
            >
              <Icon name="heroicons:chevron-right" class="h-4 w-4" />
            </UButton>
          </div>

          <div class="footer-actions">
            <UButton color="neutral" variant="soft" class="toolbar-btn" @click="downloadReport">
              <Icon name="heroicons:arrow-down-tray" class="h-4 w-4" />
              Скачать
            </UButton>

            <div class="limit-box">
              <span>Показать по</span>
              <USelect v-model="limit" :items="limitOptions" color="neutral" variant="none" :ui="selectUi" />
            </div>
          </div>
        </footer>
      </div>

      <aside class="sales-sidebar">
        <section class="panel stats-panel">
          <div class="stats-head">
            <h2>Транзакции</h2>
            <span>{{ total }} шт</span>
          </div>

          <div class="stats-list">
            <div class="stats-row"><span>Товары</span><strong>{{ statsSummary.goodsCount }} шт</strong></div>
            <div class="stats-row"><span>Услуги</span><strong>{{ statsSummary.servicesCount }} шт</strong></div>
            <div class="stats-row"><span>Комплекты</span><strong>{{ statsSummary.setsCount }} шт</strong></div>
            <div class="stats-row"><span>Сертификаты</span><strong>{{ statsSummary.certificatesCount }} шт</strong></div>
            <div class="stats-row"><span>Возвраты</span><strong>{{ statsSummary.returnsCount }} шт</strong></div>
            <div class="stats-row"><span>Сумма возвратов</span><strong>{{ formatUzs(statsSummary.returnsAmount) }}</strong></div>
            <div class="stats-row"><span>Обмены</span><strong>{{ statsSummary.exchangesCount }} шт</strong></div>
            <div class="stats-row"><span>Сумма обменов</span><strong>{{ formatUzs(statsSummary.exchangesAmount) }}</strong></div>
          </div>
        </section>

        <section class="panel total-panel">
          <span>Сумма транзакций</span>
          <strong>{{ summaryAmountLabel }}</strong>
        </section>

        <section class="panel stats-panel">
          <div v-if="paymentEntries.length" class="stats-list">
            <div v-for="payment in paymentEntries" :key="payment.key" class="stats-row">
              <span class="payment-label"><span class="dot"></span>{{ payment.label }}</span>
              <strong>{{ payment.amountLabel }}</strong>
            </div>
          </div>
          <p v-else class="stats-empty">Нет данных по оплатам</p>
        </section>

        <section class="panel stats-panel">
          <div class="stats-list">
            <div class="stats-row"><span>Баланс клиентов</span><strong>{{ formatUzs(extraStats.clientBalance) }}</strong></div>
            <div class="stats-row"><span>Начислено</span><strong>{{ formatUzs(extraStats.accrued) }}</strong></div>
            <div class="stats-row"><span>Потрачено</span><strong>{{ formatUzs(extraStats.spent) }}</strong></div>
            <div class="stats-row"><span>Подарочные сертификаты</span><strong>{{ extraStats.giftCertificatesCount }} шт</strong></div>
            <div class="stats-row"><span>Продано</span><strong>{{ extraStats.giftCertificatesSoldCount }} шт</strong></div>
            <div class="stats-row"><span>Сумма продаж</span><strong>{{ formatUzs(extraStats.giftCertificatesSalesAmount) }}</strong></div>
            <div class="stats-row"><span>Погашение долгов</span><strong>{{ formatUzs(extraStats.debtRepaymentAmount) }}</strong></div>
          </div>
        </section>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useApi } from "~/composables/useApi";
import { useFormatPrice } from "~/composables/useFormatPrice";

useHead({ title: "Все продажи | Konkurent" });

interface SaleItemView {
  key: string;
  quantity: number;
  type: string;
}

interface SaleView {
  id: string;
  numberLabel: string;
  dateValue: string;
  dateTimeLabel: string;
  sellerLabel: string;
  pointLabel: string;
  amountLabel: string;
  amountValue: number;
  paymentKey: string;
  paymentLabel: string;
  clientLabel: string;
  cashierLabel: string;
  statusKey: string;
  itemsCountLabel: string;
  items: SaleItemView[];
}

const { apiFetch } = useApi();
const { formatPrice } = useFormatPrice();
const route = useRoute();
const router = useRouter();

const search = ref("");
const selectedDate = ref(String(route.query.start_date ?? route.query.date ?? ""));
const filtersOpen = ref(false);
const saleScope = ref("all");
const scopeOpen = ref(false);
const statusFilter = ref("all");
const paymentFilter = ref("all");
const shopFilter = ref("all");
const sellerFilter = ref("all");
const cashierFilter = ref("all");
const amountFrom = ref("");
const amountTo = ref("");
const sales = ref<SaleView[]>([]);
const paymentsFromApi = ref<Record<string, number>>({});
const rawStats = ref<Record<string, unknown>>({});
const summaryAmount = ref(0);
const loading = ref(false);
const page = ref(Math.max(1, Number(route.query.page || 1) || 1));
const limit = ref(Math.max(1, Number(route.query.limit || 10) || 10));
const total = ref(0);
const selectedSaleId = ref<string | null>(null);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const saleScopeOptions = [
  { label: "Все продажи", value: "all" },
  { label: "Удаленные", value: "deleted" },
] as const;
const limitOptions = [{ label: "10", value: 10 }, { label: "25", value: 25 }, { label: "50", value: 50 }];

const searchUi = { root: "w-full", base: "h-[52px] rounded-[15px] border-0 bg-transparent px-4 pl-11 text-[15px] font-bold text-white placeholder:text-[#bdbdbd] focus:outline-none focus:ring-0" };
const selectUi = { base: "h-[46px] rounded-[14px] border border-white/10 bg-[#404040] px-3 text-[14px] font-bold text-white focus:outline-none focus:ring-0" };

const dynamicPaymentOptions = computed(() => {
  const options = new Map<string, string>([["all", "Все"]]);

  for (const sale of sales.value) {
    options.set(sale.paymentKey, sale.paymentLabel);
  }

  return Array.from(options.entries()).map(([value, label]) => ({ value, label }));
});

const shopOptions = computed(() => uniqueOptions(sales.value.map((sale) => sale.pointLabel)));
const sellerOptions = computed(() => uniqueOptions(sales.value.map((sale) => sale.sellerLabel)));
const cashierOptions = computed(() => uniqueOptions(sales.value.map((sale) => sale.cashierLabel)));
const selectedScopeLabel = computed(() => saleScopeOptions.find((option) => option.value === saleScope.value)?.label || saleScopeOptions[0].label);

const filteredSales = computed(() => {
  const query = search.value.trim().toLowerCase();
  const minAmount = amountFrom.value === "" ? null : toNumber(amountFrom.value);
  const maxAmount = amountTo.value === "" ? null : toNumber(amountTo.value);

  return sales.value.filter((sale) => {
    const matchesSearch = !query || [sale.numberLabel, sale.clientLabel, sale.sellerLabel, sale.cashierLabel].some((value) => value.toLowerCase().includes(query));
    const matchesScope = saleScope.value === "all" || ["deleted", "cancelled", "removed"].includes(sale.statusKey);
    const matchesDate = !selectedDate.value || sale.dateValue === selectedDate.value;
    const matchesStatus = statusFilter.value === "all" || sale.statusKey === statusFilter.value;
    const matchesPayment = paymentFilter.value === "all" || sale.paymentKey === paymentFilter.value;
    const matchesShop = shopFilter.value === "all" || sale.pointLabel === shopFilter.value;
    const matchesSeller = sellerFilter.value === "all" || sale.sellerLabel === sellerFilter.value;
    const matchesCashier = cashierFilter.value === "all" || sale.cashierLabel === cashierFilter.value;
    const matchesMinAmount = minAmount === null || sale.amountValue >= minAmount;
    const matchesMaxAmount = maxAmount === null || sale.amountValue <= maxAmount;

    return matchesSearch && matchesScope && matchesDate && matchesStatus && matchesPayment && matchesShop && matchesSeller && matchesCashier && matchesMinAmount && matchesMaxAmount;
  });
});

const groupedSales = computed(() => {
  const groups = new Map<string, SaleView[]>();
  for (const sale of filteredSales.value) {
    const bucket = groups.get(sale.dateValue) ?? [];
    bucket.push(sale);
    groups.set(sale.dateValue, bucket);
  }
  return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0])).map(([date, items]) => ({ date, label: new Date(date).toLocaleDateString("ru-RU"), items }));
});

const selectedSale = computed(() => filteredSales.value.find((sale) => sale.id === selectedSaleId.value) ?? filteredSales.value[0] ?? null);
const summaryAmountLabel = computed(() => formatUzs(summaryAmount.value || filteredSales.value.reduce((sum, sale) => sum + sale.amountValue, 0)));
const extraStats = computed(() => ({
  clientBalance: readStatNumber(["clientBalance", "client_balance", "customerBalance", "customer_balance"]),
  accrued: readStatNumber(["accrued", "bonusAccrued", "bonus_accrued", "earned"]),
  spent: readStatNumber(["spent", "bonusSpent", "bonus_spent", "redeemed"]),
  giftCertificatesCount: readStatNumber(["giftCertificatesCount", "gift_certificates_count", "giftCertificates", "gift_certificates"]),
  giftCertificatesSoldCount: readStatNumber(["giftCertificatesSoldCount", "gift_certificates_sold_count", "giftCertificatesSold", "gift_certificates_sold"]),
  giftCertificatesSalesAmount: readStatNumber(["giftCertificatesSalesAmount", "gift_certificates_sales_amount", "giftCertificatesAmount", "gift_certificates_amount"]),
  debtRepaymentAmount: readStatNumber(["debtRepaymentAmount", "debt_repayment_amount", "debtRepayment", "debt_repayment"]),
}));

const statsSummary = computed(() => {
  let goodsCount = 0;
  let servicesCount = 0;
  let setsCount = 0;
  let certificatesCount = 0;
  let returnsCount = 0;
  let returnsAmount = 0;

  for (const sale of filteredSales.value) {
    if (sale.amountValue < 0 || sale.statusKey === "return") {
      returnsCount += 1;
      returnsAmount += Math.abs(sale.amountValue);
    }
    for (const item of sale.items) {
      if (item.type === "service") servicesCount += item.quantity;
      else if (item.type === "set") setsCount += item.quantity;
      else if (item.type === "certificate") certificatesCount += item.quantity;
      else goodsCount += item.quantity;
    }
  }

  return { goodsCount, servicesCount, setsCount, certificatesCount, returnsCount, returnsAmount, exchangesCount: 0, exchangesAmount: 0 };
});

const paymentEntries = computed(() => {
  const base = Object.keys(paymentsFromApi.value).length ? paymentsFromApi.value : filteredSales.value.reduce<Record<string, number>>((acc, sale) => {
    acc[sale.paymentKey] = (acc[sale.paymentKey] ?? 0) + sale.amountValue;
    return acc;
  }, {});

  return Object.entries(base)
    .map(([key, amount]) => {
      const normalizedKey = normalizePaymentKey(key);
      return { key: normalizedKey, label: paymentLabelForKey(normalizedKey), amount: toNumber(amount), amountLabel: formatUzs(toNumber(amount)) };
    })
    .filter((entry) => entry.amount > 0)
    .sort((a, b) => paymentSortIndex(a.key) - paymentSortIndex(b.key));
});

watch(filteredSales, (value) => {
  if (!value.length) selectedSaleId.value = null;
  else if (!value.some((sale) => sale.id === selectedSaleId.value)) selectedSaleId.value = value[0]?.id ?? null;
});

watch([page, limit, selectedDate], () => {
  void syncRouteQuery();
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetchSales, 160);
}, { immediate: true });

watch(
  () => route.query,
  (query) => {
    const nextPage = Math.max(1, Number(query.page || 1) || 1);
    const nextLimit = Math.max(1, Number(query.limit || 10) || 10);
    const nextDate = String(query.start_date ?? query.date ?? "");

    if (page.value !== nextPage) page.value = nextPage;
    if (limit.value !== nextLimit) limit.value = nextLimit;
    if (selectedDate.value !== nextDate) selectedDate.value = nextDate;
  },
);

async function syncRouteQuery() {
  const nextQuery: Record<string, string> = {
    ...Object.fromEntries(Object.entries(route.query).map(([key, value]) => [key, Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "")])),
    page: String(page.value),
    limit: String(limit.value),
  };

  delete nextQuery.date;

  if (selectedDate.value) {
    nextQuery.start_date = selectedDate.value;
  } else {
    delete nextQuery.start_date;
  }

  const current = JSON.stringify(route.query);
  const next = JSON.stringify(nextQuery);
  if (current !== next) {
    await router.replace({ query: nextQuery });
  }
}

function normalizeSale(raw: any): SaleView {
  const id = String(raw?.id ?? raw?.sale_id ?? raw?.number ?? Math.random());
  const createdAt = raw?.created_at ?? raw?.createdAt ?? raw?.date ?? new Date().toISOString();
  const amountValue = toNumber(raw?.payable_total ?? raw?.total ?? raw?.amount ?? raw?.grand_total);
  const items = Array.isArray(raw?.items) ? raw.items.map((item: any, index: number) => ({
    key: String(item?.id ?? `${index}`),
    quantity: Math.max(toNumber(item?.quantity ?? item?.qty ?? 0), 0),
    type: normalizeItemType(item?.type ?? item?.product_type ?? item?.kind),
  })) : [];
  const itemsCount = items.reduce((sum: number, item: SaleItemView) => sum + item.quantity, 0);
  const paymentInfo = resolvePaymentInfo(raw);

  return {
    id,
    numberLabel: `Продажа #${String(raw?.number ?? raw?.sale_number ?? raw?.id ?? "—")}`,
    dateValue: toIsoDate(createdAt),
    dateTimeLabel: `${new Date(createdAt).toLocaleDateString("ru-RU")} | ${new Date(createdAt).toLocaleTimeString("ru-RU")}`,
    sellerLabel: raw?.seller?.name ?? raw?.seller_name ?? raw?.cashier?.name ?? raw?.user?.name ?? "Не указан",
    pointLabel: raw?.shop?.name ?? raw?.branch_title ?? raw?.branch_name ?? raw?.location?.name ?? raw?.point?.name ?? "Не указана",
    amountLabel: formatUzs(amountValue),
    amountValue,
    paymentKey: paymentInfo.key,
    paymentLabel: paymentInfo.label,
    clientLabel: raw?.client?.name ?? raw?.customer?.name ?? raw?.buyer?.name ?? raw?.client_name ?? "Без клиента",
    cashierLabel: raw?.cashier?.name ?? raw?.cashier_name ?? raw?.user?.name ?? raw?.seller?.name ?? "Не указан",
    statusKey: String(raw?.status ?? "paid").toLowerCase(),
    itemsCountLabel: `${itemsCount} ед.`,
    items,
  };
}

function normalizeItemType(value: unknown) {
  const type = String(value ?? "").toLowerCase();
  if (type.includes("service")) return "service";
  if (type.includes("set") || type.includes("bundle")) return "set";
  if (type.includes("certificate") || type.includes("gift")) return "certificate";
  return "goods";
}

function resolvePaymentInfo(raw: any) {
  const paymentName = String(raw?.payment?.name ?? raw?.payment_type_name ?? "").trim();
  const paymentId = String(raw?.payment?.id ?? raw?.payment_method ?? raw?.payment_type ?? raw?.paymentType ?? "").trim();
  const direct = paymentName || paymentId || String(raw?.payment?.method ?? raw?.payment?.type ?? "").trim();

  if (direct) {
    return {
      key: normalizePaymentKey(paymentId || direct),
      label: paymentName || formatPaymentLabel(direct),
    };
  }

  if (raw?.payments && typeof raw.payments === "object") {
    const first = Object.entries(raw.payments as Record<string, unknown>).find(([, amount]) => toNumber(amount) > 0)?.[0];
    if (first) {
      return {
        key: normalizePaymentKey(first),
        label: formatPaymentLabel(first),
      };
    }
  }

  return {
    key: "cash",
    label: "Наличные",
  };
}

function normalizePaymentKey(value: string) {
  const key = String(value || "").toLowerCase();
  if (key.includes("click")) return "click";
  if (key.includes("payme") || key.includes("pay_me")) return "payme";
  if (key.includes("cash") || key.includes("нал")) return "cash";
  if (key.includes("card") || key.includes("карта")) return "card";
  if (key.includes("transfer") || key.includes("перевод")) return "transfer";
  return key || "cash";
}

function formatPaymentLabel(value: string) {
  if (value === "cash") return "Наличные";
  if (value === "card") return "Карта";
  if (value === "click") return "Click QR";
  if (value === "payme") return "PayME QR";
  if (value === "transfer") return "Перевод на карту";
  return value || "Не указано";
}

function paymentSortIndex(key: string) {
  const order = ["cash", "transfer", "click", "card", "payme"];
  const index = order.indexOf(key);
  return index === -1 ? order.length : index;
}

function toIsoDate(value: string | number | Date) {
  return new Date(value).toISOString().slice(0, 10);
}

function paymentLabelForKey(key: string) {
  return sales.value.find((sale) => sale.paymentKey === key)?.paymentLabel || formatPaymentLabel(key);
}

function toNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function readStatNumber(keys: string[]) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(rawStats.value, key)) return toNumber(rawStats.value[key]);
  }
  return 0;
}

function formatUzs(value: number) {
  return `${formatPrice(value)} UZS`;
}

function resetFilters() {
  search.value = "";
  selectedDate.value = "";
  saleScope.value = "all";
  statusFilter.value = "all";
  paymentFilter.value = "all";
  shopFilter.value = "all";
  sellerFilter.value = "all";
  cashierFilter.value = "all";
  amountFrom.value = "";
  amountTo.value = "";
}

function selectScope(value: (typeof saleScopeOptions)[number]["value"]) {
  saleScope.value = value;
  scopeOpen.value = false;
}

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values.filter((value) => value && !value.includes("РќРµ СѓРєР°Р·Р°РЅ")))).sort((a, b) => a.localeCompare(b, "ru"));
}

function downloadReport() {
  if (!import.meta.client) return;
  const rows = filteredSales.value.map((sale) => [sale.id, sale.numberLabel, sale.dateTimeLabel, sale.clientLabel, sale.sellerLabel, sale.pointLabel, sale.amountValue, sale.paymentLabel]);
  const csv = [["id", "number", "datetime", "client", "user", "shop", "amount", "payment"].join(","), ...rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, "\"\"")}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sales-${selectedDate.value || new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

async function fetchSales() {
  loading.value = true;
  try {
    const response: any = await apiFetch("/sales", { method: "GET", query: { start_date: selectedDate.value || undefined, page: page.value, limit: limit.value } });
    const items = Array.isArray(response?.data) ? response.data : Array.isArray(response?.items) ? response.items : Array.isArray(response) ? response : [];
    const meta = response?.meta ?? response ?? {};
    const stats = response?.stats ?? {};
    sales.value = items.map(normalizeSale);
    total.value = Number(meta?.total ?? response?.total ?? sales.value.length ?? 0) || 0;
    page.value = Number(meta?.page ?? response?.page ?? page.value) || 1;
    limit.value = Number(meta?.limit ?? response?.limit ?? limit.value) || 10;
    summaryAmount.value = toNumber(stats?.totalAmount);
    rawStats.value = stats;
    paymentsFromApi.value = typeof stats?.payments === "object" && stats?.payments ? stats.payments : {};
  } catch {
    sales.value = [];
    total.value = 0;
    summaryAmount.value = 0;
    rawStats.value = {};
    paymentsFromApi.value = {};
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.sales-page { min-height: calc(100vh - 88px); padding: 0 0 32px; color: white; }
.sales-layout { display: grid; grid-template-columns: minmax(0,1fr) 340px; gap: 16px; }
.panel { border: 0; background: #262626; box-shadow: none; border-radius: 0; }
.sales-header { padding: 0 0 16px; display: grid; gap: 16px; }
.header-top, .sales-footer, .pagination, .footer-actions, .stats-head, .stats-row, .payment-label, .sale-left, .sale-right { display: flex; align-items: center; }
.header-top, .sales-footer, .stats-head, .stats-row { justify-content: space-between; gap: 16px; }
.scope-select { position: relative; width: fit-content; min-width: 240px; }
.scope-trigger { display: inline-flex; min-height: 54px; width: 100%; align-items: center; justify-content: space-between; gap: 12px; border: 0; border-radius: 16px; background: transparent; padding: 0 6px 0 0; color: #fff; font-size: clamp(28px,2.6vw,38px); font-weight: 800; line-height: 1; outline: none; }
.scope-trigger:hover { color: #78b3ff; }
.scope-menu { position: absolute; left: 0; top: calc(100% + 8px); z-index: 30; display: grid; min-width: 240px; gap: 6px; border-radius: 18px; background: #303030; padding: 8px; box-shadow: 0 18px 42px rgba(0,0,0,.32); }
.scope-option { display: flex; min-height: 44px; width: 100%; align-items: center; justify-content: space-between; gap: 12px; border-radius: 14px; padding: 0 12px; color: #d7d7d7; font-size: 15px; font-weight: 800; text-align: left; }
.scope-option:hover, .scope-option--active { background: #404040; color: #fff; }
.header-meta { display: flex; align-items: center; gap: 12px; }
.count-inline { min-height: 46px; display: inline-flex; align-items: center; white-space: nowrap; border-radius: 15px; background: #303030; padding: 0 14px; color: #fff; font-size: 15px; font-weight: 800; }
.count-badge span, .group-label, .sale-meta, .sale-user, .sale-shop, .stats-row span, .stats-head span, .stats-empty, .empty-text, .limit-box span, .total-panel span { color: #bdbdbd; }
.header-controls { display: grid; grid-template-columns: minmax(320px,1fr) 132px; gap: 10px; align-items: stretch; }
.search-wrap { position: relative; border: 1px solid transparent; border-radius: 15px; background: #404040; }
.search-icon { position: absolute; top: 50%; left: 16px; transform: translateY(-50%); color: #bdbdbd; }
.toolbar-btn, .report-btn, .icon-btn { border: 1px solid rgba(255,255,255,.08); background: #404040; color: #fff; }
.toolbar-btn, .report-btn { width: 100%; min-height: 52px; border-radius: 15px; justify-content: center; gap: 8px; padding: 0 12px; font-size: 14px; font-weight: 700; white-space: nowrap; }
.toolbar-btn--today { font-size: 13px; }
.toolbar-btn--icon { padding: 0 10px; }
.toolbar-btn:hover, .icon-btn:hover { background: #505050; }
.report-btn { background: #1f78ff; color: #fff; border-color: transparent; }
.report-btn:hover { background: #4993dd; }
.filters-panel { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); gap: 12px; border-top: 1px solid #404040; padding-top: 16px; }
.filter-field { display: grid; gap: 8px; min-width: 0; }
.filter-field span { color: #bdbdbd; font-size: 13px; font-weight: 800; }
.filter-field select, .filter-field input { width: 100%; min-height: 46px; border: 0; border-radius: 14px; background: #404040; padding: 0 12px; color: #fff; font-size: 14px; font-weight: 700; outline: none; }
.range-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.filter-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-self: end; }
.sales-list { margin-top: 16px; padding: 14px; }
.group + .group { margin-top: 16px; }
.group-label { margin-bottom: 10px; padding: 0 4px; font-size: 14px; font-weight: 700; }
.sale-card { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px; border: 0; border-radius: 18px; background: #303030; transition: transform .2s ease, background .2s ease; cursor: pointer; }
.sale-card + .sale-card { margin-top: 10px; }
.sale-card:hover { transform: translateY(-1px); background: #363636; }
.sale-card--active { background: rgba(31,120,255,.16); }
.sale-left { gap: 14px; min-width: 0; }
.sale-badge { min-width: 58px; height: 58px; display: flex; align-items: center; justify-content: center; border-radius: 16px; background: #404040; border: 0; font-size: 13px; font-weight: 700; color: #dfe9ff; }
.sale-id, .sale-amount, .stats-row strong, .total-panel strong, .empty-title { color: #f6f8fc; font-weight: 700; }
.sale-id { font-size: 16px; }
.sale-meta, .sale-user, .sale-shop { font-size: 13px; }
.sale-amount { font-size: 18px; color: #78b3ff; text-align: right; }
.sale-amount--negative { color: #ff7a7a; }
.sale-shop, .payment-label { display: flex; align-items: center; gap: 8px; }
.dot { width: 10px; height: 10px; border-radius: 999px; background: #1f78ff; flex: 0 0 auto; }
.arrow-btn { width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 13px; background: #404040; color: #dfe9ff; }
.state { min-height: 420px; display: flex; align-items: center; justify-content: center; gap: 10px; color: rgb(203 213 225); }
.state--empty { flex-direction: column; }
.empty-icon { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 18px; background: #303030; color: #78b3ff; }
.empty-title { font-size: 18px; }
.sales-footer { margin-top: 16px; padding: 0 4px; }
.pagination, .footer-actions, .payment-label { gap: 10px; }
.icon-btn { width: 42px; height: 42px; border-radius: 14px; }
.page-index { min-width: 24px; text-align: center; font-weight: 700; color: #f6f8fc; }
.limit-box { display: flex; align-items: center; gap: 10px; }
.sales-sidebar { display: grid; gap: 18px; align-content: start; border-left: 1px solid #404040; padding-left: 16px; }
.stats-panel, .total-panel { padding: 16px; }
.stats-head { margin-bottom: 12px; }
.stats-head h2 { font-size: 18px; font-weight: 600; color: #f6f8fc; }
.stats-list { display: grid; gap: 8px; }
.stats-row { font-size: 14px; }
.total-panel { border-color: rgba(31,120,255,.25); background: #1f78ff; }
.total-panel span { color: rgba(255,255,255,.78); }
.total-panel strong { display: block; margin-top: 8px; font-size: 24px; }
@media (max-width: 1440px) { .sales-layout { grid-template-columns: 1fr; } }
@media (max-width: 1440px) { .sales-sidebar { border-left: 0; border-top: 1px solid #404040; padding-left: 0; padding-top: 16px; } }
@media (max-width: 1180px) { .filters-panel { grid-template-columns: repeat(2,minmax(0,1fr)); } .filter-actions { grid-column: span 2; } }
@media (max-width: 768px) { .sales-page { padding: 0 0 24px; } .sales-header, .sales-list, .stats-panel, .total-panel { padding: 16px; } .header-top, .sales-footer, .sale-card, .sale-right { flex-direction: column; align-items: stretch; } .header-meta, .header-controls, .filters-panel, .filter-actions { grid-template-columns: 1fr; } .header-meta { align-items: stretch; } .scope-select { width: 100%; } .filter-actions { grid-column: auto; } .sale-amount, .sale-shop { text-align: left; justify-content: flex-start; } }
</style>
