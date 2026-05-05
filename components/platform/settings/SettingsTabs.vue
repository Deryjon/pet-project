<script setup lang="ts">
const items = [
  { label: "General", to: "/platform/settings/general" },
  { label: "Security", to: "/platform/settings/security" },
  { label: "Notifications", to: "/platform/settings/notifications" },
];
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
