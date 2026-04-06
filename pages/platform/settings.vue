<script setup lang="ts">
import DataPanel from "@/components/platform/DataPanel.vue";
import PageHeader from "@/components/platform/PageHeader.vue";

definePageMeta({ layout: "platform" });
useHead({ title: "Настройки | Konkurent Platform" });

const settingCards = [
  {
    title: "Политики безопасности",
    description: "Подготовьте единые правила доступа, паролей и ограничений для администраторов.",
    icon: "heroicons:shield-check",
  },
  {
    title: "Оформление",
    description: "Соберите в одном месте внешний вид платформы, домены и визуальные настройки.",
    icon: "heroicons:swatch",
  },
  {
    title: "Уведомления",
    description: "Настройте письма и системные уведомления для рабочих изменений и новых подключений.",
    icon: "heroicons:bell-alert",
  },
];
</script>

<template>
  <div class="space-y-8">
    <PageHeader eyebrow="Настройки платформы" title="Настройки" description="Раздел для будущих модулей конфигурации и общих параметров платформы." />

    <DataPanel title="Разделы настроек" description="Пока это заготовка интерфейса для будущих настроек платформы.">
      <div class="grid gap-4 lg:grid-cols-3">
        <article v-for="card in settingCards" :key="card.title" class="rounded-[28px] border border-slate-100 bg-slate-50/80 p-6 transition hover:bg-white hover:shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
            <Icon :name="card.icon" class="h-5 w-5" />
          </div>
          <h3 class="mt-5 text-[18px] font-semibold text-slate-950">{{ card.title }}</h3>
          <p class="mt-3 text-[14px] leading-7 text-slate-500">{{ card.description }}</p>
          <UButton color="neutral" variant="soft" class="mt-6 rounded-2xl bg-white text-slate-700 hover:bg-slate-100">Открыть</UButton>
        </article>
      </div>
    </DataPanel>
  </div>
</template>
