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
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
        <div class="absolute inset-0 cursor-pointer bg-[#06111f]/45 backdrop-blur-md" @click="emit('close')" />

        <div class="relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[34px] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,252,0.9))] p-5 shadow-[0_40px_120px_rgba(15,23,42,0.2)] sm:p-6">
          <div class="flex items-start justify-between gap-4 border-b border-slate-200/70 pb-4">
            <div class="max-w-xl">
              <p class="inline-flex rounded-full border border-teal-200/70 bg-teal-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-700">
                Форма
              </p>
              <h3 class="mt-2 text-[24px] font-semibold tracking-[-0.05em] text-slate-950 sm:text-[26px]">{{ title }}</h3>
              <p v-if="description" class="mt-1.5 text-[13px] leading-5 text-slate-500">{{ description }}</p>
            </div>

            <UButton color="neutral" variant="ghost" class="cursor-pointer rounded-2xl text-slate-500 hover:bg-slate-100" @click="emit('close')">
              <Icon name="heroicons:x-mark" class="h-5 w-5" />
            </UButton>
          </div>

          <div class="modal-form-scroll overflow-y-auto pt-4">
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
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.modal-form-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.modal-form-scroll::-webkit-scrollbar {
  display: none;
}
</style>
