<script setup lang="ts">
const props = defineProps<{
  date?: string | null;
}>();

const formatted = computed(() => {
  const rawDate = String(props.date ?? "").trim();
  const parsedDate = rawDate ? new Date(rawDate) : null;

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsedDate);
});
</script>

<template>
  <span class="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-semibold text-slate-700 ring-1 ring-slate-200">
    {{ formatted }}
  </span>
</template>
