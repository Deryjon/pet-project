<script setup lang="ts">
const props = defineProps<{
  status: string;
}>();

const labels: Record<string, string> = {
  active: "Активен",
  inactive: "Отключен",
  blocked: "Заблокирован",
  expired: "Просрочена",
  cancelled: "Отменена",
  trial: "Пробный",
};

const tones: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  inactive: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  blocked: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  expired: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  cancelled: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  trial: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
};

const dots: Record<string, string> = {
  active: "bg-emerald-500",
  inactive: "bg-slate-400",
  blocked: "bg-rose-500",
  expired: "bg-amber-500",
  cancelled: "bg-slate-400",
  trial: "bg-sky-500",
};
</script>

<template>
  <span
    class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
    :class="tones[props.status] || tones.inactive"
  >
    <span class="h-2 w-2 rounded-full" :class="dots[props.status] || dots.inactive" />
    {{ labels[props.status] || props.status }}
  </span>
</template>
