<template>
  <div class="bg-[#262626] flex flex-col shadow-style font-bold text-[17px]">
    <div class="flex items-center justify-between p-4">
      <span>Промежуточно</span>
      <span>{{ formatPrice(subtotal) }} UZS</span>
    </div>

    <div class="flex items-center justify-between p-4">
      <span>Скидки</span>
      <span>{{ formatPrice(totalDiscount) }} UZS</span>
    </div>

    <div
      class="flex items-center justify-between rounded-[15px] px-5 py-6"
      :class="total > 0 ? 'bg-[#1f78ff] cursor-pointer' : 'bg-[#bdbdbd]'"
      @click="onPay"
    >
      <span class="uppercase">Оплатить</span>
      <span>{{ formatPrice(total) }} UZS</span>
    </div>

    <div
      class="flex items-center justify-center text-gray-300 p-5 cursor-pointer"
      @click="onCancel"
    >
      Отмена продажи
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useCartStore } from "@/store/cart";
import { useFormatPrice } from "@/composables/useFormatPrice";

const cartStore = useCartStore();
const { subtotal, totalDiscount, total } = storeToRefs(cartStore);
const { formatPrice } = useFormatPrice();

async function onPay() {
  if (total.value > 0) {
    await cartStore.paySale();
  }
}

async function onCancel() {
  await cartStore.cancelSale();
}
</script>

