<script setup lang="ts">
import { useProductStore } from "@/store/productStore";
const store = useProductStore();
</script>

<template>
  <section>
    <h3 class="text-xl font-semibold">Характеристики</h3>
    <div class="flex justify-between gap-4 mt-8">
      <div class="flex flex-col w-full">
        <label class="font-medium mb-2">Бренд</label>
        <input type="text" placeholder="Введите бренд" class="rounded-lg p-3" />
      </div>
      <div class="flex flex-col w-full">
        <label class="font-medium mb-2">Поставщик</label>
        <input
          type="text"
          placeholder="Введите поставщика"
          class="rounded-lg p-3"
        />
      </div>
      <div class="flex flex-col relative w-full">
        <label class="font-medium mb-2">Категория</label>

        <!-- Кнопка -->
        <div
          class="p-3 bg-[#404040] rounded-lg cursor-pointer flex justify-between items-center"
          @click="store.isCategoryOpen = !store.isCategoryOpen"
        >
          <span class="text-white">
            {{ store.selectedCategory || "Выберите категорию" }}
          </span>
          <svg
            class="w-4 h-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        <!-- Выпадающий список -->
        <transition name="fade">
          <ul
            v-if="store.isCategoryOpen && store.categories.length > 0"
            class="absolute left-0 mt-1 w-full bg-[#404040] rounded-xl shadow-md overflow-hidden z-10 max-h-48 overflow-y-auto bottom-[50px]"
          >
            <li
              v-for="category in store.categories"
              :key="category"
              @mousedown.prevent="
                () => {
                  store.selectedCategory = category;
                  store.isCategoryOpen = false;
                }
              "
              class="px-4 py-2 hover:bg-[#505050] cursor-pointer text-white"
            >
              {{ category }}
            </li>
          </ul>
        </transition>
      </div>
    </div>
  </section>
</template>
