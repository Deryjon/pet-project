<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/store/useUserStore";
import { useLocationStore } from "@/store/useLocationStore";
import { useSidebarStore } from "../../store/useSidebar";
import { formatUzPhoneDisplay } from "~/utils/phone";

const { selectedLocation } = storeToRefs(useLocationStore());
const { user, fullName } = storeToRefs(useUserStore());
const { collapsed } = storeToRefs(useSidebarStore());

defineEmits(["toggle"]);

const displayName = computed(() => {
  return fullName.value || user.value.name || formatUzPhoneDisplay(user.value.phone) || "Пользователь";
});

const displayLocation = computed(() => {
  return (
    selectedLocation.value?.name ||
    user.value.currentShopName ||
    user.value.branchTitle ||
    user.value.branchCode ||
    "Филиал не указан"
  );
});

const displayCompany = computed(() => {
  return user.value.company?.name || "Компания не указана";
});
</script>

<template>
  <div
    role="button"
    tabindex="0"
    class="flex cursor-pointer items-center gap-3 rounded-[32px] p-2 transition-colors duration-300 hover:bg-[#5e5e5e]"
    @click.stop="$emit('toggle')"
  >
    <img
      :src="user.avatarUrl || '../../assets/images/placeholder_img.svg'"
      alt="Avatar"
      class="h-[40px] w-[40px] rounded-full object-cover"
    />

    <transition name="user-label" mode="out-in">
      <div v-if="!collapsed" key="user-label-expanded" class="min-w-0">
        <p class="max-w-[160px] truncate text-white">{{ displayName }}</p>
        <p class="max-w-[160px] truncate text-[#bdbdbd]">{{ displayCompany }}</p>
        <p class="max-w-[160px] truncate text-[12px] text-[#8f8f8f]">{{ displayLocation }}</p>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.user-label-enter-active,
.user-label-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.user-label-enter-from,
.user-label-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}
</style>
