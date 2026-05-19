<script setup lang="ts">
import { useHead } from "#imports";

useHead({ title: "Отчет по магазину | Konkurent" });
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="rounded-[30px] border border-white/10 bg-[linear-gradient(160deg,rgba(31,120,255,0.18),rgba(15,23,42,0.95))] p-6 shadow-[0_28px_70px_rgba(2,6,23,0.32)]">
      <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#8ec8ff]">Reports</p>
      <h1 class="mt-3 text-[32px] font-bold tracking-[-0.05em]">Отчет по магазину</h1>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <article class="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(110,196,255,0.14),transparent_38%),linear-gradient(180deg,#1f2937,#172033)] p-6 shadow-[0_24px_60px_rgba(2,6,23,0.28)]">
        <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#8ec8ff]">Отчет</p>
        <h2 class="mt-3 text-[28px] font-bold tracking-[-0.04em]">Сводный</h2>
        <p class="mt-3 max-w-xl text-[15px] leading-7 text-slate-300">
          Общая статистика по основным показателям магазина включая статистику продаж, продуктов, клиентов, а также продавцов.
        </p>
        <NuxtLink
          to="/reports/shop/summary?page=1&start_date=2026-05-19"
          class="mt-6 inline-flex items-center rounded-[18px] bg-[#1f78ff] px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-[#4993dd]"
        >
          Перейти к отчету
        </NuxtLink>
      </article>

      <article class="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_34%),linear-gradient(180deg,#262626,#1f1f1f)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
        <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#bdbdbd]">Отчет</p>
        <h2 class="mt-3 text-[28px] font-bold tracking-[-0.04em]">Транзакции</h2>
        <p class="mt-3 max-w-xl text-[15px] leading-7 text-slate-300">
          Отчет транзакции показывает всю статистику по транзакциям.
        </p>
        <NuxtLink
          to="/reports/shop/transactions?page=1&sameDateRefresh=22302&start_date=2026-05-19&end_date=&compare_start_date=2026-05-19&compare_end_date=&limit=10"
          class="mt-6 inline-flex items-center rounded-[18px] bg-[#404040] px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-[#525252]"
        >
          Перейти к отчету
        </NuxtLink>
      </article>
    </div>
  </section>
</template>
