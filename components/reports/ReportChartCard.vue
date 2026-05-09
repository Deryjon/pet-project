<script setup lang="ts">
import type { ReportPoint } from "~/composables/useReportsApi";

const props = defineProps<{
  title: string;
  description?: string;
  points: ReportPoint[];
  valueSuffix?: string;
}>();

const maxValue = computed(() => Math.max(1, ...props.points.map((point) => point.value)));
</script>

<template>
  <section class="rounded-[28px] border border-white/10 bg-[#202020] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.18)]">
    <h3 class="text-[20px] font-semibold text-white">{{ title }}</h3>
    <p v-if="description" class="mt-2 text-sm text-[#a3a3a3]">{{ description }}</p>

    <div v-if="points.length" class="mt-6 flex h-[220px] items-end gap-3 overflow-hidden">
      <div v-for="point in points" :key="`${point.label}-${point.value}`" class="flex min-w-0 flex-1 flex-col items-center gap-3">
        <div class="w-full rounded-t-[18px] bg-[linear-gradient(180deg,#5bb4ff_0%,#1f78ff_100%)]" :style="{ height: `${Math.max(12, (point.value / maxValue) * 160)}px` }" />
        <div class="text-center">
          <div class="text-xs font-semibold text-white">{{ Intl.NumberFormat('ru-RU').format(Math.round(point.value)) }}{{ valueSuffix || "" }}</div>
          <div class="mt-1 text-[11px] uppercase tracking-[0.08em] text-[#7f7f7f]">{{ point.label }}</div>
        </div>
      </div>
    </div>

    <div v-else class="mt-6 rounded-[22px] border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-[#9a9a9a]">
      Нет данных для графика
    </div>
  </section>
</template>
