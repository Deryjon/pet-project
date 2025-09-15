<template>
    <div
      class="bg-[#1e1e1e] rounded-xl flex flex-col shadow-style font-bold text-[17px] mt-auto"
    >
      <!-- Подытог -->
      <div class="flex items-center justify-between p-5">
        <span>Подытог</span>
        <span>{{ subtotal }} UZS</span>
      </div>
  
      <!-- Скидка -->
      <div class="flex items-center justify-between p-5">
        <span>Скидка</span>
        <span>{{ discount }} UZS</span>
      </div>
  
      <!-- К оплате -->
      <div
        class="flex items-center justify-between rounded-[15px] bg-[#404040] p-5"
      >
        <span>Оплатить</span>
        <span>{{ total }} UZS</span>
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
  import { computed } from "vue";
  import { storeToRefs } from "pinia";
  import { useCartStore } from "@/store/cart";
  
  const cartStore = useCartStore();
  const { totalPrice } = storeToRefs(cartStore);
  
  // Подытог — вся сумма
  const subtotal = computed(() => totalPrice.value);
  
  // Скидка (например, пока 0, но можно потом формулу)
  const discount = computed(() => 0);
  
  // К оплате = подытог - скидка
  const total = computed(() => subtotal.value - discount.value);
  </script>
  