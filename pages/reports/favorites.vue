<script setup lang="ts">
import { useHead } from "#imports";

useHead({ title: "Избранные отчеты | Konkurent" });

const presets = [
  { title: "Продажи за сегодня", description: "Быстрый срез по текущему дню.", to: "/reports?preset=today" },
  { title: "Продажи за месяц", description: "Основные KPI текущего месяца.", to: "/reports?preset=month" },
  { title: "Отчет Globus Mall", description: "Сохраненный фильтр по одному магазину.", to: "/reports/shops?preset=globus" },
  { title: "Продавцы за месяц", description: "KPI и зарплата команды продаж.", to: "/reports/sellers?preset=sellers-month" },
  { title: "Топ прибыльных товаров", description: "Фокус на валовой прибыли ассортимента.", to: "/reports/products?preset=profit-top" },
];
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="rounded-[30px] border border-white/10 bg-[linear-gradient(160deg,rgba(31,120,255,0.16),rgba(15,23,42,0.95))] p-6 shadow-[0_28px_70px_rgba(2,6,23,0.32)]">
      <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#8ec8ff]">Favorites</p>
      <h1 class="mt-3 text-[32px] font-bold tracking-[-0.05em]">Избранные отчеты</h1>
      <p class="mt-3 max-w-3xl text-[15px] leading-7 text-slate-300">
        UI-заготовка для быстрых фильтров отчетов. Дальше можно привязать их к API и хранению в профиле пользователя.
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <NuxtLink
        v-for="preset in presets"
        :key="preset.title"
        :to="preset.to"
        class="rounded-[26px] border border-white/10 bg-[#202020] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.18)] transition hover:border-[#5bb4ff]/30 hover:bg-[#252525]"
      >
        <p class="text-[18px] font-semibold text-white">{{ preset.title }}</p>
        <p class="mt-3 text-sm leading-6 text-[#a3a3a3]">{{ preset.description }}</p>
      </NuxtLink>
    </div>
  </section>
</template>
