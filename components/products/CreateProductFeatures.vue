<script setup lang="ts">
import { useProductStore } from "@/store/productStore";

const store = useProductStore();
</script>

<template>
  <section>
    <h3 class="text-xl font-semibold">Характеристики</h3>
    <div class="mt-8 flex justify-between gap-4">
      <div class="flex w-full flex-col">
        <label class="mb-2 font-medium">Бренд</label>
        <UInput
          type="text"
          placeholder="Введите бренд"
          class="w-full"
          :ui="{ base: 'rounded-lg p-3 text-white bg-[#404040] ring-0' }"
        />
      </div>

      <div class="flex w-full flex-col">
        <label class="mb-2 font-medium">Поставщик</label>
        <UInput
          type="text"
          placeholder="Введите поставщика"
          class="w-full"
          :ui="{ base: 'rounded-lg p-3 text-white bg-[#404040] ring-0' }"
        />
      </div>

      <div class="relative flex w-full flex-col">
        <label class="mb-2 font-medium">Категория</label>
        <USelect
          v-model="store.selectedCategory"
          :items="store.categories"
          placeholder="Выберите категорию"
          class="w-full"
          :ui="{ base: 'rounded-lg p-3 text-white bg-[#404040] ring-0' }"
        />
      </div>
    </div>
  </section>
</template>
