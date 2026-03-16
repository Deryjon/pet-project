<template>
  <div class="relative flex items-start justify-between gap-2">
    <div class="relative z-30 min-w-0 flex-1">
      <UInput
        v-model="searchQuery"
        class="w-full"
        placeholder="Артикул, баркод, наименование"
        size="xl"
        color="neutral"
        variant="none"
        :ui="{
          root: 'w-full',
          base: 'h-[58px] rounded-[15px] border-0 bg-[#404040] px-4 text-[17px] font-bold text-[#bdbdbd] placeholder:text-[#bdbdbd] focus:outline-none focus:ring-0',
          leading: 'ps-4'
        }"
      >
        <template #leading>
          <Icon name="fe:search" class="h-4 w-4 text-[#bdbdbd]" />
        </template>
      </UInput>
    </div>

    <div class="relative z-30 flex gap-2">
      <UButton
        color="neutral"
        variant="soft"
        class="h-[58px] w-[58px] justify-center rounded-[15px] bg-[#404040] text-[#bdbdbd] hover:bg-[#5e5e5e]"
      >
        <Icon name="fa7-solid:exchange" class="h-5 w-5" />
      </UButton>
      <UButton
        color="neutral"
        variant="soft"
        class="h-[58px] w-[58px] justify-center rounded-[15px] bg-[#404040] text-[#bdbdbd] hover:bg-[#5e5e5e]"
      >
        <Icon name="heroicons:clock" class="h-5 w-5" />
      </UButton>
    </div>

    <transition name="fade">
      <div
        v-if="showResults"
        class="fixed inset-0 z-10 bg-black/40 backdrop-blur-sm"
        @click="searchQuery = ''"
      />
    </transition>

    <div
      v-if="showResults"
      class="absolute top-full z-20 mt-2 flex max-h-[250px] w-full flex-col gap-3 overflow-y-auto rounded-xl shadow-lg"
    >
      <button
        v-for="product in filteredProducts"
        :key="product.id"
        type="button"
        class="flex cursor-pointer items-center justify-between bg-[#262626] p-3 text-left text-[16px] font-semibold"
        @click="addToCart(product)"
      >
        <div class="flex items-center gap-4">
          <div class="h-[20px] w-[20px] bg-[#404040]" />
          <div class="flex flex-col">
            <span class="text-[#4993dd]">{{ product.name }}</span>
            <span>{{ product.barcode }} / {{ product.article }}</span>
          </div>
        </div>
        <div class="flex flex-col text-right">
          <span>{{ formatPrice(product.price) }} UZS</span>
          <span class="text-[#999]">Кол-во: 1 шт</span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useCartStore } from "~/store/cart";

const store = useCartStore();
const { formatPrice } = useFormatPrice();
const { searchQuery, filteredProducts } = storeToRefs(store);
const addToCart = store.addToCartServer;
const showResults = computed(
  () => Boolean(searchQuery.value) && filteredProducts.value.length > 0
);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>