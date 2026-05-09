<script setup lang="ts">
const props = defineProps<{
  title: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "primary";
}>();

const toneClass = computed(() => {
  const tones = {
    neutral: "border-white/10 bg-white/5 text-white",
    success: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
    warning: "border-amber-400/20 bg-amber-500/10 text-amber-100",
    danger: "border-rose-400/20 bg-rose-500/10 text-rose-100",
    primary: "border-sky-400/20 bg-sky-500/10 text-sky-100",
  };

  return tones[props.tone || "neutral"];
});
</script>

<template>
  <article class="rounded-[24px] border p-5 shadow-[0_18px_50px_rgba(2,6,23,0.16)]" :class="toneClass">
    <p class="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/60">{{ title }}</p>
    <div class="mt-4 text-[28px] font-bold tracking-[-0.04em]">{{ value }}</div>
    <p v-if="hint" class="mt-2 text-sm text-white/65">{{ hint }}</p>
  </article>
</template>
