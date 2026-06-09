<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import CompanyTabs from "@/components/platform/company/CompanyTabs.vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import { usePlatformCompanies } from "@/composables/usePlatformCompanies";
import { usePlatformFormUi } from "@/composables/usePlatformFormUi";
import { usePlatformRoles } from "@/composables/usePlatformRoles";

definePageMeta({ layout: "platform" });
useHead({ title: "Настройки компании | Konkurent" });

const route = useRoute();
const companyId = computed(() => String(route.params.id || "").trim());
const { getCompany } = usePlatformCompanies();
const { softSelectUi } = usePlatformFormUi();
const { getCompanyRoles } = usePlatformRoles();
const toast = useToast();

const company = ref<any | null>(null);
const roles = ref<any[]>([]);
const form = reactive({
  defaultRole: "",
  timezone: "Asia/Tashkent",
  notificationsEnabled: true,
});

const roleOptions = computed(() =>
  roles.value.map((role) => ({
    label: role.name || role.id,
    value: role.id,
  })),
);

const storageKey = computed(() => `platform-company-settings-${companyId.value}`);

function loadLocalSettings() {
  if (!import.meta.client) return;

  try {
    const raw = localStorage.getItem(storageKey.value);
    if (!raw) return;
    Object.assign(form, JSON.parse(raw));
  } catch (_) {}
}

function saveLocalSettings() {
  if (!import.meta.client) return;

  try {
    localStorage.setItem(storageKey.value, JSON.stringify(form));
  } catch (_) {}
}

async function loadData() {
  const [companyResponse, companyRoles] = await Promise.all([
    getCompany(companyId.value),
    getCompanyRoles(companyId.value),
  ]);

  company.value = companyResponse;
  roles.value = companyRoles;
  if (!form.defaultRole) {
    form.defaultRole = companyRoles[0]?.id || "";
  }
  loadLocalSettings();
}

function submit() {
  saveLocalSettings();
  toast.add({ title: "Настройки компании сохранены локально", color: "success" });
}

onMounted(loadData);
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Настройки" :title="company?.name ? `Настройки: ${company.name}` : 'Настройки компании'" description="Локальные настройки компании на уровне платформенной панели." />
    <CompanyTabs :company-id="companyId" />

    <DataPanel title="Параметры компании" description="Временное хранение параметров в локальном состоянии без изменений backend-контрактов.">
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submit">
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Роль по умолчанию</span>
          <USelect v-model="form.defaultRole" :items="roleOptions" value-key="value" :ui="softSelectUi" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Часовой пояс</span>
          <USelect v-model="form.timezone" :items="[{ label: 'Asia/Tashkent', value: 'Asia/Tashkent' }, { label: 'UTC', value: 'UTC' }, { label: 'Europe/Moscow', value: 'Europe/Moscow' }]" value-key="value" :ui="softSelectUi" />
        </label>
        <label class="md:col-span-2 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-[14px] text-slate-700 ring-1 ring-slate-200">
          <input v-model="form.notificationsEnabled" type="checkbox" class="h-4 w-4 accent-teal-600" />
          Уведомления включены
        </label>
        <div class="md:col-span-2 flex justify-end">
          <UButton type="submit" color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800">Сохранить</UButton>
        </div>
      </form>
    </DataPanel>
  </div>
</template>
