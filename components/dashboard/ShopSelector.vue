<script setup lang="ts">
import { useDashboardStore } from "@/store/dashboard";
import { ref } from "vue";

const store = useDashboardStore();
const open = ref(false);
function toggle() { open.value = !open.value; }
</script>

<template>
  <div class="relative">
    <div
      @click="toggle"
      class="cursor-pointer text-2xl font-semibold flex items-center gap-2 text-white"
    >
      {{ store.selectedShopName }}
      <svg :class="{ 'rotate-180': open }" class="w-5 h-5 transition-transform">
        <path stroke="currentColor" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    <transition name="fade">
      <ul
        v-if="open"
        class="absolute z-10 mt-2 w-60 bg-[#202020] border rounded-lg shadow-lg"
      >
        <li
          @click="store.selectShop(null); open=false"
          class="px-4 py-2 hover:bg-[#404040] cursor-pointer"
        >
          Все магазины
        </li>
        <li
          v-for="shop in store.shops"
          :key="shop.id"
          @click="store.selectShop(shop.id); open=false"
          class="px-4 py-2 hover:bg-[#404040] cursor-pointer"
        >
          {{ shop.name }}
        </li>
      </ul>
    </transition>
  </div>  
</template>
