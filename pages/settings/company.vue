<script setup lang="ts">
import { useHead } from "#imports";

useHead({ title: "Настройки компании | Konkurent.cases" });

const cards = [
  "Реквизиты и юридические данные",
  "Основные параметры компании",
  "Связь с филиалами и доступами",
];
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.12),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88))] p-6 shadow-[0_24px_60px_rgba(2,6,23,0.28)]">
      <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-emerald-300">Настройки</p>
      <h1 class="mt-3 text-[30px] font-bold tracking-[-0.04em] text-white">Компания</h1>
      <p class="mt-3 max-w-3xl text-[15px] leading-7 text-slate-300">
        Страница создана как отдельный маршрут для настроек компании и связанных параметров бизнеса.
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div v-for="card in cards" :key="card" class="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur">
        <p class="text-[16px] font-semibold text-white">{{ card }}</p>
      </div>
    </div>
  </section>
</template>
