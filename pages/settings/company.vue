<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useHead } from "#imports";
import { useApi } from "~/composables/useApi";
import { useUserStore } from "~/store/useUserStore";

useHead({ title: "Настройки компании | Konkurent" });

type CompanySettingsResponse = {
  id?: string;
  company_id?: string;
  name?: string;
  login?: string;
  subdomain?: string;
  time_zone_id?: string;
  time_zone_name?: string;
  time_zone_gmt?: string;
};

type TimeZoneItem = {
  id: string;
  country_id?: string;
  name: string;
  short_name: string;
  gmt_offset: string;
};

type TimeZoneOption = {
  label: string;
  value: string;
  shortName: string;
  gmtOffset: string;
  name: string;
};

const { apiFetch } = useApi();
const userStore = useUserStore();
const toast = useToast();

const loading = ref(false);
const saving = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const company = ref<CompanySettingsResponse | null>(null);
const timeZones = ref<TimeZoneItem[]>([]);
const selectedTimeZoneId = ref("");

const companyName = computed(() => {
  return (
    company.value?.name ||
    userStore.userState.company?.name ||
    "Компания"
  );
});

const timeZoneOptions = computed<TimeZoneOption[]>(() =>
  timeZones.value.map((item) => ({
    label: `${item.name} (${item.short_name}, GMT ${item.gmt_offset})`,
    value: item.id,
    shortName: item.short_name,
    gmtOffset: item.gmt_offset,
    name: item.name,
  })),
);

const selectedTimeZone = computed(() => {
  return timeZoneOptions.value.find((item) => item.value === selectedTimeZoneId.value) || null;
});

const currentTimeZoneText = computed(() => {
  const activeOption = selectedTimeZone.value;
  if (activeOption) {
    return activeOption.label;
  }

  const currentName = String(company.value?.time_zone_name || "").trim();
  const currentOffset = String(company.value?.time_zone_gmt || "").trim();
  if (currentName) {
    return `${currentName}${currentOffset ? ` (GMT ${currentOffset})` : ""}`;
  }

  return "Asia/Tashkent (GMT +05:00)";
});

function clearMessages() {
  errorMessage.value = "";
  successMessage.value = "";
}

function normalizeApiMessage(error: any, fallback: string) {
  const message = error?.data?.message ?? error?.message;
  if (Array.isArray(message)) {
    return message.join(", ");
  }

  return String(message || fallback);
}

function normalizeTimeZone(raw: any): TimeZoneItem | null {
  const id = String(raw?.id ?? "").trim();
  const name = String(raw?.name ?? "").trim();
  const shortName = String(raw?.short_name ?? raw?.shortName ?? "").trim();
  const gmtOffset = String(raw?.gmt_offset ?? raw?.gmtOffset ?? "").trim();

  if (!id || !shortName) {
    return null;
  }

  return {
    id,
    country_id: raw?.country_id ? String(raw.country_id) : undefined,
    name: name || shortName,
    short_name: shortName,
    gmt_offset: gmtOffset || "+00:00",
  };
}

async function fetchWithFallback<T>(paths: string[], options: Record<string, any>) {
  let lastError: any = null;

  for (const path of paths) {
    try {
      return await apiFetch<T>(path, options);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function loadCompany() {
  const response = await fetchWithFallback<CompanySettingsResponse>(
    ["/company", "/v1/company"],
    { method: "GET" },
  );

  company.value = response ?? null;
  return company.value;
}

async function loadTimeZones() {
  const response = await fetchWithFallback<any>(
    ["/time-zone", "/v1/time-zone"],
    { method: "GET" },
  );

  const rawItems = Array.isArray(response?.time_zones)
    ? response.time_zones
    : Array.isArray(response?.data?.time_zones)
      ? response.data.time_zones
      : Array.isArray(response?.items)
        ? response.items
        : Array.isArray(response)
          ? response
          : [];

  timeZones.value = rawItems
    .map((item: any) => normalizeTimeZone(item))
    .filter(Boolean) as TimeZoneItem[];

  return timeZones.value;
}

function resolveDefaultTimeZoneId() {
  const byId = timeZoneOptions.value.find(
    (option) => option.value === String(company.value?.time_zone_id || "").trim(),
  );
  if (byId) {
    return byId.value;
  }

  const companyShortName = String(company.value?.time_zone_name || "").trim().toLowerCase();
  if (companyShortName) {
    const byShortName = timeZoneOptions.value.find(
      (option) => option.shortName.trim().toLowerCase() === companyShortName,
    );
    if (byShortName) {
      return byShortName.value;
    }
  }

  const tashkent = timeZoneOptions.value.find(
    (option) => option.shortName.trim().toLowerCase() === "asia/tashkent",
  );
  if (tashkent) {
    return tashkent.value;
  }

  return timeZoneOptions.value[0]?.value || "";
}

function applySelectedTimeZone() {
  selectedTimeZoneId.value = resolveDefaultTimeZoneId();
}

async function loadSettings() {
  loading.value = true;
  clearMessages();

  try {
    await Promise.all([loadCompany(), loadTimeZones()]);
    applySelectedTimeZone();
  } catch (error: any) {
    errorMessage.value = normalizeApiMessage(error, "Не удалось загрузить настройки компании");
  } finally {
    loading.value = false;
  }
}

function syncUserCompanyState(updatedCompany: CompanySettingsResponse) {
  if (!userStore.user) {
    return;
  }

  const currentCompany = userStore.user.company || {
    id: String(updatedCompany.id ?? updatedCompany.company_id ?? userStore.user.companyId ?? ""),
    companyId: String(updatedCompany.company_id ?? updatedCompany.id ?? userStore.user.companyId ?? ""),
    login: "",
    subdomain: "",
    name: "",
  };

  userStore.user = {
    ...userStore.user,
    companyId:
      String(updatedCompany.company_id ?? updatedCompany.id ?? userStore.user.companyId ?? ""),
    company: {
      ...currentCompany,
      id: String(updatedCompany.id ?? updatedCompany.company_id ?? currentCompany.id ?? ""),
      companyId: String(updatedCompany.company_id ?? updatedCompany.id ?? currentCompany.companyId ?? ""),
      login: String(updatedCompany.login ?? currentCompany.login ?? ""),
      subdomain: String(updatedCompany.subdomain ?? currentCompany.subdomain ?? ""),
      name: String(updatedCompany.name ?? currentCompany.name ?? ""),
    },
  };
}

async function saveSettings() {
  clearMessages();

  if (!selectedTimeZoneId.value) {
    errorMessage.value = "Выберите часовой пояс";
    return;
  }

  saving.value = true;

  try {
    const response = await fetchWithFallback<CompanySettingsResponse>(
      ["/company", "/v1/company"],
      {
        method: "PUT",
        body: {
          time_zone_id: selectedTimeZoneId.value,
        },
      },
    );

    company.value = response ?? company.value;
    applySelectedTimeZone();
    syncUserCompanyState(company.value || {});
    successMessage.value = "Часовой пояс сохранен";
    toast.add({ title: "Часовой пояс сохранен", color: "success" });
  } catch (error: any) {
    const rawMessage = normalizeApiMessage(error, "Не удалось сохранить часовой пояс");
    const invalidTimeZone =
      rawMessage.toLowerCase().includes("time_zone_id or time_zone_name is invalid") ||
      rawMessage.toLowerCase().includes("time_zone_id is invalid") ||
      rawMessage.toLowerCase().includes("time_zone_name is invalid");

    errorMessage.value = invalidTimeZone
      ? "Выбран некорректный часовой пояс"
      : "Не удалось сохранить часовой пояс";

    toast.add({
      title: errorMessage.value,
      description: invalidTimeZone ? undefined : rawMessage,
      color: "error",
    });
  } finally {
    saving.value = false;
  }
}

onMounted(loadSettings);
</script>

<template>
  <section class="company-settings-page text-white">
    <header class="page-header">
      <p class="page-kicker">Настройки</p>
      <h1>Настройки компании</h1>
      <p class="page-copy">
        Выберите часовой пояс компании. Это значение будет использоваться сервером при дальнейшей работе с датами и временем.
      </p>
    </header>

    <div v-if="loading" class="status-banner status-neutral">
      Загружаем настройки компании...
    </div>
    <div v-else-if="successMessage" class="status-banner status-success">
      {{ successMessage }}
    </div>
    <div v-else-if="errorMessage" class="status-banner status-error">
      {{ errorMessage }}
    </div>

    <article class="settings-card">
      <div class="card-header">
        <div>
          <p class="card-eyebrow">Компания</p>
          <h2 class="card-title">{{ companyName }}</h2>
          <p class="card-copy">
            Текущее значение: {{ currentTimeZoneText }}
          </p>
        </div>

        <UButton
          color="primary"
          class="save-button"
          :loading="saving"
          :disabled="loading || saving || !selectedTimeZoneId"
          @click="saveSettings"
        >
          Сохранить
        </UButton>
      </div>

      <div class="grid gap-5">
        <label class="field-group">
          <span class="field-label">Часовой пояс</span>
          <USelect
            v-model="selectedTimeZoneId"
            :items="timeZoneOptions"
            value-key="value"
            :disabled="loading || saving"
            placeholder="Выберите часовой пояс"
            :ui="{
              base: 'min-h-[56px] rounded-[18px] border-0 bg-[#404040] px-4 text-white',
              content: 'border border-white/10 bg-[#2f2f2f] text-white',
              item: 'text-white data-[highlighted]:bg-[#404040]',
            }"
          />
          <span class="field-hint">
            Используется формат: название, IANA short name и GMT offset.
          </span>
        </label>

        <div class="info-grid">
          <div class="info-card">
            <span class="info-label">Название</span>
            <strong>{{ selectedTimeZone?.name || "—" }}</strong>
          </div>
          <div class="info-card">
            <span class="info-label">IANA</span>
            <strong>{{ selectedTimeZone?.shortName || "Asia/Tashkent" }}</strong>
          </div>
          <div class="info-card">
            <span class="info-label">GMT</span>
            <strong>{{ selectedTimeZone?.gmtOffset || "+05:00" }}</strong>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.company-settings-page {
  display: grid;
  gap: 24px;
}

.page-header {
  display: grid;
  gap: 8px;
}

.page-kicker {
  color: #79b7ff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.page-header h1 {
  font-size: 34px;
  font-weight: 700;
  line-height: 1.05;
}

.page-copy {
  max-width: 760px;
  color: #bdbdbd;
  font-size: 15px;
  line-height: 1.6;
}

.status-banner {
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
  margin-bottom: 24px;
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

.card-copy {
  margin-top: 10px;
  color: #b7c3d7;
  font-size: 14px;
  line-height: 1.5;
}

.save-button {
  min-height: 46px;
  border-radius: 16px;
  padding-inline: 18px;
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

.field-hint {
  color: #9ca3af;
  font-size: 13px;
  line-height: 1.5;
}

.info-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-radius: 20px;
  background: #3a3a3a;
  padding: 16px;
}

.info-card strong {
  font-size: 16px;
  font-weight: 700;
  color: white;
}

.info-label {
  color: #9ca3af;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

@media (max-width: 900px) {
  .card-header {
    flex-direction: column;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
