<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import CompanyTabs from "@/components/platform/company/CompanyTabs.vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import EmptyState from "@/components/platform/EmptyState.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatsCard from "@/components/platform/StatsCard.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import { usePlatformCompanies } from "@/composables/usePlatformCompanies";
import { usePlatformFormUi } from "@/composables/usePlatformFormUi";
import { usePlatformUsers } from "@/composables/usePlatformUsers";

definePageMeta({ layout: "platform" });
useHead({ title: "Company Overview | Konkurent" });

const route = useRoute();
const router = useRouter();
const companyId = computed(() => String(route.params.id || "").trim());
const { getCompany, updateCompany, updateCompanyStatus, deleteCompany } = usePlatformCompanies();
const { getCompanyUsers } = usePlatformUsers();
const { softInputUi } = usePlatformFormUi();
const toast = useToast();

const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const company = ref<any | null>(null);
const users = ref<any[]>([]);

const form = reactive({
  name: "",
  login: "",
  subdomain: "",
  status: "active" as "active" | "inactive",
});

const shops = computed(() => company.value?.shops || []);
const activeShopsCount = computed(() => shops.value.filter((shop: any) => shop.status === "active").length);
const activeUsersCount = computed(() => users.value.filter((user: any) => user.status === "active").length);
const latestUsers = computed(() => users.value.slice(0, 4));

function resolveError(error: any, fallback: string) {
  const message = error?.data?.message ?? error?.response?._data?.message;
  return Array.isArray(message) ? message.join(", ") : message || error?.message || fallback;
}

function applyCompanyToForm() {
  form.name = company.value?.name || "";
  form.login = company.value?.login || "";
  form.subdomain = company.value?.subdomain || "";
  form.status = company.value?.status || "active";
}

async function loadData() {
  loading.value = true;
  errorMessage.value = "";

  try {
    company.value = await getCompany(companyId.value);
    applyCompanyToForm();
  } catch (error: any) {
    company.value = null;
    errorMessage.value = resolveError(error, "Не удалось загрузить компанию");
    loading.value = false;
    return;
  }

  try {
    users.value = await getCompanyUsers(companyId.value);
  } catch (error: any) {
    users.value = [];
    errorMessage.value = resolveError(error, "Не удалось загрузить сотрудников компании");
  } finally {
    loading.value = false;
  }
}

async function saveCompany() {
  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const updatedCompany = await updateCompany(companyId.value, {
      name: form.name.trim(),
      login: form.login.trim(),
      subdomain: form.subdomain.trim(),
    });

    company.value = updatedCompany.status === form.status
      ? updatedCompany
      : await updateCompanyStatus(companyId.value, form.status === "active");

    applyCompanyToForm();
    successMessage.value = "Данные компании обновлены";
    toast.add({ title: "Компания обновлена", color: "success" });
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось обновить компанию");
    toast.add({ title: "Не удалось обновить компанию", description: errorMessage.value, color: "error" });
  } finally {
    saving.value = false;
  }
}

async function removeCompany() {
  if (typeof window !== "undefined" && !window.confirm(`Удалить компанию "${company.value?.name || ""}"?`)) {
    return;
  }

  deleting.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await deleteCompany(companyId.value);
    toast.add({ title: "Компания удалена", color: "success" });
    await router.push("/platform/companies");
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось удалить компанию");
    toast.add({ title: "Не удалось удалить компанию", description: errorMessage.value, color: "error" });
  } finally {
    deleting.value = false;
  }
}

watch(companyId, () => {
  if (!companyId.value) return;
  loadData();
}, { immediate: true });
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Companies" :title="company?.name || 'Company Overview'" description="Основная информация по компании, быстрые показатели и переходы в рабочие разделы." />
    <CompanyTabs :company-id="companyId" />

    <div v-if="errorMessage" class="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-[14px] text-rose-600">{{ errorMessage }}</div>
    <div v-if="successMessage" class="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-[14px] text-emerald-700">{{ successMessage }}</div>

    <div v-if="company" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard label="Company ID" :value="company.id || '—'" helper="Идентификатор записи" icon="heroicons:identification" />
      <StatsCard label="Shops" :value="company.shopsCount ?? shops.length" helper="Всего филиалов" icon="heroicons:map-pin" />
      <StatsCard label="Active Shops" :value="activeShopsCount" helper="Со статусом active" icon="heroicons:bolt" />
      <StatsCard label="Active Users" :value="activeUsersCount" helper="Активные сотрудники" icon="heroicons:users" />
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <DataPanel title="Company Details" description="Редактирование названия, логина, поддомена и статуса компании.">
        <div v-if="loading" class="space-y-4">
          <div class="h-14 animate-pulse rounded-2xl bg-slate-100/80" />
          <div class="h-14 animate-pulse rounded-2xl bg-slate-100/80" />
          <div class="h-14 animate-pulse rounded-2xl bg-slate-100/80" />
        </div>

        <form v-else-if="company" class="grid gap-4 md:grid-cols-2" @submit.prevent="saveCompany">
          <label class="space-y-2 md:col-span-2">
            <span class="text-[13px] font-semibold text-slate-700">Название компании</span>
            <UInput v-model="form.name" type="text" required placeholder="Введите название компании" :ui="softInputUi" />
          </label>
          <label class="space-y-2">
            <span class="text-[13px] font-semibold text-slate-700">Логин</span>
            <UInput v-model="form.login" type="text" required placeholder="company-admin" :ui="softInputUi" />
          </label>
          <label class="space-y-2">
            <span class="text-[13px] font-semibold text-slate-700">Поддомен</span>
            <UInput v-model="form.subdomain" type="text" required placeholder="company" :ui="softInputUi" />
          </label>
          <div class="space-y-2 md:col-span-2">
            <span class="text-[13px] font-semibold text-slate-700">Статус</span>
            <div class="flex min-h-[48px] items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
              <div class="flex items-center gap-3">
                <StatusBadge :status="form.status" />
                <span class="text-[14px] font-medium text-slate-600">{{ form.status === "active" ? "Активна" : "Отключена" }}</span>
              </div>
              <USwitch :model-value="form.status === 'active'" @update:model-value="form.status = $event ? 'active' : 'inactive'" />
            </div>
          </div>
          <div class="flex flex-wrap justify-between gap-3 pt-2 md:col-span-2">
            <UButton type="button" color="error" variant="soft" class="rounded-2xl" :loading="deleting" @click="removeCompany">Удалить компанию</UButton>
            <UButton type="submit" color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" :loading="saving">Сохранить изменения</UButton>
          </div>
        </form>

        <EmptyState v-else title="Компания не найдена" description="Проверьте идентификатор компании и повторите попытку." icon="heroicons:building-office-2" />
      </DataPanel>

      <div class="space-y-6">
        <DataPanel title="Latest Users" description="Последние сотрудники компании для быстрого контроля доступа.">
          <div v-if="loading" class="space-y-3">
            <div v-for="item in 4" :key="item" class="h-20 animate-pulse rounded-[24px] bg-slate-100/80" />
          </div>

          <EmptyState v-else-if="!latestUsers.length" title="Сотрудников пока нет" description="Создайте первого сотрудника в разделе Users." icon="heroicons:user-plus" />

          <div v-else class="space-y-3">
            <article v-for="user in latestUsers" :key="user.id" class="rounded-[24px] border border-slate-200/70 bg-white/88 p-4 shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate text-[16px] font-semibold text-slate-950">{{ user.fullName }}</p>
                  <p class="mt-1 truncate text-[13px] text-slate-500">{{ user.phone || "Телефон не указан" }}</p>
                </div>
                <StatusBadge :status="user.status" />
              </div>
              <p class="mt-3 text-[13px] text-slate-500">{{ user.roleName || user.roleId || "Роль не указана" }}</p>
            </article>
          </div>
        </DataPanel>

        <DataPanel title="Quick Actions" description="Навигация по модулям компании без возврата к общему списку.">
          <div class="grid gap-3 sm:grid-cols-2">
            <NuxtLink :to="`/platform/companies/${companyId}/users`" class="rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-[15px] font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_18px_40px_rgba(13,148,136,0.12)]">Users</NuxtLink>
            <NuxtLink :to="`/platform/companies/${companyId}/shops`" class="rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-[15px] font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_18px_40px_rgba(13,148,136,0.12)]">Shops</NuxtLink>
            <NuxtLink :to="`/platform/companies/${companyId}/roles`" class="rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-[15px] font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_18px_40px_rgba(13,148,136,0.12)]">Roles</NuxtLink>
            <NuxtLink :to="`/platform/companies/${companyId}/logs`" class="rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-[15px] font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_18px_40px_rgba(13,148,136,0.12)]">Logs</NuxtLink>
          </div>
        </DataPanel>
      </div>
    </div>
  </div>
</template>
