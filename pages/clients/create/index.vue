<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useHead } from "#imports";
import { useRoute, useRouter } from "vue-router";
import type { ClientGender, ClientUpsertPayload, NamedEntity } from "@/composables/useClients";
import { useClients } from "@/composables/useClients";
import { normalizeBirthDateForPayload, normalizeBirthDateForPicker } from "@/utils/birthDate";

const POS_CREATED_CLIENT_STORAGE_KEY = "pos:selected-client";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const {
  createClient,
  updateClient,
  getClientCard,
  getClientGroups,
  getClientTags,
} = useClients();

const submitting = ref(false);
const loading = ref(false);
const groups = ref<NamedEntity[]>([]);
const tags = ref<NamedEntity[]>([]);
const loadError = ref("");

const editId = computed(() => String(route.query.id || "").trim());
const isEditMode = computed(() => Boolean(editId.value));

useHead(() => ({
  title: `${isEditMode.value ? "Редактировать клиента" : "Новый клиент"} | Konkurent`,
}));

const form = reactive({
  firstName: String(route.query.first_name || "").trim(),
  lastName: "",
  middleName: "",
  birthDate: "",
  gender: "male" as ClientGender,
  phone: String(route.query.phone || "").trim(),
  maritalStatus: "single",
  language: "",
  address: "",
  email: "",
  telegram: "",
  facebook: "",
  instagram: "",
  relatives: "",
  groupIds: [] as string[],
  tagIds: [] as string[],
  tagSearch: "",
  smsNotifications: true,
  phoneNotifications: false,
  socialNotifications: false,
  emailNotifications: false,
});

const filteredTags = computed(() => {
  const query = form.tagSearch.trim().toLowerCase();
  if (!query) return tags.value;
  return tags.value.filter((tag) => tag.name.toLowerCase().includes(query));
});

function buildBirthDate() {
  return normalizeBirthDateForPayload(form.birthDate) || undefined;
}

function splitLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildSocialLinks() {
  return [form.telegram, form.facebook, form.instagram]
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildPayload(): ClientUpsertPayload {
  return {
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim() || undefined,
    middle_name: form.middleName.trim() || undefined,
    phone: form.phone.trim(),
    gender: form.gender,
    birth_date: buildBirthDate(),
    marital_status: form.maritalStatus || undefined,
    address: form.address.trim() || undefined,
    social_links: buildSocialLinks(),
    relatives: splitLines(form.relatives),
    registered_at: isEditMode.value ? undefined : new Date().toISOString(),
    group_ids: form.groupIds.length ? form.groupIds : undefined,
    tag_ids: form.tagIds.length ? form.tagIds : undefined,
    sms_notifications: form.smsNotifications,
    phone_notifications: form.phoneNotifications,
    social_notifications: form.socialNotifications,
    email_notifications: form.emailNotifications,
  };
}

function applyBirthDate(value: string | null) {
  form.birthDate = normalizeBirthDateForPicker(value);
}

function applySocialLinks(links: string[]) {
  form.telegram = links.find((link) => /t\.me|telegram|^\+?\d/i.test(link)) || "";
  form.facebook = links.find((link) => /facebook/i.test(link)) || "";
  form.instagram = links.find((link) => /instagram/i.test(link)) || "";
}

async function loadReferenceData() {
  const [groupsResult, tagsResult] = await Promise.allSettled([
    getClientGroups(),
    getClientTags(),
  ]);

  groups.value = groupsResult.status === "fulfilled" && Array.isArray(groupsResult.value)
    ? groupsResult.value
    : [];
  tags.value = tagsResult.status === "fulfilled" && Array.isArray(tagsResult.value)
    ? tagsResult.value
    : [];
}

async function loadClientForEdit() {
  if (!editId.value) return;

  const response = await getClientCard(editId.value);
  const client = response.client;

  form.firstName = client.first_name || "";
  form.lastName = client.last_name || "";
  form.middleName = client.middle_name || "";
  form.gender = client.gender || "unknown";
  form.phone = client.phone || "";
  form.maritalStatus = client.marital_status || "single";
  form.address = client.address || "";
  form.smsNotifications = Boolean(client.sms_notifications);
  form.phoneNotifications = Boolean(client.phone_notifications);
  form.socialNotifications = Boolean(client.social_notifications);
  form.emailNotifications = Boolean(client.email_notifications);
  form.groupIds = Array.isArray(client.groups) ? client.groups.map((item) => item.id) : [];
  form.tagIds = Array.isArray(client.tags) ? client.tags.map((item) => item.id) : [];
  form.relatives = Array.isArray(client.relatives) ? client.relatives.join("\n") : "";

  applyBirthDate(client.birth_date);
  applySocialLinks(Array.isArray(client.social_links) ? client.social_links : []);
}

function persistCreatedClientForPos(client: { id: string; full_name?: string; phone?: string; code?: string }) {
  if (!import.meta.client) return;

  const fullName =
    client.full_name ||
    [form.lastName, form.firstName, form.middleName].map((item) => item.trim()).filter(Boolean).join(" ");

  window.sessionStorage.setItem(
    POS_CREATED_CLIENT_STORAGE_KEY,
    JSON.stringify({
      id: client.id,
      full_name: fullName,
      phone: client.phone || form.phone.trim(),
      code: client.code || "",
    }),
  );
}

async function handleSubmit() {
  if (!form.firstName.trim() || !form.phone.trim() || !form.gender) {
    toast.add({
      title: "Заполните обязательные поля",
      description: "Нужны имя, телефон и пол.",
      color: "error",
    });
    return;
  }

  submitting.value = true;

  try {
    const payload = buildPayload();

    if (isEditMode.value) {
      await updateClient(editId.value, payload);
      toast.add({ title: "Клиент обновлен", color: "success" });
      await router.push(`/clients/card/${editId.value}`);
      return;
    }

    const created = await createClient(payload);
    toast.add({ title: "Клиент создан", color: "success" });

    const returnTo = String(route.query.returnTo || "").trim();
    if (returnTo) {
      persistCreatedClientForPos(created);
      await router.push(returnTo);
      return;
    }

    await router.push(created?.id ? `/clients/card/${created.id}` : "/clients?page=1&limit=10");
  } catch (error: any) {
    toast.add({
      title: isEditMode.value ? "Не удалось обновить клиента" : "Не удалось создать клиента",
      description: error?.data?.message || error?.message || undefined,
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
}

async function handleCancel() {
  const returnTo = String(route.query.returnTo || "").trim();
  if (returnTo) {
    await router.push(returnTo);
    return;
  }

  if (isEditMode.value && editId.value) {
    await router.push(`/clients/card/${editId.value}`);
    return;
  }

  await router.push("/clients?page=1&limit=10");
}

onMounted(async () => {
  loading.value = true;
  loadError.value = "";

  try {
    await loadReferenceData();
    await loadClientForEdit();
  } catch (error: any) {
    loadError.value = error?.data?.message || error?.message || "Не удалось загрузить форму клиента.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="rounded-[28px] border border-white/10 bg-[#1f1f1f] p-6 shadow-[0_28px_70px_rgba(2,6,23,0.35)]">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-slate-400">Клиенты</p>
          <h1 class="mt-3 text-[30px] font-bold tracking-[-0.04em] text-white">
            {{ isEditMode ? "Редактировать клиента" : "Новый клиент" }}
          </h1>
        </div>

        <button
          type="submit"
          form="client-create-form"
          class="action-button action-button-primary"
          :disabled="submitting || loading"
        >
          {{ submitting ? "Сохранение..." : isEditMode ? "Сохранить" : "Создать" }}
        </button>
      </div>
    </div>

    <div
      v-if="loadError"
      class="rounded-[20px] border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200"
    >
      {{ loadError }}
    </div>

    <form id="client-create-form" class="space-y-6" @submit.prevent="handleSubmit">
      <section class="panel">
        <h2 class="panel-title">Основные</h2>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label class="field">
            <span class="field-label">Имя</span>
            <span class="field-required">*</span>
            <input v-model="form.firstName" type="text" class="field-input" placeholder="Введите имя" />
          </label>

          <label class="field">
            <span class="field-label">Фамилия</span>
            <input v-model="form.lastName" type="text" class="field-input" placeholder="Введите фамилию" />
          </label>

          <label class="field">
            <span class="field-label">Отчество</span>
            <input v-model="form.middleName" type="text" class="field-input" placeholder="Введите отчество" />
          </label>
        </div>

        <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div class="field">
            <span class="field-label">День рождения</span>
            <div class="grid grid-cols-3 gap-3">
              <input v-model="form.birthDay" type="text" class="field-input" placeholder="ДД" maxlength="2" />
              <input v-model="form.birthMonth" type="text" class="field-input" placeholder="ММ" maxlength="2" />
              <input v-model="form.birthYear" type="text" class="field-input" placeholder="ГГГГ" maxlength="4" />
            </div>
          </div>

          <div class="field">
            <span class="field-label">Пол</span>
            <div class="flex flex-wrap gap-3">
              <label class="option-pill">
                <input v-model="form.gender" type="radio" value="male" class="hidden" />
                <span>Мужской</span>
              </label>
              <label class="option-pill">
                <input v-model="form.gender" type="radio" value="female" class="hidden" />
                <span>Женский</span>
              </label>
              <label class="option-pill">
                <input v-model="form.gender" type="radio" value="unknown" class="hidden" />
                <span>Неизвестно</span>
              </label>
            </div>
          </div>

          <label class="field">
            <span class="field-label">Телефон</span>
            <span class="field-required">*</span>
            <input v-model="form.phone" type="text" class="field-input" placeholder="+998 XX XXX XX XX" />
          </label>
        </div>

        <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label class="field">
            <span class="field-label">Семейное положение</span>
            <select v-model="form.maritalStatus" class="field-input">
              <option value="single">Без брака</option>
              <option value="married">В браке</option>
            </select>
          </label>

          <label class="field">
            <span class="field-label">Язык общения</span>
            <input v-model="form.language" type="text" class="field-input" placeholder="Введите язык общения" />
          </label>

          <label class="field">
            <span class="field-label">Адрес</span>
            <input v-model="form.address" type="text" class="field-input" placeholder="Введите адрес" />
          </label>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">Социальные сети</h2>

        <div class="grid gap-4 md:grid-cols-2">
          <label class="field">
            <span class="field-label">Электронная почта</span>
            <input v-model="form.email" type="email" class="field-input" placeholder="Введите email" />
          </label>

          <label class="field">
            <span class="field-label">Telegram</span>
            <input v-model="form.telegram" type="text" class="field-input" placeholder="Никнейм или номер телефона" />
          </label>

          <label class="field">
            <span class="field-label">Facebook</span>
            <input v-model="form.facebook" type="text" class="field-input" placeholder="Никнейм или ссылка на профиль" />
          </label>

          <label class="field">
            <span class="field-label">Instagram</span>
            <input v-model="form.instagram" type="text" class="field-input" placeholder="Введите никнейм" />
          </label>
        </div>

        <label class="field mt-5">
          <span class="field-label">Родственники</span>
          <textarea
            v-model="form.relatives"
            rows="4"
            class="field-input field-textarea"
            placeholder="Каждого родственника с новой строки"
          />
        </label>
      </section>

      <section class="panel">
        <h2 class="panel-title">Группы / Теги</h2>

        <div class="grid gap-4 md:grid-cols-2">
          <label class="field">
            <span class="field-label">Группы</span>
            <select v-model="form.groupIds" class="field-input field-multiselect" multiple>
              <option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}</option>
            </select>
          </label>

          <label class="field">
            <span class="field-label">Теги</span>
            <select v-model="form.tagIds" class="field-input field-multiselect" multiple>
              <option v-for="tag in filteredTags" :key="tag.id" :value="tag.id">{{ tag.name }}</option>
            </select>
          </label>
        </div>

        <label class="field mt-5">
          <span class="field-label">Поиск тегов</span>
          <input v-model="form.tagSearch" type="text" class="field-input" placeholder="Поиск тегов" />
        </label>
      </section>

      <section class="panel">
        <h2 class="panel-title">Уведомления</h2>

        <div class="grid gap-3 md:grid-cols-2">
          <label class="toggle-row">
            <span>Уведомления по SMS</span>
            <input v-model="form.smsNotifications" type="checkbox" class="toggle-box" />
          </label>

          <label class="toggle-row">
            <span>Уведомления по телефону</span>
            <input v-model="form.phoneNotifications" type="checkbox" class="toggle-box" />
          </label>

          <label class="toggle-row">
            <span>Уведомления через социальные сети</span>
            <input v-model="form.socialNotifications" type="checkbox" class="toggle-box" />
          </label>

          <label class="toggle-row">
            <span>Уведомления через электронную почту</span>
            <input v-model="form.emailNotifications" type="checkbox" class="toggle-box" />
          </label>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">Карты</h2>
        <div class="rounded-[20px] border border-dashed border-white/10 bg-white/[0.03] px-5 py-8 text-sm text-slate-400">
          Добавление карт оставил отдельным шагом на карточке клиента после создания.
        </div>
      </section>

      <div class="flex justify-end">
        <button type="button" class="action-button action-button-secondary" :disabled="submitting" @click="handleCancel">
          Отмена
        </button>
      </div>
    </form>
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

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.field-required {
  font-size: 13px;
  color: #fca5a5;
  margin-top: -4px;
}

.field-input {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
  padding: 14px 16px;
  color: #fff;
  outline: none;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.field-input::placeholder {
  color: #94a3b8;
}

.field-input:focus {
  border-color: rgba(56, 189, 248, 0.65);
  background: rgba(255, 255, 255, 0.08);
}

.field-multiselect {
  min-height: 150px;
}

.field-textarea {
  resize: vertical;
  min-height: 120px;
}

.option-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  cursor: pointer;
}

.option-pill:has(input:checked) {
  background: #262626;
  border-color: rgba(255, 255, 255, 0.14);
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  padding: 16px;
  color: #fff;
}

.toggle-box {
  height: 18px;
  width: 18px;
  accent-color: #4993dd;
}

.action-button {
  min-height: 52px;
  border-radius: 16px;
  padding: 0 24px;
  font-size: 15px;
  font-weight: 700;
  transition: 0.2s ease;
}

.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.action-button-secondary {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #262626;
  color: #fff;
}

.action-button-secondary:hover {
  background: #303030;
}

.action-button-primary {
  background: #1f78ff;
  color: #fff;
}

.action-button-primary:hover {
  background: #2a6ed9;
}
</style>
