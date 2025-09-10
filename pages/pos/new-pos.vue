<template>
  <section class="bg-[#262626] text-white rounded-2xl flex h-full">
    <!-- Левая часть -->
    <div class="w-full border-r border-[#404040] pr-8 h-full">
      <!-- 🔎 Поиск и кнопки -->
      <div class="flex items-center justify-between w-full">
        <!-- 🔎 Поиск -->
        <div
          class="flex items-center gap-2 p-[15px] w-[700px] bg-[#404040] rounded-[15px] hover:bg-[#5e5e5e] transition-colors duration-300"
        >
          <svg
            width="16"
            height="17"
            viewBox="0 0 16 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.7812 13.8438L12.6562 10.7188C12.5 10.5938 12.3125 10.5 12.125 10.5H11.625C12.4688 9.40625 13 8.03125 13 6.5C13 2.9375 10.0625 0 6.5 0C2.90625 0 0 2.9375 0 6.5C0 10.0938 2.90625 13 6.5 13C8 13 9.375 12.5 10.5 11.625V12.1562C10.5 12.3438 10.5625 12.5312 10.7188 12.6875L13.8125 15.7812C14.125 16.0938 14.5938 16.0938 14.875 15.7812L15.75 14.9062C16.0625 14.625 16.0625 14.1562 15.7812 13.8438ZM6.5 10.5C4.28125 10.5 2.5 8.71875 2.5 6.5C2.5 4.3125 4.28125 2.5 6.5 2.5C8.6875 2.5 10.5 4.3125 10.5 6.5C10.5 8.71875 8.6875 10.5 6.5 10.5Z"
              fill="#BDBDBD"
            />
          </svg>
          <input
            type="text"
            placeholder="Артикул, баркод, наименование"
            class="bg-transparent w-full text-[#bdbdbd] text-[17px] font-bold outline-none"
          />
        </div>

        <!-- 🔘 Кнопки справа -->
        <div class="flex gap-2">
          <button
            class="flex items-center justify-center bg-[#404040] hover:bg-[#5e5e5e] transition-colors duration-300 p-[15px] rounded-[15px]"
          >
            <svg
              aria-hidden="true"
              focusable="false"
              data-prefix="fas"
              data-icon="right-left"
              class="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              style="color: rgb(73, 147, 221)"
            >
              <path
                fill="currentColor"
                d="M32 96l320 0 0-64c0-12.9 7.8-24.6 19.8-29.6s25.7-2.2 34.9 6.9l96 96c6 6 9.4 14.1 9.4 22.6s-3.4 16.6-9.4 22.6l-96 96c-9.2 9.2-22.9 11.9-34.9 6.9s-19.8-16.6-19.8-29.6l0-64L32 160c-17.7 0-32-14.3-32-32s14.3-32 32-32zM480 352c17.7 0 32 14.3 32 32s-14.3 32-32 32l-320 0 0 64c0 12.9-7.8 24.6-19.8 29.6s-25.7 2.2-34.9-6.9l-96-96c-6-6-9.4-14.1-9.4-22.6s3.4-16.6 9.4-22.6l96-96c9.2-9.2 22.9-11.9 34.9-6.9s19.8 16.6 19.8 29.6l0 64 320 0z"
              />
            </svg>
          </button>

          <button
            class="flex items-center justify-center bg-[#404040] hover:bg-[#5e5e5e] transition-colors duration-300 p-[15px] rounded-[15px]"
          >
            <svg
              aria-hidden="true"
              focusable="false"
              data-prefix="far"
              data-icon="clock"
              class="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              style="color: rgb(73, 147, 221)"
            >
              <path
                fill="currentColor"
                d="M464 256A208 208 0 1 1 48 256a208 208 0 1 1 416 0zM0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256zM232 120l0 136c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2 280 120c0-13.3-10.7-24-24-24s-24 10.7-24 24z"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- 🛒 Корзина -->
      <div class="rounded-xl mt-[30px]">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <h3 class="text-[36px] font-semibold">Корзина</h3>
            <span
              class="bg-[#404040] px-[25px] py-2 rounded-full font-bold text-[24px]"
              >0</span
            >
          </div>
          <div class="">
            <span class="text-[36px] font-bold text-[#bdbdbd]"
              >#4046384943</span
            >
          </div>
        </div>
        <div class="sellers mt-[20px] flex gap-3">
          <div
            class="w-[150px] selected-seller bg-[#3b82f6] flex items-center justify-center px-4 py-2 rounded-[15px]"
          >
            <span class="bold">Все продавцы</span>
          </div>
          <div
            class="selected-seller bg-[#404040] flex items-center justify-center px-4 py-2 rounded-[15px]"
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
          </div>
        </div>

        <div
          class="cart mt-[20px] w-full h-[400px] rounded-[25px] p-[20px] flex flex-col items-center justify-center"
        >
          <span class="text-[24px] font-bold">Корзинка пока что пуста</span>
          <span class="text-[18px] font-bold w-[340px] text-center text-[#5e5e5e]">
            Нажмите “/” для поиска товаров или отсканируйте товары
          </span>
        </div>
      </div>
    </div>

    <!-- Правая часть -->
    <div class="pl-8 flex flex-col justify-between">
      <!-- 👥 Клиент -->
      <div class="top flex flex-col gap-4">

        <div class="space-y-2">
          <label class="block text-sm">Клиент</label>
          <div class="flex gap-2">
            <button class="px-3 py-2 bg-blue-500 rounded-lg">Создать</button>
            <input
              type="text"
              placeholder="Найти клиента..."
              class="flex-1 p-3 rounded-lg text-black"
            />
          </div>
        </div>
  
        <!-- 💸 Скидка -->
        <div class="space-y-2">
          <label class="block text-sm">Скидка</label>
          <div class="flex gap-2">
            <button class="px-3 py-2 bg-blue-500 rounded-lg">Создать</button>
            <input
              type="number"
              placeholder="0"
              class="p-3 rounded-lg text-black w-24"
            />
            <select class="p-3 rounded-lg text-black">
              <option>%</option>
              <option>UZS</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 📊 Итоговый блок -->
      <div class="bg-[#1e1e1e] p-4 rounded-xl space-y-2">
        <div>Подытог: 150 000 UZS</div>
        <div>Скидка: -10 000 UZS</div>
        <div class="text-xl font-bold">Итого: 140 000 UZS</div>

        <div class="grid grid-cols-2 gap-3 mt-4">
          <button class="py-3 bg-green-600 rounded-xl font-bold">
            Оплатить
          </button>
          <button class="py-3 bg-orange-600 rounded-xl font-bold">
            Отложить
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useHead } from "#imports";
useHead({
  title: "Новая продажа | Konkurent.cases",
});
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
.cart {
  border: 1px dashed #919090;
}
</style>
