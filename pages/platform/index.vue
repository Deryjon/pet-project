<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatsCard from "@/components/platform/StatsCard.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import { usePlatformDashboard } from "@/composables/usePlatformDashboard";

definePageMeta({ layout: "platform" });
useHead({ title: "Platform Dashboard | Konkurent" });

const { getCompanies, getPlatformUsers, getDashboardStats } = usePlatformDashboard();

const loading = ref(true);
const errorMessage = ref("");
const stats = ref({
  totalCompanies: 0,
  totalShops: 0,
  totalUsers: 0,
  totalSales: 0,
  activeCompanies: 0,
  companiesWithoutShops: 0,
  usersWithoutRoles: 0,
  inactiveCompanies: 0,
});
const companies = ref<any[]>([]);
const users = ref<any[]>([]);

const lastCompanies = computed(() => companies.value.slice(0, 4));
const lastUsers = computed(() => users.value.slice(0, 4));

async function loadData() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const [statsResponse, companiesResponse, usersResponse] = await Promise.all([
      getDashboardStats(),
      getCompanies(),
      getPlatformUsers(),
    ]);

    stats.value = {
      ...statsResponse,
      companiesWithoutShops: companiesResponse.filter((company: any) => Number(company.shopsCount || 0) === 0).length,
      usersWithoutRoles: usersResponse.filter((user: any) => !String(user.roleId || user.crmRoleId || "").trim()).length,
      inactiveCompanies: companiesResponse.filter((company: any) => company.status !== "active").length,
    };
    companies.value = companiesResponse;
    users.value = usersResponse;
  } catch (error: any) {
    const message = error?.data?.message;
    errorMessage.value = Array.isArray(message) ? message.join(", ") : message || error?.message || "Не удалось загрузить данные dashboard";
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="space-y-8">
    <PageHeader
      eyebrow="Platform Overview"
      title="Platform Dashboard"
      description="Следите за компаниями, филиалами, пользователями и проблемными зонами из единого центра управления."
    >
      <template #actions>
        <UButton color="neutral" variant="soft" class="cursor-pointer rounded-2xl bg-white/80 text-slate-700 hover:bg-white" @click="loadData">
          <Icon name="heroicons:arrow-path" class="mr-2 h-4 w-4" />
          Обновить
        </UButton>
      </template>
    </PageHeader>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      <StatsCard label="Companies" :value="stats.totalCompanies" helper="Всего в системе" icon="heroicons:building-office-2" />
      <StatsCard label="Shops" :value="stats.totalShops" helper="Во всех компаниях" icon="heroicons:map-pin" />
      <StatsCard label="Admins" :value="stats.totalUsers" helper="Пользователи платформы" icon="heroicons:users" />
      <StatsCard label="Active" :value="stats.activeCompanies" helper="Со включенным статусом" icon="heroicons:bolt" />
      <StatsCard label="No Shops" :value="stats.companiesWithoutShops" helper="Компании без филиалов" icon="heroicons:building-storefront" />
      <StatsCard label="No Roles" :value="stats.usersWithoutRoles" helper="Пользователи без роли" icon="heroicons:shield-exclamation" />
      <StatsCard label="Inactive" :value="stats.inactiveCompanies" helper="Неактивные компании" icon="heroicons:pause-circle" />
    </div>

    <div v-if="errorMessage" class="rounded-[28px] border border-rose-200/80 bg-rose-50/90 px-5 py-4 text-[14px] text-rose-700 shadow-[0_18px_40px_rgba(190,24,93,0.08)]">
      {{ errorMessage }}
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <DataPanel title="Companies at Hand" description="Быстрый переход к карточкам компаний, филиалам и сотрудникам.">
        <div v-if="loading" class="grid gap-4 lg:grid-cols-2">
          <div v-for="item in 4" :key="item" class="h-44 animate-pulse rounded-[28px] bg-slate-100/80" />
        </div>

        <div v-else class="grid gap-4 lg:grid-cols-2">
          <NuxtLink
            v-for="company in lastCompanies"
            :key="company.id"
            :to="`/platform/companies/${company.id}`"
            class="group cursor-pointer rounded-[28px] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(248,250,252,0.9),rgba(255,255,255,0.95))] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-[0_28px_60px_rgba(13,148,136,0.12)]"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="truncate text-[19px] font-semibold tracking-[-0.03em] text-slate-950">{{ company.name }}</p>
                <p class="mt-2 truncate text-[14px] text-slate-500">{{ company.subdomain || company.login || "Данные не указаны" }}</p>
              </div>
              <StatusBadge :status="company.status" />
            </div>

            <div class="mt-5 grid grid-cols-2 gap-3">
              <div class="rounded-[20px] bg-slate-950 px-4 py-3 text-white shadow-[0_12px_28px_rgba(15,23,42,0.16)]">
                <p class="text-[11px] uppercase tracking-[0.16em] text-slate-300">Shops</p>
                <p class="mt-2 text-[20px] font-semibold">{{ company.shopsCount ?? 0 }}</p>
              </div>
              <div class="rounded-[20px] bg-white px-4 py-3 text-slate-900 ring-1 ring-slate-200">
                <p class="text-[11px] uppercase tracking-[0.16em] text-slate-400">Users</p>
                <p class="mt-2 text-[20px] font-semibold">{{ company.usersCount ?? 0 }}</p>
              </div>
            </div>

            <div class="mt-5 flex items-center gap-2 text-[13px] font-semibold text-teal-700">
              Открыть компанию
              <Icon name="heroicons:arrow-right" class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </NuxtLink>
        </div>
      </DataPanel>

      <div class="space-y-6">
        <DataPanel title="Platform Users" description="Текущие пользователи с доступом к платформе.">
          <div v-if="loading" class="space-y-3">
            <div v-for="item in 4" :key="item" class="h-24 animate-pulse rounded-[24px] bg-slate-100/80" />
          </div>

          <div v-else class="space-y-3">
            <article v-for="user in lastUsers" :key="user.id" class="rounded-[24px] border border-slate-200/70 bg-white/88 p-4 shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate text-[16px] font-semibold text-slate-950">{{ user.fullName }}</p>
                  <p class="mt-1 truncate text-[13px] text-slate-500">{{ user.phone || "Телефон не указан" }}</p>
                </div>
                <span class="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-semibold text-slate-700">
                  {{ user.role || "Роль не указана" }}
                </span>
              </div>
              <p class="mt-3 text-[13px] text-slate-500">{{ user.email || "Почта не указана" }}</p>
            </article>
          </div>
        </DataPanel>

        <div class="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,#0f172a_0%,#134e4a_100%)] p-6 text-white shadow-[0_32px_80px_rgba(15,23,42,0.18)]">
          <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-200">Health Focus</p>
          <h3 class="mt-3 text-[26px] font-semibold tracking-[-0.04em]">Сначала контроль, потом детали</h3>
          <p class="mt-3 text-[14px] leading-7 text-slate-200">
            Dashboard теперь показывает не только общие цифры, но и проблемные KPI: компании без филиалов, пользователи без ролей и неактивные компании.
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <NuxtLink to="/platform/companies" class="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-white px-4 py-3 text-[14px] font-semibold text-slate-900 transition hover:bg-slate-100">
              Открыть компании
            </NuxtLink>
            <NuxtLink to="/platform/audit" class="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-[14px] font-semibold text-white transition hover:bg-white/15">
              Открыть audit
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
