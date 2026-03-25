<script setup lang="ts">
import { useDashboardStore } from "@/store/dashboard";
import { ref } from "vue";

const store = useDashboardStore();
const open = ref(false);
</script>

<template>
  <UPopover
    v-model:open="open"
    :content="{ align: 'start', side: 'bottom', sideOffset: 8 }"
    :ui="{ content: 'z-50 w-60 p-1 rounded-lg bg-[#202020] border border-[#404040] shadow-lg' }"
  >
    <button
      type="button"
      class="flex w-full items-center justify-between gap-2 text-left text-[28px] font-semibold text-white sm:w-auto sm:text-4xl"
    >
      {{ store.selectedShopName }}
      <Icon
        name="tabler:chevron-down"
        :class="['h-7 w-7 shrink-0 transition-transform sm:h-8 sm:w-8', open ? 'rotate-180' : '']"
      />
    </button>

    <template #content>
      <ul>
        <li
          @click="store.selectShop(null); open = false"
          class="px-4 py-2 hover:bg-[#404040] cursor-pointer rounded-md"
        >
          Все магазины
        </li>
        <li
          v-for="shop in store.shops"
          :key="shop.id"
          @click="store.selectShop(shop.id); open = false"
          class="px-4 py-2 hover:bg-[#404040] cursor-pointer rounded-md"
        >
          {{ shop.name }}
        </li>
      </ul>
    </template>
  </UPopover>
</template>
