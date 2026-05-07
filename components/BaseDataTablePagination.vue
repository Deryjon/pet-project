<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    currentPage: number;
    totalPages: number;
    loading?: boolean;
    pageSize?: number;
    pageSizeOptions?: number[];
    previousLabel?: string;
    nextLabel?: string;
  }>(),
  {
    loading: false,
    pageSize: 10,
    pageSizeOptions: () => [10, 20, 30, 40, 50],
    previousLabel: "Назад",
    nextLabel: "Вперед",
  },
);

const emit = defineEmits<{
  (e: "previous"): void;
  (e: "next"): void;
  (e: "update:pageSize", value: number): void;
}>();

const isPreviousDisabled = computed(() => props.loading || props.currentPage <= 1);
const isNextDisabled = computed(
  () => props.loading || props.currentPage >= props.totalPages,
);
</script>

<template>
  <div class="mt-[15px] flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center sm:gap-[10px]">
    <label class="flex items-center justify-center gap-2 rounded-[12px] border border-[#2f6ed6]/35 bg-[#10294f]/70 px-3 py-2 text-sm text-white sm:justify-start sm:text-base">
      <span class="text-[#bdbdbd]">Показать по</span>
      <select
        class="rounded-[8px] border border-[#2f6ed6]/50 bg-[#1f1f1f] px-2 py-1 text-white outline-none focus:border-[#4993dd]"
        :value="pageSize"
        :disabled="loading"
        @change="emit('update:pageSize', Number(($event.target as HTMLSelectElement).value))"
      >
        <option v-for="option in pageSizeOptions" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
    </label>

    <div class="flex items-center justify-center gap-[10px]">
      <button
        class="rounded-[10px] bg-[#404040] px-[12px] py-[10px] text-sm text-white hover:bg-[#5e5e5e] disabled:cursor-not-allowed disabled:opacity-60 sm:px-[12px] sm:py-[8px] sm:text-base"
        :disabled="isPreviousDisabled"
        @click="emit('previous')"
      >
        {{ previousLabel }}
      </button>

      <span class="min-w-[72px] text-center text-sm text-white sm:text-base">
        {{ currentPage }} / {{ totalPages }}
      </span>

      <button
        class="rounded-[10px] bg-[#404040] px-[12px] py-[10px] text-sm text-white hover:bg-[#5e5e5e] disabled:cursor-not-allowed disabled:opacity-60 sm:px-[12px] sm:py-[8px] sm:text-base"
        :disabled="isNextDisabled"
        @click="emit('next')"
      >
        {{ nextLabel }}
      </button>
    </div>
  </div>
</template>
