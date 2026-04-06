<script setup lang="ts">
import { computed, ref } from "vue";
import { useDashboardStore } from "@/store/dashboard";

const store = useDashboardStore();
const sortType = ref<"sum" | "count">("sum");
const showOptions = ref(false);

const options = [
  { label: "Чистая выручка", value: "sum" },
  { label: "Кол-во проданных", value: "count" },
] as const;

const sortedProducts = computed(() => {
  return [...store.periodData.topProducts].sort((a, b) => {
    const valA = Number(a[sortType.value] ?? 0);
    const valB = Number(b[sortType.value] ?? 0);
    return valB - valA;
  });
});

const currentLabel = computed(() => {
  return options.find((item) => item.value === sortType.value)?.label ?? "";
});
</script>

<template>
  <div class="rounded-lg bg-[#262626] p-7 shadow-style">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-[24px] font-semibold">Топ товары</h2>

      <div class="relative">
        <button
          @click="showOptions = !showOptions"
          class="flex items-center gap-2 text-sm"
        >
          {{ currentLabel }}
          <svg
            class="h-4 w-4 transition-transform duration-200"
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
            class="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-lg bg-[#2c2c2c] text-sm shadow-lg"
          >
            <li
              v-for="opt in options"
              :key="opt.value"
              @click="sortType = opt.value; showOptions = false"
              class="cursor-pointer px-3 py-2 transition-colors hover:bg-[#3a3a3a]"
            >
              {{ opt.label }}
            </li>
          </ul>
        </transition>
      </div>
    </div>

    <div class="topProducts-items mt-[30px] flex flex-col gap-2">
      <div
        v-for="(product, index) in sortedProducts"
        :key="`${product.name}-${index}`"
        class="flex w-full items-center justify-between rounded-[15px] bg-[#404040] px-4 py-4"
      >
        <span class="text-left text-[16px] font-semibold">
          {{ product.name }}
        </span>
        <span class="text-left font-medium text-[#4993dd]">
          <span v-if="sortType === 'sum'">
            {{ product.sum?.toLocaleString?.() ?? 0 }} {{ store.reportCurrency }}
          </span>
          <span v-else>
            {{ product.count?.toLocaleString?.() ?? 0 }} шт
          </span>
        </span>
      </div>

      <div
        v-if="sortedProducts.length === 0"
        class="rounded-[15px] bg-[#404040] px-4 py-4 text-sm text-[#bdbdbd]"
      >
        Нет данных по товарам
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.2s ease;
}
.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.fade-scale-enter-to {
  opacity: 1;
  transform: scale(1);
}
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
