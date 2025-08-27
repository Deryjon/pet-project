<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="border-b sticky top-0 bg-[#262626] z-50">
    <div class="mx-auto px-[144px]">
      <div class="flex justify-between items-center py-[32px]">
        <div class="flex items-center gap-4">
          <div
            class="bg-[#404040] w-[50px] h-[50px] rounded-full flex items-center justify-center cursor-pointer"
            @click="router.back()"
          >
            <Icon name="heroicons:chevron-left" class="w-5 h-5 text-muted-foreground" />
          </div>
          <h2 class="text-[28px] font-bold">Новый продукт</h2>
        </div>
        <button
          class="bg-[#1f78ff] px-[30px] py-[12px] text-[16px] font-semibold rounded-[20px] transition-all duration-300 hover:bg-[#4d94ff]"
        >
          Создать
        </button>
      </div>
    </div>
  </div>
</template>
