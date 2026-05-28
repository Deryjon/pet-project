<script setup lang="ts">
import { computed } from "vue";
import {
  calculateMarkup,
  calculateSalePrice,
  nonNegative,
} from "~/composables/useCreateProductForm";
import { useProductStore } from "@/store/productStore";

const store = useProductStore();
const goodsType = computed(() => store.productTypes[0]);
const variantType = computed(() => store.productVariants[1]);

const isVariantGoods = computed(
  () =>
    store.form.productType === goodsType.value &&
    store.form.variationType === variantType.value,
);

function formatPrice(value: number) {
  const normalized = Math.round(nonNegative(value));
  return new Intl.NumberFormat("ru-RU").format(normalized);
}

function parsePriceInput(value: string) {
  const digitsOnly = String(value ?? "").replace(/[^\d]/g, "");
  return digitsOnly ? Number(digitsOnly) : 0;
}

function setSimplePurchasePrice(value: string | number) {
  store.form.prices.purchasePrice = nonNegative(parsePriceInput(String(value)));
}

function setSimpleSalePrice(value: string | number) {
  store.form.prices.salePrice = nonNegative(parsePriceInput(String(value)));
}

function setVariationPurchasePrice(variationId: string, value: string | number) {
  const variation = store.form.variations.find((item) => item.id === variationId);
  if (!variation) return;
  variation.prices.purchasePrice = nonNegative(parsePriceInput(String(value)));
}

function setVariationSalePrice(variationId: string, value: string | number) {
  const variation = store.form.variations.find((item) => item.id === variationId);
  if (!variation) return;
  variation.prices.salePrice = nonNegative(parsePriceInput(String(value)));
}

function updateSimpleSale() {
  store.form.prices.purchasePrice = nonNegative(store.form.prices.purchasePrice);
  store.form.prices.markupPercent = nonNegative(store.form.prices.markupPercent);
  store.form.prices.salePrice = calculateSalePrice(
    store.form.prices.purchasePrice,
    store.form.prices.markupPercent,
  );
}

function updateSimpleMarkup() {
  store.form.prices.purchasePrice = nonNegative(store.form.prices.purchasePrice);
  store.form.prices.salePrice = nonNegative(store.form.prices.salePrice);
  store.form.prices.markupPercent = calculateMarkup(
    store.form.prices.purchasePrice,
    store.form.prices.salePrice,
  );
}

function updateVariationSale(variationId: string) {
  const variation = store.form.variations.find((v) => v.id === variationId);
  if (!variation) return;

  variation.prices.purchasePrice = nonNegative(variation.prices.purchasePrice);
  variation.prices.markupPercent = nonNegative(variation.prices.markupPercent);
  variation.prices.salePrice = calculateSalePrice(
    variation.prices.purchasePrice,
    variation.prices.markupPercent,
  );
}

function updateVariationMarkup(variationId: string) {
  const variation = store.form.variations.find((v) => v.id === variationId);
  if (!variation) return;

  variation.prices.purchasePrice = nonNegative(variation.prices.purchasePrice);
  variation.prices.salePrice = nonNegative(variation.prices.salePrice);
  variation.prices.markupPercent = calculateMarkup(
    variation.prices.purchasePrice,
    variation.prices.salePrice,
  );
}
</script>

<template>
  <section>
    <div class="flex items-center">
      <h3 class="mb-4 shrink-0 text-xl font-semibold sm:text-2xl">Цены</h3>
      <div
        class="relative my-4 w-full after:block after:h-[0.8px] after:w-full after:bg-[repeating-linear-gradient(to_right,#6f6f6f_0_12px,transparent_12px_24px)] after:content-['']"
      ></div>
    </div>

    <div v-if="!isVariantGoods" class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div>
        <label class="font-medium">Цена прихода</label>
        <div class="mt-2 flex items-center gap-2">
          <UInput
            :model-value="formatPrice(store.form.prices.purchasePrice)"
            type="text"
            inputmode="numeric"
            class="w-full"
            placeholder="0"
            :ui="{ base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400' }"
            @update:model-value="setSimplePurchasePrice"
            @blur="updateSimpleSale"
          />
          <span class="text-sm text-gray-300">UZS</span>
        </div>
      </div>
      <div>
        <label class="font-medium">Наценка</label>
        <div class="mt-2 flex items-center gap-2">
          <UInput
            v-model.number="store.form.prices.markupPercent"
            type="number"
            min="0"
            class="w-full"
            placeholder="0"
            :ui="{ base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400' }"
            @blur="updateSimpleSale"
          />
          <span class="text-sm text-gray-300">%</span>
        </div>
      </div>
      <div>
        <label class="font-medium">Цена продажи</label>
        <div class="mt-2 flex items-center gap-2">
          <UInput
            :model-value="formatPrice(store.form.prices.salePrice)"
            type="text"
            inputmode="numeric"
            class="w-full"
            placeholder="0"
            :ui="{ base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400' }"
            @update:model-value="setSimpleSalePrice"
            @blur="updateSimpleMarkup"
          />
          <span class="text-sm text-gray-300">UZS</span>
        </div>
      </div>
    </div>

    <div v-else class="mt-4 overflow-x-auto rounded-lg">
      <table class="w-full min-w-[760px] overflow-hidden rounded-lg">
        <thead>
          <tr>
            <th class="p-3 text-left">Вариация</th>
            <th class="p-3 text-left">Цена прихода</th>
            <th class="p-3 text-left">Наценка</th>
            <th class="p-3 text-left">Цена продажи</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="variation in store.form.variations"
            :key="variation.id"
            class="border-t border-[#454545]"
          >
            <td class="p-3">{{ variation.value || "Без названия" }}</td>
            <td class="p-3">
              <UInput
                :model-value="formatPrice(variation.prices.purchasePrice)"
                type="text"
                inputmode="numeric"
                class="w-44"
                :ui="{ base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400' }"
                @update:model-value="setVariationPurchasePrice(variation.id, String($event))"
                @blur="updateVariationSale(variation.id)"
              />
            </td>
            <td class="p-3">
              <UInput
                v-model.number="variation.prices.markupPercent"
                type="number"
                min="0"
                class="w-44"
                :ui="{ base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400' }"
                @blur="updateVariationSale(variation.id)"
              />
            </td>
            <td class="p-3">
              <UInput
                :model-value="formatPrice(variation.prices.salePrice)"
                type="text"
                inputmode="numeric"
                class="w-44"
                :ui="{ base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400' }"
                @update:model-value="setVariationSalePrice(variation.id, String($event))"
                @blur="updateVariationMarkup(variation.id)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
