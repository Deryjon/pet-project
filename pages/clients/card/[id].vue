<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useHead } from "#imports";
import { useRoute, useRouter } from "vue-router";
import type {
  ClientCardItem,
  ClientCardResponse,
  ClientDebtBucket,
  ClientDebtItem,
  ClientHistoryItem,
  ClientNote,
} from "@/composables/useClients";
import { useClients } from "@/composables/useClients";

useHead({ title: "Карточка клиента | Konkurent" });

const route = useRoute();
const router = useRouter();
const toast = useToast();
const {
  getClientCard,
  getClientNotes,
  createClientNote,
  getClientHistory,
  getClientDebts,
  repayClientDebt,
  createClientCard,
  deleteClient,
} = useClients();

const clientId = computed(() => String(route.params.id || ""));
const loading = ref(false);
const cardData = ref<ClientCardResponse | null>(null);
const notes = ref<ClientNote[]>([]);
const history = ref<ClientHistoryItem[]>([]);
const debts = ref<ClientDebtItem[]>([]);
const debtSummary = ref({
  active_debt_uzs: 0,
  total_repaid_uzs: 0,
  total_debt_uzs: 0,
  all_count: 0,
  overdue_count: 0,
  unpaid_count: 0,
  partial_count: 0,
  paid_count: 0,
});
const errorMessage = ref("");

const activeTab = ref<"dashboard" | "details" | "notes" | "history" | "debts" | "cards">("dashboard");
const activeHistoryTab = ref("all");
const activeDebtTab = ref<"all" | ClientDebtBucket>("all");

const noteText = ref("");
const creatingNote = ref(false);
const repayingDebtId = ref("");
const repaymentDrafts = ref<Record<string, string>>({});
const showCardForm = ref(false);
const newCardForm = ref({
  type: "local" as "local" | "loyalty" | "discount" | "bonus",
  number: "",
  is_active: true,
  issued_at: "",
  expires_at: "",
});

const tabs = [
  { key: "dashboard", label: "Дашборд" },
  { key: "details", label: "Данные" },
  { key: "notes", label: "Заметки" },
  { key: "history", label: "История" },
  { key: "debts", label: "Долги" },
  { key: "cards", label: "Карты" },
] as const;

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
    second: "2-digit",
  }).format(date);

  return `${datePart} | ${timePart}`;
}

function genderLabel(value?: string | null) {
  if (value === "male") return "Мужской";
  if (value === "female") return "Женский";
  return "Неизвестно";
}

function debtStatusLabel(value: ClientDebtItem["status"]) {
  if (value === "paid") return "Погашен";
  if (value === "partial") return "Частично погашен";
  return "Непогашен";
}

function debtBucketLabel(value: ClientDebtBucket) {
  if (value === "overdue") return "Просрочен";
  if (value === "paid") return "Погашен";
  if (value === "partial") return "Частично погашен";
  return "Непогашен";
}

function historyTypeLabel(value: string) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("purchase")) return "Покупка";
  if (normalized.includes("note")) return "Заметка";
  if (normalized.includes("debt") && normalized.includes("repay")) return "Погашение долга";
  if (normalized.includes("repayment")) return "Погашение долга";
  if (normalized.includes("debt")) return "Создание долга";
  if (normalized.includes("create")) return "Создание клиента";
  return value || "Событие";
}

const client = computed(() => cardData.value?.client ?? null);
const dashboard = computed(() => cardData.value?.dashboard ?? null);
const clientCards = computed(() => client.value?.cards ?? []);

const historyTabs = computed(() => {
  const counts = history.value.reduce<Record<string, number>>((acc, item) => {
    const key = String(item.type || "other");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return [
    { key: "all", label: `Все (${history.value.length})` },
    ...Object.entries(counts).map(([key, count]) => ({
      key,
      label: `${historyTypeLabel(key)} (${count})`,
    })),
  ];
});

const visibleHistory = computed(() => {
  if (activeHistoryTab.value === "all") return history.value;
  return history.value.filter((item) => item.type === activeHistoryTab.value);
});

function syncTabFromRoute() {
  const queryTab = String(route.query.tab || "").trim();
  if (queryTab === "dashboard" || queryTab === "details" || queryTab === "notes" || queryTab === "history" || queryTab === "debts" || queryTab === "cards") {
    activeTab.value = queryTab;
  }
}

async function fetchCard() {
  if (!clientId.value) return;
  const response = await getClientCard(clientId.value);
  cardData.value = response;
}

async function fetchNotes() {
  if (!clientId.value) return;
  const response = await getClientNotes(clientId.value);
  notes.value = Array.isArray(response) ? response : [];
}

async function fetchHistory() {
  if (!clientId.value) return;
  const response = await getClientHistory(clientId.value, { page: 1, limit: 50 });
  history.value = Array.isArray(response?.items) ? response.items : [];
}

async function fetchDebts(bucket: "all" | ClientDebtBucket = activeDebtTab.value) {
  if (!clientId.value) return;
  const response = await getClientDebts(clientId.value, { status: bucket });
  debts.value = Array.isArray(response?.items) ? response.items : [];
  debtSummary.value = {
    active_debt_uzs: Number(response?.summary?.active_debt_uzs ?? 0),
    total_repaid_uzs: Number(response?.summary?.total_repaid_uzs ?? 0),
    total_debt_uzs: Number(response?.summary?.total_debt_uzs ?? 0),
    all_count: Number(response?.summary?.all_count ?? 0),
    overdue_count: Number(response?.summary?.overdue_count ?? 0),
    unpaid_count: Number(response?.summary?.unpaid_count ?? 0),
    partial_count: Number(response?.summary?.partial_count ?? 0),
    paid_count: Number(response?.summary?.paid_count ?? 0),
  };
}

async function loadCard() {
  if (!clientId.value) return;
  loading.value = true;
  errorMessage.value = "";

  try {
    await Promise.all([fetchCard(), fetchNotes(), fetchHistory(), fetchDebts("all")]);
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || "Не удалось загрузить карточку клиента.";
    toast.add({ title: "Не удалось загрузить клиента", description: errorMessage.value, color: "error" });
  } finally {
    loading.value = false;
  }
}

async function submitNote() {
  const text = noteText.value.trim();
  if (!text || !clientId.value) return;
  creatingNote.value = true;

  try {
    await createClientNote(clientId.value, text);
    noteText.value = "";
    await Promise.all([fetchNotes(), fetchHistory()]);
    toast.add({ title: "Заметка добавлена", color: "success" });
  } catch (error: any) {
    toast.add({
      title: "Не удалось добавить заметку",
      description: error?.data?.message || error?.message || undefined,
      color: "error",
    });
  } finally {
    creatingNote.value = false;
  }
}

async function submitRepayment(debt: ClientDebtItem) {
  if (!clientId.value) return;
  const amount = Number(repaymentDrafts.value[debt.id] || 0);
  const maxAmount = Number(debt.remaining_amount_uzs || 0);

  if (!Number.isFinite(amount) || amount <= 0 || amount > maxAmount) {
    toast.add({
      title: "Некорректная сумма погашения",
      description: `Введите сумму от 1 до ${formatUzs(maxAmount)}.`,
      color: "error",
    });
    return;
  }

  repayingDebtId.value = debt.id;
  try {
    await repayClientDebt(clientId.value, debt.id, amount);
    repaymentDrafts.value = {
      ...repaymentDrafts.value,
      [debt.id]: "",
    };
    await Promise.all([fetchCard(), fetchHistory(), fetchDebts(activeDebtTab.value)]);
    toast.add({ title: "Погашение сохранено", color: "success" });
  } catch (error: any) {
    toast.add({
      title: "Не удалось погасить долг",
      description: error?.data?.message || error?.message || undefined,
      color: "error",
    });
  } finally {
    repayingDebtId.value = "";
  }
}

async function submitCard() {
  if (!clientId.value || !newCardForm.value.number.trim()) return;

  try {
    await createClientCard(clientId.value, {
      type: newCardForm.value.type,
      number: newCardForm.value.number.trim(),
      is_active: newCardForm.value.is_active,
      issued_at: newCardForm.value.issued_at || null,
      expires_at: newCardForm.value.expires_at || null,
    });

    showCardForm.value = false;
    newCardForm.value = {
      type: "local",
      number: "",
      is_active: true,
      issued_at: "",
      expires_at: "",
    };
    await fetchCard();
    toast.add({ title: "Карта добавлена", color: "success" });
  } catch (error: any) {
    toast.add({
      title: "Не удалось добавить карту",
      description: error?.data?.message || error?.message || undefined,
      color: "error",
    });
  }
}

async function removeClient() {
  if (!client.value) return;
  if (typeof window !== "undefined" && !window.confirm(`Удалить клиента ${client.value.full_name}?`)) return;

  try {
    await deleteClient(client.value.id);
    toast.add({ title: "Клиент удален", color: "success" });
    await router.push("/clients?page=1&limit=10");
  } catch (error: any) {
    toast.add({
      title: "Не удалось удалить клиента",
      description: error?.data?.message || error?.message || undefined,
      color: "error",
    });
  }
}

function goBack() {
  void router.push("/clients?page=1&limit=10");
}

function openEdit() {
  if (!client.value) return;
  void router.push(`/clients/create?id=${encodeURIComponent(client.value.id)}&page=1`);
}

watch(clientId, () => {
  void loadCard();
});

watch(
  () => route.query.tab,
  () => {
    syncTabFromRoute();
  },
);

watch(activeDebtTab, (next) => {
  void fetchDebts(next);
});

onMounted(async () => {
  syncTabFromRoute();
  await loadCard();
});
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.84))] p-6 shadow-[0_28px_70px_rgba(2,6,23,0.35)]">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div class="flex items-center gap-4">
          <button
            type="button"
            class="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            @click="goBack"
          >
            <Icon name="heroicons:arrow-left-20-solid" class="h-5 w-5" />
          </button>

          <div>
            <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-sky-300">Клиенты</p>
            <h1 class="mt-2 text-[30px] font-bold tracking-[-0.04em] text-white">
              {{ client?.full_name || "Карточка клиента" }}
            </h1>
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="rounded-[16px] border border-white/10 bg-[#262626] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#303030]"
            @click="activeTab = 'debts'"
          >
            Долги клиента
          </button>
          <button
            type="button"
            class="rounded-[16px] border border-white/10 bg-[#262626] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#303030]"
            @click="removeClient"
          >
            Удалить
          </button>
          <button
            type="button"
            class="rounded-[16px] border border-white/10 bg-[#262626] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#303030]"
            @click="openEdit"
          >
            Редактировать
          </button>
        </div>
      </div>
    </div>

    <div v-if="errorMessage && !loading" class="rounded-[20px] border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm text-red-200">
      {{ errorMessage }}
    </div>

    <div class="flex flex-wrap gap-2 rounded-[24px] border border-white/10 bg-[#111827]/80 p-2 shadow-[0_24px_60px_rgba(2,6,23,0.24)]">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="rounded-full px-4 py-2 text-sm font-medium transition"
        :class="activeTab === tab.key ? 'bg-[#262626] text-white' : 'text-[#bdbdbd] hover:bg-white/10 hover:text-white'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="loading" class="rounded-[24px] border border-white/10 bg-[#111827]/80 p-6 text-slate-300">
      Загрузка клиента...
    </div>

    <template v-else>
      <div v-if="activeTab === 'dashboard'" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article class="card-block">
          <p class="card-label">Баланс</p>
          <p class="card-value">{{ formatUzs(dashboard?.balance_uzs || 0) }}</p>
        </article>
        <article class="card-block">
          <p class="card-label">Долг</p>
          <p class="card-value">{{ formatUzs(dashboard?.debt_uzs || 0) }}</p>
        </article>
        <article class="card-block">
          <p class="card-label">Сумма покупок</p>
          <p class="card-value">{{ formatUzs(dashboard?.total_purchases_uzs || 0) }}</p>
        </article>
        <article class="card-block">
          <p class="card-label">Средний чек</p>
          <p class="card-value">{{ formatUzs(dashboard?.average_check_uzs || 0) }}</p>
        </article>
        <article class="card-block">
          <p class="card-label">Средняя цена товара</p>
          <p class="card-value">{{ formatUzs(dashboard?.average_products_price_uzs || 0) }}</p>
        </article>
        <article class="card-block">
          <p class="card-label">Среднее кол-во товаров</p>
          <p class="card-value">{{ dashboard?.average_items_count || 0 }}</p>
        </article>
        <article class="card-block">
          <p class="card-label">Средняя скидка</p>
          <p class="card-value">{{ dashboard?.average_discount_percent || 0 }} %</p>
        </article>
        <article class="card-block">
          <p class="card-label">Топ транзакция</p>
          <p class="card-value">{{ formatUzs(dashboard?.top_transaction_uzs || 0) }}</p>
        </article>
        <article class="card-block">
          <p class="card-label">Количество визитов</p>
          <p class="card-value">{{ dashboard?.visits_count || 0 }}</p>
        </article>
        <article class="card-block">
          <p class="card-label">Первая покупка</p>
          <p class="card-value !text-[20px]">{{ formatDate(dashboard?.first_purchase_date || null) || " " }}</p>
        </article>
        <article class="card-block">
          <p class="card-label">Последняя покупка</p>
          <p class="card-value !text-[20px]">{{ formatDate(dashboard?.last_purchase_date || null) || " " }}</p>
        </article>
      </div>

      <div v-else-if="activeTab === 'details'" class="panel">
        <h2 class="panel-title">Основные данные</h2>
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div class="detail-item"><span>ФИО</span><strong>{{ client?.full_name || "-" }}</strong></div>
          <div class="detail-item"><span>Телефоны</span><strong>{{ client?.phone_numbers?.join(", ") || client?.phone || "-" }}</strong></div>
          <div class="detail-item"><span>Пол</span><strong>{{ genderLabel(client?.gender) }}</strong></div>
          <div class="detail-item"><span>Дата рождения</span><strong>{{ formatDate(client?.birth_date || null) || "-" }}</strong></div>
          <div class="detail-item"><span>Магазин регистрации</span><strong>{{ client?.registration_shop?.name || "-" }}</strong></div>
          <div class="detail-item"><span>Баланс</span><strong>{{ formatUzs(client?.balance_uzs || 0) }}</strong></div>
          <div class="detail-item"><span>Долг</span><strong>{{ formatUzs(client?.debt_uzs || 0) }}</strong></div>
          <div class="detail-item"><span>Первая покупка</span><strong>{{ formatDate(client?.first_purchase_date || null) || "-" }}</strong></div>
          <div class="detail-item"><span>Последняя покупка</span><strong>{{ formatDate(client?.last_purchase_date || null) || "-" }}</strong></div>
          <div class="detail-item"><span>Семейное положение</span><strong>{{ client?.marital_status || "-" }}</strong></div>
          <div class="detail-item"><span>Соцсети</span><strong>{{ client?.social_networks?.join(", ") || "-" }}</strong></div>
          <div class="detail-item"><span>Родственники</span><strong>{{ client?.relatives?.join(", ") || "-" }}</strong></div>
          <div class="detail-item"><span>Группы</span><strong>{{ client?.groups?.map((item) => item.name).join(", ") || "-" }}</strong></div>
          <div class="detail-item"><span>Теги</span><strong>{{ client?.tag_names?.join(", ") || "-" }}</strong></div>
        </div>
      </div>

      <div v-else-if="activeTab === 'notes'" class="panel">
        <h2 class="panel-title">Заметки</h2>

        <div class="mt-5 grid gap-3">
          <textarea v-model="noteText" rows="4" class="field resize-none" placeholder="Добавить заметку" />
          <div>
            <button
              type="button"
              class="rounded-[16px] border border-white/10 bg-[#262626] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#303030]"
              :disabled="creatingNote"
              @click="submitNote"
            >
              {{ creatingNote ? "Сохранение..." : "Добавить заметку" }}
            </button>
          </div>
        </div>

        <div class="mt-6 grid gap-4">
          <article v-for="note in notes" :key="note.id" class="rounded-[20px] border border-white/10 bg-white/5 p-5">
            <p class="text-sm text-slate-400">{{ formatDate(note.created_at, true) }}</p>
            <p class="mt-3 text-base text-white">{{ note.text }}</p>
            <p class="mt-3 text-sm text-slate-300">{{ note.created_by?.name || "Система" }}</p>
          </article>
        </div>
      </div>

      <div v-else-if="activeTab === 'history'" class="panel">
        <h2 class="panel-title">История клиента</h2>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            v-for="tab in historyTabs"
            :key="tab.key"
            type="button"
            class="rounded-full px-4 py-2 text-sm font-medium transition"
            :class="activeHistoryTab === tab.key ? 'bg-[#262626] text-white' : 'text-[#bdbdbd] hover:bg-white/10 hover:text-white'"
            @click="activeHistoryTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="mt-6 grid gap-4">
          <article v-for="item in visibleHistory" :key="item.id" class="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p class="text-sm text-slate-400">{{ formatDate(item.happened_at, true) }}</p>
            <p class="mt-3 text-sm uppercase tracking-[0.14em] text-sky-300">{{ historyTypeLabel(item.type) }}</p>
            <p class="mt-3 text-base font-semibold text-white">{{ item.title || historyTypeLabel(item.type) }}</p>
            <p v-if="item.description" class="mt-3 text-sm text-slate-300">{{ item.description }}</p>
            <p v-if="item.amount_uzs != null" class="mt-3 text-sm text-slate-200">{{ formatUzs(item.amount_uzs) }}</p>
          </article>
        </div>
      </div>

      <div v-else-if="activeTab === 'debts'" class="panel">
        <div class="flex flex-wrap gap-2">
          <button type="button" class="debt-pill" :class="{ 'debt-pill-active': activeDebtTab === 'all' }" @click="activeDebtTab = 'all'">Все {{ debtSummary.all_count }}</button>
          <button type="button" class="debt-pill" :class="{ 'debt-pill-active': activeDebtTab === 'overdue' }" @click="activeDebtTab = 'overdue'">Просроченные {{ debtSummary.overdue_count }}</button>
          <button type="button" class="debt-pill" :class="{ 'debt-pill-active': activeDebtTab === 'unpaid' }" @click="activeDebtTab = 'unpaid'">Непогашенные {{ debtSummary.unpaid_count }}</button>
          <button type="button" class="debt-pill" :class="{ 'debt-pill-active': activeDebtTab === 'partial' }" @click="activeDebtTab = 'partial'">Частично погашенные {{ debtSummary.partial_count }}</button>
          <button type="button" class="debt-pill" :class="{ 'debt-pill-active': activeDebtTab === 'paid' }" @click="activeDebtTab = 'paid'">Погашенные {{ debtSummary.paid_count }}</button>
        </div>

        <div class="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div class="grid gap-4">
            <article v-for="debt in debts" :key="debt.id" class="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p class="text-[24px] font-bold text-white">{{ formatUzs(debt.remaining_amount_uzs) }}</p>
              <p class="mt-2 text-sm text-slate-400">до {{ formatDate(debt.due_date) || "-" }}</p>
              <div class="mt-6">
                <p class="text-base font-semibold text-white">{{ debt.client?.full_name || client?.full_name || "-" }}</p>
                <p class="mt-2 text-sm text-slate-300">{{ debt.shop?.name || "-" }}</p>
                <p class="mt-2 text-sm text-slate-400">{{ debtBucketLabel(debt.bucket) }}</p>
                <p class="mt-2 text-sm text-slate-500">{{ debtStatusLabel(debt.status) }}</p>
                <p v-if="debt.comment" class="mt-2 text-sm text-slate-300">{{ debt.comment }}</p>
              </div>

              <div class="mt-5 grid gap-3">
                <div class="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                  <div class="rounded-[16px] border border-white/10 bg-[#262626] px-4 py-3">
                    <p class="text-slate-400">Общая сумма</p>
                    <p class="mt-1 font-semibold text-white">{{ formatUzs(debt.amount_uzs) }}</p>
                  </div>
                  <div class="rounded-[16px] border border-white/10 bg-[#262626] px-4 py-3">
                    <p class="text-slate-400">Погашено</p>
                    <p class="mt-1 font-semibold text-white">{{ formatUzs(debt.repaid_amount_uzs) }}</p>
                  </div>
                  <div class="rounded-[16px] border border-white/10 bg-[#262626] px-4 py-3">
                    <p class="text-slate-400">Остаток</p>
                    <p class="mt-1 font-semibold text-white">{{ formatUzs(debt.remaining_amount_uzs) }}</p>
                  </div>
                </div>

                <div class="grid grid-cols-[1fr_auto] gap-3">
                  <input
                    v-model="repaymentDrafts[debt.id]"
                    type="number"
                    min="1"
                    :max="debt.remaining_amount_uzs"
                    class="field"
                    placeholder="Сумма погашения"
                  />
                  <button
                    type="button"
                    class="rounded-[16px] border border-white/10 bg-[#262626] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#303030]"
                    :disabled="repayingDebtId === debt.id"
                    @click="submitRepayment(debt)"
                  >
                    {{ repayingDebtId === debt.id ? "..." : "Погасить" }}
                  </button>
                </div>
              </div>

              <a
                v-if="debt.receipt_url"
                :href="debt.receipt_url"
                target="_blank"
                rel="noreferrer"
                class="mt-4 inline-flex rounded-[16px] border border-white/10 bg-[#262626] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#303030]"
              >
                Чек по долгу
              </a>
            </article>
          </div>

          <article class="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <h3 class="text-lg font-semibold text-white">Сводка</h3>
            <div class="mt-5 space-y-4">
              <div class="debt-stat"><span>Общий активный долг</span><strong>{{ formatUzs(debtSummary.active_debt_uzs) }}</strong></div>
              <div class="debt-stat"><span>Общая сумма погашений</span><strong>{{ formatUzs(debtSummary.total_repaid_uzs) }}</strong></div>
              <div class="debt-stat"><span>Общая сумма долгов</span><strong>{{ formatUzs(debtSummary.total_debt_uzs) }}</strong></div>
            </div>
          </article>
        </div>
      </div>

      <div v-else class="panel">
        <div class="flex items-center justify-between gap-4">
          <h2 class="panel-title">Карты</h2>
          <button
            type="button"
            class="rounded-[16px] border border-white/10 bg-[#262626] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#303030]"
            @click="showCardForm = !showCardForm"
          >
            Добавить карту
          </button>
        </div>

        <div v-if="showCardForm" class="mt-5 grid gap-3 rounded-[20px] border border-white/10 bg-white/5 p-5 md:grid-cols-2">
          <select v-model="newCardForm.type" class="field">
            <option value="local">local</option>
            <option value="loyalty">loyalty</option>
            <option value="discount">discount</option>
            <option value="bonus">bonus</option>
          </select>
          <input v-model="newCardForm.number" type="text" class="field" placeholder="Номер карты" />
          <input v-model="newCardForm.issued_at" type="date" class="field" />
          <input v-model="newCardForm.expires_at" type="date" class="field" />
          <label class="flex items-center gap-3 text-sm text-white">
            <input v-model="newCardForm.is_active" type="checkbox" class="h-4 w-4 accent-[#4993dd]" />
            Активная карта
          </label>
          <div>
            <button
              type="button"
              class="rounded-[16px] border border-white/10 bg-[#262626] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#303030]"
              @click="submitCard"
            >
              Сохранить карту
            </button>
          </div>
        </div>

        <div class="mt-5 grid gap-4 md:grid-cols-2">
          <article v-for="item in clientCards" :key="item.id" class="purchase-card">
            <p class="text-sm text-slate-400">{{ item.type }}</p>
            <p class="mt-3 text-base font-semibold text-white">{{ item.number }}</p>
            <p class="mt-3 text-sm text-slate-300">Активна: {{ item.is_active ? "Да" : "Нет" }}</p>
            <p class="mt-2 text-sm text-slate-400">Выдана: {{ formatDate(item.issued_at) || "-" }}</p>
            <p class="mt-2 text-sm text-slate-400">Истекает: {{ formatDate(item.expires_at) || "-" }}</p>
          </article>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.panel {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 28px;
  background: rgba(17, 24, 39, 0.8);
  padding: 24px;
  box-shadow: 0 24px 60px rgba(2, 6, 23, 0.24);
}

.panel-title {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
}

.card-block {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
  padding: 20px;
  box-shadow: 0 18px 50px rgba(2, 6, 23, 0.2);
}

.card-label {
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
}

.card-value {
  margin-top: 16px;
  font-size: 28px;
  font-weight: 700;
  color: #fff;
}

.detail-item,
.debt-stat {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  padding: 16px;
}

.detail-item span,
.debt-stat span {
  font-size: 14px;
  color: #94a3b8;
}

.detail-item strong,
.debt-stat strong {
  font-size: 16px;
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

.field::placeholder {
  color: #94a3b8;
}

.purchase-card {
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px;
  background: rgba(255,255,255,0.05);
  padding: 20px;
}

.debt-pill {
  border-radius: 9999px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  transition: 0.2s ease;
  color: #bdbdbd;
}

.debt-pill:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.debt-pill-active {
  background: #262626;
  color: #fff;
}
</style>
