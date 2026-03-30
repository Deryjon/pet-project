<script setup lang="ts">
import Menu from "./Menu.vue";
import User from "./User.vue";
import { useSidebarStore } from "../store/useSidebar";
import { useRouter } from "vue-router";

const props = withDefaults(
  defineProps<{
    collapsed?: boolean;
    isMobile?: boolean;
  }>(),
  {
    collapsed: false,
    isMobile: false,
  }
);

const emit = defineEmits<{
  (e: "close-mobile"): void;
}>();

const router = useRouter();
const sidebar = useSidebarStore();

const goToSidebar = () => {
  router.push("/");
};

const handleSidebarAction = () => {
  if (props.isMobile) {
    emit("close-mobile");
    return;
  }

  sidebar.toggle();
};
</script>

<template>
  <div
    class="flex h-full flex-col justify-between overflow-y-auto transition-[padding] duration-300 ease-in-out"
    :class="props.collapsed ? 'px-[10px]' : 'px-[20px] py-2'"
  >
    <div class="flex flex-col gap-[30px]">
      <div
        :class="[
          'logo flex items-center p-[5px] text-[20px] font-bold text-white transition-all duration-300 ease-in-out',
          props.collapsed ? 'relative justify-center' : 'justify-between',
        ]"
      >
        <transition name="sidebar-label" mode="out-in">
          <h1
            v-if="props.collapsed"
            key="logo-short"
            class="cursor-pointer"
            @click="goToSidebar"
          >
            K
          </h1>
          <h1
            v-else
            key="logo-full"
            class="cursor-pointer"
            @click="goToSidebar"
          >
            Konkurent
          </h1>
        </transition>

        <Icon
          @click="handleSidebarAction"
          :name="
            props.isMobile
              ? 'mingcute:close-line'
              : props.collapsed
                ? 'tabler:chevrons-right'
                : 'tabler:chevrons-left'
          "
          :class="[
            'h-6 w-6 cursor-pointer',
            props.collapsed ? 'absolute right-0' : '',
          ]"
        />
      </div>

      <Menu :class="props.collapsed ? '-mx-[10px]' : '-mx-[20px]'" />
    </div>

    <div
      :class="[
        'flex flex-col gap-5 transition-all duration-300 ease-in-out',
        props.collapsed ? 'mb-3 items-center' : 'pb-4',
      ]"
    >
      <User />
      <UButton
        :class="[
          'flex cursor-pointer items-center bg-[#5e5e5e] text-[16px] font-semibold text-white opacity-100 transition-all duration-300 ease-in-out hover:bg-[#4d4c4c] [&_*]:text-white',
          props.collapsed
            ? 'h-11 w-11 justify-center self-center rounded-[12px] p-0'
            : '-ml-[20px] w-[calc(100%+40px)] gap-2 rounded-none px-[20px] py-5',
        ]"
      >
        <Icon
          name="solar:help-bold"
          :class="[
            'h-5 w-5 text-white',
            props.collapsed ? 'relative -top-0.5' : '',
          ]"
        />
        <transition name="sidebar-label" mode="out-in">
          <span v-if="!props.collapsed" key="support-label">
            Написать в поддержку
          </span>
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
