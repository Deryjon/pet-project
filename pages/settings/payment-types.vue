<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useHead } from "#imports";
import { useApi } from "~/composables/useApi";
import { useUserStore } from "~/store/useUserStore";

useHead({ title: "Способы оплаты | Konkurent.cases" });

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

const { apiFetch } = useApi();
const userStore = useUserStore();
const toast = useToast();

const items = ref<EditablePaymentType[]>([]);
const loading = ref(false);
const creating = ref(false);
const successMessage = ref("");
const errorMessage = ref("");

const form = ref({
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
    userStore.user.companyId ||
      userStore.user.company?.companyId ||
      userStore.user.company?.id ||
      "",
  ).trim(),
);

function clearMessages() {
  successMessage.value = "";
  errorMessage.value = "";
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
    payment_type_id: item?.payment_type_id ? String(item.payment_type_id) : undefined,
    payment_type_name: item?.payment_type_name ? String(item.payment_type_name) : undefined,
  };
}

async function loadPaymentTypes() {
  clearMessages();

  if (!companyId.value) {
    items.value = [];
    errorMessage.value = "Не найден company_id для загрузки способов оплаты";
    return;
  }

  loading.value = true;
  try {
    const res: any = await apiFetch("/company-payment-type", {
      method: "GET",
      query: { company_id: companyId.value },
    });

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
    errorMessage.value =
      error?.data?.message || error?.message || "Не удалось загрузить способы оплаты";
  } finally {
    loading.value = false;
  }
}

async function createPaymentType() {
  clearMessages();

  if (!companyId.value) {
    toast.add({ title: "Не найден company_id", color: "error" });
    errorMessage.value = "Не найден company_id";
    return;
  }

  if (!form.value.name.trim()) {
    toast.add({ title: "Введите название способа оплаты", color: "warning" });
    errorMessage.value = "Введите название способа оплаты";
    return;
  }

  creating.value = true;
  try {
    await apiFetch("/company-payment-type", {
      method: "POST",
      body: {
        company_id: companyId.value,
        name: form.value.name.trim(),
        token: form.value.token.trim(),
        is_editable: form.value.is_editable,
        dont_show_in_make_payment: form.value.dont_show_in_make_payment,
        dont_show_in_settings: form.value.dont_show_in_settings,
        is_cash_payment_type: form.value.is_cash_payment_type,
        payment_type_id: form.value.payment_type_id.trim() || undefined,
        payment_type_name: form.value.payment_type_name.trim() || undefined,
      },
    });

    form.value = {
      name: "",
      token: "",
      is_editable: true,
      dont_show_in_make_payment: false,
      dont_show_in_settings: false,
      is_cash_payment_type: false,
      payment_type_id: "",
      payment_type_name: "Кастомный",
    };

    await loadPaymentTypes();
    successMessage.value = "Способ оплаты добавлен";
    toast.add({ title: "Способ оплаты добавлен", color: "success" });
  } catch (error: any) {
    toast.add({ title: "Не удалось добавить способ оплаты", color: "error" });
    errorMessage.value =
      error?.data?.message || error?.message || "Не удалось добавить способ оплаты";
  } finally {
    creating.value = false;
  }
}

async function updatePaymentType(item: EditablePaymentType) {
  clearMessages();
  item._saving = true;

  try {
    await apiFetch(`/company-payment-type/${encodeURIComponent(item.id)}`, {
      method: "PUT",
      body: {
        name: item.name?.trim(),
        token: item.token?.trim(),
        is_editable: Boolean(item.is_editable),
        dont_show_in_make_payment: Boolean(item.dont_show_in_make_payment),
        dont_show_in_settings: Boolean(item.dont_show_in_settings),
        is_cash_payment_type: Boolean(item.is_cash_payment_type),
        payment_type_id: item.payment_type_id?.trim() || undefined,
        payment_type_name: item.payment_type_name?.trim() || undefined,
      },
    });

    successMessage.value = `Способ оплаты "${item.name}" обновлен`;
    toast.add({ title: "Способ оплаты обновлен", color: "success" });
    await loadPaymentTypes();
  } catch (error: any) {
    errorMessage.value =
      error?.data?.message || error?.message || "Не удалось обновить способ оплаты";
  } finally {
    item._saving = false;
  }
}

async function deletePaymentType(item: EditablePaymentType) {
  clearMessages();
  item._deleting = true;

  try {
    await apiFetch(`/company-payment-type/${encodeURIComponent(item.id)}`, {
      method: "DELETE",
    });

    items.value = items.value.filter((entry) => entry.id !== item.id);
    successMessage.value = `Способ оплаты "${item.name}" удален`;
  } catch (error: any) {
    toast.add({ title: "Не удалось удалить способ оплаты", color: "error" });
    errorMessage.value =
      error?.data?.message || error?.message || "Не удалось удалить способ оплаты";
  } finally {
    item._deleting = false;
  }
}

onMounted(loadPaymentTypes);
</script>

<template>
  <section class="payment-types-page mx-auto w-full max-w-[1320px] p-6 text-white">
    <div class="hero-panel">
      <div>
        <p class="hero-kicker">Settings</p>
        <h1 class="hero-title">Способы оплаты</h1>
        <p class="hero-copy">
          Добавляйте, редактируйте и удаляйте способы оплаты, которые используются в продаже.
        </p>
      </div>

      <div class="hero-meta">
        <span class="meta-label">Company ID</span>
        <span class="meta-value">{{ companyId || "Не найден" }}</span>
      </div>
    </div>

    <div v-if="successMessage" class="status-banner status-success">{{ successMessage }}</div>
    <div v-else-if="errorMessage" class="status-banner status-error">{{ errorMessage }}</div>

    <div class="grid gap-6 xl:grid-cols-[420px_1fr]">
      <article class="settings-card">
        <div class="card-header">
          <div>
            <p class="card-eyebrow">Новый способ</p>
            <h2 class="card-title">Добавить оплату</h2>
          </div>
        </div>

        <div class="space-y-4">
          <label class="field-group">
            <span class="field-label">Название</span>
            <input
              v-model="form.name"
              type="text"
              class="field-input"
              placeholder="Click"
            />
          </label>

          <label class="field-group">
            <span class="field-label">Token</span>
            <input
              v-model="form.token"
              type="text"
              class="field-input"
              placeholder="Необязательно"
            />
          </label>

          <label class="field-group">
            <span class="field-label">Payment type id</span>
            <input
              v-model="form.payment_type_id"
              type="text"
              class="field-input"
              placeholder="00ed9cff-9576-432f-849b-7bbcc2fed640"
            />
          </label>

          <label class="field-group">
            <span class="field-label">Payment type name</span>
            <input
              v-model="form.payment_type_name"
              type="text"
              class="field-input"
              placeholder="Кастомный"
            />
          </label>

          <label class="toggle-row">
            <span>Редактируемый</span>
            <input v-model="form.is_editable" type="checkbox" class="toggle-input" />
          </label>

          <label class="toggle-row">
            <span>Не показывать при оплате</span>
            <input
              v-model="form.dont_show_in_make_payment"
              type="checkbox"
              class="toggle-input"
            />
          </label>

          <label class="toggle-row">
            <span>Не показывать в настройках</span>
            <input
              v-model="form.dont_show_in_settings"
              type="checkbox"
              class="toggle-input"
            />
          </label>

          <label class="toggle-row">
            <span>Наличный способ</span>
            <input
              v-model="form.is_cash_payment_type"
              type="checkbox"
              class="toggle-input"
            />
          </label>

          <button
            type="button"
            class="primary-action w-full justify-center"
            :disabled="creating || !companyId"
            @click="createPaymentType"
          >
            {{ creating ? "Сохраняем..." : "Добавить способ оплаты" }}
          </button>
        </div>
      </article>

      <article class="settings-card">
        <div class="card-header">
          <div>
            <p class="card-eyebrow">Список</p>
            <h2 class="card-title">Текущие способы оплаты</h2>
          </div>

          <button
            type="button"
            class="secondary-action"
            :disabled="loading"
            @click="loadPaymentTypes"
          >
            {{ loading ? "Обновляем..." : "Обновить" }}
          </button>
        </div>

        <div v-if="loading" class="empty-state">Загрузка способов оплаты...</div>

        <div v-else-if="items.length === 0" class="empty-state">
          Нет способов оплаты
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="item in items"
            :key="item.id"
            class="rounded-[24px] border border-white/5 bg-[#202020] p-5"
          >
            <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-[18px] font-semibold">{{ item.name || "Без названия" }}</p>
                <p class="text-sm text-[#9ca3af]">{{ item.id }}</p>
              </div>

              <button
                type="button"
                class="danger-action"
                :disabled="Boolean(item._deleting)"
                @click="deletePaymentType(item)"
              >
                {{ item._deleting ? "Удаляем..." : "Удалить" }}
              </button>
            </div>

            <div class="grid gap-4 lg:grid-cols-2">
              <label class="field-group lg:col-span-2">
                <span class="field-label">Название</span>
                <input v-model="item.name" type="text" class="field-input" />
              </label>

              <label class="field-group">
                <span class="field-label">Token</span>
                <input v-model="item.token" type="text" class="field-input" />
              </label>

              <label class="field-group">
                <span class="field-label">Company ID</span>
                <input :value="item.company_id || companyId" type="text" class="field-input field-disabled" disabled />
              </label>

              <label class="field-group">
                <span class="field-label">Payment type id</span>
                <input v-model="item.payment_type_id" type="text" class="field-input" />
              </label>

              <label class="field-group">
                <span class="field-label">Payment type name</span>
                <input v-model="item.payment_type_name" type="text" class="field-input" />
              </label>
            </div>

            <div class="mt-4 grid gap-3 md:grid-cols-2">
              <label class="toggle-row">
                <span>Редактируемый</span>
                <input v-model="item.is_editable" type="checkbox" class="toggle-input" />
              </label>

              <label class="toggle-row">
                <span>Наличный способ</span>
                <input
                  v-model="item.is_cash_payment_type"
                  type="checkbox"
                  class="toggle-input"
                />
              </label>

              <label class="toggle-row">
                <span>Не показывать при оплате</span>
                <input
                  v-model="item.dont_show_in_make_payment"
                  type="checkbox"
                  class="toggle-input"
                />
              </label>

              <label class="toggle-row">
                <span>Не показывать в настройках</span>
                <input
                  v-model="item.dont_show_in_settings"
                  type="checkbox"
                  class="toggle-input"
                />
              </label>
            </div>

            <div class="mt-4 flex justify-end">
              <button
                type="button"
                class="primary-action"
                :disabled="Boolean(item._saving || item._deleting)"
                @click="updatePaymentType(item)"
              >
                {{ item._saving ? "Сохраняем..." : "Сохранить" }}
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.payment-types-page {
  padding: 24px;
}

.hero-panel {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
  padding: 28px 32px;
  border-radius: 32px;
  background:
    radial-gradient(circle at top left, rgba(80, 140, 228, 0.3), transparent 38%),
    linear-gradient(135deg, rgba(18, 29, 44, 0.98), rgba(28, 36, 46, 0.94));
  border: 1px solid rgba(123, 169, 216, 0.18);
}

.hero-kicker {
  margin-bottom: 10px;
  color: #7ba9d8;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero-title {
  font-size: 38px;
  font-weight: 700;
  line-height: 1.05;
}

.hero-copy {
  max-width: 620px;
  margin-top: 12px;
  color: #b7c3d7;
  font-size: 15px;
  line-height: 1.6;
}

.hero-meta {
  min-width: 260px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.05);
  padding: 18px;
}

.meta-label {
  display: block;
  margin-bottom: 8px;
  color: #7ba9d8;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.meta-value {
  word-break: break-all;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
}

.status-banner {
  margin-bottom: 18px;
  border-radius: 18px;
  padding: 14px 18px;
  font-size: 14px;
  font-weight: 600;
}

.status-success {
  background: rgba(75, 133, 77, 0.24);
  color: #9ee5a0;
}

.status-error {
  background: rgba(157, 61, 61, 0.24);
  color: #ffb3b3;
}

.settings-card {
  border-radius: 28px;
  background: linear-gradient(180deg, #262626, #2e2e2e);
  border: 1px solid rgba(255, 255, 255, 0.04);
  padding: 24px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
}

.card-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.card-eyebrow {
  color: #7ba9d8;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.card-title {
  margin-top: 6px;
  font-size: 26px;
  font-weight: 700;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-label {
  color: #d8dde6;
  font-size: 14px;
  font-weight: 600;
}

.field-input {
  width: 100%;
  border: 1px solid transparent;
  border-radius: 18px;
  background: #404040;
  padding: 14px 16px;
  color: white;
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.field-input:focus {
  border-color: #4993dd;
  background: #454545;
}

.field-disabled {
  opacity: 0.7;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-radius: 18px;
  background: #202020;
  padding: 14px 16px;
  color: white;
  font-size: 14px;
  font-weight: 600;
}

.toggle-input {
  height: 18px;
  width: 18px;
  accent-color: #1f78ff;
}

.primary-action,
.secondary-action,
.danger-action {
  display: inline-flex;
  align-items: center;
  border-radius: 16px;
  padding: 14px 18px;
  font-weight: 700;
  transition: background 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
}

.primary-action {
  background: #1f78ff;
  color: white;
}

.secondary-action {
  background: #404040;
  color: white;
}

.danger-action {
  background: #6f3030;
  color: white;
}

.primary-action:hover,
.secondary-action:hover,
.danger-action:hover {
  transform: translateY(-1px);
}

.primary-action:hover {
  background: #2a84ff;
}

.secondary-action:hover {
  background: #4a4a4a;
}

.danger-action:hover {
  background: #823838;
}

.primary-action:disabled,
.secondary-action:disabled,
.danger-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.empty-state {
  border-radius: 20px;
  background: #202020;
  padding: 24px;
  color: #bdbdbd;
  text-align: center;
}

@media (max-width: 960px) {
  .hero-panel {
    flex-direction: column;
  }

  .hero-meta {
    min-width: 0;
  }
}

@media (max-width: 640px) {
  .payment-types-page {
    padding: 16px;
  }

  .hero-panel,
  .settings-card {
    padding: 20px;
    border-radius: 24px;
  }

  .hero-title {
    font-size: 30px;
  }

  .card-title {
    font-size: 22px;
  }

  .card-header {
    flex-direction: column;
  }
}
</style>
