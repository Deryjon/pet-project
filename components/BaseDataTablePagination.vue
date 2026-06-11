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
      </div>
    </div>

    <div
      class="order-1 flex items-center gap-3 rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(31,120,255,0.12),rgba(255,255,255,0.03))] px-3 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.16)] transition-all duration-300 sm:order-2 sm:justify-end"
      :class="loading ? 'border-[#1f78ff]/35 shadow-[0_14px_34px_rgba(31,120,255,0.14)]' : 'hover:border-white/15'"
    >
      <div class="flex items-center gap-2">
        <span class="text-[15px] font-semibold text-[#9bc2ff]">Показывать по</span>
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-90"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-90"
        >
          <span
            v-if="loading"
            class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#1f78ff]/15 text-[#7fb0ff]"
          >
            <Icon name="svg-spinners:90-ring-with-bg" class="h-3.5 w-3.5" />
          </span>
        </Transition>
      </div>

      <USelect
        v-model="selectedPageSize"
        :items="pageSizeItems"
        value-key="value"
        :disabled="loading"
        size="sm"
        color="neutral"
        variant="outline"
        class="w-[76px] shrink-0"
        :ui="{
          base: 'rounded-xl border border-white/10 bg-[#363636] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 hover:border-white/20 hover:bg-[#3b3b3b] data-[state=open]:border-[#1f78ff]/45 data-[state=open]:bg-[#404040] disabled:cursor-not-allowed disabled:opacity-60',
          trailingIcon: 'text-[#7fb0ff] transition-transform duration-300',
          content: 'z-[70] w-[76px] min-w-[76px] overflow-hidden rounded-[14px] border border-white/10 bg-[#2f2f2f] p-1 text-white shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl',
          item: 'rounded-lg text-white transition-colors duration-200 data-[highlighted]:bg-[#404040] data-[highlighted]:text-white',
          value: 'justify-center text-center font-semibold text-white',
        }"
      />
    </div>
  </div>
</template>
