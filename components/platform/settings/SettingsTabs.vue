<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const items = [
  { label: "Общие", to: "/platform/settings/general" },
  { label: "Безопасность", to: "/platform/settings/security" },
  { label: "Уведомления", to: "/platform/settings/notifications" },
];

function isActive(path: string) {
  return route.path === path;
}

async function goTo(path: string) {
  if (route.path !== path) {
    await router.push(path);
  }
}
</script>

<template>
  <div class="overflow-x-auto">
    <div class="inline-flex min-w-full gap-2 rounded-[26px] border border-white/70 bg-white/70 p-2 shadow-[0_20px_45px_rgba(15,23,42,0.05)] backdrop-blur-xl">
      <button
        v-for="item in items"
        :key="item.to"
        type="button"
        class="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-2xl px-4 py-2 text-[14px] font-semibold transition"
        :class="isActive(item.to) ? 'bg-slate-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'"
        @click="goTo(item.to)"
      >
        {{ item.label }}
      </button>
    </div>
  </div>
</template>
