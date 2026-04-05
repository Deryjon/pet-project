<script setup lang="ts">
defineProps<{
  status: "active" | "inactive";
}>();
</script>

<template>
  <span
    class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
    :class="
      status === 'active'
        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
        : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
    "
  >
    <span class="h-2 w-2 rounded-full" :class="status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'" />
    {{ status === "active" ? "Active" : "Inactive" }}
  </span>
</template>
