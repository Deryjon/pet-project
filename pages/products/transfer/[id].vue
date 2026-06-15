<template>
  <section class="space-y-4 text-white">

    <!-- ── Header ── -->
    <div class="rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88))] p-4 lg:p-6 shadow-[0_24px_60px_rgba(2,6,23,0.28)]">
      <button class="mb-3 text-sm text-sky-300 hover:text-sky-200 transition-colors" @click="router.push('/products/transfer')">
        ← Назад
      </button>

      <div class="flex flex-col gap-4">
        <div class="min-w-0">
          <p class="text-xs uppercase tracking-[0.18em] text-sky-400 font-semibold">#{{ transfer?.external_id || "—" }}</p>
          <h1 class="mt-1.5 text-[22px] lg:text-[28px] font-bold tracking-tight text-white leading-tight">{{ transfer?.name || "Трансфер" }}</h1>
          <p class="mt-1.5 text-sm text-slate-400">
            <span class="text-slate-300 font-medium">{{ transfer?.departure_shop?.name || "—" }}</span>
            <span class="mx-1.5">→</span>
            <span class="text-slate-300 font-medium">{{ transfer?.arrival_shop?.name || "—" }}</span>
          </p>
          <p v-if="transfer?.comment" class="mt-1.5 text-sm text-slate-400">{{ transfer.comment }}</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            v-if="canEditItems"
            class="btn-secondary"
            @click="productModalOpen = true"
          >
            <Icon name="heroicons:plus" class="w-4 h-4" />
            <span class="hidden sm:inline">Добавить товар</span>
            <span class="sm:hidden">Товар</span>
          </button>
          <button
            v-if="canSend"
            class="btn-primary"
            :disabled="sending || !items.length"
            @click="handleSend"
          >
            <Icon v-if="sending" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
            <Icon v-else name="heroicons:paper-airplane" class="w-4 h-4" />
            {{ sending ? "..." : "Отправить" }}
          </button>
          <button
            v-if="canAccept"
            class="btn-primary"
            @click="openAcceptDialog"
          >
            <Icon name="heroicons:check-circle" class="w-4 h-4" />
            Принять
          </button>
          <button
            v-if="canCancel"
            class="btn-danger"
            :disabled="cancelling"
            @click="handleCancel"
          >
            <Icon v-if="cancelling" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
            <Icon v-else name="heroicons:x-circle" class="w-4 h-4" />
            {{ cancelling ? "..." : "Отменить" }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Status stepper ── -->
    <div v-if="transfer" class="rounded-[24px] border border-white/10 bg-[#111827]/80 px-6 py-5">
      <div class="flex items-center gap-0">
        <template v-for="(step, i) in statusSteps" :key="step.key">
          <div class="flex flex-col items-center min-w-22.5">
            <div
              class="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              :class="stepClass(step.key)"
            >
              <Icon :name="stepIcon(step.key)" class="w-5 h-5" />
            </div>
            <span class="mt-2 text-[11px] font-semibold text-center leading-tight" :class="stepTextClass(step.key)">
              {{ step.label }}
            </span>
            <span v-if="stepDate(step.key)" class="mt-0.5 text-[10px] text-slate-500 text-center">
              {{ stepDate(step.key) }}
            </span>
          </div>
          <div v-if="i < statusSteps.length - 1" class="flex-1 h-0.5 mx-1 mb-5 rounded-full transition-all" :class="connectorClass(step.key)" />
        </template>
      </div>
    </div>

    <!-- ── Stats ── -->
    <div v-if="transfer" class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <article class="stat-card">
        <span>Позиций</span>
        <strong>{{ items.length }}</strong>
      </article>
      <article class="stat-card">
        <span>Отправлено ед.</span>
        <strong>{{ fmtNum(documentTotals.quantity) }}</strong>
      </article>
      <article class="stat-card">
        <span>Принято ед.</span>
        <strong>{{ fmtNum(documentTotals.arrived) }}</strong>
      </article>
      <article class="stat-card">
        <span>Сумма (себест.)</span>
        <strong class="text-[18px]">{{ fmtMoney(documentTotals.supplyTotal) }}</strong>
      </article>
    </div>

    <!-- ── Items table ── -->
    <div class="rounded-[24px] border border-white/10 bg-[#111827]/80 overflow-hidden">
      <div class="flex flex-col gap-3 px-4 py-4 border-b border-white/8 lg:flex-row lg:items-center lg:justify-between lg:px-6 lg:py-5">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-[18px] lg:text-[20px] font-bold">Позиции</h2>
          <span class="text-sm text-slate-500">{{ filteredItems.length }} поз.</span>
        </div>
        <input
          v-model="itemSearch"
          type="text"
          class="field text-sm"
          placeholder="Поиск по позициям"
        />
      </div>

      <div v-if="itemsLoading" class="px-6 py-10 text-center text-slate-400">
        <Icon name="heroicons:arrow-path" class="w-6 h-6 animate-spin mx-auto mb-2" />
        Загружаем позиции...
      </div>
      <div v-else-if="!items.length" class="px-6 py-10 text-center text-slate-400">
        <Icon name="heroicons:inbox" class="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>Товары ещё не добавлены</p>
        <button v-if="canEditItems" class="mt-4 btn-secondary text-sm" @click="productModalOpen = true">
          Добавить товар
        </button>
      </div>
      <!-- Mobile card list -->
      <div v-else class="block lg:hidden divide-y divide-white/5">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="px-4 py-3 flex items-start gap-3"
        >
          <div class="flex-1 min-w-0">
            <div class="font-medium text-[14px] text-white truncate">{{ item.product?.name || item.product_id }}</div>
            <div class="text-[11px] text-slate-500 mt-0.5">
              {{ [item.product?.barcode && `ШК: ${item.product.barcode}`, item.product?.article && `Арт: ${item.product.article}`].filter(Boolean).join(' · ') || '—' }}
            </div>
            <div class="flex items-center gap-3 mt-1.5 text-[12px]">
              <span class="text-slate-400">Отпр: <span class="text-white font-semibold">{{ fmtNum(item.transfer_measurement_value) }}</span></span>
              <span class="text-slate-400">Принято: <span :class="arrivedClass(item)" class="font-semibold">{{ fmtNum(item.arrived_measurement_value) }}</span></span>
            </div>
          </div>
          <button
            v-if="canEditItems"
            class="w-8 h-8 shrink-0 rounded-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors"
            :disabled="removingItemId === item.product_id"
            @click="removeItem(item)"
          >
            <Icon name="heroicons:trash" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Desktop table -->
      <div class="hidden lg:block overflow-x-auto">
        <table class="w-full min-w-190">
          <thead>
            <tr class="border-b border-white/8">
              <th class="th px-6">Товар</th>
              <th class="th px-4 text-right">Отправлено</th>
              <th class="th px-4 text-right">Принято</th>
              <th class="th px-4 text-right">Остаток (отпр.)</th>
              <th class="th px-4 text-right">Остаток (пол.)</th>
              <th v-if="canEditItems" class="th px-4 text-right w-10" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in filteredItems"
              :key="item.id"
              class="border-b border-white/5 hover:bg-white/3 transition-colors"
            >
              <td class="px-6 py-3">
                <div class="font-medium text-[14px] text-white">{{ item.product?.name || item.product_id }}</div>
                <div class="text-[12px] text-slate-500 mt-0.5">
                  {{ [item.product?.barcode && `ШК: ${item.product.barcode}`, item.product?.article && `Арт: ${item.product.article}`].filter(Boolean).join(' · ') || '—' }}
                </div>
              </td>
              <td class="px-4 py-3 text-right font-semibold text-white">{{ fmtNum(item.transfer_measurement_value) }}</td>
              <td class="px-4 py-3 text-right">
                <span :class="arrivedClass(item)" class="font-semibold">{{ fmtNum(item.arrived_measurement_value) }}</span>
              </td>
              <td class="px-4 py-3 text-right text-slate-400">{{ fmtNum(item.product?.departure_shop_measurement_value.total_measurement_value || 0) }}</td>
              <td class="px-4 py-3 text-right text-slate-400">{{ fmtNum(item.product?.arrival_shop_measurement_values.total_measurement_value || 0) }}</td>
              <td v-if="canEditItems" class="px-4 py-3 text-right">
                <button
                  class="w-8 h-8 rounded-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors"
                  :disabled="removingItemId === item.product_id"
                  @click="removeItem(item)"
                >
                  <Icon name="heroicons:trash" class="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ────────── MODALS ────────── -->

    <!-- Accept dialog -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="acceptDialogOpen" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="acceptDialogOpen = false">
          <div class="bg-[#1a1a1a] border border-white/10 rounded-[28px] w-full max-w-170 shadow-2xl overflow-hidden">
            <div class="flex items-start justify-between gap-4 px-6 py-5 border-b border-white/8">
              <div>
                <h3 class="text-[20px] font-bold">Принять трансфер</h3>
                <p class="text-sm text-slate-400 mt-1">Выберите способ принятия</p>
              </div>
              <button class="w-9 h-9 rounded-full hover:bg-white/8 flex items-center justify-center text-slate-400" @click="acceptDialogOpen = false">
                <Icon name="heroicons:x-mark" class="w-5 h-5" />
              </button>
            </div>

            <!-- Mode selector -->
            <div class="grid grid-cols-2 gap-3 px-6 pt-5">
              <button
                class="accept-mode-btn"
                :class="acceptMode === 'quick' ? 'accept-mode-active' : 'accept-mode-inactive'"
                @click="acceptMode = 'quick'"
              >
                <Icon name="heroicons:bolt" class="w-5 h-5 mb-2" />
                <span class="font-semibold text-[14px]">Без проверки</span>
                <span class="text-[12px] mt-1 opacity-70">Принять всё количество как есть</span>
              </button>
              <button
                class="accept-mode-btn"
                :class="acceptMode === 'verified' ? 'accept-mode-active' : 'accept-mode-inactive'"
                @click="acceptMode = 'verified'; initVerificationQtys()"
              >
                <Icon name="heroicons:clipboard-document-check" class="w-5 h-5 mb-2" />
                <span class="font-semibold text-[14px]">С проверкой</span>
                <span class="text-[12px] mt-1 opacity-70">Ввести фактически полученное кол-во</span>
              </button>
            </div>

            <!-- Verification table -->
            <div v-if="acceptMode === 'verified'" class="px-6 pt-4 pb-2">
              <div class="rounded-[16px] border border-white/8 overflow-hidden max-h-75 overflow-y-auto">
                <table class="w-full">
                  <thead class="sticky top-0 bg-[#1a1a1a]">
                    <tr class="border-b border-white/8">
                      <th class="th px-4 py-2 text-left">Товар</th>
                      <th class="th px-4 py-2 text-right">Отправлено</th>
                      <th class="th px-4 py-2 text-right">Получено факт.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in items" :key="item.id" class="border-b border-white/5">
                      <td class="px-4 py-2.5 text-[13px] text-white">{{ item.product?.name || item.product_id }}</td>
                      <td class="px-4 py-2.5 text-right text-[13px] text-slate-400">{{ fmtNum(item.transfer_measurement_value) }}</td>
                      <td class="px-4 py-2.5 text-right">
                        <input
                          v-model.number="verificationQtys[item.id]"
                          type="number"
                          min="0"
                          class="w-24 px-2 py-1.5 rounded-[10px] border border-white/10 bg-[#2a2a2a] text-white text-[13px] text-right outline-none focus:border-[#1f78ff]"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Discrepancy summary -->
              <div v-if="hasDiscrepancy" class="mt-3 flex items-center gap-2 text-amber-400 text-[13px]">
                <Icon name="heroicons:exclamation-triangle" class="w-4 h-4 flex-none" />
                Обнаружено расхождение: отправлено {{ fmtNum(documentTotals.quantity) }}, получено {{ fmtNum(verificationTotal) }}
              </div>
            </div>

            <div class="flex gap-3 px-6 py-5">
              <button class="btn-secondary flex-1 justify-center" @click="acceptDialogOpen = false">Отмена</button>
              <button
                class="btn-primary flex-1 justify-center"
                :disabled="accepting"
                @click="handleAccept"
              >
                <Icon v-if="accepting" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
                {{ accepting ? "Принятие..." : acceptMode === 'verified' ? "Принять с проверкой" : "Принять" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Product search modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="productModalOpen" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="productModalOpen = false">
          <div class="bg-[#1a1a1a] border border-white/10 rounded-[28px] w-full max-w-215 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div class="flex items-start justify-between gap-4 px-6 py-5 border-b border-white/8 flex-none">
              <div>
                <h3 class="text-[20px] font-bold">Добавить товар</h3>
                <p class="text-sm text-slate-400 mt-1">Показываем остаток филиала-отправителя</p>
              </div>
              <button class="w-9 h-9 rounded-full hover:bg-white/8 flex items-center justify-center text-slate-400" @click="productModalOpen = false">
                <Icon name="heroicons:x-mark" class="w-5 h-5" />
              </button>
            </div>

            <div class="px-6 pt-4 flex-none">
              <div class="relative">
                <Icon name="heroicons:magnifying-glass" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  ref="searchInputRef"
                  v-model="productSearch"
                  type="text"
                  class="field pl-11"
                  placeholder="Поиск по названию, штрихкоду, артикулу..."
                  @keydown.esc="productModalOpen = false"
                />
              </div>
            </div>

            <div class="flex-1 overflow-y-auto px-6 py-4">
              <div v-if="productLoading" class="py-10 text-center text-slate-400">
                <Icon name="heroicons:arrow-path" class="w-6 h-6 animate-spin mx-auto mb-2" />
                Поиск...
              </div>
              <div v-else-if="!availableProducts.length" class="py-10 text-center text-slate-500">
                Товары не найдены
              </div>
              <div v-else class="space-y-2">
                <div
                  v-for="item in availableProducts"
                  :key="item.product_id"
                  class="flex items-center gap-4 px-4 py-3 rounded-[16px] border border-white/8 bg-white/3 hover:bg-white/6 transition-colors"
                >
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-[14px] text-white truncate">{{ item.product?.name || item.product_id }}</div>
                    <div class="text-[12px] text-slate-500 mt-0.5">
                      {{ [item.product?.barcode && `ШК: ${item.product.barcode}`, item.product?.article && `Арт: ${item.product.article}`].filter(Boolean).join(' · ') || '—' }}
                    </div>
                    <div class="text-[12px] text-slate-500 mt-0.5">
                      Остаток: <span class="text-slate-300 font-medium">{{ fmtNum(item.product?.departure_shop_measurement_value.total_measurement_value || 0) }}</span>
                      <template v-if="item.transfer_measurement_value">
                        · В документе: <span class="text-blue-400 font-medium">{{ fmtNum(item.transfer_measurement_value) }}</span>
                      </template>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 flex-none">
                    <input
                      v-model="quantityDrafts[item.product_id]"
                      type="number"
                      min="0"
                      :max="item.product?.departure_shop_measurement_value.total_measurement_value || 9999"
                      class="w-24 px-3 py-2 rounded-[12px] border border-white/10 bg-[#2a2a2a] text-white text-[13px] text-right outline-none focus:border-[#1f78ff]"
                      placeholder="0"
                      @keydown.enter="saveItem(item.product_id)"
                    />
                    <button
                      class="btn-primary px-4 py-2 text-[13px]"
                      :disabled="!quantityDrafts[item.product_id] || savingProductId === item.product_id"
                      @click="saveItem(item.product_id)"
                    >
                      <Icon v-if="savingProductId === item.product_id" name="heroicons:arrow-path" class="w-3.5 h-3.5 animate-spin" />
                      <Icon v-else name="heroicons:check" class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import { useHead } from "#imports";
import { useRoute, useRouter } from "vue-router";
import {
  useTransfers,
  type TransferDocument,
  type TransferItem,
} from "@/composables/useTransfers";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const {
  getTransfer,
  getTransferProducts,
  getTransferItems,
  upsertTransferItem,
  removeTransferItem,
  sendTransfer,
  acceptTransfer,
  acceptTransferVerified,
  cancelTransfer,
} = useTransfers();

const transferId = computed(() => String(route.params.id || ""));
useHead(() => ({ title: `${transfer.value?.name || "Трансфер"} | Konkurent` }));

// State
const loading = ref(false);
const transfer = ref<TransferDocument | null>(null);
const items = ref<TransferItem[]>([]);
const itemsLoading = ref(false);
const itemSearch = ref("");

const productModalOpen = ref(false);
const productSearch = ref("");
const availableProducts = ref<TransferItem[]>([]);
const productLoading = ref(false);
const savingProductId = ref("");
const quantityDrafts = reactive<Record<string, string>>({});
const removingItemId = ref("");
const searchInputRef = ref<HTMLInputElement | null>(null);

const sending = ref(false);
const accepting = ref(false);
const cancelling = ref(false);

const acceptDialogOpen = ref(false);
const acceptMode = ref<"quick" | "verified">("quick");
const verificationQtys = reactive<Record<string, number>>({});

// Computed
const canEditItems = computed(() => transfer.value?.status === "draft");
const canSend = computed(() => transfer.value?.status === "draft");
const canAccept = computed(() => transfer.value?.status === "sent");
const canCancel = computed(() => ["draft", "sent"].includes(transfer.value?.status || ""));

const filteredItems = computed(() => {
  const q = itemSearch.value.trim().toLowerCase();
  if (!q) return items.value;
  return items.value.filter((item) =>
    [item.product?.name, item.product?.barcode, item.product?.article, item.product_id]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );
});

const documentTotals = computed(() => ({
  quantity: items.value.reduce((s, i) => s + Number(i.transfer_measurement_value || 0), 0),
  arrived: items.value.reduce((s, i) => s + Number(i.arrived_measurement_value || 0), 0),
  supplyTotal: items.value.reduce(
    (s, i) => s + Number(i.transfer_measurement_value || 0) * Number(i.product?.departure_shop_supply_price || 0),
    0,
  ),
}));

const verificationTotal = computed(() =>
  Object.values(verificationQtys).reduce((s, v) => s + Number(v || 0), 0)
);

const hasDiscrepancy = computed(() =>
  items.value.some((item) => Number(verificationQtys[item.id] ?? item.transfer_measurement_value) !== Number(item.transfer_measurement_value))
);

// Status stepper
const statusSteps = [
  { key: "draft",    label: "Черновик" },
  { key: "sent",     label: "Отправлено" },
  { key: "accepted", label: "Принято" },
];

const STATUS_ORDER = ["draft", "sent", "accepted"];
const currentStatus = computed(() => transfer.value?.status || "draft");

function stepClass(key: string) {
  const st = currentStatus.value;
  if (st === "cancelled") return "bg-red-500/20 text-red-400";
  const cur = STATUS_ORDER.indexOf(st);
  const idx = STATUS_ORDER.indexOf(key);
  if (idx < cur) return "bg-emerald-500/20 text-emerald-400";
  if (idx === cur) return "bg-blue-500/25 text-blue-300 ring-2 ring-blue-400/40";
  return "bg-white/8 text-slate-500";
}

function stepTextClass(key: string) {
  const st = currentStatus.value;
  if (st === "cancelled" && key === "accepted") return "text-red-400";
  const cur = STATUS_ORDER.indexOf(st);
  const idx = STATUS_ORDER.indexOf(key);
  if (idx <= cur) return "text-slate-200";
  return "text-slate-600";
}

function stepIcon(key: string) {
  const st = currentStatus.value;
  const cur = STATUS_ORDER.indexOf(st);
  const idx = STATUS_ORDER.indexOf(key);
  if (key === "draft") return idx <= cur ? "heroicons:document-check" : "heroicons:document";
  if (key === "sent") return idx <= cur ? "heroicons:paper-airplane" : "heroicons:paper-airplane";
  if (key === "accepted") {
    if (st === "cancelled") return "heroicons:x-circle";
    return idx <= cur ? "heroicons:check-circle" : "heroicons:clock";
  }
  return "heroicons:circle";
}

function connectorClass(key: string) {
  const cur = STATUS_ORDER.indexOf(currentStatus.value);
  const idx = STATUS_ORDER.indexOf(key);
  if (currentStatus.value === "cancelled") return "bg-white/10";
  return idx < cur ? "bg-emerald-500/50" : "bg-white/10";
}

function stepDate(key: string) {
  if (!transfer.value) return null;
  if (key === "sent") return transfer.value.created_at ? fmtDate(transfer.value.created_at) : null;
  if (key === "accepted") return transfer.value.accepted_at ? fmtDate(transfer.value.accepted_at) : null;
  return null;
}

// Helpers
function fmtDate(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d);
}

function fmtNum(value: number) {
  return new Intl.NumberFormat("ru-RU").format(Number(value || 0));
}

function fmtMoney(value: number) {
  return `${fmtNum(value)} UZS`;
}

function arrivedClass(item: TransferItem) {
  if (transfer.value?.status !== "accepted") return "text-slate-400";
  const sent = Number(item.transfer_measurement_value);
  const got = Number(item.arrived_measurement_value);
  if (got === 0 && sent > 0) return "text-red-400";
  if (got < sent) return "text-amber-400";
  return "text-emerald-400";
}

// Data loading
async function loadTransfer() {
  if (!transferId.value) return;
  loading.value = true;
  try {
    transfer.value = await getTransfer(transferId.value);
  } catch (e: any) {
    toast.add({ title: "Ошибка загрузки", description: e?.data?.message || e?.message, color: "error" });
  } finally {
    loading.value = false;
  }
}

async function loadItems() {
  if (!transferId.value) return;
  itemsLoading.value = true;
  try {
    const res = await getTransferItems(transferId.value, { limit: 200, page: 1 });
    items.value = Array.isArray(res.items) ? res.items : [];
  } catch {
    items.value = [];
  } finally {
    itemsLoading.value = false;
  }
}

async function loadAvailableProducts() {
  if (!transferId.value) return;
  productLoading.value = true;
  try {
    const res = await getTransferProducts(transferId.value, {
      search: productSearch.value.trim() || undefined,
      limit: 40,
      page: 1,
      status: "active",
      statistics: true,
    });
    availableProducts.value = Array.isArray(res.items) ? res.items : [];
    for (const item of availableProducts.value) {
      if (!(item.product_id in quantityDrafts)) {
        quantityDrafts[item.product_id] = item.transfer_measurement_value ? String(item.transfer_measurement_value) : "";
      }
    }
  } catch {
    availableProducts.value = [];
  } finally {
    productLoading.value = false;
  }
}

// Actions
async function saveItem(productId: string) {
  const qty = Number(quantityDrafts[productId] || 0);
  savingProductId.value = productId;
  try {
    await upsertTransferItem(transferId.value, { product_id: productId, transfer_measurement_value: qty });
    await Promise.all([loadTransfer(), loadItems(), loadAvailableProducts()]);
  } catch (e: any) {
    toast.add({ title: "Ошибка", description: e?.data?.message || e?.message, color: "error" });
  } finally {
    savingProductId.value = "";
  }
}

async function removeItem(item: TransferItem) {
  removingItemId.value = item.product_id;
  try {
    await removeTransferItem(transferId.value, item.product_id);
    await Promise.all([loadTransfer(), loadItems()]);
  } catch (e: any) {
    toast.add({ title: "Ошибка удаления", description: e?.data?.message || e?.message, color: "error" });
  } finally {
    removingItemId.value = "";
  }
}

async function handleSend() {
  if (!canSend.value) return;
  sending.value = true;
  try {
    await sendTransfer(transferId.value);
    await Promise.all([loadTransfer(), loadItems()]);
    toast.add({ title: "Трансфер отправлен", color: "success" });
  } catch (e: any) {
    toast.add({ title: "Ошибка отправки", description: e?.data?.message || e?.message, color: "error" });
  } finally {
    sending.value = false;
  }
}

function openAcceptDialog() {
  acceptMode.value = "quick";
  acceptDialogOpen.value = true;
}

function initVerificationQtys() {
  for (const item of items.value) {
    verificationQtys[item.id] = Number(item.transfer_measurement_value || 0);
  }
}

async function handleAccept() {
  if (!canAccept.value) return;
  accepting.value = true;
  try {
    if (acceptMode.value === "verified") {
      const verificationItems = items.value.map((item) => ({
        item_id: item.id,
        arrived_quantity: Number(verificationQtys[item.id] ?? item.transfer_measurement_value ?? 0),
      }));
      await acceptTransferVerified(transferId.value, verificationItems);
    } else {
      await acceptTransfer(transferId.value);
    }
    acceptDialogOpen.value = false;
    await Promise.all([loadTransfer(), loadItems()]);
    toast.add({ title: "Трансфер принят", color: "success" });
  } catch (e: any) {
    toast.add({ title: "Ошибка принятия", description: e?.data?.message || e?.message, color: "error" });
  } finally {
    accepting.value = false;
  }
}

async function handleCancel() {
  if (!canCancel.value) return;
  cancelling.value = true;
  try {
    await cancelTransfer(transferId.value);
    await Promise.all([loadTransfer(), loadItems()]);
    toast.add({ title: "Трансфер отменён", color: "success" });
  } catch (e: any) {
    toast.add({ title: "Ошибка отмены", description: e?.data?.message || e?.message, color: "error" });
  } finally {
    cancelling.value = false;
  }
}

// Watchers
let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(productSearch, () => {
  if (!productModalOpen.value) return;
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadAvailableProducts(), 300);
});

watch(productModalOpen, async (next) => {
  if (next) {
    await loadAvailableProducts();
    await nextTick();
    searchInputRef.value?.focus();
  } else {
    productSearch.value = "";
  }
});

// Init
await Promise.all([loadTransfer(), loadItems()]);
</script>

<style scoped>
.field {
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  padding: 10px 14px;
  color: #fff;
  outline: none;
  transition: border-color 0.15s;
  font-size: 14px;
}
.field:focus { border-color: #1f78ff; }

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 14px;
  background: #1f78ff;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.15s;
  cursor: pointer;
}
.btn-primary:hover:not(:disabled) { background: #3d8bff; }
.btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 14px;
  background: rgba(255,255,255,0.08);
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.15s;
  cursor: pointer;
}
.btn-secondary:hover { background: rgba(255,255,255,0.12); }

.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 14px;
  background: rgba(220, 38, 38, 0.15);
  color: #f87171;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.15s;
  border: 1px solid rgba(220,38,38,0.3);
  cursor: pointer;
}
.btn-danger:hover:not(:disabled) { background: rgba(220, 38, 38, 0.25); }
.btn-danger:disabled { opacity: 0.45; cursor: not-allowed; }

.th {
  padding-top: 12px;
  padding-bottom: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #64748b;
  text-align: left;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  padding: 18px 20px;
}
.stat-card span {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #64748b;
}
.stat-card strong {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
}

.accept-mode-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  border-radius: 16px;
  border: 2px solid transparent;
  transition: all 0.15s;
  cursor: pointer;
}
.accept-mode-active {
  border-color: #1f78ff;
  background: rgba(31,120,255,0.12);
  color: #93c5fd;
}
.accept-mode-inactive {
  border-color: rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: #94a3b8;
}
.accept-mode-inactive:hover {
  border-color: rgba(255,255,255,0.16);
  background: rgba(255,255,255,0.08);
}

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
