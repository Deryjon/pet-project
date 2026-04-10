<script setup lang="ts">
import { useHead } from "#imports";

useHead({ title: "Долги клиентов | Konkurent.cases" });

const sections = [
  { title: "Задолженность", text: "Таблица долгов по клиентам и остатки к оплате." },
  { title: "История погашений", text: "Журнал частичных и полных оплат." },
  { title: "Контроль рисков", text: "Список просроченных долгов и проблемных клиентов." },
];
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.14),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88))] p-6 shadow-[0_24px_60px_rgba(2,6,23,0.28)]">
      <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-rose-300">Клиенты</p>
      <h1 class="mt-3 text-[30px] font-bold tracking-[-0.04em] text-white">Долги клиентов</h1>
      <p class="mt-3 max-w-3xl text-[15px] leading-7 text-slate-300">
        Страница под учет долгов, контроль оплат и работу с клиентской дебиторской задолженностью.
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <article v-for="section in sections" :key="section.title" class="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur">
        <p class="text-[18px] font-semibold text-white">{{ section.title }}</p>
        <p class="mt-3 text-[14px] leading-6 text-slate-300">{{ section.text }}</p>
      </article>
    </div>
  </section>
</template>
