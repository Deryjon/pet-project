<script setup lang="ts">
import DataPanel from "@/components/platform/DataPanel.vue";
import DateBadge from "@/components/platform/DateBadge.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatsCard from "@/components/platform/StatsCard.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import { formatPlatformMoney, usePlatformAdminApi, type PlatformCompany } from "@/composables/usePlatformAdmin";

definePageMeta({ layout: "platform" });
useHead({ title: "Главная | Konkurent" });

const api = usePlatformAdminApi();
const stats = ref({
  totalCompanies: 0,
  activeCompanies: 0,
  blockedCompanies: 0,
  activeSubscriptions: 0,
  expiredSubscriptions: 0,
  expiringSoonSubscriptions: 0,
  monthlyRevenue: 0,
});
const recentCompanies = ref<PlatformCompany[]>([]);

async function loadDashboard() {
  const [statsResponse, companiesResponse] = await Promise.all([api.getDashboardStats(), api.getCompanies()]);
  stats.value = statsResponse;
  recentCompanies.value = companiesResponse.slice(0, 4);
}

onMounted(loadDashboard);
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Платформа" title="Главная" description="Общая статистика платформы: компании, подписки и доход за текущий месяц." />

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard label="Всего компаний" :value="stats.totalCompanies" helper="Все подключенные клиенты" icon="heroicons:building-office-2" />
      <StatsCard label="Активные компании" :value="stats.activeCompanies" helper="Компании с доступом" icon="heroicons:bolt" />
      <StatsCard label="Заблокированные" :value="stats.blockedCompanies" helper="Доступ закрыт" icon="heroicons:lock-closed" />
      <StatsCard label="Активные подписки" :value="stats.activeSubscriptions" helper="Подписка действует" icon="heroicons:check-badge" />
      <StatsCard label="Истекают скоро" :value="stats.expiringSoonSubscriptions" helper="Осталось до 3 дней" icon="heroicons:clock" />
      <StatsCard label="Просроченные" :value="stats.expiredSubscriptions" helper="Требуют оплаты" icon="heroicons:exclamation-triangle" />
      <StatsCard label="Доход за месяц" :value="formatPlatformMoney(stats.monthlyRevenue)" helper="По добавленным оплатам" icon="heroicons:banknotes" />
    </div>

    <DataPanel title="Компании под контролем" description="Быстрый обзор статусов и дат окончания подписок.">
      <div class="grid gap-4 lg:grid-cols-3">
        <article v-for="company in recentCompanies" :key="company.id" class="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate text-[18px] font-semibold text-slate-950">{{ company.name }}</p>
              <p class="mt-1 text-[13px] text-slate-500">{{ company.ownerName }}</p>
            </div>
            <StatusBadge :status="company.status" />
          </div>
          <div class="mt-5 flex items-center justify-between gap-3">
            <span class="text-[13px] font-semibold text-slate-500">Подписка до</span>
            <DateBadge :date="company.subscription?.endDate || ''" />
          </div>
        </article>
      </div>
    </DataPanel>
  </div>
</template>
