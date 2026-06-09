<script setup lang="ts">
import type { ReportFilterQuery, SelectOption } from "~/composables/useReportsApi";

const props = defineProps<{
  modelValue: ReportFilterQuery;
  shops?: SelectOption[];
  sellers?: SelectOption[];
  categories?: SelectOption[];
  products?: SelectOption[];
  brands?: SelectOption[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: ReportFilterQuery): void;
  (e: "apply"): void;
  (e: "reset"): void;
}>();

const draft = reactive<ReportFilterQuery>({
  from: "",
  to: "",
  shopId: "",
  sellerId: "",
  categoryId: "",
  productId: "",
  brandId: "",
});

watch(
  () => props.modelValue,
  (value) => {
    Object.assign(draft, {
      from: value?.from || "",
      to: value?.to || "",
      shopId: value?.shopId || "",
      sellerId: value?.sellerId || "",
      categoryId: value?.categoryId || "",
      productId: value?.productId || "",
      brandId: value?.brandId || "",
    });
  },
  { immediate: true, deep: true },
);

function pushUpdate() {
  emit("update:modelValue", { ...draft });
}

function apply() {
  pushUpdate();
  emit("apply");
}

function reset() {
  Object.assign(draft, {
    from: "",
    to: "",
    shopId: "",
    sellerId: "",
    categoryId: "",
    productId: "",
    brandId: "",
  });
  pushUpdate();
  emit("reset");
}
</script>

<template>
  <section class="rounded-[28px] border border-white/10 bg-[#202020] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.18)]">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#7fb0ff]">Фильтры</p>
        <h3 class="mt-2 text-[20px] font-semibold text-white">Срез отчета</h3>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          @click="reset"
        >
          Сбросить
        </button>
        <button
          type="button"
          class="rounded-2xl bg-[#1f78ff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2f84ff] disabled:opacity-60"
          :disabled="loading"
          @click="apply"
        >
          Применить
        </button>
      </div>
    </div>

    <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <label class="space-y-2">
        <span class="text-sm font-medium text-[#d3d3d3]">Дата от</span>
        <AppDatePicker v-model="draft.from" clearable class="w-full" @update:model-value="pushUpdate" />
      </label>
      <label class="space-y-2">
        <span class="text-sm font-medium text-[#d3d3d3]">Дата до</span>
        <AppDatePicker v-model="draft.to" clearable class="w-full" @update:model-value="pushUpdate" />
      </label>
      <label class="space-y-2">
        <span class="text-sm font-medium text-[#d3d3d3]">Магазин</span>
        <select v-model="draft.shopId" class="w-full rounded-2xl border border-white/10 bg-[#2a2a2a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6]" @change="pushUpdate">
          <option value="">Все</option>
          <option v-for="option in shops || []" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
      <label class="space-y-2">
        <span class="text-sm font-medium text-[#d3d3d3]">Продавец</span>
        <select v-model="draft.sellerId" class="w-full rounded-2xl border border-white/10 bg-[#2a2a2a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6]" @change="pushUpdate">
          <option value="">Все</option>
          <option v-for="option in sellers || []" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
      <label class="space-y-2">
        <span class="text-sm font-medium text-[#d3d3d3]">Категория</span>
        <select v-model="draft.categoryId" class="w-full rounded-2xl border border-white/10 bg-[#2a2a2a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6]" @change="pushUpdate">
          <option value="">Все</option>
          <option v-for="option in categories || []" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
      <label class="space-y-2">
        <span class="text-sm font-medium text-[#d3d3d3]">Товар</span>
        <select v-model="draft.productId" class="w-full rounded-2xl border border-white/10 bg-[#2a2a2a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6]" @change="pushUpdate">
          <option value="">Все</option>
          <option v-for="option in products || []" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
      <label class="space-y-2">
        <span class="text-sm font-medium text-[#d3d3d3]">Бренд</span>
        <select v-model="draft.brandId" class="w-full rounded-2xl border border-white/10 bg-[#2a2a2a] px-4 py-3 text-white outline-none transition focus:border-[#2f6ed6]" @change="pushUpdate">
          <option value="">Все</option>
          <option v-for="option in brands || []" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
    </div>
  </section>
</template>
