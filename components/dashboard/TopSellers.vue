<script setup lang="ts">
import { ref, computed } from "vue";
import { useDashboardStore } from "@/store/dashboard";

const store = useDashboardStore();
const sellers = store.periodData.topSellers;

// выбранный тип сортировки
const sortType = ref<"sum" | "avgCheck" | "avgCount">("sum");
const showOptions = ref(false);

const options = [
  { label: "Сумма продаж", value: "sum" },
  { label: "Средний чек", value: "avgCheck" },
  { label: "Среднее кол-во товаров чеке", value: "avgCount" },
] as const;

const sortedSellers = computed(() => {
  return [...sellers].sort((a, b) => {
    const valA = a[sortType.value] ?? 0;
    const valB = b[sortType.value] ?? 0;
    return valB - valA;
  });
});

const currentLabel = computed(() => {
  return options.find((o) => o.value === sortType.value)?.label || "";
});
</script>

<template>
  <div class="p-7 bg-[#262626] rounded-lg shadow-style">
    <div class="flex justify-between items-center mb-4">
      <h3 class="font-bold text-[24px]">Топ-продавцы</h3>

      <!-- кастомный селект -->
      <div class="relative">
        <button
          @click="showOptions = !showOptions"
          class=" rounded-lg text-sm flex items-center gap-2"
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
                sortType = opt.value as 'sum' | 'avgCheck' | 'avgCount';
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

    <div class="flex flex-col gap-2">
      <div
        v-for="(s, i) in sortedSellers"
        :key="i"
        class="flex items-center bg-[#404040] px-4 py-4 rounded-[15px] w-full justify-between"
      >
        <div class="left flex items-center gap-3">
          <div
            class="circle w-[20px] h-[20px] rounded-full"
            :style="{ backgroundColor: s.color || '#999' }"
          ></div>
          <p class="font-semibold text-[15px]">{{ s.name }}</p>
        </div>
        <p class="text-sm text-[#4993dd] font-semibold">
          <span v-if="sortType === 'sum'">
            {{ s.sum?.toLocaleString?.() ?? "0" }} UZS
          </span>
          <span v-else-if="sortType === 'avgCheck'">
            {{ s.avgCheck?.toLocaleString?.() ?? "0" }} UZS
          </span>
          <span v-else>
            {{ s.avgCount?.toLocaleString?.() ?? "0" }} ШТ
          </span>
        </p>
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
