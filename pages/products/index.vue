<script setup lang="ts">
import { useHead } from "#imports";

useHead({ title: "Товары | Konkurent" });

const sections = [
  { title: "Каталог", description: "Просмотр всех товаров и быстрая работа с ассортиментом.", to: "/products/catalog?limit=10&page=1" },
  { title: "Импорт", description: "Массовая загрузка товаров и редактирование импортов.", to: "/products/import" },
  { title: "Заказы", description: "Контроль заказов поставщикам и связанных операций.", to: "/products/orders" },
  { title: "Инвентаризация", description: "Проверка фактических остатков по товарам.", to: "/products/inventory" },
  { title: "Трансфер", description: "Перемещение товаров между магазинами и точками.", to: "/products/transfer" },
  { title: "Переоценка", description: "Обновление цен и контроль изменений стоимости.", to: "/products/revaluation" },
  { title: "Списание", description: "Списание потерь, брака и недостачи.", to: "/products/writeoff" },
  { title: "Поставщики", description: "База поставщиков и работа с контрагентами.", to: "/products/suppliers" },
];
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.14),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.82))] p-6 shadow-[0_28px_70px_rgba(2,6,23,0.35)]">
      <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-emerald-300">Товары</p>
      <h1 class="mt-3 text-[30px] font-bold tracking-[-0.04em] text-white">Раздел товаров</h1>
      <p class="mt-3 max-w-3xl text-[15px] leading-7 text-slate-300">
        Единая точка входа в товарные процессы: каталог, импорт, складские операции, списания, переоценка и поставщики.
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <NuxtLink
        v-for="section in sections"
        :key="section.to"
        :to="section.to"
        class="rounded-[24px] border border-white/10 bg-white/5 p-5 shadow-[0_18px_50px_rgba(2,6,23,0.2)] backdrop-blur transition hover:border-emerald-300/30 hover:bg-white/10"
      >
        <p class="text-[18px] font-semibold text-white">{{ section.title }}</p>
        <p class="mt-3 text-[14px] leading-6 text-slate-300">{{ section.description }}</p>
      </NuxtLink>
    </div>
  </section>
</template>
