<template>
    <div class="flex flex-col gap-6 mt-6">
      <div class="flex items-center justify-between">
        <label class="block text-[18px] font-semibold">Скидка</label>
        <button class="text-[#4993dd] rounded-[15px]">Ввести код</button>
      </div>
  
      <div class="flex items-center gap-1">
        <input
          type="text"
          :placeholder="activeSwitcher === '%' ? 'Введите скидку' : 'Итоговая сумма'"
          class="bg-[#404040] p-4 rounded-[15px] w-1/2"
        />
        <div class="switcher bg-[#404040] w-1/2 flex p-1 rounded-[15px]">
          <div
            :class="['p-3 rounded-[15px] cursor-pointer text-center w-1/2 transition',
            activeSwitcher === '%' ? 'bg-[#262626] text-white' : 'text-[#bdbdbd] hover:bg-[#5e5e5e]']"
            @click="activeSwitcher = '%'"
          >
            %
          </div>
          <div
            :class="['p-3 rounded-[15px] cursor-pointer text-center w-1/2 transition',
            activeSwitcher === 'uzs' ? 'bg-[#262626] text-white' : 'text-[#bdbdbd] hover:bg-[#5e5e5e]']"
            @click="activeSwitcher = 'uzs'"
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
        >
          {{ item }}
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from "vue";
  
  const activeSwitcher = ref("%");
  const uzsOptions = ["50k", "100k", "500k", "1M"];
  const percentOptions = ["15%", "30%", "50%", "75%"];
  
  const options = computed(() =>
    activeSwitcher.value === "%" ? percentOptions : uzsOptions
  );
  </script>
  