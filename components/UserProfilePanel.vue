<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

defineProps<{
  user: {
    name: string;
    location: string;
    avatarUrl?: string;
  };
}>();

const emit = defineEmits<{
  (e: "logout"): void;
  (e: "settings"): void;
}>();

const isOpen = ref(false);
const panelRef = ref<HTMLElement | null>(null);

const togglePanel = () => {
  isOpen.value = !isOpen.value;
};

const handleClickOutside = (event: MouseEvent) => {
  if (panelRef.value && !panelRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div ref="panelRef" class="relative z-50">
    <div
      @click.stop="togglePanel"
      class="flex justify-start items-center gap-3 font-semibold cursor-pointer hover:bg-[#5e5e5e] p-[5px] rounded-[32px] transition-colors duration-300"
    >
      <img
        :src="user.avatarUrl || 'https://via.placeholder.com/40'"
        alt="Avatar"
        class="rounded-full w-[40px] h-[40px] object-cover"
      />
      <div class="user-info">
        <p class="text-white">
          {{ user.name.length > 13 ? user.name.slice(0, 13) + "." : user.name }}
        </p>
        <p class="text-[#bdbdbd]">
          {{
            user.location.length > 12
              ? user.location.slice(0, 12) + "..."
              : user.location
          }}
        </p>
      </div>
    </div>

    <transition name="slide">
      <div
        v-if="isOpen"
        class="fixed top-0 left-0 h-full w-[460px] bg-[#2b2b2b] text-white shadow-lg px-8 py-14 rounded-r-[56px]"
      >
        <div class="top flex justify-between items-center">
          <h2 class="text-[36px] font-bold mb-4">Аккаунт</h2>
          <button
            @click="togglePanel"
            class="rounded-full w-[48px] h-[48px] bg-[#404040] flex justify-center items-center"
          >
            <Icon name="heroicons:arrow-left" class="w-4 h-4" />
          </button>
        </div>
        <div
          class="flex justify-start items-center gap-3 font-semibold cursor-pointer p-[5px] rounded-[32px] mt-[20px]"
        >
          <img
            :src="user.avatarUrl || 'https://via.placeholder.com/40'"
            alt="Avatar"
            class="rounded-full w-[40px] h-[40px] object-cover"
          />
          <div class="user-info">
            <p class="text-white">{{ user.name }}</p>
            <p class="text-[#bdbdbd]">{{ user.location }}</p>
          </div>
        </div>
        <button class="exit mt-[20px] bg-[#404040] py-[20px] rounded-[20px] w-full text-red-500 font-semibold">Выйти из аккаунта</button>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from {
  transform: translateX(-100%);
}
.slide-enter-to {
  transform: translateX(0);
}
.slide-leave-from {
  transform: translateX(0);
}
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
