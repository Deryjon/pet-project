<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import { useApi } from "@/composables/useApi";
import { useUserStore } from "@/store/useUserStore";

definePageMeta({ layout: "platform" });
useHead({ title: "Профиль платформы | Konkurent" });

type ProfileResponse = {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
};

const { apiFetch } = useApi();
const userStore = useUserStore();

const firstName = ref("");
const lastName = ref("");
const phone = ref("");
const loading = ref(true);
const saving = ref(false);
const successMessage = ref("");
const errorMessage = ref("");

const fullName = computed(() => {
  return [firstName.value, lastName.value].filter(Boolean).join(" ").trim() || userStore.fullName || "Пользователь платформы";
});

const initials = computed(() => {
  return [firstName.value, lastName.value]
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2) || "KP";
});

function clearMessages() {
  successMessage.value = "";
  errorMessage.value = "";
}

async function fetchProfile() {
  loading.value = true;
  clearMessages();

  try {
    const profile = await apiFetch<ProfileResponse>("/user/profile", { method: "GET" });
    firstName.value = profile?.first_name || userStore.user.firstName || "";
    lastName.value = profile?.last_name || userStore.user.lastName || "";
    phone.value = profile?.phone_number || userStore.user.phone || "";
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || "Не удалось загрузить профиль";
  } finally {
    loading.value = false;
  }
}

async function saveProfile() {
  saving.value = true;
  clearMessages();

  try {
    await apiFetch("/user/profile", {
      method: "PATCH",
      body: {
        first_name: firstName.value.trim(),
        last_name: lastName.value.trim(),
      },
    });

    await userStore.fetchMe();
    await fetchProfile();
    successMessage.value = "Данные профиля обновлены";
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || "Не удалось сохранить изменения";
  } finally {
    saving.value = false;
  }
}

onMounted(fetchProfile);
</script>

<template>
  <div class="space-y-8">
    <PageHeader
      eyebrow="Профиль"
      title="Личные данные"
      description="Здесь пользователь платформы может изменить свои данные: имя и фамилию."
    />

    <div v-if="errorMessage" class="rounded-[28px] border border-rose-200/80 bg-rose-50/90 px-5 py-4 text-[14px] text-rose-700 shadow-[0_18px_40px_rgba(190,24,93,0.08)]">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="rounded-[28px] border border-emerald-200/80 bg-emerald-50/90 px-5 py-4 text-[14px] text-emerald-700 shadow-[0_18px_40px_rgba(16,185,129,0.08)]">
      {{ successMessage }}
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <DataPanel title="Редактирование профиля" description="Обновите имя и фамилию. После сохранения данные обновятся в платформенной панели.">
        <div v-if="loading" class="space-y-4">
          <div class="h-14 animate-pulse rounded-2xl bg-slate-100/80" />
          <div class="h-14 animate-pulse rounded-2xl bg-slate-100/80" />
          <div class="h-14 animate-pulse rounded-2xl bg-slate-100/80" />
        </div>

        <form v-else class="grid gap-5 md:grid-cols-2" @submit.prevent="saveProfile">
          <label class="block">
            <span class="mb-2 block text-[13px] font-semibold text-slate-700">Имя</span>
            <input
              v-model="firstName"
              type="text"
              placeholder="Введите имя"
              class="w-full rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-[14px] text-slate-950 shadow-sm outline-none transition focus:border-teal-300 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label class="block">
            <span class="mb-2 block text-[13px] font-semibold text-slate-700">Фамилия</span>
            <input
              v-model="lastName"
              type="text"
              placeholder="Введите фамилию"
              class="w-full rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-[14px] text-slate-950 shadow-sm outline-none transition focus:border-teal-300 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label class="block md:col-span-2">
            <span class="mb-2 block text-[13px] font-semibold text-slate-700">Телефон</span>
            <input
              :value="phone"
              type="text"
              readonly
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-500 shadow-sm outline-none"
            />
          </label>

          <div class="flex flex-wrap items-center gap-3 pt-2 md:col-span-2">
            <UButton type="submit" :loading="saving" class="cursor-pointer rounded-2xl px-5 py-3">
              Сохранить изменения
            </UButton>

            <UButton type="button" color="neutral" variant="soft" class="cursor-pointer rounded-2xl" @click="fetchProfile">
              Обновить данные
            </UButton>
          </div>
        </form>
      </DataPanel>

      <div class="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,#0f172a_0%,#134e4a_100%)] p-6 text-white shadow-[0_32px_80px_rgba(15,23,42,0.18)]">
        <div class="flex items-center gap-4">
          <div class="flex h-16 w-16 items-center justify-center rounded-[24px] bg-white/10 text-[22px] font-semibold text-white ring-1 ring-white/15">
            {{ initials }}
          </div>
          <div class="min-w-0">
            <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-200">Платформа</p>
            <h3 class="truncate text-[24px] font-semibold tracking-[-0.04em]">{{ fullName }}</h3>
            <p class="mt-1 truncate text-[14px] text-slate-200">{{ phone || "Телефон не указан" }}</p>
          </div>
        </div>

        <p class="mt-5 text-[14px] leading-7 text-slate-200">
          Здесь можно поддерживать в актуальном состоянии свои личные данные для платформенной админки.
        </p>
      </div>
    </div>
  </div>
</template>
