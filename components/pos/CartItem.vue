<template>
  <div
    class="flex justify-between items-center bg-[#404040] p-[24px] rounded-[20px] mb-[10px] text-[16px]"
  >
    <!-- Левая часть -->
    <div class="flex items-center gap-[10px]">
      <div class="flex items-center gap-2 bg-[#1e1e1e] text-white rounded-[15px] border border-[#404040] focus:outline-none appearance-none p-2">
        <input
          type="number"
          v-model.number="item.quantity"
          min="1"
          class="w-[10px] bg-transparent h-[38px] text-center font-semibold text-[16px] "
        />
        <span>шт</span>
        <div class="buttons flex flex-col">
          <Icon
            name="heroicons:chevron-up"
            class="w-4 h-4 cursor-pointer"
            @click="item.quantity++"
          />
          <Icon
            name="heroicons:chevron-down"
            class="w-4 h-4 cursor-pointer"
            @click="item.quantity--"
          />
        </div>
      </div>

      <img
        src="../../assets/images/placeholder_img.svg"
        class="object-cover w-[50px] h-[50px] rounded-[8px] object-cover mb-[5px]"
      ></img>

      <div class="flex flex-col">
        <span class="font-bold text-[16px]">{{ item.name }}</span>
        <div class="bar-art flex items-center gap-4">
          <span>{{ item.barcode }}</span> /
          <span>{{ item.article }}</span>
        </div>
      </div>
    </div>

    <!-- Правая часть -->
    <div class="flex gap-[10px] items-center">
      <div class="flex flex-col items-end">
  <div class="flex items-center gap-2">
    <!-- Если есть скидка -->
    <template v-if="finalPrice < props.item.price">
      <span class="text-gray-400 line-through text-[14px]">
        {{ formatPrice(props.item.price) }} UZS
      </span>
      <span class="text-[16px] font-bold text-green-400">
        {{ formatPrice(finalPrice) }} UZS
      </span>
    </template>

    <!-- Если скидки нет -->
    <template v-else>
      <span class="text-[16px] font-bold">
        {{ formatPrice(finalPrice) }} UZS
      </span>
    </template>

    <!-- Кнопка редактирования скидки -->
    <button
      @click="$emit('edit-discount', props.item)"
      class="text-gray-300 hover:text-white"
    >
      <Icon name="heroicons:pencil-square" class="w-5 h-5" />
    </button>
  </div>

  <span class="text-sm text-gray-300">Iskandarjon Yusupov</span>
</div>


      <button
        @click="$emit('remove')"
        class="p-[15px] rounded-[15px] text-center text-red-400 hover:bg-red-500 duration-300 text-[14px]"
      >
      <svg width="14" height="16" viewBox="0 0 14 16" fill="#BDBDBD" xmlns="http://www.w3.org/2000/svg"><path d="M13.5 1H9.75L9.4375 0.4375C9.3125 0.1875 9.0625 0 8.78125 0H5.1875C4.90625 0 4.65625 0.1875 4.53125 0.4375L4.25 1H0.5C0.21875 1 0 1.25 0 1.5V2.5C0 2.78125 0.21875 3 0.5 3H13.5C13.75 3 14 2.78125 14 2.5V1.5C14 1.25 13.75 1 13.5 1ZM1.65625 14.5938C1.6875 15.4062 2.34375 16 3.15625 16H10.8125C11.625 16 12.2812 15.4062 12.3125 14.5938L13 4H1L1.65625 14.5938Z" fill="inherit"></path></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useCartStore } from "@/store/cart";
import { useFormatPrice } from "@/composables/useFormatPrice";

const props = defineProps<{ item: any }>();
const store = useCartStore();
const { formatPrice } = useFormatPrice();

const finalPrice = computed(() => store.itemFinalPrice(props.item));
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
