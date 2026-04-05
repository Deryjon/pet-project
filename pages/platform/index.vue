<script setup lang="ts">
import { onMounted, ref } from "vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import StatsCard from "@/components/platform/StatsCard.vue";
import StatusBadge from "@/components/platform/StatusBadge.vue";
import { usePlatformAdminMock } from "@/composables/usePlatformAdmin";

definePageMeta({ layout: "platform" });
useHead({ title: "Platform Dashboard | Konkurent Platform" });

const { stats, activity, companies, users } = usePlatformAdminMock();
const loading = ref(true);

onMounted(() => {
  setTimeout(() => {
    loading.value = false;
  }, 500);
});
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Executive Overview" title="Premium platform dashboard" description="High-level control panel for companies, locations and users across the CRM platform.">
      <template #actions>
        <UButton color="neutral" variant="soft" class="rounded-2xl bg-white text-slate-700 hover:bg-slate-100">
          <Icon name="heroicons:arrow-path" class="mr-2 h-4 w-4" />
          Refresh
        </UButton>
        <UButton color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800">
          <Icon name="heroicons:plus" class="mr-2 h-4 w-4" />
          New Workspace Item
        </UButton>
      </template>
    </PageHeader>

    <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      <StatsCard label="Total companies" :value="stats.totalCompanies" helper="Across all tenants" icon="heroicons:building-office-2" />
      <StatsCard label="Total shops" :value="stats.totalShops" helper="All active locations" icon="heroicons:map-pin" />
      <StatsCard label="Total users" :value="stats.totalUsers" helper="Managed identities" icon="heroicons:users" />
      <StatsCard label="Active companies" :value="stats.activeCompanies" helper="Operational right now" icon="heroicons:bolt" />
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <DataPanel title="Recent platform activity" description="Operational updates from the latest platform actions.">
        <div v-if="loading" class="space-y-3">
          <div v-for="item in 3" :key="item" class="h-24 animate-pulse rounded-[24px] bg-slate-100" />
        </div>
        <div v-else class="space-y-4">
          <article v-for="item in activity" :key="item.id" class="rounded-[24px] border border-slate-100 bg-slate-50/80 p-5 transition hover:bg-white hover:shadow-sm">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-[16px] font-semibold text-slate-950">{{ item.title }}</p>
                <p class="mt-2 text-[14px] leading-6 text-slate-500">{{ item.description }}</p>
              </div>
              <span class="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]" :class="item.tone === 'success' ? 'bg-emerald-50 text-emerald-700' : item.tone === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'">
                {{ item.timestamp }}
              </span>
            </div>
          </article>
        </div>
      </DataPanel>

      <div class="space-y-6">
        <DataPanel title="Quick actions" description="Common tasks for platform operators.">
          <div class="grid gap-4">
            <NuxtLink to="/platform/companies" class="rounded-[24px] border border-slate-100 bg-[linear-gradient(135deg,#ffffff,#f8fafc)] p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(15,23,42,0.06)]">
              <p class="text-[15px] font-semibold text-slate-950">Create or edit companies</p>
              <p class="mt-2 text-[14px] text-slate-500">Manage tenant accounts, subdomains and company status.</p>
            </NuxtLink>
            <NuxtLink to="/platform/shops" class="rounded-[24px] border border-slate-100 bg-[linear-gradient(135deg,#ffffff,#f8fafc)] p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(15,23,42,0.06)]">
              <p class="text-[15px] font-semibold text-slate-950">Provision shop locations</p>
              <p class="mt-2 text-[14px] text-slate-500">Organize branch codes, location status and assignments.</p>
            </NuxtLink>
            <NuxtLink to="/platform/users" class="rounded-[24px] border border-slate-100 bg-[linear-gradient(135deg,#ffffff,#f8fafc)] p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(15,23,42,0.06)]">
              <p class="text-[15px] font-semibold text-slate-950">Manage users</p>
              <p class="mt-2 text-[14px] text-slate-500">Assign roles, companies and current shops from one flow.</p>
            </NuxtLink>
          </div>
        </DataPanel>

        <DataPanel title="Tenant snapshot" description="Latest company and user highlights.">
          <div class="space-y-4">
            <div v-for="company in companies.slice(0, 3)" :key="company.id" class="rounded-[22px] border border-slate-100 bg-slate-50/70 p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-[15px] font-semibold text-slate-950">{{ company.name }}</p>
                  <p class="mt-1 text-[13px] text-slate-500">{{ company.subdomain }}</p>
                </div>
                <StatusBadge :status="company.status" />
              </div>
            </div>
            <div class="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4">
              <p class="text-[13px] font-medium text-slate-500">Newest user</p>
              <p class="mt-2 text-[15px] font-semibold text-slate-950">{{ users[0]?.fullName }}</p>
              <p class="mt-1 text-[13px] text-slate-500">{{ users[0]?.companyName }} · {{ users[0]?.role }}</p>
            </div>
          </div>
        </DataPanel>
      </div>
    </div>
  </div>
</template>
