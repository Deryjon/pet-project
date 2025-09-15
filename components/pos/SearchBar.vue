<template>
    <div class="relative flex justify-between">
      <div class="flex items-center gap-4 p-[15px] w-[700px] bg-[#404040] rounded-[15px]">
        <svg width="16" height="17" viewBox="0 0 16 17" fill="none">
          <path
            d="M15.7812 13.8438L12.6562 10.7188C12.5 10.5938 12.3125 10.5 12.125 10.5H11.625C12.4688 9.40625 13 8.03125 13 6.5C13 2.9375 10.0625 0 6.5 0C2.90625 0 0 2.9375 0 6.5C0 10.0938 2.90625 13 6.5 13C8 13 9.375 12.5 10.5 11.625V12.1562C10.5 12.3438 10.5625 12.5312 10.7188 12.6875L13.8125 15.7812C14.125 16.0938 14.5938 16.0938 14.875 15.7812L15.75 14.9062C16.0625 14.625 16.0625 14.1562 15.7812 13.8438ZM6.5 10.5C4.28125 10.5 2.5 8.71875 2.5 6.5C2.5 4.3125 4.28125 2.5 6.5 2.5C8.6875 2.5 10.5 4.3125 10.5 6.5C10.5 8.71875 8.6875 10.5 6.5 10.5Z"
            fill="#BDBDBD"
          />
        </svg>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Артикул, баркод, наименование"
          class="bg-transparent w-full text-[#bdbdbd] text-[17px] font-bold outline-none"
        />
      </div>
  
      <!-- Кнопки справа -->
      <div class="flex gap-2">
        <button class="flex items-center justify-center bg-[#404040] p-[15px] rounded-[15px] hover:bg-[#5e5e5e] transition">
          🔄
        </button>
        <button class="flex items-center justify-center bg-[#404040] p-[15px] rounded-[15px] hover:bg-[#5e5e5e] transition">
          ⏰
        </button>
      </div>
  
      <!-- Список товаров -->
      <div
        v-if="filteredProducts.length > 0 && searchQuery"
        class="absolute top-full mt-2 w-full rounded-xl shadow-lg max-h-[250px] overflow-y-auto z-10 flex flex-col gap-3"
      >
        <div
          v-for="product in filteredProducts"
          :key="product.id"
          class="p-3 cursor-pointer bg-[#262626] hover:bg-[#5e5e5e] flex justify-between items-center text-[16px] font-semibold"
          @click="addToCart(product)"
        >
          <div class="flex items-center gap-4">
            <div class="img bg-[#404040] w-[20px] h-[20px]"></div>
            <div class="flex flex-col">
              <span class="text-[#4993dd]">{{ product.name }}</span>
              <span>{{ product.barcode }} / {{ product.article }}</span>
            </div>
          </div>
          <div class="flex flex-col text-right">
            <span>{{ formatPrice(product.price) }} UZS</span>
            <span class="text-[#999]">Кол-во: 1 шт</span>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useCartStore } from "@/store/cart";
  import { storeToRefs } from "pinia";
  import { useFormatPrice } from "@/composables/useFormatPrice";

  const store = useCartStore();
  const { searchQuery, filteredProducts } = storeToRefs(store);
  const { addToCart } = store;
  const { formatPrice } = useFormatPrice();

  </script>
  