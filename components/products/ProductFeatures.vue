<script setup lang="ts">
import { useProductStore } from '@/store/productStore'
const store = useProductStore()
</script>

<template>
  <section>
    <h3 class="text-xl font-semibold">Характеристики</h3>
    <div class="flex justify-between gap-4 mt-8">
      <div class="flex flex-col w-full">
        <label class="font-medium mb-2">Бренд</label>
        <input type="text" placeholder="Введите бренд" class="rounded-lg p-3" />
      </div>
      <div class="flex flex-col w-full">
        <label class="font-medium mb-2">Поставщик</label>
        <input type="text" placeholder="Введите поставщика" class="rounded-lg p-3" />
      </div>
      <div class="flex flex-col w-full">
        <label class="font-medium mb-2">Категория</label>
        <select class="rounded-lg p-3">
          <option v-for="cat in store.categories" :key="cat">{{ cat }}</option>
        </select>
      </div>
    </div>
  </section>
</template>
