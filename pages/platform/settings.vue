<script setup lang="ts">
import DataPanel from "@/components/platform/DataPanel.vue";
import PageHeader from "@/components/platform/PageHeader.vue";

definePageMeta({ layout: "platform" });
useHead({ title: "Settings | Konkurent Platform" });

const settingCards = [
  {
    title: "Security policies",
    description: "Prepare SSO, password rules and admin access restrictions in one place.",
    icon: "heroicons:shield-check",
  },
  {
    title: "Branding",
    description: "Keep platform visuals, domain settings and tenant-facing identity consistent.",
    icon: "heroicons:swatch",
  },
  {
    title: "Notifications",
    description: "Configure email and platform alerts for tenant onboarding and operational changes.",
    icon: "heroicons:bell-alert",
  },
];
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Platform Preferences" title="Settings" description="A polished placeholder workspace for future configuration modules and account-level controls." />

    <DataPanel title="Configuration areas" description="This page is intentionally UI-only for now and keeps the sidebar route fully connected.">
      <div class="grid gap-4 lg:grid-cols-3">
        <article v-for="card in settingCards" :key="card.title" class="rounded-[28px] border border-slate-100 bg-slate-50/80 p-6 transition hover:bg-white hover:shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
            <Icon :name="card.icon" class="h-5 w-5" />
          </div>
          <h3 class="mt-5 text-[18px] font-semibold text-slate-950">{{ card.title }}</h3>
          <p class="mt-3 text-[14px] leading-7 text-slate-500">{{ card.description }}</p>
          <UButton color="neutral" variant="soft" class="mt-6 rounded-2xl bg-white text-slate-700 hover:bg-slate-100">Open module</UButton>
        </article>
      </div>
    </DataPanel>
  </div>
</template>
