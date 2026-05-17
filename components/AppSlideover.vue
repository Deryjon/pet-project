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
    <transition name="slideover-root">
      <div
        v-if="open"
        class="fixed inset-0 z-50"
      >
        <div
          class="slideover-overlay absolute inset-0"
          :class="overlayClass"
          @click="onOverlayClick"
        />

        <aside
          class="slideover-panel fixed right-0 top-0 z-[60] flex h-full w-full flex-col overflow-hidden border-0 shadow-2xl"
          :class="[maxWidthClass, roundedClass, panelClass]"
          @click.stop
        >
          <slot />
        </aside>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.slideover-root-enter-active,
.slideover-root-leave-active {
  transition: none;
}

.slideover-overlay {
  transition: opacity 0.22s ease;
}

.slideover-panel {
  transition: opacity 0.22s ease, transform 0.22s ease;
  transform-origin: right center;
}

.slideover-root-enter-from .slideover-overlay,
.slideover-root-leave-to .slideover-overlay {
  opacity: 0;
}

.slideover-root-enter-from .slideover-panel,
.slideover-root-leave-to .slideover-panel {
  opacity: 0;
  transform: translateX(100%);
}

.slideover-root-enter-to .slideover-panel,
.slideover-root-leave-from .slideover-panel {
  opacity: 1;
  transform: translateX(0);
}
</style>
