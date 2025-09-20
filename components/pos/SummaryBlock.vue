<template>
  <div class="bg-[#262626ё] flex flex-col shadow-style font-bold text-[17px]">
    <!-- Подытог -->
    <div class="flex items-center justify-between p-4">
      <span>Подытог</span>
      <span>{{ formatPrice(subtotal) }} UZS</span>
    </div>

    <!-- Скидка -->
    <!-- Скидка -->
    <div class="flex items-center justify-between p-4">
      <span>Скидка</span>
      <span>{{ formatPrice(totalDiscount) }} UZS</span>
    </div>

    <!-- К оплате -->
    <div
      class="flex items-center justify-between rounded-[15px] px-5 py-6"
      :class="total > 0 ? 'bg-[#1f78ff] cursor-pointer' : 'bg-[#bdbdbd]'"
    >
      <span class="uppercase">Оплатить</span>
      <span>{{ formatPrice(total) }} UZS</span>
    </div>

    <!-- Отложить -->
    <div
      class="flex items-center justify-center text-gray-300 p-5 cursor-pointer"
    >
      Отложить
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useCartStore } from "@/store/cart";
import { useFormatPrice } from "@/composables/useFormatPrice";

const cartStore = useCartStore();
const { subtotal, totalDiscount, total } = storeToRefs(cartStore);

// наш форматтер
const { formatPrice } = useFormatPrice();
</script>
