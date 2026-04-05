<template>
  <div
    class="flex w-full flex-wrap gap-x-[15px] gap-y-[20px] rounded-[20px] border-2 bg-[#262626] p-[20px] text-white"
  >
    <div
      v-for="field in selectFields"
      :key="field.key"
      class="w-full sm:w-[370px]"
    >
      <CustomSelect
        v-model="store.filters[field.key]"
        :label="field.label"
        :options="field.options"
        :placeholder="field.placeholder"
      />
    </div>

    <PriceRange
      v-for="field in priceFields"
      :key="field.key"
      v-model:min="store.prices[field.key].min"
      v-model:max="store.prices[field.key].max"
      :label="field.label"
    />

    <div class="flex w-full flex-col gap-2 sm:w-[370px]">
      <span class="text-sm font-bold text-[#bdbdbd]">Свободная цена</span>
      <div class="flex gap-2">
        <button
          :class="[
            'flex-1 rounded-lg py-2 font-bold',
            store.freePrice ? 'bg-green-600' : 'bg-[#404040]',
          ]"
          @click="store.freePrice = true"
        >
          Вкл
        </button>
        <button
          :class="[
            'flex-1 rounded-lg py-2 font-bold',
            !store.freePrice ? 'bg-red-600' : 'bg-[#404040]',
          ]"
          @click="store.freePrice = false"
        >
          Выкл
        </button>
      </div>
    </div>

    <div class="mt-4 flex w-full flex-col gap-4 sm:flex-row">
      <button
        class="w-full rounded-lg bg-[#505050] p-[15px] font-bold hover:bg-[#606060]"
        @click="store.resetFilters()"
      >
        Сбросить фильтры
      </button>
      <button
        class="w-full rounded-lg bg-[#1f78ff] p-[15px] font-bold hover:bg-[#606060]"
        @click="store.applyFilters()"
      >
        Применить фильтры
      </button>
    </div>
  </div>
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

const store = useCatalogDataTableStore();

const selectFields = computed<Array<{
  key: SelectFieldKey;
  label: string;
  placeholder: string;
  options: string[];
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
    placeholder: "Введите категорию",
    options: store.filterOptions.category,
  },
  {
    key: "article",
    label: "Артикул",
    placeholder: "Введите артикул",
    options: store.filterOptions.article,
  },
  {
    key: "brand",
    label: "Бренд",
    placeholder: "Введите бренд",
    options: store.filterOptions.brand,
  },
  {
    key: "supplier",
    label: "Поставщик",
    placeholder: "Введите поставщика",
    options: store.filterOptions.supplier,
  },
  {
    key: "unit",
    label: "Единица измерения",
    placeholder: "Выберите единицу",
    options: store.filterOptions.unit,
  },
]);

const priceFields: Array<{ key: PriceFieldKey; label: string }> = [
  { key: "supply", label: "Цена поставки" },
  { key: "sale", label: "Цена продажи" },
  { key: "wholesale", label: "Оптовая цена" },
];
</script>
