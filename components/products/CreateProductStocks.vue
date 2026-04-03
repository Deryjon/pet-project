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

function sanitizeSimpleStock(storeId: string, value: number) {
  store.setStoreQty(storeId, nonNegative(value));
}

function sanitizeVariationStock(variationId: string, storeId: string, value: number) {
  store.setVariationStock(variationId, storeId, nonNegative(value));
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
        <tr v-for="s in store.form.stocks" :key="s.id" class="border-t">
          <td class="p-3 text-[16px]">{{ s.name }}</td>
          <td class="p-3">
            <UInput
              v-model.number="s.qty"
              type="number"
              min="0"
              class="w-32"
              :ui="{ base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400' }"
              @blur="sanitizeSimpleStock(s.id, s.qty)"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <table v-else-if="isVariantGoods" class="mt-8 w-full overflow-hidden rounded-lg border-gray-300">
      <thead>
        <tr>
          <th class="p-3 text-left text-base">Вариация</th>
          <th v-for="s in store.form.stocks" :key="s.id" class="p-3 text-left text-base">{{ s.name }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="variation in store.form.variations" :key="variation.id" class="border-t">
          <td class="p-3 text-[16px]">{{ variation.value || "Без названия" }}</td>
          <td v-for="s in store.form.stocks" :key="`${variation.id}-${s.id}`" class="p-3">
            <UInput
              v-model.number="variation.stocks[s.id]"
              type="number"
              min="0"
              class="w-32"
              :ui="{ base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400' }"
              @blur="sanitizeVariationStock(variation.id, s.id, variation.stocks[s.id] ?? 0)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>


