<script setup lang="ts">
import { usePanelStore } from "@/store/usePanelStore";
import { useUserStore } from "@/store/useUserStore";
import { useLocationStore } from "@/store/useLocationStore";
import BaseButton from "../ui/BaseButton.vue";
import ChangeShop from "../ChangeShop.vue";
import ConfirmLogout from "./ConfirmLogout.vue"

const panel = usePanelStore();
const { user, fullName } = storeToRefs(useUserStore());
const { selectedLocation } = storeToRefs(useLocationStore());
</script>

<template>
  <transition name="slide-main">
    <div
      class="fixed top-0 left-0 h-full w-full max-w-[460px] bg-[#2b2b2b] text-white shadow-lg px-8 py-14 rounded-r-[56px] z-50 overflow-y-auto"
      @click.stop
    >
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-[36px] font-bold">Аккаунт</h2>
        <button
          @click="panel.toggle"
          class="rounded-full w-[48px] h-[48px] bg-[#404040] flex justify-center items-center hover:bg-[#5e5e5e] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-white"
        >
          <Icon name="heroicons:arrow-left" class="w-4 h-4" />
        </button>
      </div>

      <div class="flex items-center gap-3 p-[5px] mt-[20px]">
        <img
          :src="user.avatarUrl || '../assets/images/placeholder_img.svg'"
          class="rounded-full w-[40px] h-[40px] object-cover"
        />
        <div>
          <p class="text-white truncate max-w-[300px]">{{ fullName || user.username || user.name || "..." }}</p>
          <p class="text-[#bdbdbd] truncate max-w-[300px]">
            {{ selectedLocation?.name || "..." }}
          </p>
        </div>
      </div>

      <BaseButton color="red" class="mt-6" @click="panel.openQuit">
        Выйти из аккаунта
      </BaseButton>
      <Teleport to="body">
        <transition name="slide-logout">
          <ConfirmLogout v-if="panel.isQuitConfirm" @close="panel.closeQuit" />
        </transition>
      </Teleport>
      <button
        @click="panel.openChange"
        class="mt-4 bg-[#404040] py-3 rounded-[20px] w-full font-semibold flex items-center justify-between px-5 hover:bg-[#5e5e5e] transition-colors duration-300"
      >
        <div class="flex items-center gap-2">
          <Icon name="heroicons:shopping-bag" class="w-4 h-4" />
          Сменить магазин
        </div>
        <Icon name="heroicons:arrow-right" class="w-4 h-4" />
      </button>
      <Teleport to="body">
        <transition name="slide-change">
          <ChangeShop v-if="panel.isChangeShop" @close="panel.closeChange" />
        </transition>
      </Teleport>
    </div>
  </transition>
</template>
<style>
/* Один и тот же эффект для нескольких transition name */
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

.slide-from-left-enter-active,
.slide-from-left-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-from-left-enter-from,
.slide-from-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
.slide-from-left-enter-to,
.slide-from-left-leave-from {
  transform: translateX(0%);
  opacity: 1;
}

</style>
