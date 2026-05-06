<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useUserStore } from "~/store/useUserStore";

const emit = defineEmits<{ (e: "open-sidebar"): void; (e: "logout"): void }>();
const route = useRoute();
const userStore = useUserStore();

const pageTitle = computed(() => {
  if (route.path === "/platform" || route.path === "/platform/dashboard") return "Главная";
  if (route.path === "/platform/companies") return "Компании";
  if (route.path === "/platform/companies/create") return "Создание компании";
  if (route.path.startsWith("/platform/companies/")) return "Компания";
  if (route.path === "/platform/subscriptions") return "Подписки";
  if (route.path === "/platform/payments") return "Оплаты";
  if (route.path === "/platform/plans") return "Тарифы";
  if (route.path === "/platform/users") return "Пользователи";
  if (route.path === "/platform/notifications") return "Уведомления";
  if (route.path === "/platform/settings" || route.path.startsWith("/platform/settings/")) return "Настройки";
  return "Платформа";
});

const roleLabel = computed(() => {
  const role = String(userStore.normalizedRoles?.[0] || userStore.user.role || "").trim();
  const labels: Record<string, string> = {
    platform_admin: "Администратор платформы",
    superadmin: "Суперадминистратор",
  };
  return labels[role] || role || "Администратор платформы";
});
</script>

<template>
  <header class="sticky top-0 z-20 mb-8 flex items-center justify-between gap-4 rounded-[28px] border border-white/80 bg-white/75 px-4 py-4 shadow-[0_20px_45px_rgba(15,23,42,0.06)] backdrop-blur sm:px-6">
    <div class="flex min-w-0 items-center gap-3">
      <UButton color="neutral" variant="soft" class="cursor-pointer rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 lg:hidden" @click="emit('open-sidebar')">
        <Icon name="heroicons:bars-3" class="h-5 w-5" />
      </UButton>
      <div class="min-w-0">
        <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Админ-панель</p>
        <h1 class="truncate text-[20px] font-semibold text-slate-950 sm:text-[24px]">{{ pageTitle }}</h1>
      </div>
    </div>

    <div class="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
      <UAvatar size="md" alt="Администратор платформы" src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=160&h=160&q=80" />
      <div>
        <p class="text-[14px] font-semibold text-slate-900">{{ userStore.fullName || "Пользователь платформы" }}</p>
        <p class="text-[12px] text-slate-500">{{ roleLabel }}</p>
      </div>
      <UButton color="neutral" variant="ghost" class="cursor-pointer rounded-xl text-slate-500 hover:bg-slate-100" @click="emit('logout')">
        <Icon name="heroicons:arrow-right-on-rectangle" class="h-5 w-5" />
      </UButton>
    </div>
  </header>
</template>
