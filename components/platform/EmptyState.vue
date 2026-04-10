<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
  icon: string;
}>();
</script>

<template>
  <div class="flex flex-col items-center justify-center rounded-[30px] border border-dashed border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.9))] px-6 py-16 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
    <div class="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(180deg,#ffffff_0%,#ecfeff_100%)] text-teal-700 shadow-[0_16px_34px_rgba(20,184,166,0.14)]">
      <Icon :name="icon" class="h-7 w-7" />
    </div>
    <h4 class="mt-5 text-[22px] font-semibold tracking-[-0.03em] text-slate-950">{{ title }}</h4>
    <p class="mt-2 max-w-md text-[14px] leading-7 text-slate-500">{{ description }}</p>
  </div>
</template>
