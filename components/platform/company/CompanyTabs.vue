<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  companyId: string;
}>();

const items = computed(() => [
  { label: "Overview", to: `/platform/companies/${props.companyId}/overview` },
  { label: "Users", to: `/platform/companies/${props.companyId}/users` },
  { label: "Shops", to: `/platform/companies/${props.companyId}/shops` },
  { label: "Roles", to: `/platform/companies/${props.companyId}/roles` },
  { label: "Logs", to: `/platform/companies/${props.companyId}/logs` },
  { label: "Settings", to: `/platform/companies/${props.companyId}/settings` },
]);
</script>

<template>
  <div class="overflow-x-auto">
    <div class="inline-flex min-w-full gap-2 rounded-[26px] border border-white/70 bg-white/70 p-2 shadow-[0_20px_45px_rgba(15,23,42,0.05)] backdrop-blur-xl">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="inline-flex min-h-[44px] items-center justify-center rounded-2xl px-4 py-2 text-[14px] font-semibold transition"
        :class="$route.path === item.to ? 'bg-slate-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'"
      >
        {{ item.label }}
      </NuxtLink>
    </div>
  </div>
</template>
