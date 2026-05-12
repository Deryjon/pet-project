<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    currentPage: number;
    totalPages: number;
    loading?: boolean;
    pageSize?: number; // New prop for page size
    totalRecords?: number; // New prop for total records
    pageSizeOptions?: number[]; // Используем pageSizeOptions вместо availablePageSizes
  }>(),
  {
    loading: false,
    pageSize: 10,
    pageSizeOptions: () => [10, 20, 30, 40, 50],
  },
);

const emit = defineEmits<{
  (e: "previous"): void;
  (e: "next"): void;
  (e: "update:pageSize", value: number): void;
}>();

const isPreviousDisabled = computed(
  () => props.loading || props.currentPage <= 1,
);
const isNextDisabled = computed(
  () => props.loading || props.currentPage >= props.totalPages,
);
const formattedOptions = computed(() =>
  props.pageSizeOptions.map((opt) => ({
    label: `${opt}`,
    value: opt,
  })),
);
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
          {{ currentPage }} <span class="mx-1 opacity-40">/</span>
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
      <span class="text-[14px] font-semibold text-[#1f78ff]"
        >Показывать по:</span
      >
      <USelect
        :model-value="pageSize"
        :options="formattedOptions"
        option-attribute="label"
        value-attribute="value"
        @update:model-value="emit('update:pageSize', Number($event))"
        :disabled="loading"
        size="sm"
        color="neutral"
        variant="outline"
        class="w-[80px]"
        :ui="{
          base: 'rounded-[10px] bg-[#363636] border-white/10 text-white',
        }"
      />
    </div>
  </div>
</template>
