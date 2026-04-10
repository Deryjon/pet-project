<script setup lang="ts">
defineProps<{
  eyebrow?: string;
  title: string;
  description?: string;
}>();
</script>

<template>
  <section class="overflow-hidden rounded-[34px] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.12),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(248,250,252,0.82))] px-6 py-6 shadow-[0_26px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-7">
    <div class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div class="max-w-3xl">
        <p v-if="eyebrow" class="inline-flex rounded-full border border-teal-200/70 bg-teal-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-700">
          {{ eyebrow }}
        </p>
        <h2 class="mt-3 text-[30px] font-semibold tracking-[-0.05em] text-slate-950 sm:text-[38px]">
          {{ title }}
        </h2>
        <p v-if="description" class="mt-3 max-w-2xl text-[15px] leading-7 text-slate-600">
          {{ description }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <slot name="actions" />
      </div>
    </div>
  </section>
</template>
