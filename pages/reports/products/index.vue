<script setup lang="ts">
import { useHead } from "#imports";
import { computed } from "vue";
import { useRoute } from "vue-router";
import { productReportSections } from "~/constants/reports/productSections";

useHead({ title: "Отчет по товарам | Konkurent" });

const route = useRoute();

const activeSectionMeta = computed(() =>
  productReportSections.find((section) => section.to === route.path),
);

const pageDescription = computed(() =>
  activeSectionMeta.value?.description ||
  "Выберите один из отчетов по товарам. Каждый раздел открыт как отдельная страница внутри этого модуля.",
);
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="rounded-[30px] border border-white/10 bg-[linear-gradient(160deg,rgba(31,120,255,0.18),rgba(15,23,42,0.95))] p-6 shadow-[0_28px_70px_rgba(2,6,23,0.32)]">
      <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#8ec8ff]">Reports</p>
      <h1 class="mt-3 text-[32px] font-bold tracking-[-0.05em]">Отчет по товарам</h1>
      <p class="mt-3 max-w-3xl text-[15px] leading-7 text-slate-300">
        {{ pageDescription }}
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <NuxtLink
        v-for="section in productReportSections"
        :key="section.key"
        :to="section.to"
        class="group rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(33,33,33,0.98),rgba(24,24,24,0.98))] p-5 shadow-[0_20px_50px_rgba(2,6,23,0.2)] transition hover:-translate-y-0.5 hover:border-[#5bb4ff]/35 hover:bg-[linear-gradient(180deg,rgba(38,38,38,1),rgba(26,26,26,1))]"
      >
        <p class="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#8ec8ff]">Отчет</p>
        <h2 class="mt-4 text-[22px] font-semibold leading-tight text-white">{{ section.title }}</h2>
        <p class="mt-3 text-sm leading-6 text-[#a3a3a3]">{{ section.description }}</p>
        <div class="mt-6 flex items-center justify-between text-sm font-semibold text-white">
          <span class="rounded-full border border-white/10 bg-white/5 px-3 py-2 transition group-hover:border-[#5bb4ff]/35 group-hover:bg-[#1f78ff]/10">
            Перейти к отчету
          </span>
          <Icon name="heroicons:arrow-up-right" class="h-5 w-5 text-[#8ec8ff]" />
        </div>
      </NuxtLink>
    </div>
  </section>
</template>
