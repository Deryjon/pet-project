<script setup lang="ts">
defineProps<{
  eyebrow?: string;
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div class="max-w-3xl">
      <p v-if="eyebrow" class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        {{ eyebrow }}
      </p>
      <h2 class="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-slate-950 sm:text-[34px]">
        {{ title }}
      </h2>
      <p v-if="description" class="mt-3 text-[15px] leading-7 text-slate-500">
        {{ description }}
      </p>
    </div>

    <div class="flex items-center gap-3">
      <slot name="actions" />
    </div>
  </div>
</template>
