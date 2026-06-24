<script setup lang="ts">
import { ref, onMounted } from "vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import SettingsTabs from "@/components/platform/settings/SettingsTabs.vue";

definePageMeta({ layout: "platform" });
useHead({ title: "Настройки уведомлений | Konkurent" });

const { apiFetch } = useApi();
const toast = useToast();
const saving = ref(false);

const form = ref({
  enabled: true,
  saleNotifications: true,
  stockAlerts: false,
  lowStockThreshold: false,
  dailyReport: false,
});

async function loadSettings() {
  try {
    const data: any = await apiFetch("/platform/settings/notifications");
    form.value = {
      enabled: data.enabled ?? true,
      saleNotifications: data.saleNotifications ?? true,
      stockAlerts: data.stockAlerts ?? false,
      lowStockThreshold: data.lowStockThreshold ?? false,
      dailyReport: data.dailyReport ?? false,
    };
  } catch {
    toast.add({ title: "Не удалось загрузить настройки", color: "error" });
  }
}

async function submit() {
  saving.value = true;
  try {
    await apiFetch("/platform/settings/notifications", {
      method: "PATCH",
      body: form.value,
    });
    toast.add({ title: "Настройки уведомлений сохранены", color: "success" });
  } catch {
    toast.add({ title: "Ошибка при сохранении", color: "error" });
  } finally {
    saving.value = false;
  }
}

onMounted(loadSettings);

const toggles = [
  { key: "enabled", label: "Системные уведомления" },
  { key: "saleNotifications", label: "Уведомления о продажах" },
  { key: "stockAlerts", label: "Уведомления о складе" },
  { key: "lowStockThreshold", label: "Оповещение о малом остатке" },
  { key: "dailyReport", label: "Ежедневный отчёт" },
] as const;
</script>

<template>
  <div class="space-y-8">
    <PageHeader
      eyebrow="Настройки"
      title="Уведомления"
      description="Управление системными уведомлениями и оповещениями платформы."
    />
    <SettingsTabs />

    <DataPanel
      title="Уведомления"
      description="Настройте типы уведомлений для платформы."
    >
      <form class="grid gap-4" @submit.prevent="submit">
        <label
          v-for="toggle in toggles"
          :key="toggle.key"
          class="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-[14px] text-slate-700 ring-1 ring-slate-200"
        >
          <input
            v-model="form[toggle.key]"
            type="checkbox"
            class="h-4 w-4 accent-teal-600"
          />
          {{ toggle.label }}
        </label>

        <div class="flex justify-end">
          <UButton
            type="submit"
            color="neutral"
            :disabled="saving"
            class="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
          >
            {{ saving ? "Сохранение..." : "Сохранить" }}
          </UButton>
        </div>
      </form>
    </DataPanel>
  </div>
</template>
