<script setup lang="ts">
import { useProductStore } from "@/store/productStore";

const store = useProductStore();
</script>

<template>
  <section>
    <h3 class="text-xl font-semibold">Остатки</h3>
    <table class="mt-8 w-full overflow-hidden rounded-lg border-gray-300">
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
            <UInput
              v-model.number="s.qty"
              type="number"
              class="w-24"
              :ui="{ base: 'rounded-lg p-2 text-white bg-[#404040] ring-0' }"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
