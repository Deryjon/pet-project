<script setup lang="ts">
import { computed } from "vue";
import { nonNegative } from "~/composables/useCreateProductForm";
import { useProductStore } from "@/store/productStore";

const store = useProductStore();

const isSimpleGoods = computed(
  () =>
    store.form.productType === "Товар" &&
    store.form.variationType === "Простой",
);
const isVariantGoods = computed(
  () =>
    store.form.productType === "Товар" &&
    store.form.variationType === "Вариативный",
);

function sanitizeSimpleStock(name: string, value: number) {
  store.setStoreQty(name, nonNegative(value));
}

function sanitizeVariationStock(variationId: string, storeName: string, value: number) {
  store.setVariationStock(variationId, storeName, nonNegative(value));
}
</script>

<template>
  <section>
    <h3 class="text-xl font-semibold">Остатки</h3>

    <table v-if="isSimpleGoods" class="mt-8 w-full overflow-hidden rounded-lg border-gray-300">
      <thead>
        <tr>
          <th class="p-3 text-left text-base">Магазин</th>
          <th class="p-3 text-left text-base">Кол-во</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in store.form.stocks" :key="s.name" class="border-t">
          <td class="p-3 text-[16px]">{{ s.name }}</td>
          <td class="p-3">
            <UInput
              v-model.number="s.qty"
              type="number"
              min="0"
              class="w-32"
              :ui="{ base: 'rounded-lg p-3 text-[16px] text-white bg-[#404040] ring-0' }"
              @blur="sanitizeSimpleStock(s.name, s.qty)"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <table v-else-if="isVariantGoods" class="mt-8 w-full overflow-hidden rounded-lg border-gray-300">
      <thead>
        <tr>
          <th class="p-3 text-left text-base">Вариация</th>
          <th v-for="s in store.form.stocks" :key="s.name" class="p-3 text-left text-base">{{ s.name }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="variation in store.form.variations" :key="variation.id" class="border-t">
          <td class="p-3 text-[16px]">{{ variation.value || "Без названия" }}</td>
          <td v-for="s in store.form.stocks" :key="`${variation.id}-${s.name}`" class="p-3">
            <UInput
              v-model.number="variation.stocks[s.name]"
              type="number"
              min="0"
              class="w-32"
              :ui="{ base: 'rounded-lg p-3 text-[16px] text-white bg-[#404040] ring-0' }"
              @blur="sanitizeVariationStock(variation.id, s.name, variation.stocks[s.name] ?? 0)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
