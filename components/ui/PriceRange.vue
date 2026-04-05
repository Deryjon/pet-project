<template>
    <div class="w-full sm:w-[370px]">
      <label class="block text-sm mb-2 text-[#bdbdbd] font-bold">
        {{ label }}
      </label>
      <div class="flex flex-col gap-2 sm:flex-row">
        <input
          type="number"
          :value="min"
          @input="$emit('update:min', $event.target.value)"
          placeholder="от"
          class="w-full bg-[#404040] text-white rounded-[10px] p-[15px] outline-none focus:ring-2 focus:ring-[#4993dd] sm:w-1/2"
        />
        <input
          type="number"
          :value="max"
          @input="$emit('update:max', $event.target.value)"
          placeholder="до"
          class="w-full bg-[#404040] text-white rounded-[10px] p-[15px] outline-none focus:ring-2 focus:ring-[#4993dd] sm:w-1/2"
        />
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  defineProps<{
    label: string;
    min?: string | number;
    max?: string | number;
  }>();
  
  defineEmits(["update:min", "update:max"]);
  </script>
  <style scoped>
  /* Убираем стрелки в Chrome, Safari, Edge */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  /* Убираем стрелки в Firefox */
  input[type="number"] {
    -moz-appearance: textfield;
  }
  </style>
  
