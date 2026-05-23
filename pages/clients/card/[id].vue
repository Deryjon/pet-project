<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useHead } from "#imports";
import { useRoute, useRouter } from "vue-router";
import type {
  ClientCardItem,
  ClientCardResponse,
  ClientDebtItem,
  ClientDebtStatus,
  ClientHistoryItem,
  ClientNote,
  ClientPreferenceItem,
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
  getClientPreferences,
  getClientDebts,
  repayClientDebt,
  getClientCards,
  createClientCard,
  deleteClient,
} = useClients();

const clientId = computed(() => String(route.params.id || ""));
const loading = ref(false);
const cardData = ref<ClientCardResponse | null>(null);
const notes = ref<ClientNote[]>([]);
const history = ref<ClientHistoryItem[]>([]);
const preferences = ref<ClientPreferenceItem[]>([]);
const debts = ref<ClientDebtItem[]>([]);
const debtSummary = ref({
  active_debt_uzs: 0,
  total_repaid_uzs: 0,
  total_debt_uzs: 0,
});
const clientCards = ref<ClientCardItem[]>([]);
const errorMessage = ref("");

const activeTab = ref<"dashboard" | "details" | "notes" | "history" | "preferences" | "debts" | "cards">("dashboard");
const activeHistoryTab = ref<"all" | "purchase" | "log">("all");
const activeDebtTab = ref<"all" | ClientDebtStatus>("all");

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
  { key: "dashboard", label: "Дашбоард" },
  { key: "details", label: "Данные" },
  { key: "notes", label: "Заметки" },
  { key: "history", label: "История" },
  { key: "preferences", label: "Предпочтения" },
  { key: "debts", label: "Долги" },
  { key: "cards", label: "Карты" },
] as const;

function formatUzs(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(Number(value || 0))} UZS`;
}

function formatDate(value: string | null, withTime = false) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const datePart = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

  if (!withTime) {
    return datePart;
  }

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

function debtStatusLabel(value: ClientDebtStatus) {
  if (value === "paid") return "Погашенные";
  if (value === "partial") return "Частично погашенные";
  return "Непогашенные";
}

const client = computed(() => cardData.value?.client ?? null);
const dashboard = computed(() => cardData.value?.dashboard ?? null);

const visibleHistory = computed(() => {
  if (activeHistoryTab.value === "all") return history.value;
  return history.value.filter((item) => item.type === activeHistoryTab.value);
});

const visibleDebts = computed(() => {
  if (activeDebtTab.value === "all") return debts.value;
  return debts.value.filter((item) => item.status === activeDebtTab.value);
});

function syncTabFromRoute() {
  const queryTab = String(route.query.tab || "").trim();
  if (
    queryTab === "dashboard" ||
    queryTab === "details" ||
    queryTab === "notes" ||
    queryTab === "history" ||
    queryTab === "preferences" ||
    queryTab === "debts" ||
    queryTab === "cards"
  ) {
    activeTab.value = queryTab;
  }
}

async function loadCard() {
  if (!clientId.value) return;
  loading.value = true;
  errorMessage.value = "";

  try {
    const [card, notesResponse, historyResponse, preferencesResponse, debtsResponse, cardsResponse] =
      await Promise.all([
        getClientCard(clientId.value),
        getClientNotes(clientId.value),
        getClientHistory(clientId.value, { type: "all", page: 1, limit: 50 }),
        getClientPreferences(clientId.value),
        getClientDebts(clientId.value),
        getClientCards(clientId.value),
      ]);

    cardData.value = card;
    notes.value = Array.isArray(notesResponse) ? notesResponse : [];
    history.value = Array.isArray(historyResponse?.items) ? historyResponse.items : [];
    preferences.value = Array.isArray(preferencesResponse) ? preferencesResponse : [];
    debts.value = Array.isArray(debtsResponse?.items) ? debtsResponse.items : [];
    debtSummary.value = {
      active_debt_uzs: Number(debtsResponse?.summary?.active_debt_uzs ?? 0),
      total_repaid_uzs: Number(debtsResponse?.summary?.total_repaid_uzs ?? 0),
      total_debt_uzs: Number(debtsResponse?.summary?.total_debt_uzs ?? 0),
    };
    clientCards.value = Array.isArray(cardsResponse) ? cardsResponse : [];
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
    const created = await createClientNote(clientId.value, text);
    notes.value = [created, ...notes.value];
    history.value = [
      {
        id: created.id,
        client_id: created.client_id,
        type: "log",
        title: "Добавлена заметка",
        description: created.text,
        happened_at: created.created_at,
        amount_uzs: null,
        order_id: null,
      },
      ...history.value,
    ];
    noteText.value = "";
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
    const updated = await repayClientDebt(clientId.value, debt.id, amount);
    debts.value = debts.value.map((item) => (item.id === updated.id ? updated : item));
    debtSummary.value = {
      active_debt_uzs: debts.value
        .filter((item) => item.status !== "paid")
        .reduce((sum, item) => sum + Number(item.remaining_amount_uzs || 0), 0),
      total_repaid_uzs: debts.value.reduce((sum, item) => sum + Number(item.repaid_amount_uzs || 0), 0),
      total_debt_uzs: debts.value.reduce((sum, item) => sum + Number(item.amount_uzs || 0), 0),
    };
    repaymentDrafts.value = {
      ...repaymentDrafts.value,
      [debt.id]: "",
    };
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
    const created = await createClientCard(clientId.value, {
      type: newCardForm.value.type,
      number: newCardForm.value.number.trim(),
      is_active: newCardForm.value.is_active,
      issued_at: newCardForm.value.issued_at || null,
      expires_at: newCardForm.value.expires_at || null,
    });
    clientCards.value = [created, ...clientCards.value];
    showCardForm.value = false;
    newCardForm.value = {
      type: "local",
      number: "",
      is_active: true,
      issued_at: "",
      expires_at: "",
    };
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
  if (typeof window !== "undefined" && !window.confirm(`Удалить клиента ${client.value.full_name}?`)) {
    return;
  }

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
            Погашение долга
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
          <p class="card-label">Баланс клиента</p>
          <p class="card-value">{{ formatUzs(dashboard?.balance_uzs || 0) }}</p>
        </article>
        <article class="card-block">
          <p class="card-label">Сумма покупок</p>
          <p class="card-value">{{ formatUzs(dashboard?.total_purchases_uzs || 0) }}</p>
        </article>
        <article class="card-block">
          <p class="card-label">Топ транзакция</p>
          <p class="card-value">{{ formatUzs(dashboard?.top_transaction_uzs || 0) }}</p>
        </article>
        <article class="card-block">
          <p class="card-label">Средний чек</p>
          <p class="card-value">{{ formatUzs(dashboard?.average_check_uzs || 0) }}</p>
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
          <p class="card-label">Кол-во визитов</p>
          <p class="card-value">{{ dashboard?.visits_count || 0 }}</p>
        </article>
      </div>

      <div v-else-if="activeTab === 'details'" class="panel">
        <h2 class="panel-title">Основные</h2>
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div class="detail-item"><span>Имя</span><strong>{{ client?.first_name || "-" }}</strong></div>
          <div class="detail-item"><span>Фамилия</span><strong>{{ client?.last_name || "-" }}</strong></div>
          <div class="detail-item"><span>Отчество</span><strong>{{ client?.middle_name || "-" }}</strong></div>
          <div class="detail-item"><span>День рождения</span><strong>{{ formatDate(client?.birth_date || null) }}</strong></div>
          <div class="detail-item"><span>Телефон</span><strong>{{ client?.phone || "-" }}</strong></div>
          <div class="detail-item"><span>Пол</span><strong>{{ genderLabel(client?.gender) }}</strong></div>
          <div class="detail-item"><span>Семейное положение</span><strong>{{ client?.marital_status || "Неизвестно" }}</strong></div>
          <div class="detail-item"><span>Адрес</span><strong>{{ client?.address || "-" }}</strong></div>
          <div class="detail-item"><span>Социальные сети</span><strong>{{ client?.social_links?.join(", ") || "-" }}</strong></div>
          <div class="detail-item"><span>Родственники</span><strong>{{ client?.relatives?.join(", ") || "-" }}</strong></div>
        </div>

        <h3 class="mt-8 text-lg font-semibold text-white">Уведомления</h3>
        <div class="mt-4 grid gap-3 md:grid-cols-2">
          <div class="notify-item"><span>Уведомления по SMS</span><strong>{{ client?.sms_notifications ? "Да" : "Нет" }}</strong></div>
          <div class="notify-item"><span>Уведомления по телефону</span><strong>{{ client?.phone_notifications ? "Да" : "Нет" }}</strong></div>
          <div class="notify-item"><span>Уведомления через социальные сети</span><strong>{{ client?.social_notifications ? "Да" : "Нет" }}</strong></div>
          <div class="notify-item"><span>Уведомления через электронную почту</span><strong>{{ client?.email_notifications ? "Да" : "Нет" }}</strong></div>
        </div>
      </div>

      <div v-else-if="activeTab === 'notes'" class="panel">
        <div class="flex items-center justify-between gap-4">
          <h2 class="panel-title">Заметки</h2>
        </div>

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
        <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <h2 class="panel-title">История</h2>
          <div class="w-full max-w-[240px]">
            <input type="text" class="field" placeholder="Дата пикер" />
          </div>
        </div>

        <p class="mt-4 text-sm text-slate-300">Все продажи этого клиента</p>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-full px-4 py-2 text-sm font-medium transition"
            :class="activeHistoryTab === 'all' ? 'bg-[#262626] text-white' : 'text-[#bdbdbd] hover:bg-white/10 hover:text-white'"
            @click="activeHistoryTab = 'all'"
          >
            Все ({{ history.length }})
          </button>
          <button
            type="button"
            class="rounded-full px-4 py-2 text-sm font-medium transition"
            :class="activeHistoryTab === 'purchase' ? 'bg-[#262626] text-white' : 'text-[#bdbdbd] hover:bg-white/10 hover:text-white'"
            @click="activeHistoryTab = 'purchase'"
          >
            Покупки ({{ history.filter((item) => item.type === "purchase").length }})
          </button>
          <button
            type="button"
            class="rounded-full px-4 py-2 text-sm font-medium transition"
            :class="activeHistoryTab === 'log' ? 'bg-[#262626] text-white' : 'text-[#bdbdbd] hover:bg-white/10 hover:text-white'"
            @click="activeHistoryTab = 'log'"
          >
            Лог действий ({{ history.filter((item) => item.type === "log").length }})
          </button>
        </div>

        <div class="mt-6 grid gap-4">
          <article v-for="item in visibleHistory" :key="item.id" class="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p class="text-sm text-slate-400">{{ formatDate(item.happened_at, true) }}</p>
            <p class="mt-3 text-base font-semibold text-white">{{ item.title }}</p>
            <p v-if="item.description" class="mt-3 text-sm text-slate-300">{{ item.description }}</p>
            <p v-if="item.amount_uzs != null" class="mt-3 text-sm text-slate-200">{{ formatUzs(item.amount_uzs) }}</p>
          </article>
        </div>
      </div>

      <div v-else-if="activeTab === 'preferences'" class="panel">
        <h2 class="panel-title">Предпочтения</h2>
        <p class="mt-4 text-sm text-slate-300">Последение покупки данного клиента:</p>

        <div class="mt-5 grid gap-4 md:grid-cols-2">
          <article v-for="item in preferences" :key="item.product_id" class="purchase-card">
            <p class="text-sm text-slate-400">{{ item.image_url ? "Фото товара" : "Товар" }}</p>
            <p class="mt-3 text-base font-semibold text-white">{{ item.product_name }}</p>
            <p class="mt-3 text-sm text-slate-300">{{ item.barcode || "-" }}</p>
          </article>
        </div>
      </div>

      <div v-else-if="activeTab === 'debts'" class="panel">
        <div class="flex flex-wrap gap-2">
          <button type="button" class="debt-pill" :class="{ 'debt-pill-active': activeDebtTab === 'all' }" @click="activeDebtTab = 'all'">Все</button>
          <button type="button" class="debt-pill" :class="{ 'debt-pill-active': activeDebtTab === 'paid' }" @click="activeDebtTab = 'paid'">Погашенные</button>
          <button type="button" class="debt-pill" :class="{ 'debt-pill-active': activeDebtTab === 'partial' }" @click="activeDebtTab = 'partial'">Частично погашенные</button>
          <button type="button" class="debt-pill" :class="{ 'debt-pill-active': activeDebtTab === 'unpaid' }" @click="activeDebtTab = 'unpaid'">Непогашенные</button>
        </div>

        <div class="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div class="grid gap-4">
            <article v-for="debt in visibleDebts" :key="debt.id" class="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p class="text-[24px] font-bold text-white">{{ formatUzs(debt.remaining_amount_uzs) }}</p>
              <p class="mt-2 text-sm text-slate-400">до {{ formatDate(debt.due_date) }}</p>
              <div class="mt-6">
                <p class="text-base font-semibold text-white">{{ client?.full_name || "-" }}</p>
                <p class="mt-2 text-sm text-slate-300">{{ debt.shop?.name || "-" }}</p>
                <p class="mt-2 text-sm text-slate-400">{{ debtStatusLabel(debt.status) }}</p>
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
                Чек о статусе долга
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
            <p class="mt-2 text-sm text-slate-400">Выдана: {{ formatDate(item.issued_at) }}</p>
            <p class="mt-2 text-sm text-slate-400">Истекает: {{ formatDate(item.expires_at) }}</p>
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
.notify-item,
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
.notify-item span,
.debt-stat span {
  font-size: 14px;
  color: #94a3b8;
}

.detail-item strong,
.notify-item strong,
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
  font-weight: 500;
  color: #bdbdbd;
  transition: 0.2s ease;
}

.debt-pill:hover {
  background: rgba(255,255,255,0.08);
  color: #fff;
}

.debt-pill-active {
  background: #262626;
  color: #fff;
}
</style>
