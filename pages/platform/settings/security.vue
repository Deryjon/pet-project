<script setup lang="ts">
import { onMounted } from "vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import SettingsTabs from "@/components/platform/settings/SettingsTabs.vue";
import { usePlatformSettingsState } from "@/composables/usePlatformSettingsState";

definePageMeta({ layout: "platform" });
useHead({ title: "Настройки безопасности | Konkurent" });

const { state, load, save } = usePlatformSettingsState();
const toast = useToast();

function submit() {
  save();
  toast.add({ title: "Настройки безопасности сохранены", color: "success" });
}

onMounted(load);
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Настройки" title="Безопасность" description="Базовые настройки безопасности платформы." />
    <SettingsTabs />

    <DataPanel title="Настройки безопасности" description="Минимальная длина пароля и длительность пользовательской сессии.">
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submit">
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Min Password Length</span>
          <UInput v-model="state.minPasswordLength" type="number" min="6" />
        </label>
        <label class="space-y-2">
          <span class="text-[13px] font-semibold text-slate-700">Session Timeout (minutes)</span>
          <UInput v-model="state.sessionTimeout" type="number" min="5" />
        </label>
        <div class="md:col-span-2 flex justify-end">
          <UButton type="submit" color="neutral" class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800">Сохранить</UButton>
        </div>
      </form>
    </DataPanel>
  </div>
</template>
