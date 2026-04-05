<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
  icon: string;
}>();
</script>

<template>
  <div class="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
    <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
      <Icon :name="icon" class="h-6 w-6" />
    </div>
    <h4 class="mt-5 text-[20px] font-semibold text-slate-950">{{ title }}</h4>
    <p class="mt-2 max-w-md text-[14px] leading-6 text-slate-500">{{ description }}</p>
  </div>
</template>
