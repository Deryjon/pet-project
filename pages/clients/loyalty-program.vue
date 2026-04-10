<script setup lang="ts">
import { useHead } from "#imports";

useHead({ title: "Программа лояльности | Konkurent.cases" });

const blocks = [
  "Бонусные уровни и правила начисления",
  "Персональные скидки и клиентские сегменты",
  "Ограничения по акциям и периодам действия",
];
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88))] p-6 shadow-[0_24px_60px_rgba(2,6,23,0.28)]">
      <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-amber-300">Клиенты</p>
      <h1 class="mt-3 text-[30px] font-bold tracking-[-0.04em] text-white">Программа лояльности</h1>
      <p class="mt-3 max-w-3xl text-[15px] leading-7 text-slate-300">
        Маршрут подготовлен под правила лояльности, бонусные механики и персональные предложения для покупателей.
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div v-for="block in blocks" :key="block" class="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur">
        <p class="text-[16px] font-semibold text-white">{{ block }}</p>
      </div>
    </div>
  </section>
</template>
