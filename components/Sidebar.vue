<script setup lang="ts">
import Menu from "./Menu.vue";
import User from "./User.vue";
import { useSidebarStore } from "../store/useSidebar";

const sidebar = useSidebarStore();
</script>

<template>
  <div
  class="flex flex-col justify-between"
  :class="sidebar.collapsed ? 'px-[10px]' : 'px-[20px]'"
  >
    <!-- Верхняя часть -->
    <div class="flex flex-col gap-[30px]">
      <div
        class="logo font-bold text-[20px] text-white p-[5px] flex justify-between items-center"
      >
        <!-- Если сайдбар открыт -->
        <h1 v-if="sidebar.collapsed" class="cursor-pointer">K</h1>
        <h1 v-else class="cursor-pointer">Konkurent.cases</h1>
        <!-- Кнопка сворачивания -->

        <Icon
          @click="sidebar.toggle"
          :name="
            sidebar.collapsed
              ? 'heroicons:chevron-right'
              : 'heroicons:chevron-left'
          "
          class="w-5 h-5 cursor-pointer"
        />
        <!-- Если закрыт -->
      </div>

      <Menu />
    </div>

    <!-- Нижняя часть -->
    <User />
  </div>
</template>
