<script setup lang="ts">
import { useProductStore } from '@/store/productStore'
const store = useProductStore()
</script>

<template>
  <div class="flex flex-col gap-4">
    <h3 class="text-xl font-semibold mb-4">Основное</h3>

    <!-- Тип товара -->
    <div>
      <label class="font-medium">Тип товара</label>
      <div class="flex gap-4 mt-4">
        <label
          v-for="type in store.productTypes"
          :key="type"
          class="cursor-pointer flex items-center justify-center p-[17px] w-full rounded-[15px]"
          :class="store.selectedProductType === type
            ? 'bg-[#1f78ff] text-white'
            : 'bg-[#404040] hover:bg-[#5e5e5e] text-white'"
        >
          <input type="radio" class="hidden" v-model="store.selectedProductType" :value="type" />
          {{ type }}
        </label>
      </div>
    </div>

    <!-- Вариантность -->
    <div class="mt-6">
      <label class="font-medium">Вариантность товара</label>
      <div class="flex gap-4 mt-4">
        <label
          v-for="variant in store.productVariants"
          :key="variant"
          class="cursor-pointer flex items-center justify-center p-[17px] w-full rounded-[15px]"
          :class="store.selectedVariant === variant
            ? 'bg-[#1f78ff] text-white'
            : 'bg-[#404040] hover:bg-[#5e5e5e] text-white'"
        >
          <input type="radio" class="hidden" v-model="store.selectedVariant" :value="variant" />
          {{ variant }}
        </label>
      </div>
    </div>

    <!-- Наименование -->
    <div>
      <label class="font-medium">Наименование <span class="text-red-500">*</span></label>
      <input v-model="store.name" type="text" placeholder="Введите наименование" class="w-full mt-4 bg-[#404040] p-[15px] text-[16px] font-semibold rounded-[15px]" />
    </div>

    <!-- Артикул и Штрихкод -->
    <div class="flex gap-4">
      <div class="w-full">
        <label class="font-medium">Артикул</label>
        <div class="flex gap-2 bg-[#404040] rounded-[15px] pr-[15px] mt-4">
          <input v-model="store.article" type="text" placeholder="Введите артикул" class="flex-1 bg-transparent p-[15px]" />
          <button type="button" @click="store.generateCode('article')">Сгенерировать</button>
        </div>
      </div>
      <div class="w-full">
        <label class="font-medium">Штрихкод</label>
        <div class="flex gap-2 bg-[#404040] rounded-[15px] pr-[15px] mt-4">
          <input v-model="store.barcode" type="text" placeholder="Введите штрихкод" class="flex-1 bg-transparent p-[15px]" />
          <button type="button" @click="store.generateCode('barcode')">Сгенерировать</button>
        </div>
      </div>
    </div>

    <!-- Единица измерения -->
    <div class="flex flex-col">
      <label class="font-medium mb-2">Единица измерения</label>
      <select v-model="store.selectedUnit" class="w-1/2 rounded-lg p-3 bg-[#404040]">
        <option v-for="unit in store.units" :key="unit" :value="unit">{{ unit }}</option>
      </select>
    </div>

    <!-- Фото -->
    <div>
      <label class="font-medium mb-2">Фото</label>
      <div class="mt-4 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer bg-[#404040] hover:bg-[#5e5e5e]">
        <p>Перетащите файл или нажмите для загрузки</p>
        <p class="text-sm text-gray-500">- или -</p>
        <p class="text-blue-500">Выберите файл с устройства</p>
      </div>
    </div>
  </div>
  </template>

