<script setup lang="ts">
import { ref, computed } from "vue";
import { useDashboardStore } from "@/store/dashboard";

const store = useDashboardStore();
const products = store.periodData.topProducts;

// выбранный тип сортировки
const sortType = ref<"sum" | "count">("sum");
const showOptions = ref(false);

const options = [
  { label: "Чистая выручка", value: "sum" },
  { label: "Кол-во проданных товаров", value: "count" },
] as const;

const sortedProducts = computed(() => {
  return [...products]
    .map((p) => ({
      ...p,
      count: p.count ?? Math.floor(p.sum / 10000), // если нет count в store
    }))
    .sort((a, b) => (b[sortType.value] ?? 0) - (a[sortType.value] ?? 0));
});

const currentLabel = computed(() => {
  return options.find((o) => o.value === sortType.value)?.label || "";
});
</script>

<template>
  <div class="p-7 bg-[#262626] rounded-lg shadow-style">
    <div class="flex justify-between items-center mb-3">
      <h2 class="text-[24px] font-semibold">Топ товары</h2>

      <!-- кастомный селект -->
      <div class="relative">
        <button
          @click="showOptions = !showOptions"
          class="text-sm flex items-center gap-2"
        >
          {{ currentLabel }}
          <svg
            class="w-4 h-4 transition-transform duration-200"
            :class="{ 'rotate-180': showOptions }"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <transition name="fade-scale">
          <ul
            v-show="showOptions"
            class="absolute right-0 mt-2 bg-[#2c2c2c] rounded-lg shadow-lg w-44 text-sm overflow-hidden z-50"
          >
            <li
              v-for="opt in options"
              :key="opt.value"
              @click="
                sortType = opt.value as 'sum' | 'count';
                showOptions = false;
              "
              class="px-3 py-2 cursor-pointer hover:bg-[#3a3a3a] transition-colors"
            >
              {{ opt.label }}
            </li>
          </ul>
        </transition>
      </div>
    </div>

    <div class="topProducts-items flex flex-col gap-2 mt-[30px]">
      <div
        v-for="(p, i) in sortedProducts"
        :key="i"
        class="flex items-center bg-[#404040] px-4 py-4 rounded-[15px] w-full justify-between"
      >
        <span class="text-left font-semibold text-[16px]">
          {{ p.name }}
        </span>
        <span class="text-left font-medium text-[#4993dd]">
          <span v-if="sortType === 'sum'">
            {{ p.sum?.toLocaleString?.() ?? 0 }} сум
          </span>
          <span v-else>
            {{ p.count?.toLocaleString?.() ?? 0 }} шт
          </span>
        </span>
      </div>
    </div>
  </div>
</template>
  