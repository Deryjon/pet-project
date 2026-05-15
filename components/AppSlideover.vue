<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";

const props = withDefaults(
  defineProps<{
    open: boolean;
    closeOnOverlay?: boolean;
    lockBody?: boolean;
    overlayClass?: string;
    panelClass?: string;
    maxWidthClass?: string;
    roundedClass?: string;
  }>(),
  {
    closeOnOverlay: true,
    lockBody: true,
    overlayClass: "bg-black/60 backdrop-blur-sm",
    panelClass: "bg-[#2b2b2b] text-white",
    maxWidthClass: "max-w-[760px]",
    roundedClass: "rounded-none sm:rounded-l-[40px]",
  },
);

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
}>();

function setBodyLocked(locked: boolean) {
  if (!props.lockBody || typeof document === "undefined") {
    return;
  }

  document.body.classList.toggle("overflow-hidden", locked);
}

function close() {
  emit("update:open", false);
}

function onOverlayClick() {
  if (props.closeOnOverlay) {
    close();
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && props.open) {
    close();
  }
}

watch(
  () => props.open,
  (isOpen) => {
    setBodyLocked(isOpen);

    if (typeof window === "undefined") {
      return;
    }

    if (isOpen) {
      window.addEventListener("keydown", onKeydown);
      return;
    }

    window.removeEventListener("keydown", onKeydown);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  setBodyLocked(false);

  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", onKeydown);
  }
});
</script>

<template>
  <Teleport to="body">
    <transition name="slideover-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50"
      >
        <div class="absolute inset-0" :class="overlayClass" @click="onOverlayClick" />

        <transition name="slideover-panel">
          <aside
            class="fixed right-0 top-0 z-[60] flex h-full w-full flex-col overflow-hidden border-0 shadow-2xl"
            :class="[maxWidthClass, roundedClass, panelClass]"
            @click.stop
          >
            <slot />
          </aside>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.slideover-fade-enter-active,
.slideover-fade-leave-active {
  transition: opacity 0.3s ease;
}

.slideover-fade-enter-from,
.slideover-fade-leave-to {
  opacity: 0;
}

.slideover-panel-enter-active,
.slideover-panel-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slideover-panel-enter-from,
.slideover-panel-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
