<script setup lang="ts">
import Menu from "./Menu.vue";
import User from "./User.vue";
</script>
<template>
  <div class="flex flex-col justify-between min-h-screen px-[20px]">
    <!-- Верхняя часть -->
    <div class="flex flex-col gap-[30px]">
      <div class="logo font-bold text-[20px] text-white p-[5px]">
        <h1 class="cursor-pointer">Konkurent.cases</h1>
      </div>
      <Menu />
    </div>

    <!-- Нижняя часть -->
    <User />
  </div>
</template>

