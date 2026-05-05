<script setup lang="ts">
import DataPanel from "@/components/platform/DataPanel.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import SettingsTabs from "@/components/platform/settings/SettingsTabs.vue";

definePageMeta({ layout: "platform" });
useHead({ title: "Platform Settings | Konkurent" });

const cards = [
  { title: "General", description: "Язык интерфейса и часовой пояс платформы.", to: "/platform/settings/general" },
  { title: "Security", description: "Минимальная длина пароля и время сессии.", to: "/platform/settings/security" },
  { title: "Notifications", description: "Управление системными уведомлениями.", to: "/platform/settings/notifications" },
];
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Settings" title="Platform Settings" description="Рабочие настройки платформы, разделенные по доменам." />
    <SettingsTabs />

    <DataPanel title="Settings Sections" description="Выберите раздел для редактирования платформенных параметров.">
      <div class="grid gap-4 lg:grid-cols-3">
        <NuxtLink v-for="card in cards" :key="card.to" :to="card.to" class="rounded-[28px] border border-slate-100 bg-slate-50/80 p-6 transition hover:bg-white hover:shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <h3 class="text-[18px] font-semibold text-slate-950">{{ card.title }}</h3>
          <p class="mt-3 text-[14px] leading-7 text-slate-500">{{ card.description }}</p>
        </NuxtLink>
      </div>
    </DataPanel>
  </div>
</template>
