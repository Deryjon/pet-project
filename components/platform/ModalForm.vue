<script setup lang="ts">
defineProps<{
  open: boolean;
  title: string;
  description?: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();
</script>

<template>
  <Teleport to="body">
    <transition name="fade-modal">
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div class="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" @click="emit('close')" />

        <div class="relative z-10 w-full max-w-2xl rounded-[32px] border border-white/70 bg-white p-6 shadow-[0_40px_120px_rgba(15,23,42,0.18)] sm:p-8">
          <div class="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Workspace Form</p>
              <h3 class="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-slate-950">{{ title }}</h3>
              <p v-if="description" class="mt-2 text-[14px] leading-6 text-slate-500">{{ description }}</p>
            </div>

            <UButton color="neutral" variant="ghost" class="rounded-2xl text-slate-500 hover:bg-slate-100" @click="emit('close')">
              <Icon name="heroicons:x-mark" class="h-5 w-5" />
            </UButton>
          </div>

          <div class="pt-6">
            <slot />
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.fade-modal-enter-active,
.fade-modal-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
