<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <section class="rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
    <div class="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <h3 class="text-[22px] font-semibold tracking-[-0.02em] text-slate-950">{{ title }}</h3>
        <p v-if="description" class="mt-2 text-[14px] text-slate-500">{{ description }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <slot name="toolbar" />
      </div>
    </div>

    <div class="pt-6">
      <slot />
    </div>
  </section>
</template>
