<script setup lang="ts">
import { ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import BaseButton from "../ui/BaseButton.vue";
import { usePanelStore } from "@/store/usePanelStore";

const panel = usePanelStore();
const { logout } = useAuth();
const isSubmitting = ref(false);

const handleConfirm = async () => {
  if (isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;

  try {
    await logout();
    panel.closeAll();
    await navigateTo("/auth/login");
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div
    class="fixed top-0 left-0 z-[1200] flex h-full w-[460px] flex-col justify-between rounded-r-[56px] bg-[#2b2b2b] px-8 py-14 text-white shadow-lg"
    @click.stop
  >
    <h2 class="mb-6 text-center text-[24px] font-bold">Выйти из аккаунта</h2>

    <div class="flex flex-col items-center gap-[20px]">
      <div class="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#eb5757]">
        <Icon name="material-symbols:warning-outline-rounded" class="h-6 w-6" />
      </div>
      <p class="w-[300px] text-center font-semibold">
        Вы уверены, что хотите выйти из аккаунта?
      </p>
    </div>

    <div>
      <BaseButton
        color="red"
        :class="{ 'pointer-events-none opacity-60': isSubmitting }"
        :disabled="isSubmitting"
        @click="handleConfirm"
      >
        {{ isSubmitting ? "Выходим..." : "Да, выйти" }}
      </BaseButton>
      <BaseButton class="mt-4" :disabled="isSubmitting" @click="panel.closeQuit">Отмена</BaseButton>
    </div>
  </div>
</template>
