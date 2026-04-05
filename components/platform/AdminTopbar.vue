<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const emit = defineEmits<{ (e: "open-sidebar"): void; (e: "logout"): void }>();
const route = useRoute();

const titleMap: Record<string, string> = {
  "/platform": "Dashboard",
  "/platform/companies": "Companies",
  "/platform/shops": "Shops / Locations",
  "/platform/users": "Users",
  "/platform/settings": "Settings",
};

const pageTitle = computed(() => titleMap[route.path] ?? "Platform");
</script>

<template>
  <header class="sticky top-0 z-20 mb-8 flex items-center justify-between gap-4 rounded-[28px] border border-white/80 bg-white/75 px-4 py-4 shadow-[0_20px_45px_rgba(15,23,42,0.06)] backdrop-blur sm:px-6">
    <div class="flex min-w-0 items-center gap-3">
      <UButton color="neutral" variant="soft" class="rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 lg:hidden" @click="emit('open-sidebar')">
        <Icon name="heroicons:bars-3" class="h-5 w-5" />
      </UButton>
      <div class="min-w-0">
        <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Platform Admin</p>
        <h1 class="truncate text-[20px] font-semibold text-slate-950 sm:text-[24px]">{{ pageTitle }}</h1>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <div class="hidden min-w-[260px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex">
        <Icon name="heroicons:magnifying-glass" class="h-4 w-4 text-slate-400" />
        <input type="text" placeholder="Search companies, shops, users" class="w-full bg-transparent text-[14px] text-slate-700 outline-none placeholder:text-slate-400" />
      </div>
      <button class="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700">
        <Icon name="heroicons:bell" class="h-5 w-5" />
        <span class="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
      </button>
      <div class="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
        <UAvatar size="md" alt="Platform Admin" src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=160&h=160&q=80" />
        <div>
          <p class="text-[14px] font-semibold text-slate-900">Platform Admin</p>
          <p class="text-[12px] text-slate-500">Super Admin</p>
        </div>
        <UButton color="neutral" variant="ghost" class="rounded-xl text-slate-500 hover:bg-slate-100" @click="emit('logout')">
          <Icon name="heroicons:arrow-right-on-rectangle" class="h-5 w-5" />
        </UButton>
      </div>
    </div>
  </header>
</template>
