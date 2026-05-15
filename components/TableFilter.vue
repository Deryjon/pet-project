<template>
  <section class="overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_top_left,rgba(73,147,221,0.14),transparent_24%),linear-gradient(180deg,#262626,#202020)] shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
    <div class="flex flex-col gap-5 border-b border-white/6 px-5 py-5 sm:px-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-1">
          <p class="text-[20px] font-bold text-white">Фильтры каталога</p>
          <p class="max-w-[760px] text-[14px] leading-6 text-[#9f9f9f]">
            Фильтрация по магазину, категории, бренду, поставщику, единице измерения и диапазону цен.
          </p>
        </div>

        <button
          class="inline-flex items-center justify-center rounded-[16px] bg-white/6 px-4 py-3 text-[13px] font-semibold text-[#d7d7d7] transition hover:bg-white/10 hover:text-white"
          @click="store.resetFilters()"
        >
          Сбросить
        </button>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div
          v-for="field in selectFields"
          :key="field.key"
          class="min-w-0 rounded-[24px] bg-white/[0.04] p-4"
        >
          <CustomSelect
            v-model="store.filters[field.key]"
            :label="field.label"
            :options="field.options"
            :placeholder="field.placeholder"
          />
        </div>
      </div>
    </div>

    <div class="px-5 py-5 sm:px-6">
      <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <PriceRange
          v-for="field in priceFields"
          :key="field.key"
          v-model:min="store.prices[field.key].min"
          v-model:max="store.prices[field.key].max"
          :label="field.label"
        />
      </div>

      <div class="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          class="w-full rounded-[18px] bg-[#3b3b3b] px-5 py-4 text-[15px] font-bold text-white transition hover:bg-[#474747]"
          @click="store.resetFilters()"
        >
          Очистить фильтры
        </button>
        <button
          class="w-full rounded-[18px] bg-[#1f78ff] px-5 py-4 text-[15px] font-bold text-white transition hover:bg-[#2a6ed9]"
          @click="store.applyFilters()"
        >
          Применить фильтры
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import CustomSelect from "./ui/CustomSelect.vue";
import PriceRange from "./ui/PriceRange.vue";
import { useCatalogDataTableStore } from "@/store/DataTables/catalogDataTableStore";

type SelectFieldKey =
  | "store"
  | "category"
  | "article"
  | "brand"
  | "supplier"
  | "unit";

type PriceFieldKey = "supply" | "sale" | "wholesale";

type SelectOption = {
  label: string;
  value: string;
};

const store = useCatalogDataTableStore();

const selectFields = computed<Array<{
  key: SelectFieldKey;
  label: string;
  placeholder: string;
  options: SelectOption[];
}>>(() => [
  {
    key: "store",
    label: "Магазин",
    placeholder: "Выберите магазин",
    options: store.filterOptions.store,
  },
  {
    key: "category",
    label: "Категория",
    placeholder: "Выберите категорию",
    options: store.filterOptions.category,
  },
  {
    key: "article",
    label: "Артикул",
    placeholder: "Выберите артикул",
    options: store.filterOptions.article,
  },
  {
    key: "brand",
    label: "Бренд",
    placeholder: "Выберите бренд",
    options: store.filterOptions.brand,
  },
  {
    key: "supplier",
    label: "Поставщик",
    placeholder: "Выберите поставщика",
    options: store.filterOptions.supplier,
  },
  {
    key: "unit",
    label: "Единица измерения",
    placeholder: "Выберите единицу",
    options: store.filterOptions.unit,
  },
]);

const priceFields = computed<Array<{ key: PriceFieldKey; label: string }>>(() => [
  ...(store.canViewSupplyPrice ? [{ key: "supply" as const, label: "Цена поставки" }] : []),
  { key: "sale", label: "Цена продажи" },
  { key: "wholesale", label: "Оптовая цена" },
]);
</script>
