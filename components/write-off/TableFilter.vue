<template>
    <div class="w-full border-2 bg-[#262626] text-white rounded-[20px] p-[20px]">
      <div class="grid w-full grid-cols-1 gap-y-[30px] md:grid-cols-2 md:gap-x-4">
      <!-- Дата -->
      <div class="w-full bg-[#404040] p-[15px] rounded-lg">
        e
        <!-- <DatePicker v-model="date" label="Дата" placeholder="Выберите дату" /> -->
      </div>
  
      <!-- Магазин -->
      <div class="w-full">
        <CustomSelect
          label="Магазин"
          :options="['Магазин 1', 'Магазин 2']"
          placeholder="Выберите магазин"
          v-model="store"
        />
      </div>
  
      <!-- Сумма по цене поставки -->
      <PriceRange
        label="Сумма по цене поставки"
        v-model:min="supplyPriceMin"
        v-model:max="supplyPriceMax"
      />
  
      <!-- Статус -->
      <div class="w-full">
        <CustomSelect
          label="Статус"
          :options="['В обработке', 'Принято', 'Отменено']"
          placeholder="Введите статус"
          v-model="status"
        />
      </div>
  
      <!-- Тип импорта -->
      <div class="w-full">
        <CustomSelect
          label="Тип импорта"
          :options="['Автоматический', 'Ручной']"
          placeholder="Введите тип импорта"
          v-model="importType"
        />
      </div>
  
      
    </div>
    <!-- Кнопки -->
    <div class="mt-4 flex w-full flex-col gap-4 sm:flex-row">
        <button
          @click="resetFilters"
          class="bg-[#505050] hover:bg-[#606060] p-[15px] rounded-lg font-bold w-full"
        >
          Сбросить фильтр
        </button>
        <button
          @click="acceptFilters"
          class="bg-[#1f78ff] hover:bg-[#606060] p-[15px] rounded-lg font-bold w-full"
        >
          Применить
        </button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from "vue";
  import CustomSelect from "../ui/CustomSelect.vue";
  import PriceRange from "../ui/PriceRange.vue";
  
  // Фильтры
  const date = ref("");
  const store = ref("");
  const supplyPriceMin = ref("");
  const supplyPriceMax = ref("");
  const status = ref("");
  const importType = ref("");
  
  // Методы
  const resetFilters = () => {
    date.value = "";
    store.value = "";
    supplyPriceMin.value = "";
    supplyPriceMax.value = "";
    status.value = "";
    importType.value = "";
  };
  const acceptFilters = () => {};
  </script>
  
