<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { usePanelStore } from "@/store/usePanelStore";
import { useUserStore } from "@/store/useUserStore";
import { useLocationStore } from "@/store/useLocationStore";
import BaseButton from "../ui/BaseButton.vue";
import ChangeShop from "../ChangeShop.vue";
import ConfirmLogout from "./ConfirmLogout.vue";
import { formatUzPhoneDisplay } from "~/utils/phone";

defineProps<{
  open: boolean;
}>();

const panel = usePanelStore();
const router = useRouter();
const { userState, fullName } = storeToRefs(useUserStore());
const { selectedLocation, locations } = storeToRefs(useLocationStore());

function goToNotifications() {
  panel.closeAll();
  router.push("/settings/notifications");
}

const displayName = computed(() => {
  return fullName.value || userState.value.name || formatUzPhoneDisplay(userState.value.phone) || "Пользователь";
});

const displayLocation = computed(() => {
  return (
    selectedLocation.value?.name ||
    userState.value.currentShopName ||
    userState.value.branchTitle ||
    userState.value.branchCode ||
    "Филиал не указан"
  );
});

const displayPhone = computed(() => {
  return formatUzPhoneDisplay(userState.value.phone) || "Телефон не указан";
});

const displayRole = computed(() => {
  return userState.value.roleName || userState.value.crmRole?.name || userState.value.role || "Роль не указана";
});

const displayCompany = computed(() => {
  return userState.value.company?.name || "Компания не указана";
});

const canChangeShop = computed(() => {
  return Boolean((userState.value.canSwitchShops || locations.value.length > 1) && locations.value.length);
});
</script>

<template>
  <teleport to="body">
    <transition name="fade-overlay">
      <div
        v-if="open"
        class="fixed inset-0 z-[999] cursor-pointer bg-black/40 backdrop-blur-sm"
        @click="panel.closeAll"
      />
    </transition>

    <transition name="slide-main">
      <div
        v-if="open"
        class="fixed top-0 left-0 z-[1000] h-full w-full max-w-[460px] overflow-y-auto rounded-r-[56px] bg-[#2b2b2b] px-8 py-14 text-white shadow-lg"
        @click.stop
      >
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-[36px] font-bold">Аккаунт</h2>
          <button
            class="flex h-[48px] w-[48px] cursor-pointer items-center justify-center rounded-full bg-[#404040] transition-colors duration-300 hover:bg-[#5e5e5e] focus:outline-none focus:ring-2 focus:ring-white"
            @click="panel.toggle"
          >
            <Icon name="heroicons:arrow-left" class="h-4 w-4" />
          </button>
        </div>

        <div class="mt-[20px] flex items-center gap-3 p-[5px]">
          <img
            :src="userState.avatarUrl || '../../assets/images/placeholder_img.svg'"
            class="h-[40px] w-[40px] rounded-full object-cover"
          />
          <div>
            <p class="max-w-[300px] truncate text-white">{{ displayName }}</p>
            <p class="max-w-[300px] truncate text-[#bdbdbd]">{{ displayLocation }}</p>
          </div>
        </div>

        <div class="mt-4 space-y-2 rounded-[24px] bg-[#404040] p-5">
          <div class="flex items-center justify-between gap-4">
            <span class="text-[#bdbdbd]">Компания</span>
            <span class="max-w-[220px] truncate text-right text-white">{{ displayCompany }}</span>
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="text-[#bdbdbd]">Телефон</span>
            <span class="max-w-[220px] truncate text-right text-white">{{ displayPhone }}</span>
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="text-[#bdbdbd]">Роль</span>
            <span class="max-w-[220px] truncate text-right text-white">{{ displayRole }}</span>
          </div>
        </div>

        <button
          class="mt-6 flex w-full cursor-pointer items-center justify-between rounded-[20px] bg-[#404040] px-5 py-3 font-semibold transition-colors duration-300 hover:bg-[#5e5e5e]"
          @click="goToNotifications"
        >
          <div class="flex items-center gap-2">
            <Icon name="heroicons:bell" class="h-4 w-4 text-[#229ED9]" />
            Уведомления
          </div>
          <Icon name="heroicons:arrow-right" class="h-4 w-4" />
        </button>

        <BaseButton color="red" class="mt-4" @click="panel.openQuit">
          Выйти из аккаунта
        </BaseButton>

        <teleport to="body">
          <transition name="slide-logout">
            <ConfirmLogout v-if="panel.isQuitConfirm" @close="panel.closeQuit" />
          </transition>
        </teleport>

        <button
          v-if="canChangeShop"
          class="mt-4 flex w-full cursor-pointer items-center justify-between rounded-[20px] bg-[#404040] px-5 py-3 font-semibold transition-colors duration-300 hover:bg-[#5e5e5e]"
          @click="panel.openChange"
        >
          <div class="flex items-center gap-2">
            <Icon name="heroicons:shopping-bag" class="h-4 w-4" />
            Сменить филиал
          </div>
          <Icon name="heroicons:arrow-right" class="h-4 w-4" />
        </button>

        <teleport to="body">
          <transition name="slide-change">
            <ChangeShop v-if="panel.isChangeShop" @close="panel.closeChange" />
          </transition>
        </teleport>
      </div>
    </transition>
  </teleport>
</template>

<style>
.fade-overlay-enter-active,
.fade-overlay-leave-active {
  transition: opacity 0.2s ease;
}

.fade-overlay-enter-from,
.fade-overlay-leave-to {
  opacity: 0;
}

.fade-overlay-enter-to,
.fade-overlay-leave-from {
  opacity: 1;
}

.slide-main-enter-active,
.slide-main-leave-active,
.slide-change-enter-active,
.slide-change-leave-active,
.slide-logout-enter-active,
.slide-logout-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-main-enter-from,
.slide-main-leave-to,
.slide-change-enter-from,
.slide-change-leave-to,
.slide-logout-enter-from,
.slide-logout-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-main-enter-to,
.slide-main-leave-from,
.slide-change-enter-to,
.slide-change-leave-from,
.slide-logout-enter-to,
.slide-logout-leave-from {
  transform: translateX(0%);
  opacity: 1;
}
</style>
