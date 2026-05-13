<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    currentPage: number;
    totalPages: number;
    loading?: boolean;
    pageSize?: number;
    pageSizeOptions?: number[];
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

const isPreviousDisabled = computed(() => props.loading || props.currentPage <= 1);
const isNextDisabled = computed(
  () => props.loading || props.currentPage >= props.totalPages,
);

const pageSizeItems = computed(() =>
  props.pageSizeOptions.map((value) => ({
    label: String(value),
    value,
  })),
);

const selectedPageSize = computed({
  get: () => Number(props.pageSize || 10),
  set: (value: number | string) => {
    const nextValue = Number(value);
    if (!Number.isFinite(nextValue) || nextValue <= 0) {
      return;
    }

    emit("update:pageSize", nextValue);
  },
});
</script>

<template>
  <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div class="order-2 flex items-center sm:order-1">
      <div class="flex min-w-[132px] items-center justify-between gap-3">
        <UButton
          icon="i-heroicons-chevron-left-20-solid"
          color="neutral"
          variant="ghost"
          :disabled="isPreviousDisabled"
          :ui="{ icon: { base: 'h-6 w-6 text-[#1f78ff]' } }"
          @click="emit('previous')"
        />

        <span class="min-w-[52px] text-center text-[14px] font-medium text-white/70">
          {{ currentPage }} <span class="mx-1 opacity-40">/</span> {{ totalPages }}
        </span>

        <UButton
          icon="i-heroicons-chevron-right-20-solid"
          color="neutral"
          variant="ghost"
          :disabled="isNextDisabled"
          :ui="{ icon: { base: 'h-6 w-6 text-[#1f78ff]' } }"
          @click="emit('next')"
        />
      </div>
    </div>

    <div class="order-1 flex items-center justify-between gap-2 sm:order-2 sm:justify-end">
      <span class="text-[16px] font-semibold text-[#1f78ff]">Показывать по:</span>
      <USelect
        v-model="selectedPageSize"
        :items="pageSizeItems"
        value-key="value"
        :disabled="loading"
        size="sm"
        color="neutral"
        variant="outline"
        class="w-[62px] shrink-0"
        :ui="{
          base: 'rounded-[10px] border-white/10 bg-[#363636] text-white',
          content: 'z-[70] w-[62px] min-w-[72px] overflow-hidden rounded-[12px] border border-white/10 bg-[#2f2f2f] text-white shadow-[0_18px_40px_rgba(0,0,0,0.28)]',
          item: 'text-white data-[highlighted]:bg-[#404040]',
        }"
      />
    </div>
  </div>
</template>
