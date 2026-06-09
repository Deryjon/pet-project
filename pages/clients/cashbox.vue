<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useHead } from "#imports";
import { useRoute, useRouter } from "vue-router";
import type { ClientDebtBucket, ClientDebtItem } from "@/composables/useClients";
import { useClients } from "@/composables/useClients";

useHead({ title: "Долги клиентов | Konkurent" });

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const { listClientDebts } = useClients();
const route = useRoute();
const router = useRouter();
const toast = useToast();

const loading = ref(false);
const debts = ref<ClientDebtItem[]>([]);
const activeTab = ref<"all" | ClientDebtBucket>("all");
const searchClientId = ref("");
const searchShopId = ref("");
const createdFrom = ref("");
const createdTo = ref("");
const dueFrom = ref("");
const dueTo = ref("");
const page = ref(DEFAULT_PAGE);
const limit = ref(DEFAULT_LIMIT);
const total = ref(0);
const errorMessage = ref("");
const summary = ref({
  active_debt_uzs: 0,
  total_repaid_uzs: 0,
  total_debt_uzs: 0,
  all_count: 0,
  overdue_count: 0,
  unpaid_count: 0,
  partial_count: 0,
  paid_count: 0,
});

function formatUzs(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(Number(value || 0))} UZS`;
}

function formatDate(value: string | null, withTime = false) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const datePart = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

  if (!withTime) return datePart;

  const timePart = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return `${datePart} ${timePart}`;
}

function debtBucketLabel(value: ClientDebtBucket) {
  if (value === "overdue") return "Просрочен";
  if (value === "paid") return "Погашен";
  if (value === "partial") return "Частично погашен";
  return "Непогашен";
}

function syncStateFromRoute() {
  const query = route.query;
  const status = String(query.status || "all");
  activeTab.value =
    status === "overdue" || status === "unpaid" || status === "partial" || status === "paid" ? status : "all";
  page.value = Math.max(1, Number(query.page || DEFAULT_PAGE) || DEFAULT_PAGE);
  limit.value = Math.max(1, Number(query.limit || DEFAULT_LIMIT) || DEFAULT_LIMIT);
  searchClientId.value = String(query.client_id || "");
  searchShopId.value = String(query.shop_id || "");
  createdFrom.value = String(query.created_from || "");
  createdTo.value = String(query.created_to || "");
  dueFrom.value = String(query.due_from || "");
  dueTo.value = String(query.due_to || "");
}

function syncRoute() {
  void router.replace({
    query: {
      ...route.query,
      status: activeTab.value,
      page: String(page.value),
      limit: String(limit.value),
      client_id: searchClientId.value || undefined,
      shop_id: searchShopId.value || undefined,
      created_from: createdFrom.value || undefined,
      created_to: createdTo.value || undefined,
      due_from: dueFrom.value || undefined,
      due_to: dueTo.value || undefined,
    },
  });
}

async function fetchDebts() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await listClientDebts({
      status: activeTab.value,
      page: page.value,
      limit: limit.value,
      client_id: searchClientId.value || undefined,
      shop_id: searchShopId.value || undefined,
      created_from: createdFrom.value || undefined,
      created_to: createdTo.value || undefined,
      due_from: dueFrom.value || undefined,
      due_to: dueTo.value || undefined,
    });

    debts.value = Array.isArray(response?.items) ? response.items : [];
    total.value = Number(response?.total ?? debts.value.length);
    summary.value = {
      active_debt_uzs: Number(response?.summary?.active_debt_uzs ?? 0),
      total_repaid_uzs: Number(response?.summary?.total_repaid_uzs ?? 0),
      total_debt_uzs: Number(response?.summary?.total_debt_uzs ?? 0),
      all_count: Number(response?.summary?.all_count ?? 0),
      overdue_count: Number(response?.summary?.overdue_count ?? 0),
      unpaid_count: Number(response?.summary?.unpaid_count ?? 0),
      partial_count: Number(response?.summary?.partial_count ?? 0),
      paid_count: Number(response?.summary?.paid_count ?? 0),
    };
  } catch (error: any) {
    debts.value = [];
    total.value = 0;
    errorMessage.value = error?.data?.message || error?.message || "Не удалось загрузить долги клиентов.";
    toast.add({ title: "Не удалось загрузить долги", description: errorMessage.value, color: "error" });
  } finally {
    loading.value = false;
  }
}

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)));

function previousPage() {
  if (page.value <= 1) return;
  page.value -= 1;
}

function nextPage() {
  if (page.value >= totalPages.value) return;
  page.value += 1;
}

watch(
  () => route.query,
  () => {
    syncStateFromRoute();
  },
);

watch(activeTab, () => {
  page.value = 1;
});

watch([activeTab, page, limit, searchClientId, searchShopId, createdFrom, createdTo, dueFrom, dueTo], () => {
  syncRoute();
  void fetchDebts();
});

onMounted(async () => {
  syncStateFromRoute();
  await fetchDebts();
});
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.14),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88))] p-6 shadow-[0_24px_60px_rgba(2,6,23,0.28)]">
      <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-rose-300">Клиенты</p>
      <h1 class="mt-3 text-[30px] font-bold tracking-[-0.04em] text-white">Долги клиентов</h1>
      <p class="mt-3 max-w-3xl text-[15px] leading-7 text-slate-300">
        Общий экран по всем клиентским долгам. Данные, summary и статусные вкладки приходят с бэкенда без пересчётов на фронте.
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <article class="stat-card"><span>Активный долг</span><strong>{{ formatUzs(summary.active_debt_uzs) }}</strong></article>
      <article class="stat-card"><span>Погашено</span><strong>{{ formatUzs(summary.total_repaid_uzs) }}</strong></article>
      <article class="stat-card"><span>Всего долгов</span><strong>{{ formatUzs(summary.total_debt_uzs) }}</strong></article>
      <article class="stat-card"><span>Просроченные</span><strong>{{ summary.overdue_count }}</strong></article>
      <article class="stat-card"><span>Непогашенные</span><strong>{{ summary.unpaid_count }}</strong></article>
    </div>

    <div class="rounded-[24px] border border-white/10 bg-[#111827]/80 p-5 shadow-[0_24px_60px_rgba(2,6,23,0.24)]">
      <div class="flex flex-wrap gap-2">
        <button type="button" class="debt-pill" :class="{ 'debt-pill-active': activeTab === 'all' }" @click="activeTab = 'all'">Все {{ summary.all_count }}</button>
        <button type="button" class="debt-pill" :class="{ 'debt-pill-active': activeTab === 'overdue' }" @click="activeTab = 'overdue'">Просроченные {{ summary.overdue_count }}</button>
        <button type="button" class="debt-pill" :class="{ 'debt-pill-active': activeTab === 'unpaid' }" @click="activeTab = 'unpaid'">Непогашенные {{ summary.unpaid_count }}</button>
        <button type="button" class="debt-pill" :class="{ 'debt-pill-active': activeTab === 'partial' }" @click="activeTab = 'partial'">Частично {{ summary.partial_count }}</button>
        <button type="button" class="debt-pill" :class="{ 'debt-pill-active': activeTab === 'paid' }" @click="activeTab = 'paid'">Погашенные {{ summary.paid_count }}</button>
      </div>

      <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <input v-model="searchClientId" type="text" class="field" placeholder="client_id" />
        <input v-model="searchShopId" type="text" class="field" placeholder="shop_id" />
        <div class="grid grid-cols-2 gap-3">
          <AppDatePicker v-model="dueFrom" clearable class="w-full" />
          <AppDatePicker v-model="dueTo" clearable class="w-full" />
        </div>
      </div>

      <div v-if="errorMessage && !loading" class="mt-5 rounded-[18px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {{ errorMessage }}
      </div>

      <div v-if="loading" class="mt-5 rounded-[18px] border border-white/10 bg-white/5 px-4 py-4 text-slate-300">
        Загрузка долгов...
      </div>

      <div v-else class="mt-5 grid gap-4">
        <article v-for="debt in debts" :key="debt.id" class="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p class="text-[24px] font-bold text-white">{{ formatUzs(debt.remaining_amount_uzs) }}</p>
              <p class="mt-2 text-sm text-slate-400">Срок: {{ formatDate(debt.due_date) || "-" }}</p>
              <p class="mt-2 text-sm text-slate-300">{{ debt.client?.full_name || "-" }} · {{ debt.client?.phone || "-" }}</p>
              <p class="mt-2 text-sm text-slate-400">{{ debt.shop?.name || "-" }}</p>
              <p class="mt-2 text-sm text-slate-400">{{ debtBucketLabel(debt.bucket) }}</p>
              <p v-if="debt.comment" class="mt-2 text-sm text-slate-300">{{ debt.comment }}</p>
            </div>

            <div class="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
              <div class="rounded-[16px] border border-white/10 bg-[#262626] px-4 py-3">
                <p class="text-slate-400">Сумма</p>
                <p class="mt-1 font-semibold text-white">{{ formatUzs(debt.amount_uzs) }}</p>
              </div>
              <div class="rounded-[16px] border border-white/10 bg-[#262626] px-4 py-3">
                <p class="text-slate-400">Погашено</p>
                <p class="mt-1 font-semibold text-white">{{ formatUzs(debt.repaid_amount_uzs) }}</p>
              </div>
              <div class="rounded-[16px] border border-white/10 bg-[#262626] px-4 py-3">
                <p class="text-slate-400">Создан</p>
                <p class="mt-1 font-semibold text-white">{{ formatDate(debt.created_at, true) || "-" }}</p>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div class="mt-6 flex items-center justify-between gap-3">
        <button type="button" class="page-btn" :disabled="page <= 1" @click="previousPage">Назад</button>
        <p class="text-sm text-slate-300">Страница {{ page }} из {{ totalPages }}</p>
        <button type="button" class="page-btn" :disabled="page >= totalPages" @click="nextPage">Вперёд</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
}

.stat-card span {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
}

.stat-card strong {
  font-size: 28px;
  color: #fff;
}

.field {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.05);
  padding: 14px 16px;
  color: #fff;
  outline: none;
}

.debt-pill {
  border-radius: 9999px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #bdbdbd;
  transition: 0.2s ease;
}

.debt-pill:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.debt-pill-active {
  background: #262626;
  color: #fff;
}

.page-btn {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #262626;
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  transition: 0.2s ease;
}

.page-btn:disabled {
  opacity: 0.45;
}
</style>
