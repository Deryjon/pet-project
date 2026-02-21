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
    class="flex flex-col justify-between"
    :class="sidebar.collapsed ? 'px-[10px]' : 'px-[20px]'"
  >
    <div class="flex flex-col gap-[30px]">
      <div
        class="logo font-bold text-[20px] text-white p-[5px] flex justify-between items-center"
      >
        <h1
          v-if="sidebar.collapsed"
          class="cursor-pointer"
          @click="goToSidebar"
        >
          K
        </h1>
        <h1 v-else class="cursor-pointer" @click="goToSidebar">Konkurent</h1>

        <Icon
          @click="sidebar.toggle"
          :name="sidebar.collapsed ? 'tabler:chevrons-right' : 'tabler:chevrons-left'"
          class="w-6 h-6 cursor-pointer"
        />
      </div>

      <Menu :class="sidebar.collapsed ? '-mx-[10px]' : '-mx-[20px]'" />
    </div>

    <div class="flex flex-col gap-5">
      <User />
      <UButton
        :class="[
          'text-white [&_*]:text-white opacity-100 text-[16px] w-full py-5 rounded-none bg-[#5e5e5e] hover:bg-[#4d4c4c] flex items-center gap-2 font-semibold cursor-pointer transition-colors duration-300',
          sidebar.collapsed
            ? '-ml-[10px] w-[calc(100%+20px)] px-[10px]'
            : '-ml-[20px] w-[calc(100%+40px)] px-[20px]',
        ]"
      >
        <Icon name="solar:help-bold" class="w-5 h-5 text-white" />
        Написать в поддержку
      </UButton>
    </div>
  </div>
</template>
