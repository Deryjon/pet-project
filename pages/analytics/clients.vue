<script setup lang="ts">
import { useHead } from "#imports";

useHead({ title: "Отчеты по клиентам | Konkurent" });

const metrics = ["Новые и возвращающиеся клиенты", "Retention", "Средний чек клиента", "Активность по сегментам"];
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88))] p-6 shadow-[0_24px_60px_rgba(2,6,23,0.28)]">
      <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-violet-300">Отчеты</p>
      <h1 class="mt-3 text-[30px] font-bold tracking-[-0.04em] text-white">Клиенты</h1>
      <p class="mt-3 max-w-3xl text-[15px] leading-7 text-slate-300">
        Страница для аналитики клиентской базы: повторные покупки, сегменты, активность и лояльность.
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div v-for="metric in metrics" :key="metric" class="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur">
        <p class="text-[16px] font-semibold text-white">{{ metric }}</p>
      </div>
    </div>
  </section>
</template>
