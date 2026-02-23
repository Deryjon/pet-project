<template>
  <div
    class="w-full border-2 bg-[#262626] text-white rounded-[20px] flex flex-wrap gap-y-[30px] gap-x-[15px] p-[20px]"
  >
    <div
      v-for="field in selectFields"
      :key="field.key"
      class="w-[370px]"
    >
      <CustomSelect
        :label="field.label"
        :options="field.options"
        :placeholder="field.placeholder"
        v-model="filters[field.key]"
      />
    </div>

    <PriceRange
      v-for="field in priceFields"
      :key="field.key"
      :label="field.label"
      v-model:min="prices[field.key].min"
      v-model:max="prices[field.key].max"
    />

    <div class="w-[370px] flex flex-col gap-2">
      <span class="text-sm text-[#bdbdbd] font-bold">Свободная цена</span>
      <div class="flex gap-2">
        <button
          @click="freePrice = true"
          :class="[
            'flex-1 rounded-lg py-2 font-bold',
            freePrice ? 'bg-green-600' : 'bg-[#404040]',
          ]"
        >
          Вкл
        </button>
        <button
          @click="freePrice = false"
          :class="[
            'flex-1 rounded-lg py-2 font-bold',
            !freePrice ? 'bg-red-600' : 'bg-[#404040]',
          ]"
        >
          Выкл
        </button>
      </div>
    </div>

    <div class="w-full flex gap-4 mt-4">
      <button
        @click="resetFilters"
        class="bg-[#505050] hover:bg-[#606060] p-[15px] rounded-lg font-bold w-full"
      >
        Сбросить фильтры
      </button>
      <button
        @click="acceptFilters"
        class="bg-[#1f78ff] hover:bg-[#606060] p-[15px] rounded-lg font-bold w-full"
      >
        Применить фильтры
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import CustomSelect from "./ui/CustomSelect.vue";
import PriceRange from "./ui/PriceRange.vue";

type SelectFieldKey =
  | "store"
  | "category"
  | "article"
  | "brand"
  | "supplier"
  | "unit";

type PriceFieldKey = "supply" | "sale" | "wholesale";

const selectFields: Array<{
  key: SelectFieldKey;
  label: string;
  placeholder: string;
  options: string[];
}> = [
  {
    key: "store",
    label: "Магазин",
    placeholder: "Выберите магазин",
    options: ["Магазин 1", "Магазин 2", "Магазин 3"],
  },
  {
    key: "category",
    label: "Категория",
    placeholder: "Введите категорию",
    options: ["Наушники", "Зарядное устройство", "Чехлы"],
  },
  {
    key: "article",
    label: "Артикул",
    placeholder: "Введите артикул",
    options: ["AAA", "BBB", "CCC"],
  },
  {
    key: "brand",
    label: "Бренд",
    placeholder: "Введите бренд",
    options: ["Apple", "Samsung", "Xiaomi"],
  },
  {
    key: "supplier",
    label: "Поставщик",
    placeholder: "Введите поставщика",
    options: ["Apple", "Samsung", "Xiaomi"],
  },
  {
    key: "unit",
    label: "Единица измерения",
    placeholder: "Выберите единицу",
    options: ["Шт", "Упаковка", "Коробка"],
  },
];

const priceFields: Array<{ key: PriceFieldKey; label: string }> = [
  { key: "supply", label: "Цена поставки" },
  { key: "sale", label: "Цена продажи" },
  { key: "wholesale", label: "Оптовая цена" },
];

const filters = reactive<Record<SelectFieldKey, string>>({
  store: "",
  category: "",
  article: "",
  brand: "",
  supplier: "",
  unit: "",
});

const prices = reactive<Record<PriceFieldKey, { min: string; max: string }>>({
  supply: { min: "", max: "" },
  sale: { min: "", max: "" },
  wholesale: { min: "", max: "" },
});

const freePrice = ref(false);

function resetFilters() {
  for (const field of selectFields) {
    filters[field.key] = "";
  }
  for (const field of priceFields) {
    prices[field.key].min = "";
    prices[field.key].max = "";
  }
  freePrice.value = false;
}

function acceptFilters() {}
</script>
