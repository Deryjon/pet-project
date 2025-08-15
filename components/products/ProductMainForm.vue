<script setup lang="ts">
import { useProductStore } from '@/store/productStore'
const store = useProductStore()
</script>

<template>
  <div class="flex flex-col gap-4">
    <h3 class="text-xl font-semibold mb-4">Основные</h3>

    <!-- Тип продукта -->
    <div>
      <label class="font-medium">Тип продукта</label>
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

    <!-- Вариативность -->
    <div class="mt-6">
      <label class="font-medium">Вариативность продукта</label>
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
      <input type="text" placeholder="Введите наименование" class="w-full mt-4" />
    </div>

    <!-- Артикул и Баркод -->
    <div class="flex gap-4">
      <div class="w-full">
        <label class="font-medium">Артикул</label>
        <div class="flex gap-2 bg-[#404040] rounded-[15px] pr-[15px] mt-4">
          <input v-model="store.article" type="text" placeholder="Введите артикул" class="flex-1 bg-transparent" />
          <button type="button" @click="store.generateCode('article')">Генерировать</button>
        </div>
      </div>
      <div class="w-full">
        <label class="font-medium">Баркод</label>
        <div class="flex gap-2 bg-[#404040] rounded-[15px] pr-[15px] mt-4">
          <input v-model="store.barcode" type="text" placeholder="Введите баркод" class="flex-1 bg-transparent" />
          <button type="button" @click="store.generateCode('barcode')">Генерировать</button>
        </div>
      </div>
    </div>

    <!-- Единица измерения -->
    <div class="flex flex-col">
      <label class="font-medium mb-2">Единица измерения</label>
      <select class="w-1/2 rounded-lg p-3">
        <option v-for="unit in store.units" :key="unit">{{ unit }}</option>
      </select>
    </div>

    <!-- Фото -->
    <div>
      <label class="font-medium mb-2">Фото</label>
      <div class="mt-4 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer bg-[#404040] hover:bg-[#5e5e5e]">
        <p>Перетащите фото в эту область</p>
        <p class="text-sm text-gray-500">- или -</p>
        <p class="text-blue-500">Нажмите для обзора</p>
      </div>
    </div>
  </div>
</template>
