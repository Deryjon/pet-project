<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const props = defineProps<{ mobile?: boolean }>();
const emit = defineEmits<{ (e: "logout"): void; (e: "close"): void }>();
const route = useRoute();

const items = computed(() => [
  { label: "Dashboard", to: "/platform", icon: "heroicons:squares-2x2" },
  { label: "Companies", to: "/platform/companies", icon: "heroicons:building-office-2" },
  { label: "Shops / Locations", to: "/platform/shops", icon: "heroicons:map-pin" },
  { label: "Users", to: "/platform/users", icon: "heroicons:users" },
  { label: "Settings", to: "/platform/settings", icon: "heroicons:cog-6-tooth" },
]);

function isActive(path: string) {
  return path === "/platform" ? route.path === path : route.path === path || route.path.startsWith(`${path}/`);
}
</script>

<template>
  <aside class="flex h-full flex-col rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
    <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-2 pb-5">
      <div class="flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,#0f172a,#334155)] text-sm font-semibold text-white shadow-lg">KP</div>
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Platform</p>
          <h2 class="text-[17px] font-semibold text-slate-950">Konkurent Admin</h2>
        </div>
      </div>
      <UButton v-if="props.mobile" color="neutral" variant="ghost" class="rounded-xl text-slate-500 hover:bg-slate-100" @click="emit('close')">
        <Icon name="heroicons:x-mark" class="h-5 w-5" />
      </UButton>
    </div>

    <nav class="mt-6 flex-1 space-y-1.5">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="group flex items-center gap-3 rounded-2xl px-3 py-3 text-[14px] font-medium transition-all duration-200"
        :class="isActive(item.to) ? 'bg-slate-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'"
        @click="emit('close')"
      >
        <Icon :name="item.icon" class="h-5 w-5" :class="isActive(item.to) ? 'text-sky-300' : 'text-slate-400 group-hover:text-slate-700'" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <div class="mt-6 rounded-[24px] bg-slate-950 p-4 text-white shadow-[0_20px_45px_rgba(15,23,42,0.2)]">
      <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300">Secure Access</p>
      <p class="mt-2 text-[15px] font-semibold">Platform control and company management in one place.</p>
      <p class="mt-2 text-[13px] leading-6 text-slate-300">Clean SaaS-grade workspace for onboarding, governance and operational oversight.</p>
      <UButton color="neutral" variant="soft" class="mt-4 w-full justify-center rounded-2xl bg-white/10 text-white hover:bg-white/15" @click="emit('logout')">
        Logout
      </UButton>
    </div>
  </aside>
</template>
