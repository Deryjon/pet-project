<template>
    <div
      class="fixed top-0 left-0 h-full w-[460px] bg-[#2b2b2b] text-white shadow-lg px-8 py-14 rounded-r-[56px] z-50 flex flex-col justify-between"
      @click.stop
    >
      <h2 class="text-[24px] font-bold mb-6 text-center">Выйти из аккаунта</h2>
      <div class="flex gap-[20px] flex-col items-center">
        <div class="w-[50px] h-[50px] rounded-full bg-[#eb5757] flex justify-center items-center">
          <Icon name="material-symbols:warning-outline-rounded" class="w-6 h-6" />
        </div>
        <p class="text-center font-semibold w-[300px]">
          Вы уверенны что хотите выйти из аккаунта?
        </p>
      </div>
      <div>
        <BaseButton color="red" @click="$emit('confirm')">Да, выйти</BaseButton>
        <BaseButton class="mt-4" @click="$emit('cancel')">Отмена</BaseButton>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import BaseButton from "../ui/BaseButton.vue";
  defineEmits(['confirm', 'cancel']);
  </script>
  