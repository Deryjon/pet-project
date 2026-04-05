<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import DataPanel from "@/components/platform/DataPanel.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import { usePlatformAdminApi } from "@/composables/usePlatformAdmin";

definePageMeta({ layout: "platform" });
useHead({ title: "Карточка компании | Konkurent Platform" });

const route = useRoute();
const companyId = computed(() => String(route.params.id || ""));
const { getCompany, updateCompany } = usePlatformAdminApi();

const loading = ref(true);
const saving = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const company = ref<any | null>(null);
const form = reactive({
  name: "",
  login: "",
  subdomain: "",
  status: "active" as "active" | "inactive",
});

async function loadCompany() {
  loading.value = true;
  errorMessage.value = "";

  try {
    company.value = await getCompany(companyId.value);
    form.name = company.value.name;
    form.login = company.value.login;
    form.subdomain = company.value.subdomain;
    form.status = company.value.status;
  } catch (error: any) {
    const message = error?.data?.message;
    errorMessage.value = Array.isArray(message)
      ? message.join(", ")
      : message || error?.message || "Не удалось загрузить компанию";
  } finally {
    loading.value = false;
  }
}

async function saveCompany() {
  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    company.value = await updateCompany(companyId.value, {
      name: form.name.trim(),
      login: form.login.trim(),
      subdomain: form.subdomain.trim(),
      status: form.status,
      is_active: form.status === "active",
    });
    successMessage.value = "Изменения сохранены";
  } catch (error: any) {
    const message = error?.data?.message;
    errorMessage.value = Array.isArray(message)
      ? message.join(", ")
      : message || error?.message || "Не удалось обновить компанию";
  } finally {
    saving.value = false;
  }
}

onMounted(loadCompany);
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Компании" :title="company?.name || 'Карточка компании'" description="Просмотр и редактирование одной компании.">
      <template #actions>
        <NuxtLink :to="`/platform/companies/${companyId}/shops`" class="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-950 px-4 text-[14px] font-medium text-white transition hover:bg-slate-800">
          Филиалы компании
        </NuxtLink>
      </template>
    </PageHeader>

    <div v-if="errorMessage" class="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-[14px] text-rose-600">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-[14px] text-emerald-700">
      {{ successMessage }}
    </div>

    <DataPanel title="Основная информация" description="Данные из `GET /platform/companies/:id` и обновление через `PATCH /platform/companies/:id`.">
      <div v-if="loading" class="space-y-3">
        <div v-for="item in 4" :key="item" class="h-20 animate-pulse rounded-[24px] bg-slate-100" />
      </div>

      <form v-else class="grid gap-4 md:grid-cols-2" @submit.prevent="saveCompany">
        <label class="space-y-2 md:col-span-2">
          <span class="text-[13px] font-semibold text-slate-700">Название</span>
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
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Статус</span>
          <div class="flex h-[50px] items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
            <StatusBadge :status="form.status" />
          </div>
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Изменить статус</span>
          <select v-model="form.status" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] outline-none focus:border-sky-300 focus:bg-white">
            <option value="active">Активна</option>
            <option value="inactive">Отключена</option>
          </select>
        </label>
        <div class="rounded-[24px] border border-slate-200 bg-slate-50 p-5 md:col-span-2">
          <div class="grid gap-4 sm:grid-cols-3">
            <div>
              <p class="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">ID</p>
              <p class="mt-2 text-[14px] font-semibold text-slate-900">{{ company?.id || "—" }}</p>
            </div>
            <div>
              <p class="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">Филиалы</p>
              <p class="mt-2 text-[14px] font-semibold text-slate-900">{{ company?.shopsCount ?? 0 }}</p>
            </div>
            <div>
              <p class="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">Пользователи</p>
              <p class="mt-2 text-[14px] font-semibold text-slate-900">{{ company?.usersCount ?? 0 }}</p>
            </div>
          </div>
        </div>
        <div class="flex justify-end md:col-span-2">
          <UButton type="submit" color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" :disabled="saving">
            {{ saving ? "Сохраняем..." : "Сохранить изменения" }}
          </UButton>
        </div>
      </form>
    </DataPanel>
  </div>
</template>
