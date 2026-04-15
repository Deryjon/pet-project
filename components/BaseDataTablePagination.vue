<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    currentPage: number;
    totalPages: number;
    loading?: boolean;
    previousLabel?: string;
    nextLabel?: string;
  }>(),
  {
    loading: false,
    previousLabel: "Назад",
    nextLabel: "Вперед",
  },
);

const emit = defineEmits<{
  (e: "previous"): void;
  (e: "next"): void;
}>();

const isPreviousDisabled = computed(() => props.loading || props.currentPage <= 1);
const isNextDisabled = computed(
  () => props.loading || props.currentPage >= props.totalPages,
);
</script>

<template>
  <div class="mt-[15px] flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-[10px]">
    <button
      class="rounded-[10px] bg-[#404040] px-[12px] py-[10px] text-sm text-white hover:bg-[#5e5e5e] disabled:cursor-not-allowed disabled:opacity-60 sm:px-[12px] sm:py-[8px] sm:text-base"
      :disabled="isPreviousDisabled"
      @click="emit('previous')"
    >
      {{ previousLabel }}
    </button>

    <span class="text-center text-sm text-white sm:text-base">
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
</template>
