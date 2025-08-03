<template>
    <transition name="slide">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex"
        @click.self="close"
      >
        <div
          ref="panelRef"
          class="w-[320px] max-w-full bg-white h-full shadow-xl overflow-y-auto"
        >
          <slot />
        </div>
      </div>
    </transition>
  </template>
  
  <script setup lang="ts">
  const props = defineProps<{
    modelValue: boolean;
  }>();
  
  const emit = defineEmits(["update:modelValue"]);
  
  const close = () => {
    emit("update:modelValue", false);
  };
  </script>
  
  <style scoped>
  .slide-enter-active,
  .slide-leave-active {
    transition: all 0.3s ease;
  }
  .slide-enter-from,
  .slide-leave-to {
    transform: translateX(-100%);
  }
  .slide-enter-to,
  .slide-leave-from {
    transform: translateX(0%);
  }
  </style>
  