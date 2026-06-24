<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useHead } from "#imports";
import { useReportFavorites, type ReportFavorite } from "~/composables/useReportFavorites";

useHead({ title: "Избранные отчеты | Konkurent" });

const { getAll, remove } = useReportFavorites();

const favorites = ref<ReportFavorite[]>([]);

const defaultPresets = [
  { title: "Продажи за сегодня", description: "Быстрый срез по текущему дню.", route: "/reports?preset=today" },
  { title: "Продажи за месяц", description: "Основные KPI текущего месяца.", route: "/reports?preset=month" },
  { title: "Отчет Globus Mall", description: "Сохраненный фильтр по одному магазину.", route: "/reports/shops?preset=globus" },
  { title: "Продавцы за месяц", description: "KPI и зарплата команды продаж.", route: "/reports/sellers?preset=sellers-month" },
  { title: "Топ прибыльных товаров", description: "Фокус на валовой прибыли ассортимента.", route: "/reports/products?preset=profit-top" },
];

function loadFavorites() {
  favorites.value = getAll();
}

function handleRemove(id: string) {
  remove(id);
  loadFavorites();
}

const displayItems = computed(() => {
  if (favorites.value.length > 0) return favorites.value;
  return defaultPresets.map((p, i) => ({
    id: `preset-${i}`,
    title: p.title,
    description: p.description,
    route: p.route,
    createdAt: "",
  }));
});

const isCustom = computed(() => favorites.value.length > 0);

onMounted(loadFavorites);
</script>

<template>
  <section class="space-y-6 text-white">
    <div
      class="rounded-[30px] border border-white/10 bg-[linear-gradient(160deg,rgba(31,120,255,0.16),rgba(15,23,42,0.95))] p-6 shadow-[0_28px_70px_rgba(2,6,23,0.32)]"
    >
      <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#8ec8ff]">
        Favorites
      </p>
      <h1 class="mt-3 text-[32px] font-bold tracking-[-0.05em]">
        Избранные отчеты
      </h1>
      <p class="mt-3 max-w-3xl text-[15px] leading-7 text-slate-300">
        Быстрый доступ к сохраненным фильтрам и отчетам. {{ isCustom ? "" : "Показаны стандартные пресеты." }}
      </p>
    </div>

    <div v-if="displayItems.length === 0" class="rounded-[24px] border border-white/10 bg-[#202020] p-8 text-center">
      <p class="text-[18px] font-semibold text-white">Нет избранных отчетов</p>
      <p class="mt-2 text-[14px] text-[#9a9a9a]">
        Добавьте отчеты в избранное, чтобы они появились здесь.
      </p>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="item in displayItems"
        :key="item.id"
        class="group relative rounded-[26px] border border-white/10 bg-[#202020] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.18)] transition hover:border-[#5bb4ff]/30 hover:bg-[#252525]"
      >
        <NuxtLink :to="item.route" class="block">
          <p class="text-[18px] font-semibold text-white">{{ item.title }}</p>
          <p class="mt-3 text-sm leading-6 text-[#a3a3a3]">{{ item.description }}</p>
        </NuxtLink>

        <button
          v-if="isCustom"
          class="absolute right-4 top-4 rounded-lg p-1.5 text-[#9a9a9a] opacity-0 transition hover:bg-white/10 hover:text-red-400 group-hover:opacity-100"
          title="Удалить"
          @click.stop="handleRemove(item.id)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  </section>
</template>
