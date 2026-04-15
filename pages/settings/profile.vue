<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useHead } from "#imports";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/store/useUserStore";
import { useApi } from "~/composables/useApi";

useHead({ title: "Настройки профиля | Konkurent.cases" });

type ProfileResponse = {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone_number?: string;
  avatar_url?: string | null;
  language?: string | null;
  theme?: string | null;
};

const userStore = useUserStore();
const { user, fullName } = storeToRefs(userStore);
const { apiFetch } = useApi();
const toast = useToast();

const firstName = ref("");
const lastName = ref("");
const currentPassword = ref("");
const newPassword = ref("");
const language = ref("ru");
const theme = ref("auto");
const avatarPreview = ref("");
const avatarFileName = ref("Avatar is not choosen");
const avatarError = ref("");
const fileInput = ref<HTMLInputElement | null>(null);
const loading = ref(false);
const profileSaving = ref(false);
const passwordSaving = ref(false);
const avatarSaving = ref(false);
const successMessage = ref("");
const errorMessage = ref("");
const objectUrl = ref<string | null>(null);

const languageOptions = [
  { label: "Русский", value: "ru" },
  { label: "O'zbekcha", value: "uz" },
  { label: "English", value: "en" },
];

const themeOptions = [
  { label: "Авто", value: "auto" },
  { label: "Светлая", value: "light" },
  { label: "Темная", value: "dark" },
];

const selectedLanguageLabel = computed(() => {
  return languageOptions.find((option) => option.value === language.value)?.label || "Русский";
});

const profileName = computed(() => {
  return (
    [firstName.value, lastName.value].filter(Boolean).join(" ") ||
    fullName.value ||
    user.value.name ||
    "Пользователь"
  );
});

function clearMessages() {
  successMessage.value = "";
  errorMessage.value = "";
}

function revokePreviewUrl() {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
    objectUrl.value = null;
  }
}

async function fetchProfile() {
  loading.value = true;
  clearMessages();

  try {
    const profile = await apiFetch<ProfileResponse>("/user/profile", { method: "GET" });
    firstName.value = profile?.first_name || "";
    lastName.value = profile?.last_name || "";
    language.value = profile?.language || "ru";
    theme.value = profile?.theme || "auto";
    avatarPreview.value = profile?.avatar_url || user.value.avatarUrl || "";
    avatarFileName.value = profile?.avatar_url ? "Current avatar" : "Avatar is not choosen";
  } catch (error: any) {
    errorMessage.value =
      error?.data?.message || error?.message || "Не удалось загрузить профиль";
  } finally {
    loading.value = false;
  }
}

async function syncUser() {
  await userStore.fetchMe();
}

async function saveProfile() {
  profileSaving.value = true;
  clearMessages();

  try {
    await apiFetch("/user/profile", {
      method: "PATCH",
      body: {
        first_name: firstName.value.trim(),
        last_name: lastName.value.trim(),
        language: language.value,
        theme: theme.value,
      },
    });

    await fetchProfile();
    await syncUser();
    successMessage.value = "Профиль обновлён";
  } catch (error: any) {
    errorMessage.value =
      error?.data?.message || error?.message || "Не удалось сохранить профиль";
  } finally {
    profileSaving.value = false;
  }
}

async function savePassword() {
  passwordSaving.value = true;
  clearMessages();

  try {
    await apiFetch("/user/profile/password", {
      method: "PATCH",
      body: {
        current_password: currentPassword.value,
        new_password: newPassword.value,
      },
    });

    currentPassword.value = "";
    newPassword.value = "";
    successMessage.value = "Пароль обновлён";
  } catch (error: any) {
    errorMessage.value =
      error?.data?.message || error?.message || "Не удалось обновить пароль";
  } finally {
    passwordSaving.value = false;
  }
}

function openFilePicker() {
  fileInput.value?.click();
}

async function uploadAvatar(file: File) {
  avatarSaving.value = true;
  clearMessages();

  try {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await apiFetch<{ avatar_url?: string | null }>("/user/profile/avatar", {
      method: "POST",
      body: formData as any,
    });

    avatarPreview.value = response?.avatar_url || avatarPreview.value;
    avatarFileName.value = file.name;
    await fetchProfile();
    await syncUser();
    successMessage.value = "Аватар обновлён";
  } catch (error: any) {
    errorMessage.value =
      error?.data?.message || error?.message || "Не удалось загрузить аватар";
  } finally {
    avatarSaving.value = false;
  }
}

async function removeAvatar() {
  avatarSaving.value = true;
  clearMessages();

  try {
    await apiFetch("/user/profile/avatar", { method: "DELETE" });
    revokePreviewUrl();
    avatarPreview.value = "";
    avatarFileName.value = "Avatar is not choosen";
    if (fileInput.value) {
      fileInput.value.value = "";
    }
    await fetchProfile();
    await syncUser();
    successMessage.value = "Аватар удалён";
  } catch (error: any) {
    errorMessage.value =
      error?.data?.message || error?.message || "Не удалось удалить аватар";
  } finally {
    avatarSaving.value = false;
  }
}

async function handleAvatarChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  avatarError.value = "";
  clearMessages();

  if (!file) {
    return;
  }

  const allowedTypes = ["image/jpeg", "image/png"];
  const maxSize = 5 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    avatarError.value = "Можно загружать только JPG или PNG.";
    target.value = "";
    return;
  }

  if (file.size > maxSize) {
    avatarError.value = "Размер файла должен быть не больше 5 МБ.";
    target.value = "";
    return;
  }

  revokePreviewUrl();
  objectUrl.value = URL.createObjectURL(file);
  avatarFileName.value = file.name;
  avatarPreview.value = objectUrl.value;

  await uploadAvatar(file);
}

onMounted(fetchProfile);
onBeforeUnmount(revokePreviewUrl);
</script>

<template>
  <section class="profile-settings mx-auto w-full max-w-[1120px] text-white">
    <div class="hero-panel">
      <div>
        <p class="hero-kicker">Settings</p>
        <h1 class="hero-title">Настройки профиля</h1>
        <p class="hero-copy">
          Управляйте основными данными, безопасностью аккаунта и внешним видом интерфейса.
        </p>
      </div>

      <div class="hero-user">
        <div class="hero-avatar">
          <img
            v-if="avatarPreview"
            :src="avatarPreview"
            :alt="profileName"
            class="h-full w-full object-cover"
          />
          <span v-else>{{ profileName.charAt(0).toUpperCase() }}</span>
        </div>

        <div>
          <p class="text-[20px] font-semibold text-white">{{ profileName }}</p>
          <p class="text-sm text-[#b7c3d7]">{{ user.phone || "Телефон не указан" }}</p>
          <p class="text-sm text-[#7ba9d8]">{{ user.role || "Роль не указана" }}</p>
        </div>
      </div>
    </div>

    <div v-if="loading" class="status-banner status-neutral">Загружаем профиль...</div>
    <div v-else-if="successMessage" class="status-banner status-success">{{ successMessage }}</div>
    <div v-else-if="errorMessage" class="status-banner status-error">{{ errorMessage }}</div>

    <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div class="space-y-6">
        <article class="settings-card">
          <div class="card-header">
            <div>
              <p class="card-eyebrow">Основные</p>
              <h2 class="card-title">Личные данные</h2>
            </div>

            <button
              type="button"
              class="secondary-action"
              :disabled="profileSaving"
              @click="saveProfile"
            >
              {{ profileSaving ? "Сохраняем..." : "Сохранить" }}
            </button>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="field-group">
              <span class="field-label">Имя</span>
              <input v-model="firstName" type="text" class="field-input" placeholder="Iskandarjon" />
            </label>

            <label class="field-group">
              <span class="field-label">Фамилия</span>
              <input v-model="lastName" type="text" class="field-input" placeholder="Yusupov" />
            </label>
          </div>
        </article>

        <article class="settings-card">
          <div class="card-header">
            <div>
              <p class="card-eyebrow">Фото</p>
              <h2 class="card-title">Аватар профиля</h2>
            </div>
          </div>

          <div class="avatar-layout">
            <div class="avatar-stage">
              <div class="avatar-preview">
                <img
                  v-if="avatarPreview"
                  :src="avatarPreview"
                  :alt="profileName"
                  class="h-full w-full object-cover"
                />
                <span v-else>{{ profileName.charAt(0).toUpperCase() }}</span>
              </div>
            </div>

            <div class="avatar-controls">
              <button
                type="button"
                class="primary-action"
                :disabled="avatarSaving"
                @click="openFilePicker"
              >
                {{ avatarSaving ? "Загружаем..." : "Выберите аватарку" }}
              </button>

              <div class="divider-line">
                <span>- или -</span>
              </div>

              <label class="upload-dropzone" @click="openFilePicker">
                <input
                  ref="fileInput"
                  type="file"
                  class="hidden"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  @change="handleAvatarChange"
                />
                <span class="upload-title">загрузите свое фото</span>
                <span class="upload-file">{{ avatarFileName }}</span>
              </label>

              <div class="flex flex-wrap gap-3">
                <button
                  v-if="avatarPreview"
                  type="button"
                  class="danger-action"
                  :disabled="avatarSaving"
                  @click="removeAvatar"
                >
                  Удалить фото
                </button>
              </div>

              <p v-if="avatarError" class="text-sm text-[#ff9a9a]">{{ avatarError }}</p>
              <p class="upload-hint">
                Формат загружаемого фото: JPG или PNG. Максимальный размер: 5МБ.
              </p>
            </div>
          </div>
        </article>
      </div>

      <div class="space-y-6">
        <article class="settings-card">
          <div class="card-header">
            <div>
              <p class="card-eyebrow">Безопасность</p>
              <h2 class="card-title">Доступ</h2>
            </div>

            <button
              type="button"
              class="secondary-action"
              :disabled="passwordSaving || !currentPassword || !newPassword"
              @click="savePassword"
            >
              {{ passwordSaving ? "Сохраняем..." : "Обновить" }}
            </button>
          </div>

          <div class="space-y-4">
            <label class="field-group">
              <span class="field-label">Текущий пароль</span>
              <input
                v-model="currentPassword"
                type="password"
                class="field-input"
                placeholder="Введите текущий пароль"
              />
            </label>

            <label class="field-group">
              <span class="field-label">Новый пароль</span>
              <input
                v-model="newPassword"
                type="password"
                class="field-input"
                placeholder="Введите новый пароль"
              />
            </label>
          </div>
        </article>

        <article class="settings-card">
          <div class="card-header">
            <div>
              <p class="card-eyebrow">Интерфейс</p>
              <h2 class="card-title">Персонализация</h2>
            </div>
          </div>

          <div class="space-y-5">
            <div class="field-group">
              <span class="field-label">Язык</span>
              <div class="theme-grid">
                <button
                  v-for="option in languageOptions"
                  :key="option.value"
                  type="button"
                  class="theme-option"
                  :class="{ 'theme-option-active': language === option.value }"
                  @click="language = option.value"
                >
                  <span>{{ option.label }}</span>
                </button>
              </div>
              <div class="choice-pill w-fit min-w-[180px] justify-between">
                <span>{{ selectedLanguageLabel }}</span>
                <Icon name="heroicons:language" class="h-5 w-5 text-[#7ba9d8]" />
              </div>
            </div>

            <div class="field-group">
              <span class="field-label">Тема</span>
              <div class="theme-grid">
                <button
                  v-for="option in themeOptions"
                  :key="option.value"
                  type="button"
                  class="theme-option"
                  :class="{ 'theme-option-active': theme === option.value }"
                  @click="theme = option.value"
                >
                  <span>{{ option.label }}</span>
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.profile-settings {
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

.hero-user {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 290px;
  padding: 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.05);
}

.hero-avatar,
.avatar-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 28px;
  background: linear-gradient(135deg, #1f78ff, #79a9de);
  color: white;
  font-size: 42px;
  font-weight: 700;
}

.hero-avatar {
  width: 84px;
  height: 84px;
  flex-shrink: 0;
}

.status-banner {
  margin-bottom: 18px;
  border-radius: 18px;
  padding: 14px 18px;
  font-size: 14px;
  font-weight: 600;
}

.status-neutral {
  background: rgba(73, 147, 221, 0.14);
  color: #b7d9ff;
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

.avatar-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
  align-items: start;
}

.avatar-stage {
  display: flex;
  justify-content: center;
  border-radius: 24px;
  background: #202020;
  padding: 18px;
}

.avatar-preview {
  width: 180px;
  height: 180px;
}

.avatar-controls {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.primary-action,
.secondary-action,
.danger-action {
  width: fit-content;
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

.divider-line {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #9ca3af;
}

.divider-line::before,
.divider-line::after {
  content: "";
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.upload-dropzone {
  display: flex;
  min-height: 160px;
  cursor: pointer;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px dashed rgba(123, 169, 216, 0.35);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(73, 147, 221, 0.08), rgba(255, 255, 255, 0.02));
  text-align: center;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.upload-dropzone:hover {
  border-color: #7ba9d8;
  background:
    linear-gradient(180deg, rgba(73, 147, 221, 0.14), rgba(255, 255, 255, 0.03));
}

.upload-title {
  font-size: 18px;
  font-weight: 700;
}

.upload-file {
  color: #b7c3d7;
  font-size: 14px;
}

.upload-hint {
  color: #9ca3af;
  font-size: 13px;
  line-height: 1.6;
}

.choice-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 18px;
  background: #404040;
  padding: 14px 16px;
  color: white;
}

.theme-grid {
  display: grid;
  gap: 10px;
}

.theme-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid transparent;
  border-radius: 18px;
  background: #404040;
  padding: 16px;
  color: white;
  font-weight: 600;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.theme-option:hover {
  background: #484848;
}

.theme-option-active {
  border-color: #4993dd;
  background: linear-gradient(180deg, rgba(73, 147, 221, 0.22), rgba(64, 64, 64, 0.9));
  transform: translateY(-1px);
}

@media (max-width: 960px) {
  .hero-panel {
    flex-direction: column;
  }

  .hero-user {
    min-width: 0;
  }

  .avatar-layout {
    grid-template-columns: 1fr;
  }

  .avatar-stage {
    justify-content: start;
  }
}

@media (max-width: 640px) {
  .profile-settings {
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

  .avatar-preview {
    width: 140px;
    height: 140px;
    font-size: 34px;
  }

  .card-header {
    flex-direction: column;
  }
}
</style>
