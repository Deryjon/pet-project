<template>
    <div class="rounded-xl mt-[30px]">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h3 class="text-[36px] font-semibold">Корзина</h3>
          <span class="bg-[#404040] px-[25px] py-2 rounded-full font-bold text-[24px]">
            {{ cart.length }}
          </span>
        </div>
        <span class="text-[36px] font-bold text-[#bdbdbd]">#4046384943</span>
      </div>
  
      <div
        v-if="cart.length === 0"
        class="cart mt-[20px] w-full h-[400px] rounded-[25px] p-[20px] flex flex-col items-center justify-center"
      >
        <span class="text-[24px] font-bold">Корзинка пока что пуста</span>
        <span class="text-[18px] font-bold w-[340px] text-center text-[#5e5e5e]">
          Нажмите “/” для поиска товаров или отсканируйте товары
        </span>
      </div>
  
      <div v-else class="mt-[20px] w-full max-h-[400px] overflow-y-auto rounded-[25px] p-[20px]">
        <CartItem
          v-for="item in cart"
          :key="item.id"
          :item="item"
          @remove="removeFromCart(item.id)"
        />
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useCartStore } from "@/store/cart";
  import { storeToRefs } from "pinia";
  import CartItem from "./CartItem.vue";
  
  const store = useCartStore();
  const { cart } = storeToRefs(store);
  const { removeFromCart } = store;
  </script>
  
  <style scoped>
  .cart {
    border: 1px dashed #919090;
  }
  </style>
  