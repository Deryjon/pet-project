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
  <div class="mt-5 flex items-center justify-between gap-4">
    <div class="order-2 flex items-center sm:order-1">
      <div class="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#2f2f2f] p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
        <button
          type="button"
          :disabled="isPreviousDisabled"
          class="flex h-10 w-10 items-center justify-center rounded-xl text-[#1f78ff] transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-35"
          @click="emit('previous')"
        >
          <Icon name="heroicons:chevron-left-20-solid" class="h-5 w-5" />
        </button>

        <div class="min-w-[82px] px-2 text-center">
          <span class="block text-[11px] uppercase tracking-[0.14em] text-white/35">Page</span>
          <span class="text-[14px] font-semibold text-white/80">
            {{ currentPage }} <span class="mx-1 text-white/30">/</span> {{ totalPages }}
          </span>
        </div>

        <button
          type="button"
          :disabled="isNextDisabled"
          class="flex h-10 w-10 items-center justify-center rounded-xl text-[#1f78ff] transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-35"
          @click="emit('next')"
        >
          <Icon name="heroicons:chevron-right-20-solid" class="h-5 w-5" />
        </button>
щл
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
