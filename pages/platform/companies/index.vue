<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import DataPanel from "@/components/platform/DataPanel.vue";
import EmptyState from "@/components/platform/EmptyState.vue";
import ModalForm from "@/components/platform/ModalForm.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import type { PlatformCompany } from "@/composables/usePlatformAdmin";
import { usePlatformAdminApi } from "@/composables/usePlatformAdmin";
import { usePlatformFormUi } from "@/composables/usePlatformFormUi";

definePageMeta({ layout: "platform" });
useHead({ title: "Компании | Konkurent" });

const router = useRouter();
const { getCompanies, createCompany, updateCompany, deleteCompany } = usePlatformAdminApi();
const { inputUi, selectUi } = usePlatformFormUi();
const toast = useToast();

const loading = ref(true);
const saving = ref(false);
const deletingId = ref("");
const errorMessage = ref("");
const successMessage = ref("");
const companies = ref<PlatformCompany[]>([]);
const search = ref("");
const status = ref("all");
const modalOpen = ref(false);
const editing = ref<PlatformCompany | null>(null);

const statusOptions = [
  { label: "Все статусы", value: "all" },
  { label: "Активные", value: "active" },
  { label: "Отключенные", value: "inactive" },
];

const companyStatusOptions = [
  { label: "Активна", value: "active" },
  { label: "Отключена", value: "inactive" },
];

const form = reactive({
  name: "",
  login: "",
  subdomain: "",
  status: "active" as "active" | "inactive",
});

function getCompanyRouteId(company: PlatformCompany) {
  return company.id;
}

function openCompanyCard(company: PlatformCompany) {
  return router.push(`/platform/companies/${getCompanyRouteId(company)}`);
}

const filteredCompanies = computed(() =>
  companies.value.filter((company) => {
    const q = search.value.trim().toLowerCase();
    const matchesSearch = !q || `${company.name} ${company.login} ${company.subdomain}`.toLowerCase().includes(q);
    const matchesStatus = status.value === "all" || company.status === status.value;
    return matchesSearch && matchesStatus;
  }),
);

function resolveError(error: any, fallback: string) {
  const message = error?.data?.message ?? error?.response?._data?.message;
  return Array.isArray(message) ? message.join(", ") : message || error?.message || fallback;
}

async function loadCompanies() {
  loading.value = true;
  errorMessage.value = "";

  try {
    companies.value = await getCompanies();
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось загрузить компании");
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.name = "";
  form.login = "";
  form.subdomain = "";
  form.status = "active";
}

function openCreate() {
  editing.value = null;
  resetForm();
  successMessage.value = "";
  modalOpen.value = true;
}

function openEdit(company: PlatformCompany) {
  editing.value = company;
  form.name = company.name;
  form.login = company.login;
  form.subdomain = company.subdomain;
  form.status = company.status;
  successMessage.value = "";
  modalOpen.value = true;
}

async function submit() {
  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    if (editing.value?.id) {
      await updateCompany(editing.value.id, {
        name: form.name.trim(),
        login: form.login.trim(),
        subdomain: form.subdomain.trim(),
        is_active: form.status === "active",
      });
      successMessage.value = "Компания обновлена";
      toast.add({ title: "Компания обновлена", color: "success" });
    } else {
      await createCompany({
        name: form.name.trim(),
        login: form.login.trim(),
        subdomain: form.subdomain.trim(),
      });
      successMessage.value = "Компания создана";
      toast.add({ title: "Компания создана", color: "success" });
    }

    modalOpen.value = false;
    await loadCompanies();
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось сохранить компанию");
    toast.add({ title: "Не удалось сохранить компанию", description: errorMessage.value, color: "error" });
  } finally {
    saving.value = false;
  }
}

async function removeCompany(company: PlatformCompany) {
  if (typeof window !== "undefined" && !window.confirm(`Удалить компанию "${company.name}"?`)) {
    return;
  }

  deletingId.value = company.id;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await deleteCompany(company.id);
    successMessage.value = "Компания удалена";
    await loadCompanies();
  } catch (error: any) {
    errorMessage.value = resolveError(error, "Не удалось удалить компанию");
    toast.add({ title: "Не удалось удалить компанию", description: errorMessage.value, color: "error" });
  } finally {
    deletingId.value = "";
  }
}

watch(
  () => true,
  () => {
    loadCompanies();
  },
  { immediate: true, once: true },
);
</script>

<template>
  <div class="space-y-8">
    <PageHeader
      eyebrow="Компании"
      title="Компании платформы"
      description="Создавайте компании, следите за их статусом и быстро переходите к филиалам и сотрудникам."
    >
      <template #actions>
        <UButton color="neutral" variant="soft" class="cursor-pointer rounded-2xl bg-white/80 text-slate-700 hover:bg-white" @click="loadCompanies">
          <Icon name="heroicons:arrow-path" class="mr-2 h-4 w-4" />
          Обновить
        </UButton>
        <UButton color="neutral" class="cursor-pointer rounded-2xl bg-slate-950 text-white hover:bg-slate-800" @click="openCreate">
          <Icon name="heroicons:plus" class="mr-2 h-4 w-4" />
          Новая компания
        </UButton>
      </template>
    </PageHeader>

    <div v-if="errorMessage" class="rounded-[28px] border border-rose-200/80 bg-rose-50/90 px-5 py-4 text-[14px] text-rose-700 shadow-[0_18px_40px_rgba(190,24,93,0.08)]">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="rounded-[28px] border border-emerald-200/80 bg-emerald-50/90 px-5 py-4 text-[14px] text-emerald-700 shadow-[0_18px_40px_rgba(5,150,105,0.08)]">
      {{ successMessage }}
    </div>

    <DataPanel title="Каталог компаний" description="Фильтруйте список и открывайте нужную компанию в один клик.">
      <template #toolbar>
        <div class="flex flex-1 flex-wrap items-center gap-3">
          <div class="min-w-[240px] flex-1">
            <UInput v-model="search" type="text" placeholder="Поиск по названию, логину или поддомену" :ui="inputUi" />
          </div>
          <USelect v-model="status" :items="statusOptions" value-key="value" :ui="selectUi" class="min-w-[220px]" />
        </div>
      </template>

      <div v-if="loading" class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <div v-for="item in 6" :key="item" class="h-64 animate-pulse rounded-[30px] bg-slate-100/80" />
      </div>

      <EmptyState v-else-if="!filteredCompanies.length" title="Компании не найдены" description="Измените фильтры или создайте первую компанию." icon="heroicons:building-office-2" />

      <div v-else class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="company in filteredCompanies"
          :key="company.id"
          class="cursor-pointer rounded-[30px] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.92))] p-5 shadow-[0_20px_46px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-[0_28px_60px_rgba(13,148,136,0.12)]"
          role="link"
          tabindex="0"
          @click="openCompanyCard(company)"
          @keydown.enter.prevent="openCompanyCard(company)"
          @keydown.space.prevent="openCompanyCard(company)"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="truncate text-[20px] font-semibold tracking-[-0.03em] text-slate-950">{{ company.name }}</p>
              <p class="mt-2 truncate text-[14px] text-slate-500">
                {{ company.login || "Логин не указан" }}
              </p>
            </div>
            <StatusBadge :status="company.status" />
          </div>

          <div class="mt-5 grid grid-cols-2 gap-3">
            <div class="rounded-[22px] bg-slate-950 px-4 py-3 text-white shadow-[0_12px_28px_rgba(15,23,42,0.16)]">
              <p class="text-[11px] uppercase tracking-[0.16em] text-slate-300">Филиалы</p>
              <p class="mt-2 text-[22px] font-semibold">{{ company.shopsCount }}</p>
            </div>
            <div class="rounded-[22px] bg-white px-4 py-3 text-slate-900 ring-1 ring-slate-200">
              <p class="text-[11px] uppercase tracking-[0.16em] text-slate-400">Сотрудники</p>
              <p class="mt-2 text-[22px] font-semibold">{{ company.usersCount }}</p>
            </div>
          </div>

          <div class="mt-4 rounded-[22px] bg-[#f4f8fb] px-4 py-3 ring-1 ring-slate-200/70">
            <p class="text-[11px] uppercase tracking-[0.16em] text-slate-400">Поддомен</p>
            <p class="mt-1 truncate text-[14px] font-medium text-slate-700">{{ company.subdomain || "Не указан" }}</p>
          </div>

          <div class="mt-5 flex flex-wrap gap-2">
            <NuxtLink :to="`/platform/companies/${getCompanyRouteId(company)}`" class="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-slate-950 px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-slate-800" @click.stop>
              Карточка
            </NuxtLink>
            <NuxtLink :to="`/platform/companies/${getCompanyRouteId(company)}/shops`" class="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50" @click.stop>
              Филиалы
            </NuxtLink>
            <NuxtLink :to="`/platform/companies/${getCompanyRouteId(company)}/users`" class="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50" @click.stop>
              Сотрудники
            </NuxtLink>
          </div>

          <div class="mt-5 flex items-center justify-between gap-2 border-t border-slate-200/80 pt-4">
            <button class="cursor-pointer rounded-2xl px-3 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-100" @click.stop="openEdit(company)">
              Редактировать
            </button>
            <UButton color="error" variant="soft" class="cursor-pointer rounded-2xl" :loading="deletingId === company.id" @click.stop="removeCompany(company)">
              Удалить
            </UButton>
          </div>
        </article>
      </div>
    </DataPanel>

    <ModalForm :open="modalOpen" :title="editing ? 'Редактировать компанию' : 'Создать компанию'" description="Заполните ключевые данные компании." @close="modalOpen = false">
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submit">
        <label class="space-y-2 md:col-span-2">
          <span class="text-[13px] font-semibold text-slate-700">Название компании</span>
          <UInput v-model="form.name" type="text" required placeholder="Введите название компании" :ui="inputUi" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Логин</span>
          <UInput v-model="form.login" type="text" required placeholder="Введите логин" :ui="inputUi" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Поддомен</span>
          <UInput v-model="form.subdomain" type="text" required placeholder="Введите поддомен" :ui="inputUi" />
        </label>
        <label v-if="editing" class="space-y-2 md:col-span-2">
          <span class="text-[13px] font-semibold text-slate-700">Статус</span>
          <USelect v-model="form.status" :items="companyStatusOptions" value-key="value" :ui="selectUi" />
        </label>
        <div class="mt-2 flex justify-end gap-3 md:col-span-2">
          <UButton type="button" color="neutral" variant="soft" class="rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200" @click="modalOpen = false">Отмена</UButton>
          <UButton type="submit" color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" :disabled="saving">
            {{ saving ? "Сохраняем..." : editing ? "Сохранить" : "Создать" }}
          </UButton>
        </div>
      </form>
    </ModalForm>
  </div>
</template>
