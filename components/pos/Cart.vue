<template>
  <div class="rounded-xl mt-[30px] relative">
    <!-- Заголовок -->

    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h3 class="text-[36px] font-semibold">Корзина</h3>
        <div class="div bg-[#404040] px-[25px] py-2 rounded-full font-bold text-[24px] flex items-center gap-2">

          <span
            class=""
          >
            {{ totalQuantity }}
          </span>
          <button
          @click="store.cancelSale"
          class="rounded-[15px] text-center text-red-400  duration-300 text-[14px]"
          :class="{ 'opacity-50 pointer-events-none': store.cancelLoading }"
          v-if="totalQuantity > 0"
        >
        <svg width="14" height="16"
        class="hover:fill-red-500 duration-300"
        viewBox="0 0 14 16" fill="#bdbdbd" xmlns="http://www.w3.org/2000/svg"><path d="M13.5 1H9.75L9.4375 0.4375C9.3125 0.1875 9.0625 0 8.78125 0H5.1875C4.90625 0 4.65625 0.1875 4.53125 0.4375L4.25 1H0.5C0.21875 1 0 1.25 0 1.5V2.5C0 2.78125 0.21875 3 0.5 3H13.5C13.75 3 14 2.78125 14 2.5V1.5C14 1.25 13.75 1 13.5 1ZM1.65625 14.5938C1.6875 15.4062 2.34375 16 3.15625 16H10.8125C11.625 16 12.2812 15.4062 12.3125 14.5938L13 4H1L1.65625 14.5938Z" fill="inherit"></path></svg>
        </button>
        </div>
      </div>
      <span class="text-[36px] font-bold text-[#bdbdbd]">{{ store.saleNumber ? `№ ${store.saleNumber}` : (store.saleId ? `#${store.saleId}` : '#—') }}</span>
    </div>
    <div class="sellers flex gap-4 mt-[15px]">
      <button
        class="all-sellers bg-[#1f78ff] hover:bg-[#4993dd] py-1 px-4 rounded-[20px]"
      >
        <span class="text-[16px] font-semibold"> Все продавцы </span>
      </button>
      <button
        class="seller bg-[#404040] hover:bg-[#5e5e5e] py-1 px-4 rounded-[20px] flex items-center justify-center"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="#fff"
          xmlns="http://www.w3.org/2000/svg"
          
        >
          <path
            d="M8 0.25C3.71875 0.25 0.25 3.71875 0.25 8C0.25 12.2812 3.71875 15.75 8 15.75C12.2812 15.75 15.75 12.2812 15.75 8C15.75 3.71875 12.2812 0.25 8 0.25ZM12.5 8.875C12.5 9.09375 12.3125 9.25 12.125 9.25H9.25V12.125C9.25 12.3438 9.0625 12.5 8.875 12.5H7.125C6.90625 12.5 6.75 12.3438 6.75 12.125V9.25H3.875C3.65625 9.25 3.5 9.09375 3.5 8.875V7.125C3.5 6.9375 3.65625 6.75 3.875 6.75H6.75V3.875C6.75 3.6875 6.90625 3.5 7.125 3.5H8.875C9.0625 3.5 9.25 3.6875 9.25 3.875V6.75H12.125C12.3125 6.75 12.5 6.9375 12.5 7.125V8.875Z"
            fill="#4993DD"
          ></path>
        </svg>
      </button>
    </div>
    <!-- пустая корзина -->
    <div
      v-if="cart.length === 0"
      class="cart mt-[20px] w-full h-[400px] rounded-[25px] p-[20px] flex flex-col items-center justify-center"
    >
      <span class="text-[24px] font-bold">Корзинка пока что пуста</span>
      <span class="text-[18px] font-bold w-[340px] text-center text-[#5e5e5e]">
        Нажмите “/” для поиска товаров или отсканируйте товары
      </span>
    </div>

    <!-- список товаров -->
    <div
      v-else
      class="mt-[20px] w-full max-h-[400px] overflow-y-auto rounded-[25px]"
    >
      <CartItem
        v-for="item in cart"
        :key="item.id"
        :item="item"
        @remove="removeFromCart(item.id)"
        @edit-discount="openDiscountPanel"
      />
    </div>

    <!-- 👉 панель справа -->
    <transition name="slide">
      <div
        v-if="editingItem"
        class="fixed top-0 right-0 w-[300px] h-full bg-[#1e1e1e] text-white shadow-lg p-6 z-50 flex flex-col"
      >
        <h3 class="text-xl font-bold mb-4">Скидка</h3>

        <label class="text-sm mb-1">Введите скидку</label>
        <input
          type="number"
          v-model.number="discountValue"
          class="w-full mb-3 p-2 rounded bg-[#2a2a2a] border border-[#404040]"
        />

        <label class="text-sm mb-1">Тип скидки</label>
        <select
          v-model="discountType"
          class="w-full mb-6 p-2 rounded bg-[#2a2a2a] border border-[#404040]"
        >
          <option value="%">%</option>
          <option value="uzs">UZS</option>
        </select>

        <div class="mt-auto flex gap-2">
          <button
            @click="applyDiscount"
            class="flex-1 bg-green-600 py-2 rounded font-bold hover:bg-green-700"
          >
            Применить
          </button>
          <button
            @click="closeDiscountPanel"
            class="flex-1 bg-red-500 py-2 rounded font-bold hover:bg-red-600"
          >
            Отмена
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useCartStore } from "@/store/cart";
import { storeToRefs } from "pinia";
import CartItem from "./CartItem.vue";

const store = useCartStore();
const { cart } = storeToRefs(store);
const { removeFromCart, updateDiscount } = store;

// общее кол-во товаров
const totalQuantity = computed(() =>
  cart.value.reduce((sum, item) => sum + item.quantity, 0)
);

// 👉 состояние для панели
const editingItem = ref<any>(null);
const discountValue = ref(0);
const discountType = ref("%");

function openDiscountPanel(item: any) {
  editingItem.value = item;
  discountValue.value = item.discountValue;
  discountType.value = item.discountType;
}

function closeDiscountPanel() {
  editingItem.value = null;
}

function applyDiscount() {
  if (editingItem.value) {
    updateDiscount(
      editingItem.value.id,
      discountValue.value,
      discountType.value
    );
    closeDiscountPanel();
  }
}
</script>

<style scoped>
.cart {
  border: 1px dashed #919090;
}

/* анимация выезда справа */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
