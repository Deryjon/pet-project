<script setup lang="ts">
defineProps<{
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "confirm"): void;
}>();
</script>

<template>
  <Teleport to="body">
    <transition name="fade-confirm">
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div class="absolute inset-0 bg-[#06111f]/45 backdrop-blur-md" @click="emit('close')" />
        <section class="relative z-10 w-full max-w-md rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_40px_120px_rgba(15,23,42,0.22)]">
          <h3 class="text-[22px] font-semibold tracking-[-0.03em] text-slate-950">{{ title }}</h3>
          <p class="mt-3 text-[14px] leading-6 text-slate-500">{{ description }}</p>
          <div class="mt-6 flex justify-end gap-3">
            <UButton color="neutral" variant="soft" class="rounded-2xl bg-slate-100 text-slate-700" @click="emit('close')">
              Отмена
            </UButton>
            <UButton color="error" class="rounded-2xl" :loading="loading" @click="emit('confirm')">
              {{ confirmText || "Подтвердить" }}
            </UButton>
          </div>
        </section>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.fade-confirm-enter-active,
.fade-confirm-leave-active {
  transition: opacity 0.2s ease;
}

.fade-confirm-enter-from,
.fade-confirm-leave-to {
  opacity: 0;
}
</style>
