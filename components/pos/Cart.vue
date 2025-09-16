<template>
  <div class="rounded-xl mt-[30px] relative">
    <!-- Заголовок -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h3 class="text-[36px] font-semibold">Корзина</h3>
        <span
          class="bg-[#404040] px-[25px] py-2 rounded-full font-bold text-[24px]"
        >
          {{ totalQuantity }}
        </span>
      </div>
      <span class="text-[36px] font-bold text-[#bdbdbd]">#4046384943</span>
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
      class="mt-[20px] w-full max-h-[400px] overflow-y-auto rounded-[25px] p-[20px]"
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
    updateDiscount(editingItem.value.id, discountValue.value, discountType.value);
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
