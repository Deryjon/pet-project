<template>
  <div
    class="flex justify-between items-center bg-[#404040] p-[24px] rounded-[20px] mb-[10px] text-[16px]"
  >
    <!-- Левая часть -->
    <div class="flex items-center gap-[10px]">
      <div class="flex flex-col items-center gap-1">
        <input
          type="number"
          v-model.number="item.quantity"
          min="1"
          class="w-[60px] h-[38px] text-center font-semibold text-[16px] bg-[#1e1e1e] text-white rounded-lg border border-[#404040] focus:outline-none focus:ring-2 focus:ring-green-600 appearance-none"
        />
      </div>

      <div
        src=""
        alt=""
        class="bg-[#111111] w-[40px] h-[40px] rounded-[8px] object-cover mb-[5px]"
      ></div>
      <div class="flex flex-col">
        <span class="font-bold text-[16px]">{{ item.name }}</span>
        <div class="bar-art flex items-center gap-4">
          <span class="">{{ item.barcode }}</span>
          /
          <span class="">{{ item.article }}</span>
        </div>
      </div>
    </div>

    <!-- Правая часть -->
    <div class="flex gap-[10px]">
      <div class="flex flex-col items-end">
        <span class="text-[16px] font-bold">{{ item.price }} UZS</span>
        <span class="">Iskandarjon Yusupov</span>
      </div>
      <button
        @click="$emit('remove')"
        class="p-[13px] rounded-[15px] text-center text-red-400 hover:bg-red-500 text-[14px]"
      >
        <Icon name="heroicons:trash" class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ item: any }>();
</script>
