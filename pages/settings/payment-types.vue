<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useHead } from "#imports";
import { useRouter } from "vue-router";
import { useApi } from "~/composables/useApi";
import { useUserStore } from "~/store/useUserStore";

useHead({ title: "Типы оплат | Konkurent" });

type PaymentTypeItem = {
  id: string;
  company_id?: string;
  name: string;
  token?: string;
  is_editable?: boolean;
  dont_show_in_make_payment?: boolean;
  dont_show_in_settings?: boolean;
  is_cash_payment_type?: boolean;
  payment_type_id?: string;
  payment_type_name?: string;
};

type EditablePaymentType = PaymentTypeItem & {
  _saving?: boolean;
  _deleting?: boolean;
};

type DraftMode = "create" | "edit";

const { apiFetch } = useApi();
const userStore = useUserStore();
const router = useRouter();
const toast = useToast();

const COMPANY_PAYMENT_TYPE_PATH = "/company-payment-type";

const items = ref<EditablePaymentType[]>([]);
const loading = ref(false);
const panelOpen = ref(false);
const panelSaving = ref(false);
const deletingId = ref("");
const panelMode = ref<DraftMode>("create");
const editingId = ref("");

const draft = reactive({
  name: "",
  token: "",
  is_editable: true,
  dont_show_in_make_payment: false,
  dont_show_in_settings: false,
  is_cash_payment_type: false,
  payment_type_id: "",
  payment_type_name: "Кастомный",
});

const companyId = computed(() =>
  String(
    userStore.userState.companyId ||
      userStore.userState.company?.companyId ||
      userStore.userState.company?.id ||
      "",
  ).trim(),
);

const settingsItems = computed(() => items.value.filter((item) => !item.dont_show_in_settings));

const stats = computed(() => {
  const total = settingsItems.value.length;
  const system = settingsItems.value.filter((item) => isSystemItem(item)).length;
  const custom = Math.max(0, total - system);
  const active = settingsItems.value.filter((item) => isDisplayed(item)).length;

  return { total, system, custom, active };
});

const sortedItems = computed(() =>
  [...settingsItems.value].sort((a, b) => {
    const systemDelta = Number(isSystemItem(b)) - Number(isSystemItem(a));
    if (systemDelta !== 0) return systemDelta;
    return String(a.name || "").localeCompare(String(b.name || ""), "ru");
  }),
);

const panelTitle = computed(() =>
  panelMode.value === "create" ? "Добавить тип оплаты" : "Редактировать тип оплаты",
);

const canSubmitDraft = computed(() => {
  if (panelSaving.value || !companyId.value) return false;
  return Boolean(String(draft.name || "").trim());
});

function clearDraft() {
  draft.name = "";
  draft.token = "";
  draft.is_editable = true;
  draft.dont_show_in_make_payment = false;
  draft.dont_show_in_settings = false;
  draft.is_cash_payment_type = false;
  draft.payment_type_id = "";
  draft.payment_type_name = "Кастомный";
}

function normalizeItem(item: any): EditablePaymentType {
  return {
    id: String(item?.id ?? ""),
    company_id: item?.company_id ? String(item.company_id) : undefined,
    name: String(item?.name ?? ""),
    token: String(item?.token ?? ""),
    is_editable: Boolean(item?.is_editable ?? true),
    dont_show_in_make_payment: Boolean(item?.dont_show_in_make_payment),
    dont_show_in_settings: Boolean(item?.dont_show_in_settings),
    is_cash_payment_type: Boolean(item?.is_cash_payment_type),
    payment_type_id: item?.payment_type_id
      ? String(item.payment_type_id)
      : item?.payment_type?.id
        ? String(item.payment_type.id)
        : undefined,
    payment_type_name: item?.payment_type_name
      ? String(item.payment_type_name)
      : item?.payment_type?.name
        ? String(item.payment_type.name)
        : undefined,
  };
}

function normalizeApiMessage(error: any, fallback: string) {
  const message = error?.data?.message ?? error?.message;
  if (Array.isArray(message)) {
    return message.join(", ");
  }

  return String(message || fallback);
}

function normalizeName(value: string) {
  return String(value || "").trim().toLowerCase();
}

function isSystemItem(item: EditablePaymentType) {
  const normalizedName = normalizeName(item.name);
  const normalizedType = normalizeName(item.payment_type_name || "");

  return (
    item.is_editable === false ||
    normalizedName === "наличные" ||
    normalizedName === "карта" ||
    normalizedType === "системный"
  );
}

function isDisplayed(item: EditablePaymentType) {
  return !item.dont_show_in_make_payment;
}

function paymentKind(item: EditablePaymentType) {
  return isSystemItem(item) ? "Системный" : "Кастомный";
}

async function loadPaymentTypes() {
  if (!companyId.value) {
    items.value = [];
    toast.add({ title: "Не найден company_id", color: "error" });
    return;
  }

  loading.value = true;
  try {
    let res: any;
    try {
      res = await apiFetch(COMPANY_PAYMENT_TYPE_PATH, {
        method: "GET",
        query: { limit: 1000, company_id: companyId.value },
      });
    } catch {
      res = await apiFetch(`/v1${COMPANY_PAYMENT_TYPE_PATH}`, {
        method: "GET",
        query: { limit: 1000, company_id: companyId.value },
      });
    }

    const rawItems = Array.isArray(res)
      ? res
      : Array.isArray(res?.company_payment_types)
        ? res.company_payment_types
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.company_payment_types)
            ? res.data.company_payment_types
            : [];

    items.value = rawItems.map(normalizeItem);
  } catch (error: any) {
    items.value = [];
    toast.add({
      title: "Не удалось загрузить типы оплат",
      description: normalizeApiMessage(error, "Ошибка загрузки"),
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

function openCreatePanel() {
  panelMode.value = "create";
  editingId.value = "";
  clearDraft();
  panelOpen.value = true;
}

function openEditPanel(item: EditablePaymentType) {
  panelMode.value = "edit";
  editingId.value = item.id;
  draft.name = item.name || "";
  draft.token = item.token || "";
  draft.is_editable = Boolean(item.is_editable ?? true);
  draft.dont_show_in_make_payment = Boolean(item.dont_show_in_make_payment);
  draft.dont_show_in_settings = Boolean(item.dont_show_in_settings);
  draft.is_cash_payment_type = Boolean(item.is_cash_payment_type);
  draft.payment_type_id = String(item.payment_type_id || "");
  draft.payment_type_name = String(item.payment_type_name || "Кастомный");
  panelOpen.value = true;
}

function closePanel() {
  panelOpen.value = false;
  panelSaving.value = false;
  editingId.value = "";
  clearDraft();
}

async function submitDraft() {
  if (!canSubmitDraft.value) return;

  panelSaving.value = true;
  try {
    const payload = {
      company_id: companyId.value,
      name: draft.name.trim(),
      token: draft.token.trim(),
      is_editable: draft.is_editable,
      dont_show_in_make_payment: draft.dont_show_in_make_payment,
      dont_show_in_settings: draft.dont_show_in_settings,
      is_cash_payment_type: draft.is_cash_payment_type,
      payment_type_id: draft.payment_type_id.trim() || undefined,
      payment_type_name: draft.payment_type_name.trim() || undefined,
    };

    if (panelMode.value === "create") {
      await apiFetch(COMPANY_PAYMENT_TYPE_PATH, {
        method: "POST",
        body: payload,
      });

      toast.add({ title: "Тип оплаты добавлен", color: "success" });
    } else {
      await apiFetch(`${COMPANY_PAYMENT_TYPE_PATH}/${encodeURIComponent(editingId.value)}`, {
        method: "PUT",
        body: payload,
      });

      toast.add({ title: "Тип оплаты обновлен", color: "success" });
    }

    await loadPaymentTypes();
    closePanel();
  } catch (error: any) {
    toast.add({
      title: panelMode.value === "create" ? "Не удалось добавить тип оплаты" : "Не удалось сохранить тип оплаты",
      description: normalizeApiMessage(error, "Ошибка сохранения"),
      color: "error",
    });
  } finally {
    panelSaving.value = false;
  }
}

async function toggleDisplay(item: EditablePaymentType) {
  if (item._saving) return;

  const nextValue = isDisplayed(item) ? true : false;
  item._saving = true;

  try {
    await apiFetch(`${COMPANY_PAYMENT_TYPE_PATH}/${encodeURIComponent(item.id)}`, {
      method: "PUT",
      body: {
        name: item.name?.trim(),
        token: item.token?.trim(),
        is_editable: Boolean(item.is_editable),
        dont_show_in_make_payment: nextValue,
        dont_show_in_settings: Boolean(item.dont_show_in_settings),
        is_cash_payment_type: Boolean(item.is_cash_payment_type),
        payment_type_id: item.payment_type_id?.trim() || undefined,
        payment_type_name: item.payment_type_name?.trim() || undefined,
      },
    });

    item.dont_show_in_make_payment = nextValue;
    toast.add({
      title: nextValue ? "Тип оплаты скрыт" : "Тип оплаты отображается",
      color: "success",
    });
  } catch (error: any) {
    toast.add({
      title: "Не удалось обновить отображение",
      description: normalizeApiMessage(error, "Ошибка обновления"),
      color: "error",
    });
  } finally {
    item._saving = false;
  }
}

async function deletePaymentType(item: EditablePaymentType) {
  if (isSystemItem(item)) {
    toast.add({
      title: "Системный тип оплаты нельзя удалить",
      color: "warning",
    });
    return;
  }

  deletingId.value = item.id;
  try {
    await apiFetch(`${COMPANY_PAYMENT_TYPE_PATH}/${encodeURIComponent(item.id)}`, {
      method: "DELETE",
    });

    items.value = items.value.filter((entry) => entry.id !== item.id);
    toast.add({ title: "Тип оплаты удален", color: "success" });
  } catch (error: any) {
    toast.add({
      title: "Не удалось удалить тип оплаты",
      description: normalizeApiMessage(error, "Ошибка удаления"),
      color: "error",
    });
  } finally {
    deletingId.value = "";
  }
}

function goBack() {
  router.back();
}

onMounted(loadPaymentTypes);
</script>

<template>
  <section class="payment-types-page w-full text-white">
    <header class="page-header">
      <div class="page-headline">
        <button type="button" class="icon-shell" @click="goBack">
          <Icon name="heroicons:arrow-left-20-solid" class="h-5 w-5" />
        </button>

        <div>
          <p class="page-kicker">Настройки / Валюты и оплаты</p>
          <h1 class="page-title">Типы оплат</h1>
        </div>
      </div>

      <button
        type="button"
        class="save-button"
        :disabled="!panelOpen || !canSubmitDraft"
        @click="submitDraft"
      >
        <Icon v-if="panelSaving" name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />
        <span>Сохранить</span>
      </button>
    </header>

    <section class="stats-grid">
      <article class="stat-card">
        <span class="stat-label">Всего типов</span>
        <span class="stat-value">{{ stats.total }}</span>
      </article>
      <article class="stat-card">
        <span class="stat-label">Системные</span>
        <span class="stat-value">{{ stats.system }}</span>
      </article>
      <article class="stat-card">
        <span class="stat-label">Кастомные</span>
        <span class="stat-value">{{ stats.custom }}</span>
      </article>
      <article class="stat-card">
        <span class="stat-label">Отображаются</span>
        <span class="stat-value">{{ stats.active }}</span>
      </article>
    </section>

    <section class="table-card">
      <div class="table-head">
        <span>Название</span>
        <span>Тип оплаты</span>
        <span>Действие</span>
        <span class="head-toggle">Отображение</span>
      </div>

      <div v-if="loading" class="table-empty">
        <Icon name="heroicons:arrow-path" class="h-5 w-5 animate-spin" />
        <span>Загружаем типы оплат...</span>
      </div>

      <div v-else-if="!sortedItems.length" class="table-empty">
        <Icon name="heroicons:credit-card" class="h-5 w-5" />
        <span>Список типов оплат пока пуст</span>
      </div>

      <div v-else class="table-body">
        <article
          v-for="item in sortedItems"
          :key="item.id"
          class="table-row"
        >
          <div class="cell-title">
            <div class="title-stack">
              <span class="title-text">{{ item.name || "Без названия" }}</span>
              <span class="title-id">{{ item.id }}</span>
            </div>
          </div>

          <div class="cell-type">
            <span :class="['type-badge', isSystemItem(item) ? 'type-badge-system' : 'type-badge-custom']">
              {{ paymentKind(item) }}
            </span>
          </div>

          <div class="cell-actions">
            <button
              type="button"
              class="icon-button"
              :class="isSystemItem(item) ? 'icon-button-system' : 'icon-button-custom'"
              @click="openEditPanel(item)"
            >
              <Icon name="heroicons:pencil-square-20-solid" class="h-5 w-5" />
            </button>

            <button
              type="button"
              class="icon-button"
              :class="isSystemItem(item) ? 'icon-button-disabled' : 'icon-button-danger'"
              :disabled="isSystemItem(item) || deletingId === item.id"
              @click="deletePaymentType(item)"
            >
              <Icon
                v-if="deletingId === item.id"
                name="heroicons:arrow-path"
                class="h-5 w-5 animate-spin"
              />
              <Icon
                v-else
                name="heroicons:x-mark-20-solid"
                class="h-5 w-5"
              />
            </button>
          </div>

          <div class="cell-toggle">
            <button
              type="button"
              class="toggle-shell"
              :class="isDisplayed(item) ? 'toggle-shell-on' : 'toggle-shell-off'"
              :disabled="item._saving"
              @click="toggleDisplay(item)"
            >
              <span class="toggle-thumb" :class="isDisplayed(item) ? 'toggle-thumb-on' : 'toggle-thumb-off'" />
            </button>
          </div>
        </article>
      </div>
    </section>

    <footer class="page-footer">
      <button type="button" class="add-button" @click="openCreatePanel">
        <Icon name="heroicons:plus-20-solid" class="h-5 w-5" />
        <span>Добавить тип оплаты</span>
      </button>
    </footer>

    <UModal
      v-model:open="panelOpen"
      :ui="{
        overlay: 'bg-black/60 backdrop-blur-sm',
        content: 'mx-4 max-h-[calc(100dvh-32px)] max-w-[560px] overflow-hidden rounded-[24px] border border-white/10 bg-[#262626] text-white shadow-2xl ring-0 sm:mx-0',
      }"
    >
      <template #content>
        <div class="modal-body">
          <div class="modal-header">
            <div>
              <p class="modal-kicker">Типы оплат</p>
              <h2 class="modal-title">{{ panelTitle }}</h2>
            </div>

            <button type="button" class="icon-shell" @click="closePanel">
              <Icon name="heroicons:x-mark-20-solid" class="h-5 w-5" />
            </button>
          </div>

          <div class="form-grid">
            <label class="field-group">
              <span class="field-label">Название</span>
              <input v-model="draft.name" type="text" class="field-input" placeholder="Например, Click QR" />
            </label>

            <label class="field-group">
              <span class="field-label">Тип оплаты</span>
              <input v-model="draft.payment_type_name" type="text" class="field-input" placeholder="Кастомный" />
            </label>

            <label class="field-group">
              <span class="field-label">Token</span>
              <input v-model="draft.token" type="text" class="field-input" placeholder="Необязательно" />
            </label>

            <label class="field-group">
              <span class="field-label">ID способа оплаты</span>
              <input
                v-model="draft.payment_type_id"
                type="text"
                class="field-input"
                placeholder="00ed9cff-9576-432f-849b-7bbcc2fed640"
              />
            </label>
          </div>

          <div class="switch-list">
            <label class="switch-row">
              <span>Редактируемый</span>
              <input v-model="draft.is_editable" type="checkbox" class="hidden-toggle" />
              <span class="mini-toggle" :class="draft.is_editable ? 'mini-toggle-on' : 'mini-toggle-off'">
                <span class="mini-thumb" :class="draft.is_editable ? 'mini-thumb-on' : 'mini-thumb-off'" />
              </span>
            </label>

            <label class="switch-row">
              <span>Показывать в продаже</span>
              <input v-model="draft.dont_show_in_make_payment" type="checkbox" class="hidden-toggle" />
              <span
                class="mini-toggle"
                :class="!draft.dont_show_in_make_payment ? 'mini-toggle-on' : 'mini-toggle-off'"
              >
                <span
                  class="mini-thumb"
                  :class="!draft.dont_show_in_make_payment ? 'mini-thumb-on' : 'mini-thumb-off'"
                />
              </span>
            </label>

            <label class="switch-row">
              <span>Скрыть в настройках</span>
              <input v-model="draft.dont_show_in_settings" type="checkbox" class="hidden-toggle" />
              <span class="mini-toggle" :class="draft.dont_show_in_settings ? 'mini-toggle-on' : 'mini-toggle-off'">
                <span class="mini-thumb" :class="draft.dont_show_in_settings ? 'mini-thumb-on' : 'mini-thumb-off'" />
              </span>
            </label>

            <label class="switch-row">
              <span>Наличный способ</span>
              <input v-model="draft.is_cash_payment_type" type="checkbox" class="hidden-toggle" />
              <span class="mini-toggle" :class="draft.is_cash_payment_type ? 'mini-toggle-on' : 'mini-toggle-off'">
                <span class="mini-thumb" :class="draft.is_cash_payment_type ? 'mini-thumb-on' : 'mini-thumb-off'" />
              </span>
            </label>
          </div>

          <div class="modal-footer">
            <button type="button" class="ghost-button" @click="closePanel">Отмена</button>
            <button
              type="button"
              class="save-button"
              :disabled="!canSubmitDraft"
              @click="submitDraft"
            >
              <Icon v-if="panelSaving" name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />
              <span>Сохранить</span>
            </button>
          </div>
        </div>
      </template>
    </UModal>
  </section>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.page-headline {
  display: flex;
  align-items: center;
  gap: 14px;
}

.page-kicker {
  color: #79b7ff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.page-title {
  margin-top: 4px;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.05;
}

.icon-shell,
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 16px;
  transition: background 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
}

.icon-shell {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #404040;
  color: #f5f7fb;
}

.icon-shell:hover {
  background: #505050;
  transform: translateY(-1px);
}

.save-button,
.add-button,
.ghost-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  border-radius: 18px;
  padding: 0 18px;
  font-size: 14px;
  font-weight: 700;
  transition: background 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
}

.save-button {
  background: #1f78ff;
  color: white;
}

.save-button:hover:not(:disabled) {
  background: #2e84ff;
  transform: translateY(-1px);
}

.save-button:disabled,
.add-button:disabled,
.ghost-button:disabled,
.icon-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  transform: none;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}

.stat-card {
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #262626;
  padding: 18px;
}

.stat-label {
  display: block;
  color: #9b9b9b;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.stat-value {
  display: block;
  margin-top: 10px;
  font-size: 28px;
  font-weight: 700;
}

.table-card {
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #262626;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) 170px 150px 140px;
  gap: 16px;
  align-items: center;
}

.table-head {
  padding: 18px 22px;
  color: #9b9b9b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.head-toggle {
  text-align: center;
}

.table-body {
  padding: 8px;
}

.table-row {
  min-height: 82px;
  margin-bottom: 8px;
  border-radius: 16px;
  background: #1f1f1f;
  padding: 0 14px;
}

.table-row:last-child {
  margin-bottom: 0;
}

.title-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title-text {
  color: #8ec3ff;
  font-size: 15px;
  font-weight: 700;
}

.title-id {
  color: #9b9b9b;
  font-size: 12px;
  line-height: 1.4;
  word-break: break-all;
}

.type-badge,
.feature-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.type-badge-system {
  background: rgba(255, 255, 255, 0.08);
  color: #d8d8d8;
}

.type-badge-custom {
  background: rgba(31, 120, 255, 0.16);
  color: #8ec3ff;
}

.cell-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-button-system {
  background: #404040;
  color: white;
}

.icon-button-custom {
  background: rgba(31, 120, 255, 0.15);
  color: #8ec3ff;
}

.icon-button-danger {
  background: rgba(220, 38, 38, 0.14);
  color: #ff8b8b;
}

.icon-button-disabled {
  background: #404040;
  color: #9b9b9b;
}

.icon-button-system:hover:not(:disabled),
.icon-button-disabled:hover:not(:disabled) {
  background: #505050;
}

.icon-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.cell-toggle {
  display: flex;
  justify-content: center;
}

.toggle-shell,
.mini-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 56px;
  height: 32px;
  border-radius: 999px;
  padding: 4px;
  transition: background 0.2s ease, opacity 0.2s ease;
}

.toggle-shell-on,
.mini-toggle-on {
  background: #1f78ff;
}

.toggle-shell-off,
.mini-toggle-off {
  background: #404040;
}

.toggle-thumb,
.mini-thumb {
  display: block;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: white;
  transition: transform 0.2s ease;
}

.toggle-thumb-on,
.mini-thumb-on {
  transform: translateX(24px);
}

.toggle-thumb-off,
.mini-thumb-off {
  transform: translateX(0);
}

.table-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 220px;
  color: #bdbdbd;
}

.page-footer {
  margin-top: 22px;
}

.add-button {
  background: #404040;
  color: white;
  border: 1px dashed rgba(255, 255, 255, 0.14);
}

.add-button:hover {
  background: #505050;
}

.modal-body {
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  padding: 22px;
  scrollbar-gutter: stable;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.modal-kicker {
  color: #79b7ff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.modal-title {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 700;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  color: #d7d7d7;
  font-size: 13px;
  font-weight: 600;
}

.field-input {
  width: 100%;
  min-height: 48px;
  border: 1px solid #404040;
  border-radius: 14px;
  background: #1f1f1f;
  padding: 0 14px;
  color: white;
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.field-input:focus {
  border-color: #1f78ff;
  background: #1f1f1f;
}

.switch-list {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-radius: 14px;
  background: #1f1f1f;
  padding: 14px 16px;
  font-size: 14px;
  font-weight: 600;
}

.hidden-toggle {
  display: none;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.ghost-button {
  background: #404040;
  color: white;
}

.ghost-button:hover {
  background: #505050;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .table-head,
  .table-row {
    grid-template-columns: minmax(0, 1fr) 140px 120px 110px;
  }
}

@media (max-width: 768px) {
  .payment-types-page {
    padding: 0;
  }

  .page-header {
    align-items: stretch;
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .table-head {
    display: none;
  }

  .table-row {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 16px;
  }

  .cell-actions,
  .cell-toggle {
    justify-content: flex-start;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column;
  }
}
</style>
