<template>
  <div class="relative">
    <div class="relative z-30 w-full max-w-[700px]">
      <UInput
        v-model="searchQuery"
        placeholder="Артикул, баркод, наименование"
        size="xl"
        color="neutral"
        variant="none"
        :ui="{
          base: 'h-[58px] rounded-[15px] border-0 bg-[#404040] px-4 text-[17px] font-bold text-[#bdbdbd] placeholder:text-[#bdbdbd] focus:outline-none focus:ring-0',
          leading: 'ps-4'
        }"
      >
        <template #leading>
          <Icon name="heroicons:magnifying-glass-20-solid" class="h-4 w-4 text-[#bdbdbd]" />
        </template>
      </UInput>
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
          <span class="text-[#999]">
            Кол-во: {{ Number(product.availableQuantity ?? 0) }}
            {{ resolveMeasurementUnitLabel(product) }}
          </span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useCartStore } from "~/store/cart";
import { resolveMeasurementUnitLabel } from "@/composables/useMeasurementUnitLabel";

const store = useCartStore();
const { formatPrice } = useFormatPrice();
const { searchQuery, filteredProducts } = storeToRefs(store);
const { addToCart } = store;
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

