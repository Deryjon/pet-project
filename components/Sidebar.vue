<script setup lang="ts">
import Menu from "./Menu.vue";
import User from "./User.vue";
import { useSidebarStore } from "../store/useSidebar";
import { useRouter } from "vue-router";

const router = useRouter();
const goToSidebar = () => {
  router.push("/");
};
const sidebar = useSidebarStore();
</script>

<template>
  <div
    class="flex flex-col justify-between transition-[padding] duration-300 ease-in-out"
    :class="sidebar.collapsed ? 'px-[10px]' : 'px-[20px]'"
  >
    <div class="flex flex-col gap-[30px]">
      <div
        :class="[
          'logo font-bold text-[20px] text-white p-[5px] flex items-center transition-all duration-300 ease-in-out',
          sidebar.collapsed ? 'relative justify-center' : 'justify-between',
        ]"
      >
        <transition name="sidebar-label" mode="out-in">
          <h1
            v-if="sidebar.collapsed"
            key="logo-short"
            class="cursor-pointer"
            @click="goToSidebar"
          >
            K
          </h1>
          <h1 v-else key="logo-full" class="cursor-pointer" @click="goToSidebar">Konkurent</h1>
        </transition>

        <Icon
          @click="sidebar.toggle"
          :name="
            sidebar.collapsed ? 'tabler:chevrons-right' : 'tabler:chevrons-left'
          "
          :class="[
            'w-6 h-6 cursor-pointer',
            sidebar.collapsed ? 'absolute right-0' : '',
          ]"
        />
      </div>

      <Menu :class="sidebar.collapsed ? '-mx-[10px]' : '-mx-[20px]'" />
    </div>

    <div :class="['flex flex-col gap-5 transition-all duration-300 ease-in-out', sidebar.collapsed ? 'items-center mb-3' : '']">
      <User />
      <UButton
        :class="[
          'text-white [&_*]:text-white opacity-100 text-[16px] bg-[#5e5e5e] hover:bg-[#4d4c4c] flex items-center font-semibold cursor-pointer transition-all duration-300 ease-in-out',
          sidebar.collapsed
            ? 'w-11 h-11 p-0 justify-center rounded-[12px] self-center'
            : '-ml-[20px] w-[calc(100%+40px)] px-[20px] py-5 rounded-none gap-2',
        ]"
      >
        <Icon
          name="solar:help-bold"
          :class="['w-5 h-5 text-white', sidebar.collapsed ? 'relative -top-0.5' : '']"
        />
        <transition name="sidebar-label" mode="out-in">
          <span v-if="!sidebar.collapsed" key="support-label">Написать в поддержку</span>
        </transition>
      </UButton>
    </div>
  </div>
</template>

<style scoped>
.sidebar-label-enter-active,
.sidebar-label-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.sidebar-label-enter-from,
.sidebar-label-leave-to {
  opacity: 0;
  transform: translateY(3px);
}
</style>
