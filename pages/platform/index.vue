<script setup lang="ts">
import { onMounted, ref } from "vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatsCard from "@/components/platform/StatsCard.vue";
import { usePlatformAdminApi } from "@/composables/usePlatformAdmin";

definePageMeta({ layout: "platform" });
useHead({ title: "Дашборд платформы | Konkurent Platform" });

const { getCompanies, getUsers, getDashboardStats } = usePlatformAdminApi();

const loading = ref(true);
const errorMessage = ref("");
const stats = ref({
  totalCompanies: 0,
  totalShops: 0,
  totalUsers: 0,
  totalSales: 0,
  activeCompanies: 0,
});
const companies = ref<any[]>([]);
const users = ref<any[]>([]);

async function loadData() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const [statsResponse, companiesResponse, usersResponse] = await Promise.all([
      getDashboardStats(),
      getCompanies(),
      getUsers(),
    ]);

    stats.value = statsResponse;
    companies.value = companiesResponse.slice(0, 5);
    users.value = usersResponse.slice(0, 5);
  } catch (error: any) {
    const message = error?.data?.message;
    errorMessage.value = Array.isArray(message)
      ? message.join(", ")
      : message || error?.message || "Не удалось загрузить дашборд";
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Обзор" title="Дашборд платформы" description="Сводные показатели по компаниям, филиалам, пользователям и продажам.">
      <template #actions>
        <UButton color="neutral" variant="soft" class="rounded-2xl bg-white text-slate-700 hover:bg-slate-100" @click="loadData">
          <Icon name="heroicons:arrow-path" class="mr-2 h-4 w-4" />
          Обновить
        </UButton>
      </template>
    </PageHeader>

    <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
      <StatsCard label="Компании" :value="stats.totalCompanies" helper="Всего в системе" icon="heroicons:building-office-2" />
      <StatsCard label="Филиалы" :value="stats.totalShops" helper="Во всех компаниях" icon="heroicons:map-pin" />
      <StatsCard label="Пользователи" :value="stats.totalUsers" helper="Platform admin и support" icon="heroicons:users" />
      <StatsCard label="Активные компании" :value="stats.activeCompanies" helper="С активным статусом" icon="heroicons:bolt" />
      <StatsCard label="Продажи" :value="stats.totalSales" helper="Если бэк отдает sales_count" icon="heroicons:banknotes" />
    </div>

    <div v-if="errorMessage" class="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-[14px] text-rose-600">
      {{ errorMessage }}
    </div>

    <div class="grid gap-6 xl:grid-cols-2">
      <DataPanel title="Последние компании" description="Быстрый доступ к карточкам компаний.">
        <div v-if="loading" class="space-y-3">
          <div v-for="item in 4" :key="item" class="h-24 animate-pulse rounded-[24px] bg-slate-100" />
        </div>

        <div v-else class="space-y-4">
          <NuxtLink
            v-for="company in companies"
            :key="company.id"
            :to="`/platform/companies/${company.id}`"
            class="block rounded-[24px] border border-slate-100 bg-slate-50/80 p-5 transition hover:bg-white hover:shadow-sm"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-[16px] font-semibold text-slate-950">{{ company.name }}</p>
                <p class="mt-2 text-[14px] leading-6 text-slate-500">{{ company.subdomain || company.login || "Без login/subdomain" }}</p>
              </div>
              <span class="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]" :class="company.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'">
                {{ company.status === "active" ? "Активна" : "Отключена" }}
              </span>
            </div>
          </NuxtLink>
        </div>
      </DataPanel>

      <DataPanel title="Пользователи платформы" description="Текущие platform admin и support.">
        <div v-if="loading" class="space-y-3">
          <div v-for="item in 4" :key="item" class="h-24 animate-pulse rounded-[24px] bg-slate-100" />
        </div>

        <div v-else class="space-y-4">
          <article v-for="user in users" :key="user.id" class="rounded-[24px] border border-slate-100 bg-slate-50/80 p-5">
            <p class="text-[16px] font-semibold text-slate-950">{{ user.fullName }}</p>
            <p class="mt-2 text-[14px] text-slate-500">{{ user.phone || "Телефон не указан" }}</p>
            <div class="mt-3 flex items-center justify-between gap-3 text-[13px] text-slate-500">
              <span>{{ user.email || "Email не указан" }}</span>
              <span class="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700">{{ user.role || "role" }}</span>
            </div>
          </article>
        </div>
      </DataPanel>
    </div>
  </div>
</template>
