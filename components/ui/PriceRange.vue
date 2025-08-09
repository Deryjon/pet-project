<template>
    <div class="w-[370px]">
      <label class="block text-sm mb-2 text-[#bdbdbd] font-bold">
        {{ label }}
      </label>
      <div class="flex gap-2">
        <input
          type="number"
          :value="min"
          @input="$emit('update:min', $event.target.value)"
          placeholder="от"
          class="w-1/2 bg-[#404040] text-white rounded-[10px] p-[15px] outline-none focus:ring-2 focus:ring-[#4993dd]"
        />
        <input
          type="number"
          :value="max"
          @input="$emit('update:max', $event.target.value)"
          placeholder="до"
          class="w-1/2 bg-[#404040] text-white rounded-[10px] p-[15px] outline-none focus:ring-2 focus:ring-[#4993dd]"
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
  