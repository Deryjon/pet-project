<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import AdminSidebar from "@/components/platform/AdminSidebar.vue";
import AdminTopbar from "@/components/platform/AdminTopbar.vue";
import { usePlatformAdminSession } from "@/composables/usePlatformAdmin";

const router = useRouter();
const { authenticated, restore, signOut } = usePlatformAdminSession();
const mobileSidebarOpen = ref(false);

onMounted(() => {
  restore();
  if (!authenticated.value) {
    router.replace("/platform/login");
  }
});

function logout() {
  signOut();
  router.push("/platform/login");
}
</script>

<template>
  <div class="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_45%,#eef2ff_100%)] text-slate-900">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.06),transparent_30%)]" />
    <div class="absolute inset-0 opacity-[0.35]" style="background-image: linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px); background-size: 40px 40px;" />

    <div class="relative z-10 flex min-h-screen">
      <transition name="fade-sidebar">
        <div v-if="mobileSidebarOpen" class="fixed inset-0 z-30 bg-slate-950/25 backdrop-blur-sm lg:hidden" @click="mobileSidebarOpen = false" />
      </transition>

      <div class="fixed inset-y-0 left-0 z-40 hidden w-[288px] p-5 lg:block">
        <AdminSidebar @logout="logout" />
      </div>

      <div class="fixed inset-y-0 left-0 z-40 w-[288px] p-4 transition-transform duration-300 lg:hidden" :class="mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'">
        <AdminSidebar mobile @close="mobileSidebarOpen = false" @logout="logout" />
      </div>

      <main class="relative w-full px-4 py-4 sm:px-6 lg:ml-[288px] lg:px-8 lg:py-6">
        <AdminTopbar @open-sidebar="mobileSidebarOpen = true" @logout="logout" />
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-sidebar-enter-active,
.fade-sidebar-leave-active {
  transition: opacity 0.2s ease;
}

.fade-sidebar-enter-from,
.fade-sidebar-leave-to {
  opacity: 0;
}
</style>
