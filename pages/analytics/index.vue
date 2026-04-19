<script setup lang="ts">
import { useHead } from "#imports";

useHead({ title: "Отчеты | Konkurent" });

const sections = [
  { title: "Магазин", description: "Общие показатели магазина и операционная динамика.", to: "/analytics/shop" },
  { title: "Товары", description: "Продажи, остатки, оборачиваемость и эффективность ассортимента.", to: "/analytics/products" },
  { title: "Продавцы", description: "Показатели сотрудников и сравнение по продажам.", to: "/analytics/sellers" },
  { title: "Клиенты", description: "Поведение клиентов, retention и лояльность.", to: "/analytics/clients" },
];
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.14),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.82))] p-6 shadow-[0_28px_70px_rgba(2,6,23,0.35)]">
      <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-violet-300">Отчеты</p>
      <h1 class="mt-3 text-[30px] font-bold tracking-[-0.04em] text-white">Раздел аналитики</h1>
      <p class="mt-3 max-w-3xl text-[15px] leading-7 text-slate-300">
        Навигационная точка для отчетов по магазину, товарам, продавцам и клиентам.
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <NuxtLink
        v-for="section in sections"
        :key="section.to"
        :to="section.to"
        class="rounded-[24px] border border-white/10 bg-white/5 p-5 shadow-[0_18px_50px_rgba(2,6,23,0.2)] backdrop-blur transition hover:border-violet-300/30 hover:bg-white/10"
      >
        <p class="text-[18px] font-semibold text-white">{{ section.title }}</p>
        <p class="mt-3 text-[14px] leading-6 text-slate-300">{{ section.description }}</p>
      </NuxtLink>
    </div>
  </section>
</template>
