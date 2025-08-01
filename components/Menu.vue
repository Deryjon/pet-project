<script setup lang="ts">
import { ref } from "vue";
import { MENU_DATA, IMenuItem } from "./menu.data";
import { useMenuStore } from "../store/menu.store";

const store = useMenuStore();
const closeMenu = () => {
  store.isOpen = false;
};

const activeMenu = ref<IMenuItem | null>(null);

const openMenu = (item: IMenuItem) => {
  activeMenu.value = item;
};

const backToMainMenu = () => {
  activeMenu.value = null;
};
</script>

<template>
  <div
    class="flex flex-col gap-[5px] text-black dark:text-white text-md font-semibold  transition-colors duration-300"
  >
    <!-- Подменю выбранного раздела -->
    <template v-if="activeMenu">
      <div class="flex flex-col gap-2 ">
        <!-- Название раздела с действием "Назад" -->
        <h2
          @click="backToMainMenu"
          class="text-lg font-semibold p-[5px] py-2 cursor-pointer flex items-center gap-3 hover:bg-[#5e5e5e]  rounded-md transition-colors duration-300"
        >
          <Icon name="heroicons:arrow-left" class="w-4 h-4" />
          <Icon
            :name="activeMenu.icon"
            class="w-5 h-5"
            v-if="activeMenu?.icon"
          />
          {{ activeMenu.name }}
        </h2>

        <NuxtLink
          v-for="(subItem, j) in activeMenu.items"
          :key="j"
          :to="subItem.url"
          @click="closeMenu"
          class="rounded-md py-2 hover:bg-[#5e5e5e]  p-[5px] transition-colors duration-300"
        >
          {{ subItem.title }}
        </NuxtLink>
      </div>
    </template>

    <!-- Главное меню -->
    <template v-else>
      <template v-for="(item, i) in MENU_DATA" :key="i">
        <!-- Пункт без подменю -->
        <NuxtLink
          v-if="!item.items"
          :to="item.url"
          class="inline-flex items-center gap-4 p-[5px] py-3 hover:bg-[#5e5e5e] rounded-md  transition-colors duration-300"
        >
          <Icon
            v-if="item.icon"
            :name="item.icon"
            class="h-5 w-5 text-muted-foreground"
          />
          <p class="truncate">{{ item.name }}</p>
        </NuxtLink>

        <!-- Пункт с подменю и стрелкой -->
        <button
          v-else
          @click="openMenu(item)"
          class="flex items-center justify-between gap-4 p-[5px] py-3 hover:bg-[#5e5e5e] rounded-md  transition-colors duration-300"
        >
          <div class="flex items-center gap-4">
            <Icon
              v-if="item.icon"
              :name="item.icon"
              class="w-5 h-5 text-muted-foreground"
            />
            <p class="truncate">{{ item.name }}</p>
          </div>
          <Icon
            name="heroicons:chevron-right"
            class="w-5 h-5 text-muted-foreground"
          />
        </button>
      </template>
    </template>
  </div>
</template>
