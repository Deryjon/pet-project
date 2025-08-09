<template>
    <div class="bg-[#404040] rounded-[15px] p-[20px] flex flex-col">
      <p class="text-[#A0A0A0] text-[16px]">{{ label }}</p>
      <p class="text-white font-bold text-[20px]">{{ value }}</p>
    </div>
  </template>
  
  <script setup lang="ts">
  defineProps<{
    label: string
    value: string | number
  }>()
  </script>
  