<template>
  <section class="sales-page">
    <div class="sales-layout">
      <div class="sales-main">
        <header class="panel sales-header">
          <div class="header-top">
            <div>
              <p class="kicker">Sales</p>
              <h1>Все продажи</h1>
            </div>
            <div class="count-badge">
              <strong>{{ total }}</strong>
              <span>транзакции</span>
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

            <UButton color="neutral" variant="soft" class="toolbar-btn" @click="setToday">
              <Icon name="heroicons:calendar-days" class="h-4 w-4" />
              Сегодня ({{ todayLabel }})
            </UButton>

            <AppDatePicker v-model="selectedDate" clearable />

            <UButton color="neutral" variant="soft" class="toolbar-btn" @click="filtersOpen = true">
              <Icon name="heroicons:adjustments-horizontal" class="h-4 w-4" />
              Фильтры
            </UButton>

            <UButton color="primary" variant="solid" class="report-btn" @click="printReport">
              Распечатать отчет
              <Icon name="heroicons:arrow-right" class="h-4 w-4" />
            </UButton>
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
          <div class="stats-head">
            <h2>Оплаты</h2>
            <span>{{ paymentEntries.length }}</span>
          </div>

          <div v-if="paymentEntries.length" class="stats-list">
            <div v-for="payment in paymentEntries" :key="payment.key" class="stats-row">
              <span class="payment-label"><span class="dot"></span>{{ payment.label }}</span>
              <strong>{{ payment.amountLabel }}</strong>
            </div>
          </div>
          <p v-else class="stats-empty">Нет данных по оплатам</p>
        </section>

        <section v-if="selectedSale" class="panel stats-panel">
          <div class="stats-head">
            <h2>Выбрано</h2>
            <span>{{ selectedSale.numberLabel }}</span>
          </div>

          <div class="stats-list">
            <div class="stats-row"><span>Клиент</span><strong>{{ selectedSale.clientLabel }}</strong></div>
            <div class="stats-row"><span>Пользователь</span><strong>{{ selectedSale.sellerLabel }}</strong></div>
            <div class="stats-row"><span>Локация</span><strong>{{ selectedSale.pointLabel }}</strong></div>
            <div class="stats-row"><span>Сумма</span><strong>{{ selectedSale.amountLabel }}</strong></div>
          </div>
        </section>
      </aside>
    </div>

    <UModal v-model:open="filtersOpen" title="Фильтры продаж">
      <template #body>
        <div class="modal-grid">
          <div class="modal-group">
            <p class="modal-label">Быстрый период</p>
            <div class="modal-actions">
              <UButton color="neutral" variant="soft" class="toolbar-btn" @click="setToday">Сегодня</UButton>
              <UButton color="neutral" variant="soft" class="toolbar-btn" @click="setYesterday">Вчера</UButton>
              <UButton color="neutral" variant="soft" class="toolbar-btn" @click="clearDate">Сбросить дату</UButton>
            </div>
          </div>

          <div class="modal-group">
            <p class="modal-label">Статус</p>
            <USelect v-model="statusFilter" :items="statusOptions" color="neutral" variant="none" :ui="selectUi" />
          </div>

          <div class="modal-group">
            <p class="modal-label">Оплата</p>
            <USelect v-model="paymentFilter" :items="paymentOptions" color="neutral" variant="none" :ui="selectUi" />
          </div>
        </div>
      </template>

      <template #footer>
        <div class="modal-actions">
          <UButton color="neutral" variant="soft" class="toolbar-btn" @click="resetFilters">Сбросить всё</UButton>
          <UButton color="primary" variant="solid" class="toolbar-btn" @click="filtersOpen = false">Применить</UButton>
        </div>
      </template>
    </UModal>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useApi } from "~/composables/useApi";
import { useFormatPrice } from "~/composables/useFormatPrice";

useHead({ title: "Все продажи | Konkurent.cases" });

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
  clientLabel: string;
  statusKey: string;
  itemsCountLabel: string;
  items: SaleItemView[];
}

const { apiFetch } = useApi();
const { formatPrice } = useFormatPrice();

const search = ref("");
const selectedDate = ref("");
const filtersOpen = ref(false);
const statusFilter = ref("all");
const paymentFilter = ref("all");
const sales = ref<SaleView[]>([]);
const paymentsFromApi = ref<Record<string, number>>({});
const summaryAmount = ref(0);
const loading = ref(false);
const page = ref(1);
const limit = ref(10);
const total = ref(0);
const selectedSaleId = ref<string | null>(null);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const limitOptions = [{ label: "10", value: 10 }, { label: "25", value: 25 }, { label: "50", value: 50 }];
const statusOptions = [{ label: "Все", value: "all" }, { label: "Оплачен", value: "paid" }, { label: "Ожидает", value: "pending" }, { label: "Отменён", value: "cancelled" }];
const paymentOptions = [{ label: "Все", value: "all" }, { label: "Наличные", value: "cash" }, { label: "Карта", value: "card" }, { label: "Click QR", value: "click" }, { label: "Перевод", value: "transfer" }];

const searchUi = { root: "w-full", base: "h-[54px] rounded-[18px] border-0 bg-transparent px-4 pl-11 text-white placeholder:text-slate-300 focus:outline-none focus:ring-0" };
const selectUi = { base: "h-[44px] rounded-[14px] border border-white/10 bg-white/5 px-3 text-white focus:outline-none focus:ring-0" };

const todayLabel = computed(() => new Date().toLocaleDateString("ru-RU"));

const filteredSales = computed(() => {
  const query = search.value.trim().toLowerCase();
  return sales.value.filter((sale) => {
    const matchesSearch = !query || [sale.numberLabel, sale.clientLabel, sale.sellerLabel].some((value) => value.toLowerCase().includes(query));
    const matchesDate = !selectedDate.value || sale.dateValue === selectedDate.value;
    const matchesStatus = statusFilter.value === "all" || sale.statusKey === statusFilter.value;
    const matchesPayment = paymentFilter.value === "all" || sale.paymentKey === paymentFilter.value;
    return matchesSearch && matchesDate && matchesStatus && matchesPayment;
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
    .map(([key, amount]) => ({ key, label: formatPaymentLabel(key), amount: toNumber(amount), amountLabel: formatUzs(toNumber(amount)) }))
    .filter((entry) => entry.amount > 0)
    .sort((a, b) => b.amount - a.amount);
});

watch(filteredSales, (value) => {
  if (!value.length) selectedSaleId.value = null;
  else if (!value.some((sale) => sale.id === selectedSaleId.value)) selectedSaleId.value = value[0]?.id ?? null;
});

watch([page, limit, selectedDate], () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetchSales, 160);
}, { immediate: true });

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

  return {
    id,
    numberLabel: `Продажа #${String(raw?.number ?? raw?.sale_number ?? raw?.id ?? "—")}`,
    dateValue: toIsoDate(createdAt),
    dateTimeLabel: `${new Date(createdAt).toLocaleDateString("ru-RU")} | ${new Date(createdAt).toLocaleTimeString("ru-RU")}`,
    sellerLabel: raw?.seller?.name ?? raw?.seller_name ?? raw?.cashier?.name ?? raw?.user?.name ?? "Не указан",
    pointLabel: raw?.shop?.name ?? raw?.branch_title ?? raw?.branch_name ?? raw?.location?.name ?? raw?.point?.name ?? "Не указана",
    amountLabel: formatUzs(amountValue),
    amountValue,
    paymentKey: detectPaymentKey(raw),
    clientLabel: raw?.client?.name ?? raw?.customer?.name ?? raw?.buyer?.name ?? raw?.client_name ?? "Без клиента",
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

function detectPaymentKey(raw: any) {
  const direct = String(raw?.payment?.name ?? raw?.payment_method ?? raw?.payment_type ?? raw?.paymentType ?? raw?.payment?.method ?? raw?.payment?.type ?? "").toLowerCase();
  if (direct) return normalizePaymentKey(direct);
  if (raw?.payments && typeof raw.payments === "object") {
    const first = Object.entries(raw.payments as Record<string, unknown>).find(([, amount]) => toNumber(amount) > 0)?.[0];
    if (first) return normalizePaymentKey(first);
  }
  return "cash";
}

function normalizePaymentKey(value: string) {
  if (value.includes("click")) return "click";
  if (value.includes("cash")) return "cash";
  if (value.includes("card")) return "card";
  if (value.includes("transfer")) return "transfer";
  return value || "cash";
}

function formatPaymentLabel(value: string) {
  if (value === "cash") return "Наличные";
  if (value === "card") return "Карта";
  if (value === "click") return "Click QR";
  if (value === "transfer") return "Перевод";
  return value || "Не указано";
}

function toIsoDate(value: string | number | Date) {
  return new Date(value).toISOString().slice(0, 10);
}

function toNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatUzs(value: number) {
  return `${formatPrice(value)} UZS`;
}

function setToday() {
  selectedDate.value = new Date().toISOString().slice(0, 10);
  filtersOpen.value = false;
}

function setYesterday() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  selectedDate.value = date.toISOString().slice(0, 10);
  filtersOpen.value = false;
}

function clearDate() {
  selectedDate.value = "";
}

function resetFilters() {
  search.value = "";
  selectedDate.value = "";
  statusFilter.value = "all";
  paymentFilter.value = "all";
  filtersOpen.value = false;
}

function printReport() {
  if (import.meta.client) window.print();
}

function downloadReport() {
  if (!import.meta.client) return;
  const rows = filteredSales.value.map((sale) => [sale.id, sale.numberLabel, sale.dateTimeLabel, sale.clientLabel, sale.sellerLabel, sale.pointLabel, sale.amountValue, formatPaymentLabel(sale.paymentKey)]);
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
    const response: any = await apiFetch("/sales", { method: "GET", query: { date: selectedDate.value || undefined, page: page.value, limit: limit.value } });
    const items = Array.isArray(response?.data) ? response.data : Array.isArray(response?.items) ? response.items : Array.isArray(response) ? response : [];
    const meta = response?.meta ?? response ?? {};
    const stats = response?.stats ?? {};
    sales.value = items.map(normalizeSale);
    total.value = Number(meta?.total ?? response?.total ?? sales.value.length ?? 0) || 0;
    page.value = Number(meta?.page ?? response?.page ?? page.value) || 1;
    limit.value = Number(meta?.limit ?? response?.limit ?? limit.value) || 10;
    summaryAmount.value = toNumber(stats?.totalAmount);
    paymentsFromApi.value = typeof stats?.payments === "object" && stats?.payments ? stats.payments : {};
  } catch {
    sales.value = [];
    total.value = 0;
    summaryAmount.value = 0;
    paymentsFromApi.value = {};
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.sales-page { min-height: calc(100vh - 88px); padding: 24px 0 32px; }
.sales-layout { display: grid; grid-template-columns: minmax(0,1fr) 360px; gap: 18px; }
.panel { border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.05); box-shadow: 0 18px 50px rgba(2,6,23,.2); backdrop-filter: blur(10px); border-radius: 28px; }
.sales-header { padding: 24px; display: grid; gap: 18px; }
.header-top, .sales-footer, .pagination, .footer-actions, .stats-head, .stats-row, .payment-label, .sale-left, .sale-right { display: flex; align-items: center; }
.header-top, .sales-footer, .stats-head, .stats-row { justify-content: space-between; gap: 16px; }
.kicker { font-size: 12px; letter-spacing: .22em; text-transform: uppercase; color: rgb(125 211 252); }
h1 { margin-top: 8px; font-size: clamp(34px,4vw,52px); line-height: .94; font-weight: 700; color: #f6f8fc; }
.count-badge { min-width: 96px; padding: 14px 16px; border-radius: 22px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08); text-align: center; }
.count-badge strong { display: block; font-size: 28px; color: #f6f8fc; }
.count-badge span, .group-label, .sale-meta, .sale-user, .sale-shop, .stats-row span, .stats-head span, .stats-empty, .empty-text, .limit-box span, .total-panel span { color: rgb(203 213 225); }
.header-controls { display: grid; grid-template-columns: minmax(280px,1fr) 190px 170px 150px 210px; gap: 12px; }
.search-wrap { position: relative; border: 1px solid rgba(255,255,255,.1); border-radius: 18px; background: rgba(255,255,255,.04); }
.search-icon { position: absolute; top: 50%; left: 16px; transform: translateY(-50%); color: rgb(203 213 225); }
.toolbar-btn, .report-btn, .icon-btn { border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.05); color: #f6f8fc; }
.toolbar-btn, .report-btn { height: 54px; border-radius: 18px; justify-content: center; gap: 8px; }
.report-btn { background: rgba(255,255,255,.08); color: #fff; }
.sales-list { margin-top: 18px; padding: 18px; }
.group + .group { margin-top: 18px; }
.group-label { margin-bottom: 12px; padding: 0 4px; font-size: 15px; font-weight: 600; }
.sale-card { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 18px; border: 1px solid rgba(255,255,255,.08); border-radius: 24px; background: rgba(255,255,255,.04); transition: transform .2s ease, border-color .2s ease, background .2s ease; cursor: pointer; }
.sale-card + .sale-card { margin-top: 12px; }
.sale-card:hover { transform: translateY(-1px); border-color: rgba(125,211,252,.35); background: rgba(255,255,255,.07); }
.sale-card--active { border-color: rgba(125,211,252,.35); background: rgba(255,255,255,.09); }
.sale-left { gap: 16px; min-width: 0; }
.sale-badge { min-width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; border-radius: 999px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08); font-size: 14px; font-weight: 700; color: #dfe9ff; }
.sale-id, .sale-amount, .stats-row strong, .total-panel strong, .empty-title { color: #f6f8fc; font-weight: 700; }
.sale-id { font-size: 17px; }
.sale-amount { font-size: 20px; color: #f6f8fc; text-align: right; }
.sale-amount--negative { color: #ff7a7a; }
.sale-shop, .payment-label { display: flex; align-items: center; gap: 8px; }
.dot { width: 10px; height: 10px; border-radius: 999px; background: rgb(125 211 252); flex: 0 0 auto; }
.arrow-btn { width: 42px; height: 42px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,.1); border-radius: 14px; background: rgba(255,255,255,.04); color: #dfe9ff; }
.state { min-height: 420px; display: flex; align-items: center; justify-content: center; gap: 10px; color: rgb(203 213 225); }
.state--empty { flex-direction: column; }
.empty-icon { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 999px; background: rgba(255,255,255,.06); color: rgb(125 211 252); }
.empty-title { font-size: 18px; }
.sales-footer { margin-top: 18px; padding: 0 4px; }
.pagination, .footer-actions, .payment-label { gap: 10px; }
.icon-btn { width: 44px; height: 44px; border-radius: 14px; }
.page-index { min-width: 24px; text-align: center; font-weight: 700; color: #f6f8fc; }
.limit-box { display: flex; align-items: center; gap: 10px; }
.sales-sidebar { display: grid; gap: 18px; align-content: start; }
.stats-panel, .total-panel { padding: 20px; }
.stats-head { margin-bottom: 14px; }
.stats-head h2 { font-size: 18px; font-weight: 600; color: #f6f8fc; }
.stats-list { display: grid; gap: 10px; }
.total-panel { border-color: rgba(255,255,255,.1); background: rgba(255,255,255,.06); }
.total-panel strong { display: block; margin-top: 8px; font-size: 28px; }
.modal-grid, .modal-group { display: grid; gap: 12px; }
.modal-label { font-size: 13px; font-weight: 600; color: #f6f8fc; }
.modal-actions { display: flex; gap: 10px; flex-wrap: wrap; }
@media (max-width: 1440px) { .sales-layout { grid-template-columns: 1fr; } }
@media (max-width: 1180px) { .header-controls { grid-template-columns: 1fr 1fr; } .report-btn { grid-column: span 2; } }
@media (max-width: 768px) { .sales-page { padding: 16px 0 24px; } .panel { border-radius: 20px; } .sales-header, .sales-list, .stats-panel, .total-panel { padding: 16px; } .header-top, .sales-footer, .sale-card, .sale-right { flex-direction: column; align-items: stretch; } .header-controls, .report-btn { grid-template-columns: 1fr; grid-column: auto; } .sale-amount, .sale-shop { text-align: left; justify-content: flex-start; } }
</style>
