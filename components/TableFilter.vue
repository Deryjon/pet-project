<template>
  <div
    class="w-full border-2 bg-[#262626] text-white rounded-[20px] flex flex-wrap gap-y-[30px] gap-x-[15px] p-[20px]"
  >
    <!-- Магазин -->
    <div class="w-[370px]">
      <CustomSelect
        label="Магазин"
        :options="['Магазин 1', 'Магазин 2', 'Магазин 3']"
        placeholder="Выберите магазин"
        v-model="store"
      />
    </div>

    <!-- Категория -->
    <div class="w-[370px]">
      <CustomSelect
        label="Категория"
        :options="['Наушники', 'Зарядное устройство', 'Чехлы']"
        placeholder="Введите категорию"
        v-model="category"
      />
    </div>

    <!-- Артикул -->
    <div class="w-[370px]">
      <CustomSelect
        label="Артикул"
        :options="['AAA', 'BBB', 'CCC']"
        placeholder="Введите артикул"
        v-model="article"
      />
    </div>

    <!-- Бренд -->
    <div class="w-[370px]">
      <CustomSelect
        label="Бренд"
        :options="['Apple', 'Samsung', 'Xiaomi']"
        placeholder="Введите бренд"
        v-model="brand"
      />
    </div>

    <!-- Поставщик -->
    <div class="w-[370px]">
      <CustomSelect
        label="Поставщик"
        :options="['Apple', 'Samsung', 'Xiaomi']"
        placeholder="Введите поставщика"
        v-model="supplier"
      />
    </div>

    <!-- Единица измерения -->
    <div class="w-[370px]">
      <CustomSelect
        label="Единица измерения"
        :options="['Шт', 'Упаковка', 'Коробка']"
        placeholder="Выберите единицу"
        v-model="unit"
      />
    </div>

    <PriceRange
      label="Цена поставки"
      v-model:min="supplyPriceMin"
      v-model:max="supplyPriceMax"
    />
    <PriceRange
      label="Цена продажи"
      v-model:min="salePriceMin"
      v-model:max="salePriceMax"
    />
    <PriceRange
      label="Оптовая цена"
      v-model:min="wholesalePriceMin"
      v-model:max="wholesalePriceMax"
    />

    <!-- Свободная цена -->
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

    <!-- Сбросить -->
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
import { ref } from "vue";
import CustomSelect from "./ui/CustomSelect.vue";
import PriceRange from "./ui/PriceRange.vue";
// Селекты
const store = ref("");
const category = ref("");
const article = ref("");
const brand = ref("");
const supplier = ref("");
const unit = ref("");

// Цены
const supplyPriceMin = ref("");
const supplyPriceMax = ref("");
const salePriceMin = ref("");
const salePriceMax = ref("");
const wholesalePriceMin = ref("");
const wholesalePriceMax = ref("");

// Свободная цена
const freePrice = ref(false);

const resetFilters = () => {
  store.value = "";
  category.value = "";
  article.value = "";
  brand.value = "";
  supplier.value = "";
  unit.value = "";
  supplyPriceMin.value = "";
  supplyPriceMax.value = "";
  salePriceMin.value = "";
  salePriceMax.value = "";
  wholesalePriceMin.value = "";
  wholesalePriceMax.value = "";
  freePrice.value = false;
};
const acceptFilters = () => {};
</script>
