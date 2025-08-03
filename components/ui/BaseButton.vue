<template>
    <button
      :class="[
        'py-4 rounded-[20px] w-full font-semibold flex items-center justify-center gap-2',
        'bg-[#404040]',
        hoverClass,
        color === 'red' ? 'text-[#eb5757]' : 'text-white',
      ]"
      v-bind="$attrs"
    >
      <slot />
    </button>
  </template>
  
  <script setup lang="ts">
  defineProps<{
    color?: 'default' | 'red'
  }>()
  
  const hoverClass = 'hover:bg-[#5e5e5e] transition-colors duration-300'
  </script>
  