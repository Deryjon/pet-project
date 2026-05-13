<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    pageSize?: number;
    pageSizeOptions?: number[];
    loading?: boolean;
  }>(),
  {
    pageSize: 10,
    pageSizeOptions: () => [10, 20, 30, 40, 50],
    loading: false,
  }
);

const emit = defineEmits<{
  (e: "update:pageSize", value: number): void;
}>();

const selectedPageSize = computed({
  get: () => props.pageSize,
  set: (value) => emit("update:pageSize", Number(value)),
});
</script>

<template>
  <div class="mt-[20px] flex flex-row items-center justify-between gap-4">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-1">
        <UButton
          icon="i-heroicons-chevron-left-20-solid"
          color="neutral"
          variant="ghost"
          :disabled="isPreviousDisabled"
          :ui="{ icon: { base: 'text-[#1f78ff] h-6 w-6' } }"
          @click="emit('previous')"
        />

        <span class="text-[14px] font-medium text-white/70">
          {{ currentPage }}
          <span class="mx-1 opacity-40">/</span>
          {{ totalPages }}
        </span>

        <UButton
          icon="i-heroicons-chevron-right-20-solid"
          color="neutral"
          variant="ghost"
          :disabled="isNextDisabled"
          :ui="{ icon: { base: 'text-[#1f78ff] h-6 w-6' } }"
          @click="emit('next')"
        />
      </div>
    </div>

    <div class="flex items-center gap-2">
      <span class="text-[14px] font-semibold text-[#1f78ff]">
        Показывать по:
      </span>

     <select
  v-model="selectedPageSize"
  :disabled="loading"
  class="w-[80px] cursor-pointer appearance-none rounded-[10px] border border-white/10 bg-[#363636] px-3 py-2 text-sm text-white transition-colors hover:bg-[#404040] focus:border-[#1f78ff] focus:outline-none focus:ring-1 focus:ring-[#1f78ff] disabled:cursor-not-allowed disabled:opacity-50"
>
  <option
    v-for="option in pageSizeOptions"
    :key="option"
    :value="option"
    :style="{
      backgroundColor: '#262626',
      color: '#ffffff'
    }"
  >
    {{ option }}
  </option>
</select>
    </div>
  </div>
</template>