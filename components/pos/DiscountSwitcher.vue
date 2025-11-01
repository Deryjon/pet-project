<template>
    <div class="flex flex-col gap-6 mt-6">
      <div class="flex items-center justify-between">
        <label class="block text-[18px] font-semibold">Скидка</label>
        <button class="text-[#4993dd] rounded-[15px]">Ввести код</button>
      </div>
  
      <div class="flex items-center gap-1">
        <input
          type="number"
          v-model.number="cartStore.discountValue"
          :placeholder="activeSwitcher === '%' ? 'Введите скидку %' : 'Введите сумму'"
          class="bg-[#404040] p-4 rounded-[15px] w-1/2 text-white"
        />
        <div class="switcher bg-[#404040] w-1/2 flex p-1 rounded-[15px]">
          <div
            :class="['p-3 rounded-[15px] cursor-pointer text-center w-1/2 transition',
            activeSwitcher === '%' ? 'bg-[#262626] text-white' : 'text-[#bdbdbd] hover:bg-[#5e5e5e]']"
            @click="setType('%')"
          >
            %
          </div>
          <div
            :class="['p-3 rounded-[15px] cursor-pointer text-center w-1/2 transition',
            activeSwitcher === 'uzs' ? 'bg-[#262626] text-white' : 'text-[#bdbdbd] hover:bg-[#5e5e5e]']"
            @click="setType('uzs')"
          >
            uzs
          </div>
        </div>
      </div>
  
      <div class="flex items-center gap-2">
        <div
          v-for="item in options"
          :key="item"
          class="flex-1 bg-[#404040] hover:bg-[#5e5e5e] text-white text-center p-3 rounded-[15px] cursor-pointer transition"
          @click="applyQuickDiscount(item)"
        >
          {{ item }}
        </div>
      </div>
    </div>
  </template>
<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { useCartStore } from "@/store/cart";

const cartStore = useCartStore();
const activeSwitcher = ref(cartStore.discountType);

const uzsOptions = ["50000", "100000", "500000", "1000000"]; // лучше сразу числа
const percentOptions = ["15", "30", "50", "75"]; // проценты без символов

const options = computed(() =>
  activeSwitcher.value === "%" ? percentOptions : uzsOptions
);

function setType(type: "%" | "uzs") {
  activeSwitcher.value = type;
  cartStore.discountType = type;
  cartStore.discountValue = 0; // сбрасываем при переключении
}

function applyQuickDiscount(val: string) {
  if (activeSwitcher.value === "%") {
    cartStore.discountValue = parseInt(val.replace("%", "")); // "15%" → 15
  } else {
    cartStore.discountValue = parseInt(val.replace("K", "000").replace("M", "000000")); 
    // "50K" → 50000, "1M" → 1000000
  }
}



// Debounced apply to backend
let t: any = null;
watch(
  () => [cartStore.discountType, cartStore.discountValue],
  () => {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      cartStore.applySaleDiscount();
    }, 400);
  }
);
onBeforeUnmount(() => { if (t) clearTimeout(t); });
</script>

