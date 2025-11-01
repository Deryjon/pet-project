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

    <button
      class="flex items-center justify-between rounded-[15px] px-5 py-6 w-full"
      :class="(cartStore.payableTotal || total) > 0 && !cartStore.payLoading ? 'bg-[#1f78ff] cursor-pointer' : 'bg-[#bdbdbd] cursor-not-allowed'"
      :disabled="total <= 0 || cartStore.payLoading"
      @click="onPay"
    >
      <span class="uppercase flex items-center gap-2">
        <Icon v-if="cartStore.payLoading" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
        Оплатить
      </span>
      <span>{{ formatPrice(cartStore.payableTotal || total) }} UZS</span>
    </button>

    <button
      class="flex items-center justify-center text-gray-300 p-5 w-full"
      :class="cartStore.cancelLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'"
      :disabled="cartStore.cancelLoading"
      @click="onCancel"
    >
      <Icon v-if="cartStore.cancelLoading" name="heroicons:arrow-path" class="w-4 h-4 animate-spin mr-2" />
      Отмена продажи
    </button>
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


