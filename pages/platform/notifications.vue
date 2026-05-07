<script setup lang="ts">
import DataPanel from "@/components/platform/DataPanel.vue";
import DateBadge from "@/components/platform/DateBadge.vue";
import EmptyState from "@/components/platform/EmptyState.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import { daysLeft, usePlatformAdminApi, type PlatformCompany } from "@/composables/usePlatformAdmin";

definePageMeta({ layout: "platform" });
useHead({ title: "Уведомления | Konkurent" });

const api = usePlatformAdminApi();
const companies = ref<PlatformCompany[]>([]);

onMounted(async () => {
  companies.value = await api.getCompanies();
});

const expiringInThreeDays = computed(() =>
  companies.value.filter((company) => {
    const left = daysLeft(company.subscription?.endDate || "");
    return left <= 3 && left >= 0;
  }),
);
const expired = computed(() => companies.value.filter((company) => daysLeft(company.subscription?.endDate || "") < 0));
const blocked = computed(() => companies.value.filter((company) => company.status === "blocked"));
</script>

<template>
  <div class="space-y-8">
    <PageHeader
      eyebrow="Уведомления"
      title="Центр уведомлений"
      description="Компании с истекающими, просроченными подписками и заблокированным доступом. Позже здесь можно подключить SMS, Telegram и Email."
    />

    <div class="grid gap-6 xl:grid-cols-3">
      <DataPanel title="Заканчивается через 3 дня">
        <div v-if="expiringInThreeDays.length" class="space-y-3">
          <article v-for="company in expiringInThreeDays" :key="company.id" class="rounded-[22px] border border-slate-200 bg-white p-4">
            <p class="font-semibold text-slate-950">{{ company.name }}</p>
            <p class="mt-2 text-[13px] text-slate-500">Окончание: <DateBadge :date="company.subscription?.endDate || ''" /></p>
          </article>
        </div>
        <EmptyState v-else title="Нет компаний" description="Подписок с окончанием через 3 дня нет." icon="heroicons:bell-alert" />
      </DataPanel>

      <DataPanel title="Подписка истекла">
        <div v-if="expired.length" class="space-y-3">
          <article v-for="company in expired" :key="company.id" class="rounded-[22px] border border-slate-200 bg-white p-4">
            <p class="font-semibold text-slate-950">{{ company.name }}</p>
            <p class="mt-2 text-[13px] text-slate-500">Окончание: <DateBadge :date="company.subscription?.endDate || ''" /></p>
          </article>
        </div>
        <EmptyState v-else title="Нет компаний" description="Просроченных подписок нет." icon="heroicons:check-circle" />
      </DataPanel>

      <DataPanel title="Заблокированы">
        <div v-if="blocked.length" class="space-y-3">
          <article v-for="company in blocked" :key="company.id" class="flex items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-white p-4">
            <p class="font-semibold text-slate-950">{{ company.name }}</p>
            <StatusBadge :status="company.status" />
          </article>
        </div>
        <EmptyState v-else title="Нет компаний" description="Заблокированных компаний нет." icon="heroicons:lock-open" />
      </DataPanel>
    </div>
  </div>
</template>
