<script setup lang="ts">
import { onMounted } from "vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import SettingsTabs from "@/components/platform/settings/SettingsTabs.vue";
import { usePlatformSettingsState } from "@/composables/usePlatformSettingsState";

definePageMeta({ layout: "platform" });
useHead({ title: "Настройки уведомлений | Konkurent" });

const { state, load, save } = usePlatformSettingsState();
const toast = useToast();

function submit() {
  save();
  toast.add({ title: "Notification settings saved", color: "success" });
}

onMounted(load);
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Настройки" title="Уведомления" description="Базовое включение и выключение системных уведомлений." />
    <SettingsTabs />

    <DataPanel title="Уведомления" description="Mock-state для системных событий платформы.">
      <form class="grid gap-4" @submit.prevent="submit">
        <label class="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-[14px] text-slate-700 ring-1 ring-slate-200">
          <input v-model="state.notificationsEnabled" type="checkbox" class="h-4 w-4 accent-teal-600" />
          Включить платформенные уведомления
        </label>
        <div class="flex justify-end">
          <UButton type="submit" color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800">Сохранить</UButton>
        </div>
      </form>
    </DataPanel>
  </div>
</template>
