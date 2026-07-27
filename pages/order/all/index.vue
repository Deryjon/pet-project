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
            <div class="filters-panel-header">
              <Icon name="heroicons:adjustments-horizontal" class="h-4 w-4" />
              <span>Фильтры</span>
            </div>

            <div class="filters-grid">
              <label class="filter-field">
                <span class="filter-label">Магазин</span>
                <div class="filter-select-wrap">
                  <select v-model="shopFilter">
                    <option value="all">Все магазины</option>
                    <option v-for="option in shopOptions" :key="option" :value="option">{{ option }}</option>
                  </select>
                  <Icon name="heroicons:chevron-down-20-solid" class="filter-select-icon" />
                </div>
              </label>

              <label class="filter-field">
                <span class="filter-label">Тип оплаты</span>
                <div class="filter-select-wrap">
                  <select v-model="paymentFilter">
                    <option value="all">Все типы</option>
                    <option v-for="option in dynamicPaymentOptions.filter((item) => item.value !== 'all')" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                  <Icon name="heroicons:chevron-down-20-solid" class="filter-select-icon" />
                </div>
              </label>

              <div class="filter-field">
                <span class="filter-label">Сумма чека</span>
                <div class="range-inputs">
                  <input v-model="amountFrom" type="number" min="0" placeholder="от" />
                  <input v-model="amountTo" type="number" min="0" placeholder="до" />
                </div>
              </div>

              <label class="filter-field">
                <span class="filter-label">Продавец</span>
                <div class="filter-select-wrap">
                  <select v-model="sellerFilter">
                    <option value="all">Все продавцы</option>
                    <option v-for="option in sellerOptions" :key="option" :value="option">{{ option }}</option>
                  </select>
                  <Icon name="heroicons:chevron-down-20-solid" class="filter-select-icon" />
                </div>
              </label>

              <label class="filter-field">
                <span class="filter-label">Кассир</span>
                <div class="filter-select-wrap">
                  <select v-model="cashierFilter">
                    <option value="all">Все кассиры</option>
                    <option v-for="option in cashierOptions" :key="option" :value="option">{{ option }}</option>
                  </select>
                  <Icon name="heroicons:chevron-down-20-solid" class="filter-select-icon" />
                </div>
              </label>
            </div>

            <div class="filter-actions">
              <UButton color="neutral" variant="soft" class="toolbar-btn" @click="resetFilters">
                <Icon name="heroicons:arrow-uturn-left" class="h-4 w-4" />
                Сбросить
              </UButton>
              <UButton color="primary" variant="solid" class="report-btn" @click="filtersOpen = false">
                <Icon name="heroicons:check" class="h-4 w-4" />
                Применить
              </UButton>
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
                :class="{ 'sale-card--active': activeSaleId === sale.id }"
                @click="openSaleDetails(sale)"
              >
                <div class="sale-left sale-left--stacked">
                  <div class="sale-badge">{{ sale.typeLabel || "Продажа" }} {{ sale.itemsCountLabel }}</div>
                  <div>
                    <p class="sale-id">Продажа #</p>
                    <p class="sale-number">{{ saleNumberValue(sale) }}</p>
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
                  <p class="sale-payment" :class="{ 'sale-payment--mixed': sale.paymentKey === 'mixed' }">
                    <Icon :name="sale.paymentKey === 'mixed' ? 'heroicons:arrows-right-left' : 'heroicons:credit-card'" class="h-3 w-3" />
                    {{ sale.paymentLabel }}
                  </p>
                  <button type="button" class="arrow-btn" @click.stop="openSaleDetails(sale)">
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

      <AppSlideover
        :open="detailsOpen && !!drawerSale"
        @update:open="detailsOpen = $event"
        overlayClass="bg-black/60 backdrop-blur-sm"
        maxWidthClass="max-w-[480px]"
        panelClass="sale-drawer overflow-y-auto bg-[#262626] px-5 py-5 text-white shadow-[-24px_0_60px_rgba(0,0,0,0.38)] sm:px-[26px] sm:py-[26px]"
        roundedClass="rounded-none"
      >
        <div v-if="saleDetailsLoading" class="drawer-state">
          <Icon name="heroicons:arrow-path" class="h-5 w-5 animate-spin" />
          Загружаем продажу...
        </div>
        <div v-else-if="saleDetailsError" class="drawer-state drawer-state--error">
          {{ saleDetailsError }}
        </div>
        <template v-else-if="drawerSale">
            <header class="drawer-header">
              <div>
                <h2>Продажа #{{ saleNumberValue(drawerSale) }}</h2>
                <strong>{{ drawerSale.amountLabel }}</strong>
              </div>
              <button type="button" class="drawer-close" @click="detailsOpen = false">
                <Icon name="heroicons:x-mark-20-solid" class="h-5 w-5" />
              </button>
            </header>

            <section class="drawer-section">
              <h3>Оплата</h3>
              <template v-if="drawerSale.extraPayments && drawerSale.extraPayments.length > 1">
                <div v-for="ep in drawerSale.extraPayments" :key="ep.payment_method" class="drawer-row">
                  <span>{{ ep.payment_name }}</span>
                  <strong>{{ formatUzs(ep.amount) }}</strong>
                </div>
              </template>
              <div v-else class="drawer-row">
                <span>{{ drawerSale.paymentLabel }}</span>
                <strong>{{ drawerSale.amountLabel }}</strong>
              </div>
            </section>

            <section class="drawer-section">
              <h3>Корзина</h3>
              <div class="cashier-line">
                <span>Кассир:</span>
                <strong>{{ drawerSale.cashierLabel }}</strong>
              </div>

              <div v-if="drawerSale.items.length" class="drawer-cart">
                <article v-for="item in drawerSale.items" :key="item.key" class="drawer-item">
                  <p class="drawer-item-title">{{ itemQuantityLabel(item) }} x {{ item.name || "Товар" }}</p>
                  <p class="drawer-item-code">{{ item.codeLabel || "—" }}</p>
                  <p v-if="item.discountLabel" class="drawer-item-discount">{{ item.discountLabel }}</p>
                  <div class="drawer-price-row">
                    <strong>{{ item.amountLabel || drawerSale.amountLabel }}</strong>
                    <span v-if="item.originalAmountLabel">{{ item.originalAmountLabel }}</span>
                  </div>
                  <p class="drawer-item-seller">{{ item.sellerLabel || drawerSale.sellerLabel }}</p>
                </article>
              </div>
            </section>

            <section class="drawer-section">
              <h3>Детали</h3>
              <div class="detail-list">
                <div>
                  <span>Дата и время:</span>
                  <strong>{{ drawerSale.dateTimeLabel }}</strong>
                </div>
                <div>
                  <span>Магазин:</span>
                  <strong>{{ drawerSale.pointLabel }}</strong>
                </div>
              </div>
            </section>

            <section class="drawer-section">
              <h3>Кэшбек</h3>
              <div class="drawer-row">
                <span></span>
                <strong>{{ drawerSale.cashbackLabel || formatUzs(0) }}</strong>
              </div>
            </section>

            <footer class="drawer-actions">
              <button type="button" class="drawer-action" @click="printSale(drawerSale)">
                <Icon name="heroicons:printer" class="h-5 w-5" />
                Печать чека
              </button>
              <button type="button" class="drawer-action drawer-action--secondary" @click="openChangePayment(drawerSale)">
                <Icon name="heroicons:credit-card" class="h-5 w-5" />
                Изменить оплату
              </button>
              <button type="button" class="drawer-action drawer-action--secondary" @click="editSale(drawerSale)">
                <Icon name="heroicons:pencil-square" class="h-5 w-5" />
                Изменить
              </button>
              <button type="button" class="drawer-action drawer-action--danger" @click="requestDeleteSale(drawerSale)">
                <Icon name="heroicons:trash" class="h-5 w-5" />
                Удалить
              </button>
            </footer>
        </template>
      </AppSlideover>

      <Teleport to="body">
        <Transition name="cpay">
          <div v-if="receiptModalOpen" class="fixed inset-0 z-[110] flex items-center justify-center px-4">
            <div class="no-print absolute inset-0 bg-black/70 backdrop-blur-sm" @click="receiptModalOpen = false" />
            <div class="relative w-full max-w-[420px] rounded-[24px] border border-white/10 bg-[#1a1a1a] p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                class="no-print absolute right-4 top-4 rounded-full bg-white/10 p-1.5 hover:bg-white/20"
                @click="receiptModalOpen = false"
              >
                <Icon name="heroicons:x-mark-20-solid" class="h-5 w-5" />
              </button>
              <div v-if="receiptLoading" class="drawer-state">
                <Icon name="heroicons:arrow-path" class="h-5 w-5 animate-spin" />
                Загружаем чек...
              </div>
              <div v-else-if="receiptError" class="drawer-state drawer-state--error">
                {{ receiptError }}
              </div>
              <div v-else-if="receiptData && receiptSettings" class="rounded-[16px] bg-white p-2">
                <ReceiptView :receipt="receiptData" :settings="receiptSettings" mode="screen" @send="sendReceipt" />
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <Teleport to="body">
        <Transition name="cpay">
          <div v-if="changePaymentOpen" class="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="changePaymentOpen = false" />
            <div class="relative w-full max-w-[480px] rounded-[28px] border border-white/10 bg-[#262626] p-7 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 class="text-[20px] font-bold">Изменить продажу</h3>
              <p class="mt-1 text-[13px] text-[#9a9a9a]">
                Продажа #{{ changePaymentSale ? saleNumberValue(changePaymentSale) : '' }}
                <span v-if="changePaymentSale"> · {{ changePaymentSale.amountLabel }}</span>
              </p>

              <!-- Продавец -->
              <div class="mt-6">
                <p class="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#9a9a9a]">Продавец</p>
                <div v-if="sellersLoading" class="text-[13px] text-[#9a9a9a]">Загрузка...</div>
                <select
                  v-else
                  v-model="selectedNewSellerId"
                  class="w-full appearance-none rounded-[14px] border border-white/10 bg-[#404040] px-4 py-3 text-[14px] font-semibold text-white outline-none focus:border-[#1f78ff] focus:ring-2 focus:ring-[#1f78ff]/30"
                  @change="changePaymentError = ''"
                >
                  <option value="">Не менять</option>
                  <option v-for="seller in sellersList" :key="seller.id" :value="seller.id">{{ seller.name }}</option>
                </select>
              </div>

              <!-- Оплата -->
              <div class="mt-6">
                <p class="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#9a9a9a]">Способ оплаты</p>
                <p class="mb-3 text-[12px] text-[#9a9a9a]">Введите сумму для каждого способа оплаты (оставьте 0 чтобы не использовать)</p>
                <div v-if="paymentTypesLoading" class="text-[13px] text-[#9a9a9a]">Загрузка...</div>
                <div v-else class="flex flex-col gap-2">
                  <div
                    v-for="pt in paymentTypesList"
                    :key="pt.id"
                    class="flex items-center gap-3 rounded-[14px] bg-[#404040] px-4 py-3"
                    :class="{ 'border border-[#1f78ff]/40 bg-[#1f2840]': Number(paymentAmounts[pt.id] || 0) > 0 }"
                  >
                    <Icon :name="pt.isCash ? 'heroicons:banknotes' : 'heroicons:credit-card'" class="h-4 w-4 shrink-0 text-[#9a9a9a]" />
                    <span class="flex-1 text-[14px] font-semibold">{{ pt.name }}</span>
                    <input
                      v-model="paymentAmounts[pt.id]"
                      type="number"
                      min="0"
                      placeholder="0"
                      class="w-[130px] rounded-[10px] bg-[#303030] px-3 py-2 text-right text-[14px] font-bold text-white outline-none placeholder-[#666] focus:ring-2 focus:ring-[#1f78ff]"
                    />
                  </div>

                  <!-- Итог -->
                  <div v-if="totalEnteredAmount > 0" class="mt-1 space-y-1">
                    <div class="flex items-center justify-between rounded-[12px] bg-[#303030] px-4 py-2 text-[13px]">
                      <span class="text-[#9a9a9a]">Введено:</span>
                      <strong>{{ formatUzs(totalEnteredAmount) }}</strong>
                    </div>
                    <div
                      class="flex items-center justify-between rounded-[12px] px-4 py-2 text-[13px] font-bold"
                      :class="remainingAmount === 0 ? 'text-[#4ade80]' : remainingAmount < 0 ? 'text-[#ff7a7a]' : 'text-[#fbbf24]'"
                    >
                      <span>{{ remainingAmount > 0 ? 'Остаток:' : remainingAmount < 0 ? 'Превышение:' : 'Распределено:' }}</span>
                      <span>{{ remainingAmount === 0 ? '✓ Сумма совпадает' : formatUzs(Math.abs(remainingAmount)) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="changePaymentError" class="mt-4 rounded-[12px] bg-[#ff4444]/15 px-4 py-3 text-[13px] font-semibold text-[#ff7a7a]">
                {{ changePaymentError }}
              </div>

              <div class="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  class="rounded-[14px] bg-[#404040] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[#505050]"
                  @click="changePaymentOpen = false"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  :disabled="!canSaveChanges || changingPayment"
                  class="rounded-[14px] bg-[#1f78ff] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[#4993dd] disabled:cursor-not-allowed disabled:opacity-50"
                  @click="confirmChangePayment"
                >
                  {{ changingPayment ? 'Сохраняем...' : 'Сохранить' }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useApi } from "~/composables/useApi";
import { useFormatPrice } from "~/composables/useFormatPrice";
import { useUserStore } from "~/store/useUserStore";
import { useReceipts, defaultReceiptSettings, type ReceiptData, type ReceiptSettingsData } from "~/composables/useReceipts";
import { useReceiptShare } from "~/composables/useReceiptShare";
import ReceiptView from "~/components/receipt/ReceiptView.vue";

useHead({ title: "Все продажи | Konkurent" });

interface SaleItemView {
  key: string;
  quantity: number;
  quantityLabel?: string;
  type: string;
  name?: string;
  codeLabel?: string;
  discountLabel?: string;
  amountLabel?: string;
  originalAmountLabel?: string;
  sellerLabel?: string;
}

interface SaleView {
  id: string;
  numberLabel: string;
  numberValue?: string;
  typeLabel?: string;
  dateValue: string;
  dateTimeLabel: string;
  sellerLabel: string;
  pointLabel: string;
  shopId?: string;
  amountLabel: string;
  amountValue: number;
  paymentKey: string;
  paymentLabel: string;
  clientLabel: string;
  cashierLabel: string;
  statusKey: string;
  itemsCountLabel: string;
  cashbackLabel?: string;
  extraPayments?: Array<{ payment_method: string; amount: number; payment_name: string }> | null;
  items: SaleItemView[];
}

const { apiFetch } = useApi();
const { formatPrice } = useFormatPrice();
const userStore = useUserStore();
const route = useRoute();
const router = useRouter();

const search = ref("");
const todayDate = new Date().toISOString().slice(0, 10);
const selectedDate = ref(String(route.query.start_date ?? route.query.date ?? "") || todayDate);
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
const detailsOpen = ref(false);
const saleDetails = ref<SaleView | null>(null);
const saleDetailsLoading = ref(false);
const receiptModalOpen = ref(false);
const receiptLoading = ref(false);
const receiptError = ref("");
const receiptData = ref<ReceiptData | null>(null);
const receiptSettings = ref<ReceiptSettingsData | null>(null);
const saleDetailsError = ref("");

const changePaymentOpen = ref(false);
const changePaymentSale = ref<SaleView | null>(null);
const changingPayment = ref(false);
const changePaymentError = ref("");
const paymentTypesLoading = ref(false);
const paymentTypesList = ref<Array<{ id: string; name: string; isCash: boolean }>>([]);
const sellersList = ref<Array<{ id: string; name: string }>>([]);
const sellersLoading = ref(false);
const selectedNewSellerId = ref("");
const paymentAmounts = ref<Record<string, string>>({});
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let isMounted = true;
onUnmounted(() => {
  isMounted = false;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
});

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

const selectedListSale = computed(() => filteredSales.value.find((sale) => sale.id === selectedSaleId.value) ?? null);
const drawerSale = computed(() => saleDetails.value ?? selectedListSale.value);
const activeSaleId = computed(() => selectedSaleId.value ?? filteredSales.value[0]?.id ?? null);
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
  if (Object.keys(paymentsFromApi.value).length) {
    return Object.entries(paymentsFromApi.value)
      .map(([key, amount]) => {
        const normalizedKey = normalizePaymentKey(key);
        return { key: normalizedKey, label: paymentLabelForKey(normalizedKey), amount: toNumber(amount), amountLabel: formatUzs(toNumber(amount)) };
      })
      .filter((entry) => entry.amount > 0)
      .sort((a, b) => paymentSortIndex(a.key) - paymentSortIndex(b.key));
  }

  // Build sums and a name lookup for UUID keys that come from extra_payments
  const sums: Record<string, number> = {};
  const nameLookup: Record<string, string> = {};

  for (const sale of filteredSales.value) {
    if (sale.extraPayments && sale.extraPayments.length > 1) {
      for (const ep of sale.extraPayments) {
        sums[ep.payment_method] = (sums[ep.payment_method] ?? 0) + ep.amount;
        nameLookup[ep.payment_method] = ep.payment_name;
      }
    } else {
      sums[sale.paymentKey] = (sums[sale.paymentKey] ?? 0) + sale.amountValue;
    }
  }

  return Object.entries(sums)
    .map(([key, amount]) => {
      const normalizedKey = normalizePaymentKey(key);
      const label = paymentLabelForKey(normalizedKey) || nameLookup[key] || formatPaymentLabel(normalizedKey);
      return { key: normalizedKey, label, amount: toNumber(amount), amountLabel: formatUzs(toNumber(amount)) };
    })
    .filter((entry) => entry.amount > 0)
    .sort((a, b) => paymentSortIndex(a.key) - paymentSortIndex(b.key));
});

const totalEnteredAmount = computed(() =>
  Object.values(paymentAmounts.value).reduce((sum, v) => sum + (Number(v) || 0), 0),
);

const remainingAmount = computed(() => {
  if (!changePaymentSale.value) return 0;
  return changePaymentSale.value.amountValue - totalEnteredAmount.value;
});

const canSaveChanges = computed(() => {
  const hasSeller = !!selectedNewSellerId.value;
  const hasPayment = paymentTypesList.value.some(pt => Number(paymentAmounts.value[pt.id] || 0) > 0);
  return hasSeller || hasPayment;
});

watch(filteredSales, (value) => {
  if (!value.length) {
    selectedSaleId.value = null;
    detailsOpen.value = false;
    saleDetails.value = null;
    saleDetailsError.value = "";
    return;
  }

  if (value.some((sale) => sale.id === selectedSaleId.value)) {
    return;
  }

  if (detailsOpen.value) {
    detailsOpen.value = false;
  }

  saleDetails.value = null;
  saleDetailsError.value = "";
  selectedSaleId.value = value[0]?.id ?? null;
});

watch([page, limit, selectedDate], () => {
  void syncRouteQuery();
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetchSales, 160);
});

onMounted(() => {
  void fetchSales();

  const receiptNumber = route.query.receipt;
  if (receiptNumber) {
    void printSaleByNumber(String(receiptNumber));
    const { receipt, ...rest } = route.query;
    void router.replace({ query: rest });
  }
});

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
  const nextQuery: Record<string, string> = {};
  for (const [key, value] of Object.entries(route.query)) {
    nextQuery[key] = Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
  }
  nextQuery.page = String(page.value);
  nextQuery.limit = String(limit.value);

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
  const detail = raw?.order_detail ?? raw?.orderDetail ?? raw?.detail ?? raw;
  const id = String(raw?.id ?? raw?.sale_id ?? raw?.number ?? Math.random());
  const numberValue = String(raw?.number ?? raw?.sale_number ?? raw?.receipt_number ?? raw?.id ?? "—");
  const createdAt = raw?.created_at ?? raw?.createdAt ?? raw?.date ?? new Date().toISOString();
  const amountValue = toNumber(raw?.payable_total ?? raw?.total ?? raw?.amount ?? raw?.grand_total);
  const cashbackValue = toNumber(raw?.cashback ?? raw?.cashback_amount ?? raw?.bonus ?? raw?.bonus_amount);
  const sellerName = String(raw?.seller_name ?? raw?.seller?.name ?? raw?.cashier?.name ?? raw?.cashier_name ?? raw?.user?.name ?? "Iskandar Yusupov");
  const items = Array.isArray(raw?.items) ? raw.items.map((item: any, index: number) => ({
    key: String(item?.id ?? `${index}`),
    quantity: Math.max(toNumber(item?.quantity ?? item?.qty ?? 0), 0),
    quantityLabel: formatQuantity(Math.max(toNumber(item?.quantity ?? item?.qty ?? 0), 0)),
    type: normalizeItemType(item?.type ?? item?.product_type ?? item?.kind),
    name: String(item?.name ?? item?.product_name ?? item?.product?.name ?? item?.title ?? "Товар"),
    codeLabel: String(item?.sku ?? item?.article ?? item?.barcode ?? item?.product?.sku ?? item?.product?.barcode ?? "—"),
    discountLabel: formatDiscountLabel(item),
    amountLabel: formatUzs(toNumber(item?.total ?? item?.amount ?? item?.line_total ?? item?.final_price ?? item?.price)),
    originalAmountLabel: formatOriginalAmountLabel(item),
    sellerLabel: String(item?.seller?.name ?? item?.seller_name ?? item?.user?.name ?? sellerName),
  })) : [];
  const itemsCount = items.reduce((sum: number, item: SaleItemView) => sum + item.quantity, 0);
  const paymentInfo = resolvePaymentInfo(raw);

  return {
    id,
    numberLabel: `Продажа #${numberValue}`,
    numberValue,
    typeLabel: String(raw?.type_label ?? raw?.operation_label ?? raw?.operation_type_label ?? "Продажа"),
    dateValue: toIsoDate(createdAt),
    dateTimeLabel: `${new Date(createdAt).toLocaleDateString("ru-RU")} | ${new Date(createdAt).toLocaleTimeString("ru-RU")}`,
    sellerLabel: sellerName,
    pointLabel: raw?.shop?.name ?? raw?.branch_title ?? raw?.branch_name ?? raw?.location?.name ?? raw?.point?.name ?? "Не указана",
    shopId: raw?.shop?.id ?? raw?.shop_id ?? raw?.branch_code ?? undefined,
    amountLabel: formatUzs(amountValue),
    amountValue,
    paymentKey: paymentInfo.key,
    paymentLabel: paymentInfo.label,
    clientLabel: raw?.client?.name ?? raw?.customer?.name ?? raw?.buyer?.name ?? raw?.client_name ?? "Без клиента",
    cashierLabel: raw?.cashier?.name ?? raw?.cashier_name ?? raw?.user?.name ?? sellerName,
    statusKey: String(raw?.status ?? "paid").toLowerCase(),
    itemsCountLabel: `${itemsCount} ед.`,
    cashbackLabel: formatUzs(cashbackValue),
    extraPayments: Array.isArray(raw?.extra_payments) && raw.extra_payments.length > 1 ? raw.extra_payments : null,
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
  if (Array.isArray(raw?.extra_payments) && raw.extra_payments.length > 1) {
    return {
      key: "mixed",
      label: "Смешанная оплата",
    };
  }

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
  selectedDate.value = todayDate;
  saleScope.value = "all";
  statusFilter.value = "all";
  paymentFilter.value = "all";
  shopFilter.value = "all";
  sellerFilter.value = "all";
  cashierFilter.value = "all";
  amountFrom.value = "";
  amountTo.value = "";
}

async function openSaleDetails(sale: SaleView) {
  const saleId = sale.id;

  selectedSaleId.value = saleId;
  detailsOpen.value = true;
  saleDetails.value = null;
  saleDetailsError.value = "";
  saleDetailsLoading.value = true;

  try {
    const details = await fetchSaleDetails(saleId);
    if (selectedSaleId.value !== saleId) return;
    saleDetails.value = details;
  } catch {
    if (selectedSaleId.value !== saleId) return;
    saleDetailsError.value = "Не удалось загрузить детали продажи.";
  } finally {
    if (selectedSaleId.value !== saleId) return;
    saleDetailsLoading.value = false;
  }
}

function saleNumberValue(sale: SaleView) {
  if (sale.numberValue) return sale.numberValue;
  return sale.numberLabel.replace(/^.*#/, "").trim() || sale.id;
}

function itemQuantityLabel(item: SaleItemView) {
  return item.quantityLabel || formatQuantity(item.quantity);
}

function formatQuantity(value: number) {
  return Number.isInteger(value) ? String(value) : String(value).replace(".", ",");
}

function formatDiscountLabel(item: any) {
  const name = String(item?.discount_name ?? item?.discount?.name ?? item?.discount_type ?? "").trim();
  const percent = toNumber(item?.discount_percent ?? item?.discount?.percent ?? item?.discount_percentage);
  const amount = toNumber(item?.discount_amount ?? item?.discount?.amount);

  if (name && percent) return `${name} (${formatQuantity(percent)}%)`;
  if (name) return name;
  if (percent) return `Ручная (${formatQuantity(percent)}%)`;
  if (amount) return `Ручная (${formatUzs(amount)})`;
  return "";
}

function formatOriginalAmountLabel(item: any) {
  const original = toNumber(item?.original_total ?? item?.original_amount ?? item?.price_before_discount ?? item?.base_total ?? item?.old_price);
  const current = toNumber(item?.total ?? item?.amount ?? item?.line_total ?? item?.final_price ?? item?.price);
  return original && original !== current ? formatUzs(original) : "";
}

async function fetchPaymentTypes() {
  paymentTypesLoading.value = true;
  try {
    const companyId = userStore.currentTenantId;
    const res: any = await apiFetch("/company-payment-type", {
      method: "GET",
      query: companyId ? { company_id: companyId } : undefined,
    });
    const list: any[] = res?.company_payment_types ?? (Array.isArray(res) ? res : []);
    paymentTypesList.value = list
      .filter((pt: any) => !pt?.dont_show_in_make_payment)
      .map((pt: any) => ({ id: String(pt.id), name: String(pt.name), isCash: !!pt.is_cash_payment_type }));
  } catch {
    paymentTypesList.value = [];
  } finally {
    paymentTypesLoading.value = false;
  }
}

async function fetchSellers() {
  if (sellersList.value.length > 0) return;
  sellersLoading.value = true;
  try {
    const res: any = await apiFetch("/users", { method: "GET" });
    const list: any[] = Array.isArray(res) ? res : res?.users ?? res?.data ?? [];
    sellersList.value = list.map((u: any) => {
      const firstName = String(u.first_name ?? u.firstName ?? "").trim();
      const lastName = String(u.last_name ?? u.lastName ?? "").trim();
      const fullName = [firstName, lastName].filter(Boolean).join(" ");
      return {
        id: String(u.id),
        name: fullName || String(u.name ?? u.full_name ?? u.username ?? `User ${u.id}`),
      };
    });
  } catch {
    sellersList.value = [];
  } finally {
    sellersLoading.value = false;
  }
}

function openChangePayment(sale: SaleView) {
  changePaymentSale.value = sale;
  selectedNewSellerId.value = "";
  changePaymentError.value = "";
  // Pre-fill amounts from existing mixed payments
  if (sale.extraPayments && sale.extraPayments.length > 1) {
    const prefill: Record<string, string> = {};
    for (const ep of sale.extraPayments) {
      prefill[ep.payment_method] = String(ep.amount);
    }
    paymentAmounts.value = prefill;
  } else {
    paymentAmounts.value = {};
  }
  changePaymentOpen.value = true;
  if (!paymentTypesList.value.length) fetchPaymentTypes();
  fetchSellers();
}

async function confirmChangePayment() {
  if (!changePaymentSale.value || changingPayment.value) return;

  const activePayments = paymentTypesList.value
    .filter(pt => Number(paymentAmounts.value[pt.id] || 0) > 0)
    .map(pt => ({
      company_payment_type_id: pt.id,
      amount: Number(paymentAmounts.value[pt.id]),
    }));

  changingPayment.value = true;
  try {
    const body: Record<string, unknown> = {};
    if (selectedNewSellerId.value) body.user_id = Number(selectedNewSellerId.value);
    if (activePayments.length > 0) body.payments = activePayments;

    await apiFetch(`/order/${changePaymentSale.value.id}/payment-method`, {
      method: "PATCH",
      body,
    });
    changePaymentOpen.value = false;
    const refreshedDetails = await fetchSaleDetails(changePaymentSale.value.id);
    if (saleDetails.value?.id === changePaymentSale.value.id) {
      saleDetails.value = refreshedDetails;
    }
    await fetchSales();
  } catch (e: any) {
    changePaymentError.value = e?.data?.message ?? e?.message ?? "Не удалось сохранить изменения";
  } finally {
    changingPayment.value = false;
  }
}

const { shareReceipt } = useReceiptShare();

async function sendReceipt() {
  if (receiptData.value) await shareReceipt(receiptData.value);
}

async function printSale(sale: SaleView) {
  if (!import.meta.client) return;
  receiptModalOpen.value = true;
  receiptLoading.value = true;
  receiptError.value = "";
  receiptData.value = null;
  receiptSettings.value = null;
  try {
    const { fetchReceipt, fetchReceiptSettings } = useReceipts();
    const [receipt, settings] = await Promise.all([
      fetchReceipt(sale.id),
      fetchReceiptSettings().catch(() => null),
    ]);
    receiptData.value = receipt;
    receiptSettings.value = settings ?? defaultReceiptSettings();
  } catch (e: any) {
    receiptError.value = e?.data?.message || e?.message || "Не удалось загрузить чек.";
  } finally {
    receiptLoading.value = false;
  }
}

async function printSaleByNumber(number: string) {
  if (!import.meta.client) return;
  receiptModalOpen.value = true;
  receiptLoading.value = true;
  receiptError.value = "";
  receiptData.value = null;
  receiptSettings.value = null;
  try {
    const { fetchReceiptByNumber, fetchReceiptSettings } = useReceipts();
    const [receipt, settings] = await Promise.all([
      fetchReceiptByNumber(number),
      fetchReceiptSettings().catch(() => null),
    ]);
    receiptData.value = receipt;
    receiptSettings.value = settings ?? defaultReceiptSettings();
  } catch (e: any) {
    receiptError.value = e?.data?.message || e?.message || "Не удалось загрузить чек.";
  } finally {
    receiptLoading.value = false;
  }
}

function editSale(sale: SaleView) {
  detailsOpen.value = false;
  void router.push({ path: `/order/new-order/${encodeURIComponent(sale.id)}`, query: { order_number: saleNumberValue(sale), page: String(page.value) } });
}

async function requestDeleteSale(sale: SaleView) {
  if (!confirm("Вы уверены, что хотите удалить эту продажу?")) return;

  try {
    await apiFetch(`/order/${encodeURIComponent(sale.id)}`, { method: "DELETE" });
    detailsOpen.value = false;
    saleDetails.value = null;
    selectedSaleId.value = null;
    await fetchSales();
  } catch (e: any) {
    alert(e?.data?.message ?? e?.message ?? "Не удалось удалить продажу");
  }
}

function selectScope(value: (typeof saleScopeOptions)[number]["value"]) {
  saleScope.value = value;
  scopeOpen.value = false;
}

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values.filter((value) => value && !value.includes("Не указан")))).sort((a, b) => a.localeCompare(b, "ru"));
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
  if (!isMounted) return;
  loading.value = true;
  try {
    const response: any = await apiFetch("/sales", { method: "GET", query: { start_date: selectedDate.value || undefined, page: page.value, limit: limit.value } });
    if (!isMounted) return;
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

async function fetchSaleDetails(id: string) {
  const endpoints = [`/order/${encodeURIComponent(id)}`, `/v2/order/${encodeURIComponent(id)}`];
  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const response: any = await apiFetch(endpoint, { method: "GET" });
      const payload = response?.data ?? response?.item ?? response?.order ?? response;
      return normalizeSaleDetails(payload);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function normalizeSaleDetails(raw: any): SaleView {
  const detail = raw?.order_detail ?? raw?.orderDetail ?? raw?.detail ?? raw;
  const createdAt = raw?.sold_at ?? raw?.finished_at ?? detail?.created_at ?? raw?.created_at ?? new Date().toISOString();
  const itemsSource = Array.isArray(detail?.order_items) ? detail.order_items : [];
  const sellerName = String(detail?.user?.name ?? raw?.user?.name ?? raw?.seller?.name ?? raw?.cashier?.name ?? "Не указан");
  const items = itemsSource.map((item: any, index: number) => ({
    key: String(item?.id ?? `${index}`),
    quantity: Math.max(toNumber(item?.measurement_value ?? item?.quantity ?? item?.qty ?? 0), 0),
    quantityLabel: formatQuantity(Math.max(toNumber(item?.measurement_value ?? item?.quantity ?? item?.qty ?? 0), 0)),
    type: normalizeItemType(item?.product_type_id ?? item?.type ?? item?.product_type ?? item?.kind),
    name: String(item?.name ?? item?.product?.name ?? "Товар"),
    codeLabel: String(item?.sku ?? item?.barcode ?? item?.product?.sku ?? item?.product?.barcode ?? "—"),
    discountLabel: formatDiscountLabel(item),
    amountLabel: formatUzs(toNumber(item?.total_price ?? item?.total ?? item?.amount ?? item?.line_total ?? item?.final_price ?? item?.price)),
    originalAmountLabel: formatOriginalAmountLabel(item),
    sellerLabel: String(item?.sellers?.[0]?.seller?.name ?? item?.seller?.name ?? item?.seller_name ?? sellerName),
  }));
  const itemsCount = items.reduce((sum: number, item: SaleItemView) => sum + item.quantity, 0);
  const paymentInfo = resolveSaleDetailsPaymentInfo(raw);
  const amountValue = toNumber(detail?.total_price ?? raw?.payable_total ?? raw?.total ?? raw?.amount ?? raw?.grand_total);
  const cashbackValue = toNumber(detail?.with_cashback ?? raw?.cashback ?? raw?.cashback_amount ?? raw?.bonus ?? raw?.bonus_amount);

  return {
    id: String(raw?.id ?? raw?.sale_id ?? raw?.number ?? Math.random()),
    numberLabel: `Продажа #${String(raw?.order_number ?? raw?.number ?? raw?.sale_number ?? raw?.receipt_number ?? raw?.id ?? "—")}`,
    numberValue: String(raw?.order_number ?? raw?.number ?? raw?.sale_number ?? raw?.receipt_number ?? raw?.id ?? "—"),
    typeLabel: String(raw?.order_type ?? raw?.type_label ?? raw?.operation_label ?? raw?.operation_type_label ?? "Продажа"),
    dateValue: toIsoDate(createdAt),
    dateTimeLabel: `${new Date(createdAt).toLocaleDateString("ru-RU")} | ${new Date(createdAt).toLocaleTimeString("ru-RU")}`,
    sellerLabel: sellerName,
    pointLabel: String(detail?.shop?.name ?? raw?.shop?.name ?? raw?.branch_title ?? raw?.branch_name ?? raw?.location?.name ?? raw?.point?.name ?? "Не указана"),
    shopId: detail?.shop?.id ?? raw?.shop?.id ?? raw?.shop_id ?? raw?.branch_code ?? undefined,
    amountLabel: formatUzs(amountValue),
    amountValue,
    paymentKey: paymentInfo.key,
    paymentLabel: paymentInfo.label,
    clientLabel: String(detail?.customer?.name ?? raw?.client?.name ?? raw?.customer?.name ?? raw?.buyer?.name ?? raw?.client_name ?? "Без клиента"),
    cashierLabel: String(detail?.user?.name ?? raw?.cashier?.name ?? raw?.cashier_name ?? raw?.user?.name ?? sellerName),
    statusKey: String(raw?.order_status ?? raw?.status ?? "paid").toLowerCase(),
    itemsCountLabel: `${itemsCount} ед.`,
    cashbackLabel: formatUzs(cashbackValue),
    extraPayments: Array.isArray(raw?.extra_payments) && raw.extra_payments.length > 1 ? raw.extra_payments : null,
    items,
  };
}

function resolveSaleDetailsPaymentInfo(raw: any) {
  // Mixed payments take priority
  if (Array.isArray(raw?.extra_payments) && raw.extra_payments.length > 1) {
    return { key: "mixed", label: "Смешанная оплата" };
  }

  const detail = raw?.order_detail ?? raw?.orderDetail ?? raw?.detail ?? raw;

  // Also check order_payments from detail (now built from extraPayments on backend)
  const orderPayments = Array.isArray(detail?.order_payments) ? detail.order_payments : [];
  if (orderPayments.length > 1) {
    return { key: "mixed", label: "Смешанная оплата" };
  }

  const firstOrderPayment = orderPayments.find((payment: any) => toNumber(payment?.paid_amount) > 0) ?? orderPayments[0];

  if (firstOrderPayment) {
    const companyPaymentType = firstOrderPayment?.company_payment_type;
    const paymentName = String(companyPaymentType?.name ?? firstOrderPayment?.payment_sub_type_name ?? "").trim();
    const paymentId = String(companyPaymentType?.payment_type_id ?? firstOrderPayment?.company_payment_type_id ?? firstOrderPayment?.payment_sub_type_id ?? "").trim();

    return {
      key: normalizePaymentKey(paymentId || paymentName),
      label: paymentName || formatPaymentLabel(paymentId),
    };
  }

  return resolvePaymentInfo(raw);
}
</script>

<style scoped>
.sales-page { min-height: calc(100vh - 88px); padding: 8px 0 32px; color: white; }
.sales-layout { display: block; min-width: 0; }
.sales-main { min-width: 0; }
.panel { border: 0; background: #262626; box-shadow: none; border-radius: 0; }
.sales-header { display: grid; gap: 16px; margin-bottom: 18px; border: 1px solid rgba(255,255,255,.06); border-radius: 24px; background: linear-gradient(180deg,rgba(48,48,48,.94),rgba(38,38,38,.98)); padding: 20px; box-shadow: 0 24px 60px rgba(0,0,0,.18); }
.header-top, .sales-footer, .pagination, .footer-actions, .stats-head, .stats-row, .payment-label, .sale-left, .sale-right { display: flex; align-items: center; }
.header-top, .sales-footer, .stats-head, .stats-row { justify-content: space-between; gap: 16px; }
.scope-select { position: relative; width: fit-content; min-width: 240px; }
.scope-trigger { display: inline-flex; min-height: 54px; width: 100%; align-items: center; justify-content: space-between; gap: 12px; border: 0; border-radius: 16px; background: transparent; padding: 0 6px 0 0; color: #fff; font-size: clamp(28px,2.6vw,38px); font-weight: 800; line-height: 1; outline: none; }
.scope-trigger:hover { color: #78b3ff; }
.scope-menu { position: absolute; left: 0; top: calc(100% + 8px); z-index: 30; display: grid; min-width: 240px; gap: 6px; border-radius: 18px; background: #303030; padding: 8px; box-shadow: 0 18px 42px rgba(0,0,0,.32); }
.scope-option { display: flex; min-height: 44px; width: 100%; align-items: center; justify-content: space-between; gap: 12px; border-radius: 14px; padding: 0 12px; color: #d7d7d7; font-size: 15px; font-weight: 800; text-align: left; }
.scope-option:hover, .scope-option--active { background: #404040; color: #fff; }
.header-meta { display: flex; min-width: 0; align-items: center; gap: 12px; }
.count-inline { min-height: 46px; display: inline-flex; align-items: center; white-space: nowrap; border-radius: 15px; background: #303030; padding: 0 14px; color: #fff; font-size: 15px; font-weight: 800; }
.count-badge span, .group-label, .sale-meta, .sale-user, .sale-shop, .stats-row span, .stats-head span, .stats-empty, .empty-text, .limit-box span, .total-panel span { color: #bdbdbd; }
.header-controls { display: grid; grid-template-columns: minmax(320px,1fr) 132px; gap: 12px; align-items: stretch; }
.search-wrap { position: relative; border: 1px solid rgba(255,255,255,.07); border-radius: 16px; background: #353535; }
.search-icon { position: absolute; top: 50%; left: 16px; transform: translateY(-50%); color: #bdbdbd; }
.toolbar-btn, .report-btn, .icon-btn { border: 1px solid rgba(255,255,255,.08); background: #404040; color: #fff; }
.toolbar-btn, .report-btn { width: 100%; min-height: 52px; border-radius: 15px; justify-content: center; gap: 8px; padding: 0 12px; font-size: 14px; font-weight: 700; white-space: nowrap; }
.toolbar-btn--today { font-size: 13px; }
.toolbar-btn--icon { padding: 0 10px; }
.toolbar-btn:hover, .icon-btn:hover { background: #505050; }
.report-btn { background: #1f78ff; color: #fff; border-color: transparent; }
.report-btn:hover { background: #4993dd; }
.filters-panel { display: grid; gap: 16px; border-top: 1px solid rgba(255,255,255,.08); padding-top: 18px; }
.filters-panel-header { display: flex; align-items: center; gap: 8px; color: #78b3ff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
.filters-grid { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); gap: 12px; }
.filter-field { display: grid; gap: 7px; min-width: 0; }
.filter-label { color: #9ca3af; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; padding-left: 2px; }
.filter-select-wrap { position: relative; }
.filter-select-wrap select { appearance: none; -webkit-appearance: none; width: 100%; min-height: 48px; border: 1px solid rgba(255,255,255,.1); border-radius: 14px; background: #353535; padding: 0 40px 0 14px; color: #fff; font-size: 14px; font-weight: 700; outline: none; cursor: pointer; transition: border-color .2s ease, background .2s ease, box-shadow .2s ease; }
.filter-select-wrap select:hover { border-color: rgba(120,179,255,.3); background: #404040; }
.filter-select-wrap select:focus { border-color: rgba(120,179,255,.5); background: #404040; box-shadow: 0 0 0 3px rgba(120,179,255,.1); }
.filter-select-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #9ca3af; width: 16px; height: 16px; flex-shrink: 0; }
.range-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.range-inputs input, .filter-field > input { width: 100%; min-height: 48px; border: 1px solid rgba(255,255,255,.1); border-radius: 14px; background: #353535; padding: 0 14px; color: #fff; font-size: 14px; font-weight: 700; outline: none; transition: border-color .2s ease, background .2s ease, box-shadow .2s ease; }
.range-inputs input:hover, .filter-field > input:hover { border-color: rgba(120,179,255,.3); background: #404040; }
.range-inputs input:focus, .filter-field > input:focus { border-color: rgba(120,179,255,.5); background: #404040; box-shadow: 0 0 0 3px rgba(120,179,255,.1); }
.range-inputs input::placeholder, .filter-field > input::placeholder { color: #6b7280; }
.filter-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.sales-list { margin-top: 0; padding: 20px; border: 1px solid rgba(255,255,255,.06); border-radius: 24px; background: linear-gradient(180deg,rgba(38,38,38,.98),rgba(32,32,32,.98)); box-shadow: 0 24px 60px rgba(0,0,0,.16); }
.group + .group { margin-top: 18px; }
.group-label { margin-bottom: 12px; padding: 0 2px; font-size: 14px; font-weight: 800; }
.sale-card { display: flex; align-items: stretch; justify-content: space-between; gap: 18px; padding: 18px; border: 1px solid rgba(255,255,255,.06); border-radius: 16px; background: #303030; box-shadow: inset 4px 0 0 rgba(120,179,255,.32); transition: transform .2s ease, background .2s ease, border-color .2s ease; cursor: pointer; }
.sale-card + .sale-card { margin-top: 12px; }
.sale-card:hover { transform: translateY(-1px); border-color: rgba(120,179,255,.28); background: #363636; }
.sale-card--active { border-color: rgba(120,179,255,.42); background: rgba(31,120,255,.16); }
.sale-left { gap: 14px; min-width: 0; }
.sale-left--stacked { align-items: flex-start; flex-direction: column; justify-content: space-between; gap: 10px; }
.sale-badge { display: inline-flex; min-height: 28px; align-items: center; justify-content: flex-start; border-radius: 10px; background: rgba(120,179,255,.12); border: 1px solid rgba(120,179,255,.18); padding: 0 10px; font-size: 13px; font-weight: 800; color: #dfe9ff; }
.sale-id, .sale-amount, .stats-row strong, .total-panel strong, .empty-title { color: #f6f8fc; font-weight: 700; }
.sale-id { font-size: 13px; color: #bdbdbd; }
.sale-number { margin-top: 3px; color: #f6f8fc; font-size: 18px; font-weight: 800; line-height: 1.25; word-break: break-word; }
.sale-meta, .sale-user, .sale-shop { font-size: 13px; }
.sale-user { display: none; }
.sale-right { min-width: 180px; align-items: flex-end; flex-direction: column; justify-content: space-between; gap: 12px; }
.sale-amount { font-size: 19px; color: #78b3ff; text-align: right; font-weight: 800; }
.sale-amount--negative { color: #ff7a7a; }
.sale-shop, .payment-label { display: flex; align-items: center; gap: 8px; }
.sale-payment { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #9a9a9a; text-align: right; }
.sale-payment--mixed { color: #f59e42; font-weight: 600; }
.dot { width: 10px; height: 10px; border-radius: 999px; background: #1f78ff; flex: 0 0 auto; }
.arrow-btn { width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,.08); border-radius: 13px; background: #404040; color: #dfe9ff; transition: background .2s ease, transform .2s ease; }
.arrow-btn:hover { background: #505050; transform: translateX(2px); }
.state { min-height: 420px; display: flex; align-items: center; justify-content: center; gap: 10px; color: rgb(203 213 225); }
.state--empty { flex-direction: column; }
.empty-icon { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 18px; background: #303030; color: #78b3ff; }
.empty-title { font-size: 18px; }
.sales-footer { margin-top: 18px; padding: 16px 18px; border: 1px solid rgba(255,255,255,.06); border-radius: 22px; background: rgba(38,38,38,.96); box-shadow: 0 18px 40px rgba(0,0,0,.14); }
.pagination, .footer-actions, .payment-label { gap: 10px; }
.icon-btn { width: 42px; height: 42px; border-radius: 14px; }
.page-index { min-width: 24px; text-align: center; font-weight: 700; color: #f6f8fc; }
.limit-box { display: flex; align-items: center; gap: 10px; }
.sales-sidebar { display: none; }
.stats-panel, .total-panel { padding: 16px; }
.stats-head { margin-bottom: 12px; }
.stats-head h2 { font-size: 18px; font-weight: 600; color: #f6f8fc; }
.stats-list { display: grid; gap: 8px; }
.stats-row { font-size: 14px; }
.total-panel { border-color: rgba(31,120,255,.25); background: #1f78ff; }
.total-panel span { color: rgba(255,255,255,.78); }
.total-panel strong { display: block; margin-top: 8px; font-size: 24px; }
.sale-drawer { height: 100%; overflow-y: auto; background: #262626; padding: 26px; color: #fff; box-shadow: -24px 0 60px rgba(0,0,0,.38); }
.drawer-state { min-height: 220px; display: flex; align-items: center; justify-content: center; gap: 10px; color: #cbd5e1; font-weight: 700; }
.drawer-state--error { color: #fda4af; text-align: center; }
.drawer-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; padding-bottom: 22px; }
.drawer-header h2 { color: #f6f8fc; font-size: 22px; font-weight: 800; line-height: 1.25; }
.drawer-header strong { display: block; margin-top: 14px; color: #78b3ff; font-size: 22px; font-weight: 800; }
.drawer-close { display: inline-flex; width: 40px; height: 40px; flex: 0 0 auto; align-items: center; justify-content: center; border-radius: 14px; background: #404040; color: #fff; }
.drawer-close:hover { background: #505050; }
.drawer-section { padding: 22px 0; }
.drawer-section h3 { margin-bottom: 16px; color: #f6f8fc; font-size: 17px; font-weight: 800; }
.drawer-row, .drawer-price-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.drawer-row span, .cashier-line span, .detail-list span, .drawer-item-code, .drawer-item-discount, .drawer-item-seller, .drawer-price-row span { color: #bdbdbd; }
.drawer-row strong, .detail-list strong, .drawer-price-row strong { color: #f6f8fc; font-weight: 800; text-align: right; }
.cashier-line { display: grid; gap: 5px; margin-bottom: 16px; }
.cashier-line strong { color: #f6f8fc; font-weight: 800; }
.drawer-cart { display: grid; gap: 12px; }
.drawer-item { display: grid; gap: 9px; border-radius: 16px; background: #303030; padding: 16px; }
.drawer-item-title { color: #f6f8fc; font-size: 15px; font-weight: 800; line-height: 1.35; }
.drawer-item-code, .drawer-item-discount, .drawer-item-seller { font-size: 13px; }
.detail-list { display: grid; gap: 16px; }
.detail-list div { display: grid; gap: 6px; }
.drawer-actions { position: sticky; bottom: -26px; display: grid; grid-template-columns: 1fr; gap: 12px; margin: 0 -26px -26px; background: rgba(38,38,38,.96); padding: 18px 26px 26px; backdrop-filter: blur(8px); }
.drawer-action { display: inline-flex; min-height: 50px; align-items: center; justify-content: center; gap: 10px; border-radius: 15px; background: #1f78ff; color: #fff; font-size: 14px; font-weight: 800; transition: background .2s ease, transform .2s ease; }
.drawer-action:hover { background: #4993dd; transform: translateY(-1px); }
.drawer-action--secondary { background: #404040; color: #f6f8fc; }
.drawer-action--secondary:hover { background: #505050; }
.drawer-action--danger { background: transparent; color: #ff9a9a; }
.drawer-action--danger:hover { background: rgba(239,68,68,.16); }
@media (max-width: 1180px) { .filters-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } .filter-actions { grid-template-columns: 1fr 1fr; } }
@media (max-width: 768px) { .sales-page { padding: 0 0 24px; } .sales-header, .sales-list, .stats-panel, .total-panel, .sales-footer { padding: 16px; border-radius: 20px; } .header-top, .sales-footer, .sale-card, .sale-right { flex-direction: column; align-items: stretch; } .header-controls, .filters-grid, .filter-actions { grid-template-columns: 1fr; } .header-meta { min-width: 0; align-items: stretch; } .scope-select { width: 100%; min-width: 0; } .scope-menu { min-width: 100%; } .scope-trigger { font-size: clamp(24px,8vw,32px); } .count-inline { justify-content: center; white-space: normal; } .filter-actions { grid-column: auto; } .sale-right { min-width: 0; } .sale-amount, .sale-shop { text-align: left; justify-content: flex-start; } .footer-actions { width: 100%; } .limit-box { justify-content: space-between; } .sale-card { gap: 14px; padding: 16px; border-radius: 18px; } .header-controls { grid-template-columns: 1fr; } .sale-drawer { padding: 20px; } .drawer-actions { bottom: -20px; margin: 0 -20px -20px; padding: 14px 20px 20px; } }
@media (max-width: 520px) { .sales-header, .sales-list, .sales-footer { padding: 14px; border-radius: 18px; } .sale-card { padding: 14px; } .sale-amount { font-size: 17px; } .sale-number { font-size: 16px; } .drawer-header h2, .drawer-header strong { font-size: 20px; } .toolbar-btn, .report-btn { min-height: 48px; } }
.cpay-enter-active, .cpay-leave-active { transition: opacity 0.18s ease; }
.cpay-enter-from, .cpay-leave-to { opacity: 0; }
</style>
