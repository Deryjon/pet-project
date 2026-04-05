<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
  helper?: string;
  icon: string;
}>();
</script>

<template>
  <div class="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-0.5">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-[13px] font-medium text-slate-500">{{ label }}</p>
        <p class="mt-4 text-[30px] font-semibold tracking-[-0.03em] text-slate-950">{{ value }}</p>
        <p v-if="helper" class="mt-2 text-[13px] text-slate-400">{{ helper }}</p>
      </div>

      <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sky-300 shadow-lg">
        <Icon :name="icon" class="h-5 w-5" />
      </div>
    </div>
  </div>
</template>
