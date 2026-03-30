<template>
  <section class="rounded-[28px] border border-white/8 bg-[#202020] p-5 text-white sm:p-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-[12px] font-bold uppercase tracking-[0.24em] text-[#7eb8f0]">
          Filters
        </p>
        <h4 class="mt-2 text-[24px] font-bold text-white">Параметры импорта</h4>
        <p class="mt-1 text-[14px] text-[#a6a6a6]">
          Отберите нужные поставки по магазину, типу, статусу и диапазону суммы.
        </p>
      </div>

      <div class="rounded-[18px] border border-dashed border-white/10 bg-white/5 px-4 py-3">
        <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f9aaa]">
          Дата
        </p>
        <p class="mt-1 text-[14px] font-semibold text-[#d7d7d7]">Скоро добавим выбор периода</p>
      </div>
    </div>

    <div class="mt-5 grid gap-4 lg:grid-cols-2">
      <div class="rounded-[22px] bg-[#2a2a2a] p-4">
        <CustomSelect
          v-model="store"
          label="Магазин"
          :options="['Globus Mall', 'Samarqand Darvoza']"
          placeholder="Выберите магазин"
        />
      </div>

      <div class="rounded-[22px] bg-[#2a2a2a] p-4">
        <CustomSelect
          v-model="status"
          label="Статус"
          :options="['Завершен', 'В обработке', 'Отменен']"
          placeholder="Выберите статус"
        />
      </div>

      <div class="rounded-[22px] bg-[#2a2a2a] p-4">
        <CustomSelect
          v-model="importType"
          label="Тип импорта"
          :options="['Поступление', 'Приход остатков', 'Корректировка']"
          placeholder="Выберите тип импорта"
        />
      </div>

      <div class="rounded-[22px] bg-[#2a2a2a] p-4">
        <PriceRange
          v-model:min="supplyPriceMin"
          v-model:max="supplyPriceMax"
          label="Сумма прихода"
        />
      </div>
    </div>

    <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        class="min-h-[54px] cursor-pointer rounded-[18px] border border-white/10 bg-white/5 px-5 text-[15px] font-bold text-white transition-colors duration-200 hover:bg-white/10"
        @click="resetFilters"
      >
        Сбросить фильтры
      </button>

      <button
        type="button"
        class="min-h-[54px] cursor-pointer rounded-[18px] bg-[#1f78ff] px-6 text-[15px] font-bold text-white transition-colors duration-200 hover:bg-[#2a6ed9]"
        @click="acceptFilters"
      >
        Применить
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import CustomSelect from "../ui/CustomSelect.vue";
import PriceRange from "../ui/PriceRange.vue";

const store = ref("");
const supplyPriceMin = ref("");
const supplyPriceMax = ref("");
const status = ref("");
const importType = ref("");

const resetFilters = () => {
  store.value = "";
  supplyPriceMin.value = "";
  supplyPriceMax.value = "";
  status.value = "";
  importType.value = "";
};

const acceptFilters = () => {};
</script>
