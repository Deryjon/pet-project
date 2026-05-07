<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
  helper?: string;
  icon: string;
}>();
</script>

<template>
  <article class="group h-full rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_22px_56px_rgba(15,23,42,0.07)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_rgba(15,23,42,0.11)]">
    <div class="flex h-full items-start justify-between gap-4">
      <div class="flex min-h-[120px] flex-1 flex-col">
        <p class="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">{{ label }}</p>
        <div class="mt-auto">
          <p class="text-[34px] font-semibold tracking-[-0.05em] text-slate-950">{{ value }}</p>
          <p v-if="helper" class="mt-2 text-[13px] leading-6 text-slate-500">{{ helper }}</p>
        </div>
      </div>

      <div class="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[linear-gradient(180deg,#0f172a_0%,#134e4a_100%)] text-[#d5fff8] shadow-[0_16px_34px_rgba(15,23,42,0.22)] transition duration-300 group-hover:scale-105">
        <Icon :name="icon" class="h-5 w-5" />
      </div>
    </div>
  </article>
</template>
