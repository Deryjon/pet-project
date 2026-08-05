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

function setStockPurchasePrice(storeId: string, value: string | number) {
  store.setStorePurchasePrice(storeId, parsePriceInput(String(value)));
}

function setStockSalePrice(storeId: string, value: string | number) {
  store.setStoreSalePrice(storeId, parsePriceInput(String(value)));
}

function updateStockSale(storeId: string) {
  const stock = store.form.stocks.find((s) => s.id === storeId);
  if (!stock) return;

  stock.purchasePrice = nonNegative(stock.purchasePrice);
  stock.markupPercent = nonNegative(stock.markupPercent);
  stock.salePrice = calculateSalePrice(stock.purchasePrice, stock.markupPercent);
}

function updateStockMarkup(storeId: string) {
  const stock = store.form.stocks.find((s) => s.id === storeId);
  if (!stock) return;

  stock.purchasePrice = nonNegative(stock.purchasePrice);
  stock.salePrice = nonNegative(stock.salePrice);
  stock.markupPercent = calculateMarkup(stock.purchasePrice, stock.salePrice);
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

    <div v-if="!isVariantGoods" class="mt-4 overflow-x-auto rounded-lg">
      <p class="mb-3 text-sm text-[#9f9f9f]">
        Цена задаётся отдельно для каждого филиала.
      </p>
      <table class="w-full min-w-[640px] overflow-hidden rounded-lg">
        <thead>
          <tr>
            <th class="p-3 text-left">Филиал</th>
            <th class="p-3 text-left">Цена прихода</th>
            <th class="p-3 text-left">Наценка</th>
            <th class="p-3 text-left">Цена продажи</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="stock in store.form.stocks"
            :key="stock.id"
            class="border-t border-[#454545]"
          >
            <td class="p-3">{{ stock.name }}</td>
            <td class="p-3">
              <div class="flex items-center gap-2">
                <UInput
                  :model-value="formatPrice(stock.purchasePrice)"
                  type="text"
                  inputmode="numeric"
                  class="w-44"
                  placeholder="0"
                  :ui="{ base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400' }"
                  @update:model-value="setStockPurchasePrice(stock.id, String($event))"
                  @blur="updateStockSale(stock.id)"
                />
                <span class="text-sm text-gray-300">UZS</span>
              </div>
            </td>
            <td class="p-3">
              <div class="flex items-center gap-2">
                <UInput
                  v-model.number="stock.markupPercent"
                  type="number"
                  min="0"
                  class="w-32"
                  placeholder="0"
                  :ui="{ base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400' }"
                  @blur="updateStockSale(stock.id)"
                />
                <span class="text-sm text-gray-300">%</span>
              </div>
            </td>
            <td class="p-3">
              <div class="flex items-center gap-2">
                <UInput
                  :model-value="formatPrice(stock.salePrice)"
                  type="text"
                  inputmode="numeric"
                  class="w-44"
                  placeholder="0"
                  :ui="{ base: 'rounded-[15px] border-0 ring-0 bg-[#404040] p-4 text-[18px] font-semibold text-white placeholder:text-gray-400' }"
                  @update:model-value="setStockSalePrice(stock.id, String($event))"
                  @blur="updateStockMarkup(stock.id)"
                />
                <span class="text-sm text-gray-300">UZS</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
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
