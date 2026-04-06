<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <section class="rounded-[34px] border border-white/70 bg-white/78 p-6 shadow-[0_32px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
    <div class="flex flex-col gap-4 border-b border-slate-200/70 pb-5 md:flex-row md:items-end md:justify-between">
      <div class="max-w-2xl">
        <h3 class="text-[22px] font-semibold tracking-[-0.03em] text-slate-950">{{ title }}</h3>
        <p v-if="description" class="mt-2 text-[14px] leading-6 text-slate-500">{{ description }}</p>
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
