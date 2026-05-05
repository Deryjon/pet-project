<script setup lang="ts">
import { onMounted } from "vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import SettingsTabs from "@/components/platform/settings/SettingsTabs.vue";
import { usePlatformSettingsState } from "@/composables/usePlatformSettingsState";

definePageMeta({ layout: "platform" });
useHead({ title: "General Settings | Konkurent" });

const { state, load, save } = usePlatformSettingsState();
const toast = useToast();

function submit() {
  save();
  toast.add({ title: "General settings saved", color: "success" });
}

onMounted(load);
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Settings" title="General" description="Язык и часовой пояс платформы." />
    <SettingsTabs />

    <DataPanel title="General Settings" description="Локальное хранение без изменения backend-контрактов.">
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submit">
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Language</span>
          <USelect v-model="state.language" :items="[{ label: 'Русский', value: 'ru' }, { label: 'O`zbek', value: 'uz' }, { label: 'English', value: 'en' }]" value-key="value" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Timezone</span>
          <USelect v-model="state.timezone" :items="[{ label: 'Asia/Tashkent', value: 'Asia/Tashkent' }, { label: 'UTC', value: 'UTC' }, { label: 'Europe/Moscow', value: 'Europe/Moscow' }]" value-key="value" />
        </label>
        <div class="md:col-span-2 flex justify-end">
          <UButton type="submit" color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800">Сохранить</UButton>
        </div>
      </form>
    </DataPanel>
  </div>
</template>
