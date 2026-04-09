<script setup lang="ts">
import { computed, ref } from "vue";
import { useHead } from "#imports";

useHead({ title: "Роли | Konkurent.cases" });

type RoleCard = {
  id: string;
  title: string;
  badge: string;
  accent: string;
  summary: string;
  permissions: string[];
};

const roles = ref<RoleCard[]>([
  {
    id: "owner",
    title: "Владелец",
    badge: "owner",
    accent: "from-amber-400/30 to-orange-500/20 border-amber-300/40",
    summary: "Полный доступ к компании, сотрудникам, филиалам и ключевым настройкам.",
    permissions: [
      "Полный доступ к сотрудникам и ролям",
      "Управление филиалами и переключением между ними",
      "Доступ к настройкам компании и финансовым разделам",
      "Просмотр всех отчетов и операций",
    ],
  },
  {
    id: "admin",
    title: "Администратор",
    badge: "admin",
    accent: "from-sky-400/30 to-cyan-500/20 border-sky-300/40",
    summary: "Операционное управление магазином и командой без прав владельца.",
    permissions: [
      "Создание и редактирование сотрудников",
      "Управление остатками, товарами и заказами",
      "Просмотр отчетов по продажам и складу",
      "Контроль рабочих процессов филиала",
    ],
  },
  {
    id: "store_manager",
    title: "Управляющий магазином",
    badge: "store_manager",
    accent: "from-emerald-400/30 to-teal-500/20 border-emerald-300/40",
    summary: "Контролирует работу конкретного филиала и следит за персоналом.",
    permissions: [
      "Просмотр и управление сотрудниками своего филиала",
      "Контроль продаж и заказов филиала",
      "Работа с остатками и перемещениями в пределах доступа",
      "Доступ к операционным показателям точки",
    ],
  },
  {
    id: "cashier",
    title: "Кассир",
    badge: "cashier",
    accent: "from-fuchsia-400/25 to-pink-500/20 border-fuchsia-300/40",
    summary: "Работает на кассе, оформляет продажи и взаимодействует с клиентом.",
    permissions: [
      "Создание и проведение продаж",
      "Работа с клиентами и их долгами в пределах доступа",
      "Просмотр ограниченных данных по товару и остаткам",
      "Без доступа к настройкам компании и управлению ролями",
    ],
  },
  {
    id: "employee",
    title: "Сотрудник",
    badge: "employee",
    accent: "from-slate-300/20 to-slate-400/10 border-slate-200/30",
    summary: "Базовая роль для повседневных операций без административных прав.",
    permissions: [
      "Работа только в назначенном филиале",
      "Ограниченный доступ к разделам управления",
      "Доступ только к разрешенным операциям",
      "Без прав на изменение ролей и настроек",
    ],
  },
]);

const selectedRoleId = ref("owner");

const selectedRole = computed<RoleCard>(() => roles.value.find((role) => role.id === selectedRoleId.value) ?? roles.value[0]!);

const stats = computed(() => [
  { label: "Всего ролей", value: roles.value.length, helper: "Базовые роли компании" },
  { label: "Админ-уровень", value: 3, helper: "Owner, admin, store_manager" },
  { label: "Операционные", value: 2, helper: "Cashier и employee" },
]);
</script>

<template>
  <section class="space-y-6 text-white">
    <div class="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.82))] p-6 shadow-[0_28px_70px_rgba(2,6,23,0.35)] lg:flex-row lg:items-end lg:justify-between">
      <div class="max-w-3xl">
        <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-sky-300">Управление</p>
        <h1 class="mt-3 text-[30px] font-bold tracking-[-0.04em] text-white">Роли</h1>
        <p class="mt-3 text-[15px] leading-7 text-slate-300">
          Страница ролей для раздела управления. Здесь видно, какие роли есть в системе и какие права логически к ним относятся.
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <NuxtLink
          to="/management/employees"
          class="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[14px] font-medium text-slate-100 transition hover:bg-white/10"
        >
          Сотрудники
        </NuxtLink>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-2xl border border-sky-300/30 bg-sky-400/15 px-4 py-3 text-[14px] font-medium text-sky-100 transition hover:bg-sky-400/20"
        >
          CRUD ролей позже
        </button>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <article
        v-for="item in stats"
        :key="item.label"
        class="rounded-[24px] border border-white/10 bg-white/5 p-5 shadow-[0_18px_50px_rgba(2,6,23,0.22)] backdrop-blur"
      >
        <p class="text-[12px] uppercase tracking-[0.18em] text-slate-400">{{ item.label }}</p>
        <p class="mt-3 text-[28px] font-semibold text-white">{{ item.value }}</p>
        <p class="mt-2 text-[14px] text-slate-400">{{ item.helper }}</p>
      </article>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section class="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_55px_rgba(2,6,23,0.22)] backdrop-blur">
        <div class="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 class="text-[22px] font-semibold text-white">Каталог ролей</h2>
            <p class="mt-2 text-[14px] text-slate-400">Выберите роль и посмотрите зону ответственности.</p>
          </div>
        </div>

        <div class="grid gap-4">
          <button
            v-for="role in roles"
            :key="role.id"
            type="button"
            class="group rounded-[24px] border p-5 text-left transition duration-200"
            :class="selectedRoleId === role.id ? `bg-gradient-to-br ${role.accent} shadow-[0_18px_50px_rgba(15,23,42,0.18)]` : 'border-white/10 bg-slate-900/70 hover:border-white/20 hover:bg-slate-900/90'"
            @click="selectedRoleId = role.id"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-[19px] font-semibold text-white">{{ role.title }}</p>
                <p class="mt-2 text-[14px] leading-6 text-slate-300">{{ role.summary }}</p>
              </div>
              <span class="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-sky-200">
                {{ role.badge }}
              </span>
            </div>
          </button>
        </div>
      </section>

      <aside class="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(30,41,59,0.88))] p-6 shadow-[0_24px_60px_rgba(2,6,23,0.28)]">
        <div class="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <p class="text-[12px] uppercase tracking-[0.18em] text-slate-400">Выбранная роль</p>
          <h3 class="mt-3 text-[26px] font-semibold text-white">{{ selectedRole.title }}</h3>
          <p class="mt-3 text-[14px] leading-7 text-slate-300">{{ selectedRole.summary }}</p>
        </div>

        <div class="mt-5 rounded-[24px] border border-white/10 bg-slate-950/40 p-5">
          <p class="text-[12px] uppercase tracking-[0.18em] text-slate-400">Права и доступы</p>
          <div class="mt-4 space-y-3">
            <div
              v-for="permission in selectedRole.permissions"
              :key="permission"
              class="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
            >
              <div class="mt-1 h-2.5 w-2.5 rounded-full bg-sky-300" />
              <p class="text-[14px] leading-6 text-slate-200">{{ permission }}</p>
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[24px] border border-amber-300/15 bg-amber-400/10 p-5">
          <p class="text-[12px] uppercase tracking-[0.18em] text-amber-200">Статус страницы</p>
          <p class="mt-3 text-[14px] leading-7 text-amber-50/90">
            Маршрут готов и страница работает. Если дальше нужен реальный CRUD ролей, нужен отдельный backend-контракт для списка,
            создания, редактирования и удаления ролей.
          </p>
        </div>
      </aside>
    </div>
  </section>
</template>
