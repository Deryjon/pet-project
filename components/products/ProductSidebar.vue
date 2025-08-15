<script setup lang="ts">
const emit = defineEmits(['scrollTo'])
function go(section: string) {
  emit('scrollTo', section)
}
</script>

<template>
  <aside class="bg-[#404040] p-1 rounded-[15px] sticky top-[96px] h-fit">
    <nav class="flex flex-col gap-2">
      <button
        class="bg-[#262626] text-[#4993dd] px-[10px] w-[185px] font-bold py-[10px] text-left rounded-[15px]"
        @click="go('main')"
      >
        Основные
      </button>
      <button
        class="hover:bg-[#262626] duration-300 px-[10px] w-[185px] font-bold py-[10px] text-left rounded-[15px]"
        @click="go('prices')"
      >
        Цены
      </button>
      <button
        class="hover:bg-[#262626] duration-300 px-[10px] w-[185px] font-bold py-[10px] text-left rounded-[15px]"
        @click="go('stocks')"
      >
        Остатки
      </button>
      <button
        class="hover:bg-[#262626] duration-300 px-[10px] w-[185px] font-bold py-[10px] text-left rounded-[15px]"
        @click="go('features')"
      >
        Характеристики
      </button>
    </nav>
  </aside>
</template>
