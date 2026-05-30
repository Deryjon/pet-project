<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import MobileBottomNav from "../components/MobileBottomNav.vue";
import LayoutSidebar from "../components/Sidebar.vue";
import { useUserStore } from "../store/useUserStore";
import { useSidebarStore } from "../store/useSidebar";

const userStore = useUserStore();
const sidebar = useSidebarStore();
const route = useRoute();
const { isPageLoading } = usePageLoader();
const mobileSidebarOpen = ref(false);
const isMobileViewport = ref(false);
const showAuthLoader = computed(() => userStore.authLoading || !userStore.authChecked);
const canRenderDashboard = computed(() => userStore.authChecked && userStore.isAuthenticated);
const pageContentLoading = computed(
  () => userStore.initializing || (userStore.permissionsLoading && !userStore.permissionsLoaded) || isPageLoading.value,
);

const syncViewport = () => {
  isMobileViewport.value = window.innerWidth < 1024;

  if (isMobileViewport.value) {
    sidebar.collapsed = false;
  } else {
    mobileSidebarOpen.value = false;
  }
};

const sidebarWidthClass = computed(() => {
  if (isMobileViewport.value) {
    return "w-[256px] min-w-[256px] max-w-[256px]";
  }

  return sidebar.collapsed
    ? "w-[95px] min-w-[95px] max-w-[95px]"
    : "w-[256px] min-w-[256px] max-w-[256px]";
});

const sidebarPositionClass = computed(() => {
  if (!isMobileViewport.value) {
    return "translate-x-0";
  }

  return mobileSidebarOpen.value ? "translate-x-0" : "-translate-x-full";
});

watch(
  () => route.path,
  () => {
    mobileSidebarOpen.value = false;
  }
);

watch([isMobileViewport, mobileSidebarOpen], ([mobile, open]) => {
  document.body.classList.toggle("no-scroll", mobile && open);
});

onMounted(() => {
  syncViewport();
  window.addEventListener("resize", syncViewport);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", syncViewport);
  document.body.classList.remove("no-scroll");
});
</script>

<template>
  <section
    v-if="showAuthLoader || !canRenderDashboard"
    class="relative flex min-h-screen items-center justify-center bg-[#1f1f1f] px-4"
  >
    <div
      class="inline-flex min-w-[168px] items-center justify-center gap-2.5 rounded-[18px] border border-white/10 bg-[#262626]/95 px-5 py-3.5 text-[15px] font-bold text-white shadow-2xl"
      role="status"
      aria-live="polite"
      aria-label="Загрузка"
    >
      <Icon name="heroicons:arrow-path" class="h-5 w-5 animate-spin text-[#4993dd]" />
      <span>Загрузка...</span>
    </div>
  </section>

  <section v-else class=" relative flex min-h-screen bg-[#1f1f1f]">
    <transition name="fade-overlay">
      <div
        v-if="isMobileViewport && mobileSidebarOpen"
        class="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        @click="mobileSidebarOpen = false"
      />
    </transition>

    <div
      :class="[
        'fixed left-0 top-0 z-40 h-screen app-sidebar bg-[#262626] pt-5 transition-all duration-300 ease-in-out',
        sidebarWidthClass,
        sidebarPositionClass,
      ]"
    >
      <LayoutSidebar
        class="h-full"
        :collapsed="isMobileViewport ? false : sidebar.collapsed"
        :is-mobile="isMobileViewport"
        @close-mobile="mobileSidebarOpen = false"
      />
    </div>

    <div
      :class="[
        'app-main-content relative min-h-screen min-w-0 pt-6 text-white transition-all duration-300 ease-in-out px-6',
        isMobileViewport
          ? 'w-full ml-0'
          : sidebar.collapsed
            ? 'w-full lg:ml-[80px] lg:w-[calc(100%-80px)]'
            : 'w-full lg:ml-[256px] lg:w-[calc(100%-256px)]',
      ]"
      style="max-width: 100vw; overflow-x: hidden"
    >
      <div class="sticky top-0 z-20 flex items-center justify-between -mx-4 mb-4 border-b border-white/5 bg-[#1f1f1f]/95 px-4 py-3 backdrop-blur-sm -mx-6 px-6 lg:hidden">
        <UButton
          color="neutral"
          variant="soft"
          class="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#404040] text-white hover:bg-[#4f4f4f]"
          @click="mobileSidebarOpen = true"
        >
          <Icon name="tabler:menu-2" class="h-5 w-5" />
        </UButton>
        <div class="icon flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#404040]">
          <img src="/favicon.png" alt="Logo" class="h-6 w-6 object-contain" />
        </div>
      </div>

      <slot />

      <div
        v-if="pageContentLoading"
        class="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        role="status"
        aria-live="polite"
        aria-label="Загрузка"
      >
        <div class="inline-flex min-w-[168px] items-center justify-center gap-2.5 rounded-[18px] border border-white/10 bg-[#262626]/95 px-5 py-3.5 text-[15px] font-bold text-white shadow-2xl">
          <Icon name="heroicons:arrow-path" class="h-5 w-5 animate-spin text-[#4993dd]" />
          <span>Загрузка...</span>
        </div>
      </div>
    </div>

    <MobileBottomNav
      v-if="isMobileViewport"
      @open-menu="mobileSidebarOpen = true"
    />
  </section>
</template>

<style scoped>
.fade-overlay-enter-active,
.fade-overlay-leave-active {
  transition: opacity 0.2s ease;
}

.fade-overlay-enter-from,
.fade-overlay-leave-to {
  opacity: 0;
}
</style>
