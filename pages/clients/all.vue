<script setup lang="ts">
import { useHead } from "#imports";

useHead({ title: "Все клиенты | Konkurent" });

const stats = [
  { label: "Статус", value: "Готово", helper: "Маршрут создан и доступен из меню" },
  { label: "Назначение", value: "Клиенты", helper: "Будущая таблица клиентской базы" },
  { label: "Следующий шаг", value: "CRUD", helper: "Подключение API списка клиентов" },
];
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88))] p-6 shadow-[0_24px_60px_rgba(2,6,23,0.28)]">
      <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-orange-300">Клиенты</p>
      <h1 class="mt-3 text-[30px] font-bold tracking-[-0.04em] text-white">Все клиенты</h1>
      <p class="mt-3 max-w-3xl text-[15px] leading-7 text-slate-300">
        Страница создана как отдельный маршрут под список клиентов, поиск, фильтры, сегменты и карточки покупателей.
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <article v-for="item in stats" :key="item.label" class="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur">
        <p class="text-[12px] uppercase tracking-[0.18em] text-slate-400">{{ item.label }}</p>
        <p class="mt-3 text-[26px] font-semibold text-white">{{ item.value }}</p>
        <p class="mt-2 text-[14px] text-slate-400">{{ item.helper }}</p>
      </article>
    </div>
  </section>
</template>
