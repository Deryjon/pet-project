<script setup lang="ts">
import { useProductStore } from '@/store/productStore'
const store = useProductStore()
</script>

<template>
  <section>
    <h3 class="text-xl font-semibold">Остатки</h3>
    <table class="w-full border-gray-300 rounded-lg overflow-hidden mt-8">
      <thead>
        <tr>
          <th class="p-3 text-left">Магазин</th>
          <th class="p-3 text-left">Кол-во</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in store.stores" :key="s.name" class="border-t">
          <td class="p-3">{{ s.name }}</td>
          <td class="p-3">
            <input
              type="number"
              class="w-24 rounded-lg p-2"
              v-model.number="s.qty"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
