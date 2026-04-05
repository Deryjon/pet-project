<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import EmptyState from "@/components/platform/EmptyState.vue";
import ModalForm from "@/components/platform/ModalForm.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import type { PlatformCompany } from "@/composables/usePlatformAdmin";
import { usePlatformAdminApi } from "@/composables/usePlatformAdmin";

definePageMeta({ layout: "platform" });
useHead({ title: "Компании | Konkurent Platform" });

const { getCompanies, createCompany, updateCompany } = usePlatformAdminApi();

const loading = ref(true);
const saving = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const companies = ref<PlatformCompany[]>([]);
const search = ref("");
const status = ref("all");
const modalOpen = ref(false);
const editing = ref<PlatformCompany | null>(null);

const form = reactive({
  name: "",
  login: "",
  subdomain: "",
  status: "active" as "active" | "inactive",
});

const filteredCompanies = computed(() =>
  companies.value.filter((company) => {
    const q = search.value.trim().toLowerCase();
    const matchesSearch =
      !q || `${company.name} ${company.login} ${company.subdomain}`.toLowerCase().includes(q);
    const matchesStatus = status.value === "all" || company.status === status.value;
    return matchesSearch && matchesStatus;
  }),
);

async function loadCompanies() {
  loading.value = true;
  errorMessage.value = "";

  try {
    companies.value = await getCompanies();
  } catch (error: any) {
    const message = error?.data?.message;
    errorMessage.value = Array.isArray(message)
      ? message.join(", ")
      : message || error?.message || "Не удалось загрузить компании";
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editing.value = null;
  form.name = "";
  form.login = "";
  form.subdomain = "";
  form.status = "active";
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

  const payload = {
    name: form.name.trim(),
    login: form.login.trim(),
    subdomain: form.subdomain.trim(),
    status: form.status,
    is_active: form.status === "active",
  };

  try {
    if (editing.value?.id) {
      await updateCompany(editing.value.id, payload);
      successMessage.value = "Компания обновлена";
    } else {
      await createCompany(payload);
      successMessage.value = "Компания создана";
    }

    modalOpen.value = false;
    await loadCompanies();
  } catch (error: any) {
    const message = error?.data?.message;
    errorMessage.value = Array.isArray(message)
      ? message.join(", ")
      : message || error?.message || "Не удалось сохранить компанию";
  } finally {
    saving.value = false;
  }
}

onMounted(loadCompanies);
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Компании" title="Список компаний" description="Чтение, создание и редактирование компаний платформы.">
      <template #actions>
        <UButton color="neutral" variant="soft" class="rounded-2xl bg-white text-slate-700 hover:bg-slate-100" @click="loadCompanies">
          <Icon name="heroicons:arrow-path" class="mr-2 h-4 w-4" />
          Обновить
        </UButton>
        <UButton color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" @click="openCreate">
          <Icon name="heroicons:plus" class="mr-2 h-4 w-4" />
          Создать компанию
        </UButton>
      </template>
    </PageHeader>

    <div v-if="errorMessage" class="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-[14px] text-rose-600">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-[14px] text-emerald-700">
      {{ successMessage }}
    </div>

    <DataPanel title="Компании" description="Работа с `GET /platform/companies`, `POST /platform/companies`, `PATCH /platform/companies/:id`.">
      <template #toolbar>
        <div class="flex flex-1 flex-wrap items-center gap-3">
          <div class="min-w-[240px] flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input v-model="search" type="text" placeholder="Поиск по названию, login или subdomain" class="w-full bg-transparent text-[14px] text-slate-700 outline-none placeholder:text-slate-400" />
          </div>
          <select v-model="status" class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-700 outline-none">
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Отключенные</option>
          </select>
        </div>
      </template>

      <div v-if="loading" class="space-y-3">
        <div v-for="item in 6" :key="item" class="h-20 animate-pulse rounded-[24px] bg-slate-100" />
      </div>

      <EmptyState v-else-if="!filteredCompanies.length" title="Компании не найдены" description="Измените фильтры или создайте первую компанию." icon="heroicons:building-office-2" />

      <div v-else class="overflow-x-auto">
        <table class="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr class="text-left text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <th class="px-4 py-2">Компания</th>
              <th class="px-4 py-2">Login</th>
              <th class="px-4 py-2">Subdomain</th>
              <th class="px-4 py-2">Статус</th>
              <th class="px-4 py-2">Создана</th>
              <th class="px-4 py-2">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="company in filteredCompanies" :key="company.id">
              <td class="rounded-l-[22px] bg-slate-50 px-4 py-4">
                <p class="font-semibold text-slate-950">{{ company.name }}</p>
                <p class="mt-1 text-[13px] text-slate-500">
                  {{ company.shopsCount }} филиалов · {{ company.usersCount }} пользователей
                </p>
              </td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ company.login || "—" }}</td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ company.subdomain || "—" }}</td>
              <td class="bg-slate-50 px-4 py-4"><StatusBadge :status="company.status" /></td>
              <td class="bg-slate-50 px-4 py-4 text-[14px] text-slate-600">{{ company.createdAt || "—" }}</td>
              <td class="rounded-r-[22px] bg-slate-50 px-4 py-4">
                <div class="flex flex-wrap items-center gap-2">
                  <NuxtLink :to="`/platform/companies/${company.id}`" class="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 transition hover:bg-slate-100">
                    Карточка
                  </NuxtLink>
                  <NuxtLink :to="`/platform/companies/${company.id}/shops`" class="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 transition hover:bg-slate-100">
                    Филиалы
                  </NuxtLink>
                  <UButton color="neutral" variant="soft" class="rounded-2xl bg-white text-slate-700 hover:bg-slate-100" @click="openEdit(company)">
                    Редактировать
                  </UButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DataPanel>

    <ModalForm :open="modalOpen" :title="editing ? 'Редактировать компанию' : 'Создать компанию'" description="Форма для platform admin. Поля отправляются в API компании." @close="modalOpen = false">
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submit">
        <label class="space-y-2 md:col-span-2">
          <span class="text-[13px] font-semibold text-slate-700">Название компании</span>
          <input v-model="form.name" type="text" required class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Login</span>
          <input v-model="form.login" type="text" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Subdomain</span>
          <input v-model="form.subdomain" type="text" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white" />
        </label>
        <label class="space-y-2 md:col-span-2">
          <span class="text-[13px] font-semibold text-slate-700">Статус</span>
          <select v-model="form.status" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white">
            <option value="active">Активна</option>
            <option value="inactive">Отключена</option>
          </select>
        </label>
        <div class="mt-2 flex justify-end gap-3 md:col-span-2">
          <UButton color="neutral" variant="soft" class="rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200" @click="modalOpen = false">Отмена</UButton>
          <UButton type="submit" color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" :disabled="saving">
            {{ saving ? "Сохраняем..." : editing ? "Сохранить" : "Создать" }}
          </UButton>
        </div>
      </form>
    </ModalForm>
  </div>
</template>
