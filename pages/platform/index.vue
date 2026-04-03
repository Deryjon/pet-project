<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "~/store/useUserStore";

const router = useRouter();
const userStore = useUserStore();

const isPlatformUser = computed(() => userStore.user.userType === "platform");
const displayName = computed(() => {
  return userStore.fullName || userStore.user.name || userStore.user.phone || "Platform admin";
});

onMounted(async () => {
  if (!userStore.token) {
    await router.replace("/platform/login");
    return;
  }

  if (!userStore.user.userType) {
    await userStore.fetchMe();
  }

  if (userStore.user.userType !== "platform") {
    await router.replace("/auth/login");
  }
});

function logout() {
  userStore.logout();
  router.push("/platform/login");
}
</script>

<template>
  <section class="min-h-screen bg-[#1f1f1f] px-6 py-10 text-white">
    <div class="mx-auto max-w-4xl">
      <div class="flex items-start justify-between gap-4 rounded-[32px] bg-[#262626] p-8">
        <div>
          <p class="text-sm uppercase tracking-[0.22em] text-[#8dbcf8]">Platform Admin</p>
          <h1 class="mt-3 text-4xl font-semibold">CRM admin panel</h1>
          <p class="mt-3 max-w-2xl text-[#bdbdbd]">
            Эта зона предназначена для platform-пользователей: создание компаний,
            филиалов и первичных сотрудников клиента.
          </p>
        </div>

        <button
          class="rounded-[16px] bg-[#404040] px-4 py-3 text-sm font-semibold transition-colors hover:bg-[#525252]"
          @click="logout"
        >
          Выйти
        </button>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-2">
        <div class="rounded-[28px] bg-[#262626] p-6">
          <p class="text-sm text-[#8f8f8f]">Пользователь</p>
          <p class="mt-2 text-2xl font-semibold">{{ displayName }}</p>
          <p class="mt-2 text-[#bdbdbd]">{{ userStore.user.phone || "Телефон не указан" }}</p>
        </div>

        <div class="rounded-[28px] bg-[#262626] p-6">
          <p class="text-sm text-[#8f8f8f]">Тип доступа</p>
          <p class="mt-2 text-2xl font-semibold">
            {{ isPlatformUser ? "platform" : userStore.user.userType || "unknown" }}
          </p>
          <p class="mt-2 text-[#bdbdbd]">
            Для client/company пользователей используется отдельный вход на `/auth/login`.
          </p>
        </div>
      </div>

      <div class="mt-6 rounded-[28px] bg-[#262626] p-6">
        <p class="text-sm uppercase tracking-[0.18em] text-[#8dbcf8]">Что дальше</p>
        <div class="mt-4 grid gap-4 md:grid-cols-3">
          <div class="rounded-[20px] bg-[#2e2e2e] p-5">
            <p class="text-lg font-semibold">1. Создать Company</p>
            <p class="mt-2 text-sm text-[#bdbdbd]">`POST /api/platform/companies`</p>
          </div>
          <div class="rounded-[20px] bg-[#2e2e2e] p-5">
            <p class="text-lg font-semibold">2. Создать Shop</p>
            <p class="mt-2 text-sm text-[#bdbdbd]">`POST /api/platform/companies/:companyId/shops`</p>
          </div>
          <div class="rounded-[20px] bg-[#2e2e2e] p-5">
            <p class="text-lg font-semibold">3. Создать User</p>
            <p class="mt-2 text-sm text-[#bdbdbd]">`POST /api/users/add`</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
