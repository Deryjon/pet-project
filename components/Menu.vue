<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import type { IMenuItem } from "./menu.data";
import { MENU_DATA } from "./menu.data";
import { useMenuStore } from "../store/menu.store";
import { useSidebarStore } from "../store/useSidebar";

const store = useMenuStore();
const sidebar = useSidebarStore();
const route = useRoute();

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

const isPathActive = (url: string) => {
  if (!url) return false;
  return route.path === url || route.path.startsWith(`${url}/`);
};

const isSubItemActive = (url: string) => isPathActive(url);

const isMenuItemActive = (item: IMenuItem) => {
  if (isPathActive(item.url)) return true;
  return item.items?.some((subItem) => isSubItemActive(subItem.url)) ?? false;
};
</script>

<template>
  <div class="flex flex-col gap-[5px] text-white text-[16px] font-medium transition-colors duration-300">
    <template v-if="activeMenu">
      <div class="flex flex-col gap-2">
        <h2
          @click="backToMainMenu"
          :class="[
            'w-full text-[16px] font-medium py-2 cursor-pointer flex items-center gap-3 hover:bg-[#5e5e5e] duration-300',
            sidebar.collapsed ? 'px-[10px]' : 'px-[20px]',
          ]"
        >
          <Icon name="tabler:chevron-left" class="w-5 h-5 text-muted-foreground" />
          <Icon v-if="activeMenu?.icon" :name="activeMenu.icon" class="w-5 h-5 text-[#3b82f6]" />
          <transition name="menu-label" mode="out-in">
            <span v-if="!sidebar.collapsed" key="active-menu-title">{{ activeMenu.name }}</span>
          </transition>
        </h2>

        <NuxtLink
          v-for="(subItem, j) in activeMenu.items"
          :key="j"
          :to="subItem.url"
          @click="closeMenu"
          :class="[
            'block w-full py-3 cursor-pointer hover:bg-[#5e5e5e] transition-colors duration-300',
            isSubItemActive(subItem.url) ? 'bg-[#5e5e5e] text-[#5489dd]' : '',
            sidebar.collapsed ? 'px-[15px]' : 'px-[25px]',
          ]"
        >
          <transition name="menu-label" mode="out-in">
            <span v-if="!sidebar.collapsed" :key="`sub-${j}`">{{ subItem.title }}</span>
          </transition>
        </NuxtLink>
      </div>
    </template>

    <template v-else>
      <template v-for="(item, i) in MENU_DATA" :key="i">
        <NuxtLink
          v-if="!item.items"
          :to="item.url"
          :class="[
            'flex w-full items-center gap-4 py-3 cursor-pointer hover:bg-[#5e5e5e] transition-colors duration-300',
            isMenuItemActive(item) ? 'bg-[#5e5e5e]' : '',
            sidebar.collapsed ? 'px-[15px]' : 'px-[20px]',
          ]"
        >
          <Icon v-if="item.icon" :name="item.icon" class="h-5 w-5 text-[#3b82f6]" />
          <transition name="menu-label" mode="out-in">
            <p
              v-if="!sidebar.collapsed"
              :key="`item-link-${i}`"
              :class="['truncate', isMenuItemActive(item) ? 'text-[#5489dd]' : '']"
            >
              {{ item.name }}
            </p>
          </transition>
        </NuxtLink>

        <button
          v-else
          @click="openMenu(item)"
          :class="[
            'flex w-full items-center justify-between py-3 cursor-pointer hover:bg-[#5e5e5e] transition-colors duration-300',
            isMenuItemActive(item) ? 'bg-[#5e5e5e]' : '',
            sidebar.collapsed ? 'px-[15px]' : 'px-[25px]',
          ]"
        >
          <div
            :class="[
              'flex items-center gap-4',
              sidebar.collapsed ? 'flex-1 justify-center' : '',
            ]"
          >
            <Icon v-if="item.icon" :name="item.icon" class="w-5 h-5 text-[#3b82f6]" />
            <transition name="menu-label" mode="out-in">
              <p
                v-if="!sidebar.collapsed"
                :key="`item-btn-${i}`"
                :class="['truncate', isMenuItemActive(item) ? 'text-[#5489dd]' : '']"
              >
                {{ item.name }}
              </p>
            </transition>
          </div>

          <Icon v-if="!sidebar.collapsed" name="tabler:chevron-right" class="w-6 h-6 text-muted-foreground" />
        </button>
      </template>
    </template>
  </div>
</template>

<style scoped>
.menu-label-enter-active,
.menu-label-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.menu-label-enter-from,
.menu-label-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}
</style>
