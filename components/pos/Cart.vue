<template>
  <div class="rounded-xl mt-[30px]">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h3 class="text-[36px] font-semibold">Корзина</h3>
        <span
          class="bg-[#404040] px-[25px] py-2 rounded-full font-bold text-[24px]"
        >
          {{ totalQuantity }}
        </span>
      </div>
      <span class="text-[36px] font-bold text-[#bdbdbd]">#4046384943</span>
    </div>
    <div class="sellers flex gap-3 mt-[20px]">
      <!-- Все продавцы -->
      <div
        class="seller flex items-center bg-[#1f78ff] rounded-[20px] px-[15px] py-[6px] cursor-pointer transition hover:bg-[#3b86ff]"
      >
        <span class="text-[16px] font-bold">Все продавцы</span>
      </div>

      <!-- Добавить -->
      <div
        class="seller flex items-center bg-[#404040] rounded-[20px] px-[15px] py-[6px] cursor-pointer transition hover:bg-[#5e5e5e]"
      >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="#fff" xmlns="http://www.w3.org/2000/svg"><path d="M8 0.25C3.71875 0.25 0.25 3.71875 0.25 8C0.25 12.2812 3.71875 15.75 8 15.75C12.2812 15.75 15.75 12.2812 15.75 8C15.75 3.71875 12.2812 0.25 8 0.25ZM12.5 8.875C12.5 9.09375 12.3125 9.25 12.125 9.25H9.25V12.125C9.25 12.3438 9.0625 12.5 8.875 12.5H7.125C6.90625 12.5 6.75 12.3438 6.75 12.125V9.25H3.875C3.65625 9.25 3.5 9.09375 3.5 8.875V7.125C3.5 6.9375 3.65625 6.75 3.875 6.75H6.75V3.875C6.75 3.6875 6.90625 3.5 7.125 3.5H8.875C9.0625 3.5 9.25 3.6875 9.25 3.875V6.75H12.125C12.3125 6.75 12.5 6.9375 12.5 7.125V8.875Z" fill="#4993DD"></path></svg>
      </div>
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

    <div
      v-else
      class="mt-[20px] w-full max-h-[400px] overflow-y-auto rounded-[25px] p-[20px]"
    >
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
import { computed } from "vue";
import { useCartStore } from "@/store/cart";
import { storeToRefs } from "pinia";
import CartItem from "./CartItem.vue";

const store = useCartStore();
const { cart } = storeToRefs(store);
const { removeFromCart } = store;

// Общий кол-во товаров
const totalQuantity = computed(() =>
  cart.value.reduce((sum, item) => sum + item.quantity, 0)
);
</script>

<style scoped>
.cart {
  border: 1px dashed #919090;
}
</style>
