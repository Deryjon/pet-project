<template>
  <div
    class="bg-[#1e1e1e] rounded-xl flex flex-col shadow-style font-bold text-[17px] mt-auto"
  >
    <!-- Подытог -->
    <div class="flex items-center justify-between p-5">
      <span>Подытог</span>
      <span>{{ formatPrice(subtotal) }} UZS</span>
    </div>

    <!-- Скидка -->
 <!-- Скидка -->
<div class="flex items-center justify-between p-5">
  <span>Скидка</span>
  <span>{{ formatPrice(totalDiscount) }} UZS</span>
</div>

    <!-- К оплате -->
    <div
      class="flex items-center justify-between rounded-[15px] bg-[#404040] p-5"
    >
      <span>Оплатить</span>
      <span>{{ formatPrice(total) }} UZS</span>
    </div>

    <!-- Отложить -->
    <div
      class="flex items-center justify-center text-[#404040] p-5 cursor-pointer"
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
