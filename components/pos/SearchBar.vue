<template>
  <div class="relative flex flex-col items-stretch gap-2 sm:flex-row sm:items-start sm:justify-between">
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
          base: 'h-[52px] rounded-[15px] border-0 bg-[#404040] px-4 text-[15px] font-bold text-[#bdbdbd] placeholder:text-[#bdbdbd] focus:outline-none focus:ring-0 sm:h-[58px] sm:text-[17px]',
          leading: 'ps-4'
        }"
      >
        <template #leading>
          <Icon name="fe:search" class="h-4 w-4 text-[#bdbdbd]" />
        </template>
      </UInput>
    </div>

    <div class="relative z-30 flex gap-2 sm:w-auto">
      <UButton
        color="primary"
        variant="solid"
        class="h-[52px] flex-1 justify-center rounded-[15px] bg-[#1f78ff] text-white hover:bg-[#4993dd] sm:h-[58px] sm:w-[58px] sm:flex-none"
      >
        <Icon name="fa7-solid:exchange" class="h-5 w-5" />
      </UButton>
      <UButton
        color="primary"
        variant="solid"
        class="h-[52px] flex-1 justify-center rounded-[15px] bg-[#1f78ff] text-white hover:bg-[#4993dd] sm:h-[58px] sm:w-[58px] sm:flex-none"
      >
        <Icon name="heroicons:clock" class="h-5 w-5" />
      </UButton>
    </div>

    <transition name="fade">
      <div
        v-if="showDropdown"
        class="fixed inset-0 z-10 bg-black/40 backdrop-blur-sm"
        @click="searchQuery = ''"
      />
    </transition>

    <div
      v-if="showDropdown"
      class="absolute top-full z-20 mt-2 flex max-h-[250px] w-full flex-col gap-2 overflow-y-auto rounded-xl shadow-lg"
    >
      <div
        v-if="store.productsLoading"
        class="flex flex-col gap-2"
      >
        <div
          v-for="item in 3"
          :key="item"
          class="flex flex-col gap-3 rounded-[12px] bg-[#262626] p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex min-w-0 items-center gap-3 sm:gap-4">
            <div class="h-[20px] w-[20px] shrink-0 animate-pulse rounded bg-[#404040]" />
            <div class="min-w-0 space-y-2">
              <div class="h-4 w-48 max-w-[55vw] animate-pulse rounded-full bg-[#404040]" />
              <div class="text-[12px] font-bold uppercase tracking-[0.1em] text-[#777] sm:text-[14px]">
                #SKU-{{ item }} / 000{{ item }}000{{ item }}
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-2 sm:items-end">
            <div class="h-4 w-24 animate-pulse rounded-full bg-[#404040]" />
            <div class="text-[12px] font-bold uppercase tracking-[0.1em] text-[#777]">#QTY-{{ item }}</div>
          </div>
        </div>
      </div>

      <div
        v-else-if="filteredProducts.length === 0"
        class="rounded-[12px] bg-[#262626] p-4 text-[14px] font-semibold text-[#bdbdbd] sm:text-[16px]"
      >
        Ничего не найдено
      </div>

      <button
        v-for="product in filteredProducts"
        :key="product.id"
        type="button"
        :disabled="store.isItemBusy(product.id) || store.addingItem"
        class="flex cursor-pointer flex-col items-start gap-3 rounded-[12px] bg-[#262626] p-3 text-left text-[14px] font-semibold transition hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-row sm:items-center sm:justify-between sm:text-[16px]"
        @click="addToCart(product)"
      >
        <div class="flex w-full min-w-0 items-center gap-3 sm:gap-4">
          <div class="h-[20px] w-[20px] shrink-0 bg-[#404040]" />
          <div class="flex min-w-0 flex-col">
            <span class="truncate text-[#4993dd]">{{ product.name }}</span>
            <span class="break-all text-[12px] sm:text-[14px]">{{ product.barcode }} / {{ product.article }}</span>
          </div>
        </div>
        <div class="flex w-full flex-col text-left sm:w-auto sm:text-right">
          <span>{{ formatPrice(product.price) }} UZS</span>
          <span class="text-[#999]">Кол-во: {{ Number(product.availableQuantity ?? 0) }} шт</span>
          <span
            v-if="store.isItemBusy(product.id)"
            class="mt-1 inline-flex items-center gap-1 text-[#78b3ff]"
          >
            <Icon name="heroicons:arrow-path" class="h-3.5 w-3.5 animate-spin" />
            Добавляем...
          </span>
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
const showDropdown = computed(() => Boolean(searchQuery.value.trim()));
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
