<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { usePlatformAdminSession } from "@/composables/usePlatformAdmin";

definePageMeta({ layout: false });

const router = useRouter();
const { signIn, restore, authenticated } = usePlatformAdminSession();

const form = reactive({
  phone: "",
  password: "",
});

const loading = ref(false);
const showPassword = ref(false);
const errors = reactive({
  phone: "",
  password: "",
});

function formatPhone(input = "") {
  const digits = input.replace(/\D/g, "").slice(0, 9);
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 7),
    digits.slice(7, 9),
  ].filter(Boolean);

  return parts.join(" ");
}

watch(
  () => form.phone,
  (value) => {
    const formatted = formatPhone(value);
    if (formatted !== value) {
      form.phone = formatted;
    }
  },
);

restore();
if (authenticated.value) {
  router.replace("/platform");
}

function submit() {
  const phoneDigits = form.phone.replace(/\D/g, "");

  errors.phone = phoneDigits.length === 9 ? "" : "Введите номер телефона";
  errors.password = form.password.trim() ? "" : "Введите пароль";

  if (errors.phone || errors.password) {
    return;
  }

  loading.value = true;
  setTimeout(() => {
    signIn();
    router.push("/platform");
    loading.value = false;
  }, 650);
}
</script>

<template>
  <section class="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_48%,#e2e8f0_100%)] px-4 py-10 sm:px-6 lg:px-10">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.08),transparent_30%)]" />
    <div class="absolute inset-0 opacity-50" style="background-image: linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px); background-size: 44px 44px;" />
    <div class="absolute -left-20 top-16 h-72 w-72 rounded-full bg-sky-200/50 blur-3xl" />
    <div class="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-200/50 blur-3xl" />

    <div class="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_480px]">
      <div class="max-w-2xl">
        <div class="inline-flex items-center gap-3 rounded-full border border-white/80 bg-white/70 px-4 py-2 shadow-sm backdrop-blur">
          <span class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">KP</span>
          <span class="text-[12px] font-semibold uppercase tracking-[0.22em] text-slate-500">Konkurent Platform</span>
        </div>

        <h1 class="mt-8 max-w-3xl text-[42px] font-semibold leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-[56px]">
          Безопасный вход в панель управления платформой CRM.
        </h1>
        <p class="mt-6 max-w-2xl text-[17px] leading-8 text-slate-600">
          Единое рабочее пространство для управления платформой, компаниями и операционными процессами всей CRM-системы.
        </p>

        <div class="mt-8 grid gap-4 sm:grid-cols-3">
          <div class="rounded-[28px] border border-white/80 bg-white/75 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur">
            <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Безопасный вход</p>
            <p class="mt-3 text-[15px] font-semibold text-slate-900">Защищённая точка входа только для администраторов платформы.</p>
          </div>
          <div class="rounded-[28px] border border-white/80 bg-white/75 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur">
            <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Контроль платформы</p>
            <p class="mt-3 text-[15px] font-semibold text-slate-900">Управляйте компаниями, филиалами и пользователями из одного окна.</p>
          </div>
          <div class="rounded-[28px] border border-white/80 bg-white/75 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur">
            <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Управление компаниями</p>
            <p class="mt-3 text-[15px] font-semibold text-slate-900">Подключайте, настраивайте и масштабируйте клиентские организации.</p>
          </div>
        </div>
      </div>

      <div class="rounded-[36px] border border-white/80 bg-white/85 p-6 shadow-[0_40px_120px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
        <div class="border-b border-slate-100 pb-6">
          <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Авторизация платформы</p>
          <h2 class="mt-3 text-[32px] font-semibold tracking-[-0.04em] text-slate-950">Вход</h2>
          <p class="mt-3 text-[15px] leading-7 text-slate-500">
            Введите номер телефона и пароль администратора платформы, чтобы продолжить работу в системе управления.
          </p>
        </div>

        <form class="mt-6 space-y-5" @submit.prevent="submit">
          <div class="space-y-2">
            <label class="text-[13px] font-semibold text-slate-700">Номер телефона</label>
            <div class="flex items-center rounded-2xl border bg-slate-50 transition focus-within:bg-white" :class="errors.phone ? 'border-rose-300 bg-rose-50/60' : 'border-slate-200 focus-within:border-sky-300'">
              <span class="pl-4 text-[15px] font-medium text-slate-500">+998</span>
              <input
                v-model="form.phone"
                type="tel"
                inputmode="numeric"
                placeholder="90 123 45 67"
                class="w-full bg-transparent px-3 py-3.5 text-[15px] text-slate-900 outline-none"
              />
            </div>
            <p v-if="errors.phone" class="text-[13px] text-rose-500">{{ errors.phone }}</p>
          </div>

          <div class="space-y-2">
            <label class="text-[13px] font-semibold text-slate-700">Пароль</label>
            <div class="flex items-center rounded-2xl border bg-slate-50 transition focus-within:bg-white" :class="errors.password ? 'border-rose-300 bg-rose-50/60' : 'border-slate-200 focus-within:border-sky-300'">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Введите пароль"
                class="w-full bg-transparent px-4 py-3.5 text-[15px] text-slate-900 outline-none"
              />
              <button type="button" class="px-4 text-[13px] font-semibold text-slate-500 transition hover:text-slate-800" @click="showPassword = !showPassword">
                {{ showPassword ? "Скрыть" : "Показать" }}
              </button>
            </div>
            <p v-if="errors.password" class="text-[13px] text-rose-500">{{ errors.password }}</p>
          </div>

          <UButton type="submit" color="neutral" class="h-14 w-full justify-center rounded-2xl bg-slate-950 text-[15px] font-semibold text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)] hover:bg-slate-800" :disabled="loading">
            <Icon v-if="loading" name="heroicons:arrow-path" class="mr-2 h-4 w-4 animate-spin" />
            {{ loading ? "Входим..." : "Войти" }}
          </UButton>
        </form>

        <div class="mt-6 rounded-[24px] bg-slate-950 p-5 text-white">
          <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">Слой безопасности</p>
          <p class="mt-3 text-[14px] leading-7 text-slate-300">
            Сейчас для этого интерфейса используется mock-авторизация на фронтенде. API можно подключить позже без переделки макета.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
