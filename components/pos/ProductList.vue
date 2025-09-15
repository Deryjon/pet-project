<template>
    <div
      v-if="filteredProducts.length > 0 && searchQuery"
      class="mt-3 bg-[#333333] rounded-xl p-3 max-h-[250px] overflow-y-auto"
    >
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        @click="addToCart(product)"
        class="flex justify-between items-center p-2 rounded-lg cursor-pointer hover:bg-[#404040] transition"
      >
        <div class="flex flex-col">
          <span class="font-semibold">{{ product.name }}</span>
          <span v-if="product.barcode" class="text-xs text-gray-400">
            Баркод: {{ product.barcode }}
          </span>
          <span v-if="product.article" class="text-xs text-gray-400">
            Артикул: {{ product.article }}
          </span>
        </div>
        <div class="flex items-center gap-3">
          <span class="font-bold">{{ product.price.toLocaleString() }} UZS</span>
          <button
            class="px-3 py-1 bg-green-600 rounded-lg text-sm hover:bg-green-700"
          >
            ➕
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useCartStore } from "@/store/cart";
  import { storeToRefs } from "pinia";
  
  const store = useCartStore();
  const { filteredProducts, searchQuery } = storeToRefs(store);
  const { addToCart } = store;
  </script>
  